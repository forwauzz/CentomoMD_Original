import { CleanedInput } from '../../../shared/types/clinical.js';
import { formatWithGuardrails } from './shared.js';
import { extractNameWhitelist } from '../../utils/names.js';
import { selectFormatterPrompts, buildLanguageContext } from './langUtils.js';
import { loadPromptFile } from './promptLoader.js';
import { extractClinicalEntities } from './Extractor.js';
import { assessASRQuality } from './ASRQualityGate.js';
import { validateCNESSTCompliance } from './validators.js';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env['OPENAI_API_KEY'],
});

export interface TemplatePipelineResult {
  formatted: string;
  issues: string[];
  confidence_score: number;
  clinical_entities?: any;
}

export interface TemplatePipelineOptions {
  language?: 'fr' | 'en'; // Legacy parameter for backward compatibility (optional now)
  inputLanguage?: 'fr' | 'en';
  outputLanguage?: 'fr' | 'en';
  section: '7' | '8' | '11';
  templateId?: string | undefined;
}

/**
 * Template Pipeline - S8 layer that processes CleanedInput from S7 UniversalCleanup
 * Dispatches to appropriate formatters based on section
 */
export class TemplatePipeline {
  
  /**
   * Helper for pass-through scenarios with explicit reasons
   */
  private passThrough(reason: string, transcript: string, issues: string[], clinicalEntities: any): TemplatePipelineResult {
    console.warn(`[FMT] PASS-THROUGH: ${reason}`);
    return {
      formatted: transcript,
      issues: [...issues, reason],
      confidence_score: 0.3,
      clinical_entities: clinicalEntities
    };
  }
  
  /**
   * Two-pass pipeline: Extract → Format with ASR Quality Gate
   * Pass 1: Extract clinical entities (INPUT language optimized)
   * Pass 2: Format with clinical entities (OUTPUT language optimized)
   */
  async processWithTwoPassPipeline(
    transcript: string,
    section: '7'|'8'|'11',
    options: TemplatePipelineOptions
  ): Promise<TemplatePipelineResult> {
    console.log(`[TemplatePipeline] processWithTwoPassPipeline called with:`, {
      section,
      transcriptLength: transcript.length,
      options
    });
    
    const issues: string[] = [];
    
    try {
      // Canonicalize languages - One source of truth
      const canon = (l?: string) => (l === 'fr' ? 'fr' : 'en');
      const inputLanguage = canon(options.inputLanguage);
      const outputLanguage = canon(options.outputLanguage);
      
      console.log(`[TemplatePipeline] Canonicalized languages - Input: ${inputLanguage}, Output: ${outputLanguage}`);
      
      // ASR Quality Gate
      const asrQuality = await assessASRQuality(transcript, inputLanguage);
      if (asrQuality.status === 'FAIL') {
        issues.push(...asrQuality.issues);
        return {
          formatted: transcript,
          issues,
          confidence_score: 0.1,
          clinical_entities: null
        };
      }
      
      if (asrQuality.status === 'WARN') {
        issues.push(...asrQuality.issues);
      }
      
      // Pass 1: Extract clinical entities (INPUT language optimized)
      const clinicalEntities = await extractClinicalEntities(
        transcript, 
        section, 
        inputLanguage
      );
      
      // Pass 2: Format with clinical entities (OUTPUT language optimized)
      const formatterPrompts = selectFormatterPrompts(section, outputLanguage);
      
      console.log(`[FMT] Section: ${section}, Input: ${inputLanguage}, Output: ${outputLanguage}`);
      console.log(`[FMT] prompts:`, formatterPrompts);
      
      // Load files with hard failure
      let systemPrompt = '';
      try {
        systemPrompt = await loadPromptFile(formatterPrompts.master);
        console.log(`[FMT] Loaded master prompt: ${formatterPrompts.master}`);
      } catch (e) {
        console.error(`[FMT] Missing master prompt: ${formatterPrompts.master}`, e);
        return this.passThrough(`Missing master prompt: ${formatterPrompts.master}`, transcript, issues, clinicalEntities);
      }
      
      // Hard output language header (FIRST line)
      const header = outputLanguage === 'fr'
        ? '[OUTPUT LANGUAGE]: FR-CA. Répondez exclusivement en français (Québec).'
        : '[OUTPUT LANGUAGE]: EN-CA. Respond exclusively in English (Canada).';
      
      // Translation context (only if inLang != outLang)
      let enhancedPrompt = `${header}\n\n${systemPrompt}`;
      if (inputLanguage !== outputLanguage) {
        console.log(`[FMT] Adding language context for ${inputLanguage} → ${outputLanguage}`);
        const context = buildLanguageContext(inputLanguage, outputLanguage, section);
        enhancedPrompt = `${header}\n\n${context}${systemPrompt}`;
      } else {
        console.log(`[FMT] No language context needed (same language)`);
      }
      
      console.log(`[FMT] systemPrompt(head)=`, enhancedPrompt.slice(0, 220));
      
      // Note: guardrails loaded but not used in current implementation
      // await loadGuardrailsFile(formatterPrompts.guardrails);
      
      // Token budget management
      const estimateTokens = (s: string) => Math.ceil((s?.length ?? 0) / 4);
      const approxTokensIn = estimateTokens(enhancedPrompt) + estimateTokens(transcript) + estimateTokens(JSON.stringify(clinicalEntities));
      console.log(`[FMT] approxTokensIn: ${approxTokensIn}`);
      
      // Trim transcript for the format step (keep the most recent/most dense)
      const TRIM_THRESHOLD = 8000; // chars
      const trimmed = transcript.length > TRIM_THRESHOLD ? transcript.slice(-TRIM_THRESHOLD) : transcript;
      if (trimmed !== transcript) {
        console.log(`[FMT] Trimmed transcript from ${transcript.length} to ${trimmed.length} chars`);
      }
      
      // Format with clinical entities
      console.log(`[FMT] Calling OpenAI with enhanced prompt length: ${enhancedPrompt.length}`);
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: enhancedPrompt },
          { role: "user", content: `TRANSCRIPT (possibly truncated):\n${trimmed}\n\n[Clinical Entities]\n${JSON.stringify(clinicalEntities)}` }
        ],
        temperature: 0.2,
        max_tokens: 1200
      });
      
      const choice = completion?.choices?.[0];
      const out = choice?.message?.content?.trim() ?? '';
      
      console.log(`[FMT] finish_reason: ${choice?.finish_reason}, usage:`, completion?.usage);
      console.log(`[FMT] Output length: ${out.length}`);
      console.log(`[FMT] Output preview: ${out.substring(0, 200)}...`);
      
      // Guards on the response
      const raw = transcript.trim();
      if (!out) {
        return this.passThrough('LLM returned empty content', transcript, issues, clinicalEntities);
      }
      if (out === raw) {
        return this.passThrough('Formatting pass-through (identical to input)', transcript, issues, clinicalEntities);
      }
      
      const formatted = out;
      
      // Language validation
      const looksFrench = (t: string) =>
        /[àâçéèêëîïôùûüÿœ]/i.test(t) || t.includes("Plaintes et problèmes :");
      
      if (outputLanguage === 'fr' && !looksFrench(formatted)) {
        issues.push('Formatter returned non-French output');
        console.warn(`[FMT] Expected French output but got: ${formatted.substring(0, 100)}...`);
      }
      
      // Section 8 header enforcement
      if (section === '8') {
        const S8_FR = [
          "Appréciation subjective de l'évolution :",
          "Plaintes et problèmes :",
          "Impact fonctionnel :",
          "Observations neurologiques :",
          "Autres observations :",
          "Exclusions / mentions négatives :",
          "Références externes :"
        ];
        const S8_EN = [
          "Subjective appraisal of progression:",
          "Complaints and problems:",
          "Functional impact:",
          "Neurological observations:",
          "Other observations:",
          "Exclusions / negative mentions:",
          "External references:"
        ];
        
        const must = outputLanguage === 'fr' ? S8_FR : S8_EN;
        const missing = must.filter(h => !formatted.includes(h));
        if (missing.length) {
          issues.push(`Missing required headers: ${missing.join(', ')}`);
          console.warn(`[FMT] Missing Section 8 headers: ${missing.join(', ')}`);
        }
      }
      
      // Validate CNESST compliance
      const complianceValidation = validateCNESSTCompliance(section, outputLanguage);
      issues.push(...complianceValidation.issues);
      
      return {
        formatted,
        issues,
        confidence_score: issues.length === 0 ? 0.8 : 0.6,
        clinical_entities: clinicalEntities
      };
      
    } catch (error) {
      console.error(`[TemplatePipeline] Two-pass pipeline error:`, error);
      console.error(`[TemplatePipeline] Error details:`, {
        section,
        transcriptLength: transcript.length,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined
      });
      
      issues.push(`Two-pass pipeline error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        formatted: transcript,
        issues,
        confidence_score: 0.1,
        clinical_entities: null
      };
    }
  }
  /**
   * Process CleanedInput through template pipeline
   * Uses cleaned_text as narrative source and clinical_entities for structured merges
   */
  async process(
    cleanedInput: CleanedInput,
    options: TemplatePipelineOptions
  ): Promise<TemplatePipelineResult> {
    const issues: string[] = [];
    
    try {
      switch (options.section) {
        case '7':
          return await this.processSection7(cleanedInput, options);
        case '8':
          return await this.processSection8(cleanedInput, options);
        case '11':
          return await this.processSection11(cleanedInput, options);
        default:
          throw new Error(`Unsupported section: ${options.section}`);
      }
    } catch (error) {
      issues.push(`Template pipeline error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        formatted: cleanedInput.cleaned_text, // Return cleaned text on error
        issues,
        confidence_score: 0,
        clinical_entities: cleanedInput.clinical_entities
      };
    }
  }

  /**
   * Process Section 8 (Subjective questionnaire) with CleanedInput
   */
  private async processSection8(
    cleanedInput: CleanedInput,
    options: TemplatePipelineOptions
  ): Promise<TemplatePipelineResult> {
    const issues: string[] = [];
    
    try {
      // Extract name whitelist from cleaned text
      const nameWhitelist = extractNameWhitelist(cleanedInput.cleaned_text);
      
      // Apply AI formatting with guardrails using cleaned text and clinical entities
      const canon = (l?: string) => (l === 'fr' ? 'fr' : 'en');
      const outputLanguage = canon(options.outputLanguage);
      const result = await formatWithGuardrails('8', outputLanguage, cleanedInput.cleaned_text, undefined, { 
        nameWhitelist,
        clinicalEntities: cleanedInput.clinical_entities
      });
      
      return {
        formatted: result.formatted,
        issues: result.issues,
        confidence_score: result.confidence_score || 0.8,
        clinical_entities: cleanedInput.clinical_entities
      };
    } catch (error) {
      issues.push(`Section 8 processing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        formatted: cleanedInput.cleaned_text,
        issues,
        confidence_score: 0.1,
        clinical_entities: cleanedInput.clinical_entities
      };
    }
  }

  /**
   * Process Section 7 (Historical narrative) with CleanedInput
   */
  private async processSection7(
    cleanedInput: CleanedInput,
    options: TemplatePipelineOptions
  ): Promise<TemplatePipelineResult> {
    const issues: string[] = [];
    
    try {
      // Extract name whitelist from cleaned text
      const nameWhitelist = extractNameWhitelist(cleanedInput.cleaned_text);
      
      // Apply AI formatting with guardrails using cleaned text
      const canon = (l?: string) => (l === 'fr' ? 'fr' : 'en');
      const outputLanguage = canon(options.outputLanguage);
      const result = await formatWithGuardrails('7', outputLanguage, cleanedInput.cleaned_text, undefined, { nameWhitelist });
      
      return {
        formatted: result.formatted,
        issues: result.issues,
        confidence_score: result.confidence_score || 0.9,
        clinical_entities: cleanedInput.clinical_entities
      };
    } catch (error) {
      issues.push(`Section 7 processing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        formatted: cleanedInput.cleaned_text,
        issues,
        confidence_score: 0,
        clinical_entities: cleanedInput.clinical_entities
      };
    }
  }


  /**
   * Process Section 11 (Conclusion) with CleanedInput
   */
  private async processSection11(
    cleanedInput: CleanedInput,
    _options: TemplatePipelineOptions
  ): Promise<TemplatePipelineResult> {
    const issues: string[] = [];
    
    try {
      // TODO: Implement Section 11 AI formatting with clinical entities integration
      // For now, return cleaned text with clinical entities
      issues.push('Section 11 AI formatting not yet implemented');
      
      return {
        formatted: cleanedInput.cleaned_text,
        issues,
        confidence_score: 0.5,
        clinical_entities: cleanedInput.clinical_entities
      };
    } catch (error) {
      issues.push(`Section 11 processing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        formatted: cleanedInput.cleaned_text,
        issues,
        confidence_score: 0,
        clinical_entities: cleanedInput.clinical_entities
      };
    }
  }
}
