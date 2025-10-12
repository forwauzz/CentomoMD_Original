import { TemplatePipeline } from './TemplatePipeline.js';
// import { getTemplateVersion } from './langUtils.js';

export interface Mode2FormattingOptions {
  language: 'fr' | 'en'; // Legacy parameter for backward compatibility
  inputLanguage?: 'fr' | 'en';
  outputLanguage?: 'fr' | 'en';
  section: '7' | '8' | '11';
  case_id?: string;
  selected_sections?: number[];
  extra_dictation?: string;
  // Template combination parameters
  templateCombo?: string;
  verbatimSupport?: boolean;
  voiceCommandsSupport?: boolean;
  templateId?: string;
}

export interface Mode2FormattingResult {
  formatted: string;
  issues: string[];
  sources_used?: string[];
  confidence_score?: number;
  clinical_entities?: any; // Clinical entities from S7 UniversalCleanup
}

export class Mode2Formatter {
  private templatePipeline: TemplatePipeline;

  constructor() {
    this.templatePipeline = new TemplatePipeline();
  }

  /**
   * Format transcript using AI-powered Mode 2 processing
   * Handles Section 7, 8, and 11 with appropriate prompts and guardrails
   */
  async format(
    transcript: string, 
    options: Mode2FormattingOptions
  ): Promise<Mode2FormattingResult> {
    const issues: string[] = [];
    
    try {
      switch (options.section) {
        case '7':
          return await this.formatSection7(transcript, options);
        case '8':
          return await this.formatSection8Enhanced(transcript, options);
        case '11':
          return await this.formatSection11(transcript, options);
        default:
          throw new Error(`Unsupported section: ${options.section}`);
      }
    } catch (error) {
      issues.push(`Formatting error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        formatted: transcript, // Return original on error
        issues,
        confidence_score: 0,
        clinical_entities: null
      };
    }
  }

  /**
   * Format Section 8 (Subjective questionnaire) with AI
   * Uses two-pass pipeline: Extract → Format
   */
  private async formatSection8Enhanced(
    transcript: string, 
    options: Mode2FormattingOptions
  ): Promise<Mode2FormattingResult> {
    const issues: string[] = [];
    
    try {
      // Canonicalize languages - One source of truth
      const canon = (l?: string) => (l === 'fr' ? 'fr' : 'en');
      const inputLanguage = canon(options.inputLanguage);
      const outputLanguage = canon(options.outputLanguage);
      
      console.log(`[Mode2Formatter] Section 8 - Input: ${inputLanguage}, Output: ${outputLanguage}`);
      console.log(`[Mode2Formatter] Options:`, { inputLanguage: options.inputLanguage, outputLanguage: options.outputLanguage });
      
      // Get template version for caching
      // const templateVersion = await getTemplateVersion('8', outputLanguage);
      
      // TODO: Implement caching here
      // const cacheKey = createCacheKey('8', options.templateId || 'default', templateVersion, outputLanguage, transcript);
      // const cached = await this.cache.get(cacheKey);
      // if (cached) {
      //   console.log('Cache hit for Section 8 formatting');
      //   return cached;
      // }
      
      // Process with two-pass pipeline
      const result = await this.templatePipeline.processWithTwoPassPipeline(transcript, '8', {
        inputLanguage,
        outputLanguage,
        section: '8',
        templateId: options.templateId || options.case_id
      });
      
      const formattingResult: Mode2FormattingResult = {
        formatted: result.formatted,
        issues: result.issues,
        sources_used: ['section8-ai-formatter'],
        confidence_score: result.confidence_score,
        clinical_entities: result.clinical_entities
      };
      
      // TODO: Cache result
      // await this.cache.set(cacheKey, formattingResult);
      
      return formattingResult;
      
    } catch (error) {
      console.error('Error in Section 8 formatting:', error);
      return {
        formatted: transcript,
        issues: [...issues, `Formatting error: ${error instanceof Error ? error.message : 'Unknown error'}`],
        sources_used: ['section8-ai-formatter'],
        confidence_score: 0.1,
        clinical_entities: null
      };
    }
  }

  /**
   * Format Section 7 (Historical narrative) with AI
   * Uses two-pass pipeline: Extract → Format
   */
  private async formatSection7(
    transcript: string, 
    options: Mode2FormattingOptions
  ): Promise<Mode2FormattingResult> {
    const issues: string[] = [];
    
    try {
      // Canonicalize languages - One source of truth
      const canon = (l?: string) => (l === 'fr' ? 'fr' : 'en');
      const inputLanguage = canon(options.inputLanguage);
      const outputLanguage = canon(options.outputLanguage);
      
      // Get template version for caching
      // const templateVersion = await getTemplateVersion('7', outputLanguage);
      
      // TODO: Implement caching here
      // const cacheKey = createCacheKey('7', options.templateId || 'default', templateVersion, outputLanguage, transcript);
      // const cached = await this.cache.get(cacheKey);
      // if (cached) {
      //   console.log('Cache hit for Section 7 formatting');
      //   return cached;
      // }
      
      // Process with two-pass pipeline
      const result = await this.templatePipeline.processWithTwoPassPipeline(transcript, '7', {
        inputLanguage,
        outputLanguage,
        section: '7',
        templateId: options.templateId || options.case_id
      });
      
      const formattingResult: Mode2FormattingResult = {
        formatted: result.formatted,
        issues: result.issues,
        sources_used: ['section7-ai-formatter'],
        confidence_score: result.confidence_score,
        clinical_entities: result.clinical_entities
      };
      
      // TODO: Cache result
      // await this.cache.set(cacheKey, formattingResult);
      
      return formattingResult;
      
    } catch (error) {
      console.error('Error in Section 7 formatting:', error);
      return {
        formatted: transcript,
        issues: [...issues, `Formatting error: ${error instanceof Error ? error.message : 'Unknown error'}`],
        sources_used: ['section7-ai-formatter'],
        confidence_score: 0.1,
        clinical_entities: null
      };
    }
  }

  /**
   * Format Section 11 (Conclusion) with AI
   */
  private async formatSection11(
    transcript: string, 
    _options: Mode2FormattingOptions
  ): Promise<Mode2FormattingResult> {
    const issues: string[] = [];
    
    try {
      // TODO: Implement Section 11 AI formatting with source integration
      // For now, return original transcript
      issues.push('Section 11 AI formatting not yet implemented');
      
      return {
        formatted: transcript,
        issues,
        sources_used: [],
        confidence_score: 0,
        clinical_entities: null
      };
    } catch (error) {
      issues.push(`Section 11 formatting error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        formatted: transcript,
        issues,
        sources_used: [],
        confidence_score: 0,
        clinical_entities: null
      };
    }
  }
}
