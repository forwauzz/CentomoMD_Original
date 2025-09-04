import { formatWithGuardrails } from './shared.js';
import { extractNameWhitelist } from '../../utils/names.js';

export interface Mode2FormattingOptions {
  language: 'fr' | 'en';
  section: '7' | '8' | '11';
  case_id?: string;
  selected_sections?: number[];
  extra_dictation?: string;
}

export interface Mode2FormattingResult {
  formatted: string;
  issues: string[];
  sources_used?: string[];
  confidence_score?: number;
}

export class Mode2Formatter {
  constructor() {
    // Constructor for future extensions
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
          return await this.formatSection8(transcript, options);
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
        confidence_score: 0
      };
    }
  }

  /**
   * Format Section 7 (Historical narrative) with AI
   */
  private async formatSection7(
    transcript: string, 
    options: Mode2FormattingOptions
  ): Promise<Mode2FormattingResult> {
    const issues: string[] = [];
    
    try {
      // Extract name whitelist from raw transcript
      const nameWhitelist = extractNameWhitelist(transcript);
      
      // Use the shared formatWithGuardrails function with name whitelist
      const result = await formatWithGuardrails('7', options.language, transcript, undefined, { nameWhitelist });
      
      return {
        formatted: result.formatted,
        issues: result.issues,
        confidence_score: result.confidence_score || 0.9
      };
    } catch (error) {
      issues.push(`Section 7 formatting error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        formatted: transcript,
        issues,
        confidence_score: 0
      };
    }
  }

  /**
   * Format Section 8 (Clinical examination) with AI
   */
  private async formatSection8(
    transcript: string, 
    _options: Mode2FormattingOptions
  ): Promise<Mode2FormattingResult> {
    const issues: string[] = [];
    
    try {
      // TODO: Implement Section 8 AI formatting
      // For now, return original transcript
      issues.push('Section 8 AI formatting not yet implemented');
      
      return {
        formatted: transcript,
        issues,
        confidence_score: 0
      };
    } catch (error) {
      issues.push(`Section 8 formatting error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        formatted: transcript,
        issues,
        confidence_score: 0
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
        confidence_score: 0
      };
    } catch (error) {
      issues.push(`Section 11 formatting error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        formatted: transcript,
        issues,
        sources_used: [],
        confidence_score: 0
      };
    }
  }





}
