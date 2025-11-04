import { ClinicalEntities, CleanedInput } from "../../../shared/types/clinical.js";
import { PROMPT_FR } from "../../prompts/clinical.js";
import { createHash } from "node:crypto";
import { LayerProcessor, LayerOptions, LayerResult } from "./LayerManager.js";
import { getAIProvider } from "../../lib/aiProvider.js";

function pickPrompt(inputLang: 'fr' | 'en', t: string): string { 
  // Always use French prompt for output, but add English input context when needed
  const basePrompt = PROMPT_FR.replace('{{TRANSCRIPT}}', t);
  
  if (inputLang === 'en') {
    // Add English input context to French prompt
    const englishContext = `
## CONTEXTE D'ENTRÉE: Anglais
Le transcript ci-dessous est en anglais. Extrayez les entités cliniques et traduisez-les en terminologie médicale française.

`;
    return englishContext + basePrompt;
  }
  
  return basePrompt;
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
  constructor() {} // Model will be resolved via AIProvider abstraction

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
          language: 'fr', // Always output French clinical entities
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

    const key = getKey(cleaned_text + '|' + opts.language + '|inputLang');
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
      // Get model from options or use default (using bracket notation for index signature)
      const modelId = (options['model'] as string | undefined) || process.env['OPENAI_MODEL'] || "gpt-4o-mini";
      const temperature = options['temperature'] !== undefined 
        ? (options['temperature'] as number)
        : parseFloat(process.env['OPENAI_TEMPERATURE'] || '0.1');
      
      console.log('UniversalCleanupLayer: Creating AI completion for transcript length:', cleaned_text.length);
      console.log('UniversalCleanupLayer: Using model:', modelId);
      console.log('UniversalCleanupLayer: Using temperature:', temperature);

      // Use AIProvider abstraction instead of direct OpenAI call
      const provider = getAIProvider(modelId);
      const completion = await provider.createCompletion({
        model: modelId,
        messages: [
          {
            role: "system",
            content: pickPrompt(opts.language, cleaned_text)
          }
        ],
        temperature: temperature,
        response_format: { type: "json_object" },
        max_tokens: 800
      });

      const raw = completion.content ?? "{}";
      let parsed: any = {};
      try { 
        parsed = JSON.parse(raw); 
      } catch { 
        parsed = {}; 
      }

      const clinical_entities = sanitize({
        ...parsed,
        language: 'fr', // Always output French clinical entities
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
          language: 'fr', // Always output French clinical entities
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
