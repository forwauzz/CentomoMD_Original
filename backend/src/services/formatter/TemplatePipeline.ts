import { CleanedInput } from '../../../shared/types/clinical.js';
import { formatWithGuardrails } from './shared.js';
import { extractNameWhitelist } from '../../utils/names.js';

export interface TemplatePipelineResult {
  formatted: string;
  issues: string[];
  confidence_score: number;
  clinical_entities?: any;
}

export interface TemplatePipelineOptions {
  language: 'fr' | 'en';
  section: '7' | '8' | '11';
  templateId?: string | undefined;
}

/**
 * Template Pipeline - S8 layer that processes CleanedInput from S7 UniversalCleanup
 * Dispatches to appropriate formatters based on section
 */
export class TemplatePipeline {
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
      const result = await formatWithGuardrails('8', options.language, cleanedInput.cleaned_text, undefined, { 
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
      const result = await formatWithGuardrails('7', options.language, cleanedInput.cleaned_text, undefined, { nameWhitelist });
      
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
