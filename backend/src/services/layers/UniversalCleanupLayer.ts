import { ClinicalEntities, CleanedInput } from "../../../shared/types/clinical";
import { PROMPT_FR, PROMPT_EN } from "../../prompts/clinical";
import { createHash } from "node:crypto";
import { LayerProcessor, LayerOptions, LayerResult } from "./LayerManager";
import { openai as defaultOpenAI } from "../../lib/openai";

function pickPrompt(lang: 'fr' | 'en', t: string): string { 
  return (lang === 'fr' ? PROMPT_FR : PROMPT_EN).replace('{{TRANSCRIPT}}', t);
}

// Simple in-memory LRU (replace with your LRU if you have one)
const CACHE = new Map<string, CleanedInput>();

function getKey(text: string): string { 
  return createHash('sha256').update(text).digest('hex'); 
}

function sanitize(ce: Partial<ClinicalEntities>): ClinicalEntities {
  return {
    ...ce,
    functional_limitations: Array.isArray(ce.functional_limitations) ? ce.functional_limitations : [],
    previous_injuries: Array.isArray(ce.previous_injuries) ? ce.previous_injuries : [],
    treatment_to_date: Array.isArray(ce.treatment_to_date) ? ce.treatment_to_date : [],
    imaging_done: Array.isArray(ce.imaging_done) ? ce.imaging_done : [],
    issues: Array.isArray(ce.issues) ? ce.issues : [],
  };
}

export class UniversalCleanupLayer implements LayerProcessor {
  constructor(private readonly client = defaultOpenAI) {}

  async process(
    transcript: string,
    options: LayerOptions
  ): Promise<LayerResult> {
    const opts = {
      language: options.language,
      source: (options['source'] as 'ambient' | 'smart_dictation') || 'ambient'
    };
    const start = Date.now();
    const cleaned_text = transcript
      .replace(/\[(\d{2}:){1,2}\d{2}\]/g, "")           // timestamps like [00:12] or [01:02:03]
      .replace(/\b(uh|um|euh|hm)+\b/gi, "")             // hesitations
      .replace(/\s+/g, " ")
      .trim();

    // Handle empty transcripts
    if (!cleaned_text) {
      const emptyResult: CleanedInput = {
        cleaned_text: '',
        clinical_entities: {
          language: opts.language,
          issues: ['Empty transcript provided']
        },
        meta: {
          processing_ms: Date.now() - start,
          source: opts.source,
          language: opts.language,
          used_cache: false
        }
      };
      
      return {
        success: true,
        data: emptyResult,
        metadata: {
          processingTime: Date.now() - start,
          language: opts.language,
          source: opts.source,
          used_cache: false
        }
      };
    }

    const key = getKey(cleaned_text + '|' + opts.language);
    const cached = CACHE.get(key);
    if (cached) {
      return {
        success: true,
        data: { ...cached, meta: { ...cached.meta, used_cache: true } },
        metadata: {
          processingTime: 0, // Cached result
          language: opts.language,
          source: opts.source,
          used_cache: true
        }
      };
    }

    try {

      const completion = await this.client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: pickPrompt(opts.language, cleaned_text)
          }
        ],
        temperature: 0.1,
        response_format: { type: "json_object" },
        max_tokens: 800
      });

      const raw = completion.choices[0]?.message?.content ?? "{}";
      let parsed: any = {};
      try { 
        parsed = JSON.parse(raw); 
      } catch { 
        parsed = {}; 
      }

      const clinical_entities = sanitize({
        ...parsed,
        language: opts.language,
        confidence: typeof parsed.confidence === "number" ? parsed.confidence : undefined
      });

      const cleanedInput: CleanedInput = {
        cleaned_text,
        clinical_entities,
        meta: { 
          processing_ms: Date.now() - start, 
          source: opts.source, 
          language: opts.language, 
          used_cache: false 
        }
      };

      // cheap TTL cache (30 min)
      CACHE.set(key, cleanedInput);
      setTimeout(() => CACHE.delete(key), 30 * 60 * 1000);

      return {
        success: true,
        data: cleanedInput,
        metadata: {
          processingTime: Date.now() - start,
          language: opts.language,
          source: opts.source,
          used_cache: false
        }
      };
    } catch (error) {
      console.error('UniversalCleanupLayer OpenAI extraction failed:', error);
      
      // Return fallback result on error
      const fallbackCleanedInput: CleanedInput = {
        cleaned_text,
        clinical_entities: {
          language: opts.language,
          issues: [`Extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
        },
        meta: { 
          processing_ms: Date.now() - start, 
          source: opts.source, 
          language: opts.language, 
          used_cache: false 
        }
      };
      
      return {
        success: false,
        data: fallbackCleanedInput,
        metadata: {
          processingTime: Date.now() - start,
          language: opts.language,
          source: opts.source,
          used_cache: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }
}
