import { formatWithGuardrails } from './shared.js';
import { extractNameWhitelist } from '../../utils/names.js';
import { LayerManager } from '../layers/LayerManager.js';
import { UniversalCleanupLayer } from '../layers/UniversalCleanupLayer.js';
import { CleanedInput } from '../../../shared/types/clinical.js';
import { TemplatePipeline } from './TemplatePipeline.js';

export interface Mode2FormattingOptions {
  language: 'fr' | 'en';
  section: '7' | '8' | '11';
  case_id?: string;
  selected_sections?: number[];
  extra_dictation?: string;
  // Template combination parameters
  templateCombo?: string;
  verbatimSupport?: boolean;
  voiceCommandsSupport?: boolean;
}

export interface Mode2FormattingResult {
  formatted: string;
  issues: string[];
  sources_used?: string[];
  confidence_score?: number;
  clinical_entities?: any; // Clinical entities from S7 UniversalCleanup
}

export class Mode2Formatter {
  private layerManager: LayerManager;
  private universalCleanupLayer: UniversalCleanupLayer;
  private templatePipeline: TemplatePipeline;

  constructor() {
    this.layerManager = new LayerManager();
    this.universalCleanupLayer = new UniversalCleanupLayer();
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
   * Format Section 7 (Historical narrative) with AI
   * Supports template combinations with modular layer system
   * Maintains backward compatibility with original Mode 2 pipeline
   */
  private async formatSection8Enhanced(
    transcript: string, 
    options: Mode2FormattingOptions
  ): Promise<Mode2FormattingResult> {
    const issues: string[] = [];
    
    try {
      // Check if Universal Cleanup is enabled
      const universalCleanupEnabled = process.env['UNIVERSAL_CLEANUP_ENABLED'] === 'true';
      
      let clinicalEntities: any = null;
      
      if (universalCleanupEnabled) {
        console.log('Universal Cleanup enabled - processing Section 8 with S7 UniversalCleanupLayer');
        console.log('Section 8 - transcript length:', transcript.length);
        console.log('Section 8 - language:', options.language);
        
        // Process with UniversalCleanupLayer to get CleanedInput
        const cleanupResult = await this.universalCleanupLayer.process(transcript, {
          language: options.language,
          source: 'ambient' // Default to ambient, could be made configurable
        });
        
        console.log('Section 8 - Universal Cleanup result:', {
          success: cleanupResult.success,
          hasData: !!cleanupResult.data,
          error: cleanupResult.metadata?.['error']
        });
        
        if (cleanupResult.success && cleanupResult.data) {
          const cleanedData = cleanupResult.data;
          clinicalEntities = cleanedData.clinical_entities;
          console.log('Universal Cleanup completed successfully for Section 8');
          
          // Use TemplatePipeline to process CleanedInput
          const templateResult = await this.templatePipeline.process(cleanedData, {
            section: '8',
            language: options.language,
            templateId: options.templateCombo || 'section8-ai-formatter'
          });
          
          return {
            formatted: templateResult.formatted,
            issues: templateResult.issues || [],
            sources_used: ['universal-cleanup', 'template-pipeline'],
            confidence_score: templateResult.confidence_score || 0.8,
            clinical_entities: clinicalEntities
          };
        } else {
          console.warn('Universal Cleanup failed, falling back to formatWithGuardrails');
          issues.push('Universal Cleanup failed, using fallback formatting');
        }
      }

      // Fallback to formatWithGuardrails (consistent with Section 7)
      console.log('Using formatWithGuardrails for Section 8 formatting');
      const result = await formatWithGuardrails('8', options.language, transcript);
      
      return {
        formatted: result.formatted,
        issues: [...issues, ...(result.issues || [])],
        sources_used: ['section8-ai-formatter'],
        confidence_score: 0.7,
        clinical_entities: clinicalEntities
      };
      
    } catch (error) {
      console.error('Error in Section 8 formatting:', error);
      issues.push(`Section 8 formatting error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      return {
        formatted: transcript, // Fallback to original transcript
        issues,
        sources_used: ['fallback'],
        confidence_score: 0.1,
        clinical_entities: null
      };
    }
  }

  private async formatSection7(
    transcript: string, 
    options: Mode2FormattingOptions
  ): Promise<Mode2FormattingResult> {
    const issues: string[] = [];
    
    try {
      // Check if Universal Cleanup is enabled
      const universalCleanupEnabled = process.env['UNIVERSAL_CLEANUP_ENABLED'] === 'true';
      
      let cleanedInput: CleanedInput | null = null;
      let clinicalEntities: any = null;
      
      if (universalCleanupEnabled) {
        console.log('Universal Cleanup enabled - processing with S7 UniversalCleanupLayer');
        
        // Process with UniversalCleanupLayer to get CleanedInput
        const cleanupResult = await this.universalCleanupLayer.process(transcript, {
          language: options.language,
          source: 'ambient' // Default to ambient, could be made configurable
        });
        
        if (cleanupResult.success && cleanupResult.data) {
          const cleanedData = cleanupResult.data;
          cleanedInput = cleanedData;
          clinicalEntities = cleanedData.clinical_entities;
          console.log('Universal Cleanup completed successfully');
          
          // Use TemplatePipeline to process CleanedInput
          const pipelineResult = await this.templatePipeline.process(cleanedData, {
            language: options.language,
            section: options.section,
            templateId: options.templateCombo || undefined
          });
          
          return {
            formatted: pipelineResult.formatted,
            issues: [...pipelineResult.issues, ...issues],
            confidence_score: pipelineResult.confidence_score,
            clinical_entities: pipelineResult.clinical_entities
          };
        } else {
          console.warn('Universal Cleanup failed, falling back to original transcript');
          issues.push('Universal Cleanup failed, using original transcript');
        }
      }
      
      // BACKWARD COMPATIBILITY: If no templateCombo is provided, use original Mode 2 pipeline
      if (!options.templateCombo) {
        console.log('No templateCombo provided - using original Mode 2 pipeline');
        
        // Use cleaned text if available, otherwise original transcript
        const textToProcess = cleanedInput ? (cleanedInput as CleanedInput).cleaned_text : transcript;
        
        // Extract name whitelist from processed transcript
        const nameWhitelist = extractNameWhitelist(textToProcess);
        
        // Apply AI formatting with guardrails (original Mode 2 functionality)
        const result = await formatWithGuardrails('7', options.language, textToProcess, undefined, { nameWhitelist });
        
        return {
          formatted: result.formatted,
          issues: result.issues,
          confidence_score: result.confidence_score || 0.9,
          clinical_entities: clinicalEntities
        };
      }

      // NEW LAYER SYSTEM: Process with template combinations
      const templateCombo = options.templateCombo;
      
      // Validate the combination
      const validation = this.layerManager.validateCombination(templateCombo);
      if (!validation.valid) {
        console.warn(`Template combination '${templateCombo}' validation failed:`, validation.errors);
        // Fall back to original Mode 2 pipeline
        console.log('Falling back to original Mode 2 pipeline');
        const { templateCombo: _, ...optionsWithoutCombo } = options;
        return this.formatSection7(transcript, optionsWithoutCombo);
      }

      // Get enabled layers for this combination
      const enabledLayers = this.layerManager.getEnabledLayers(templateCombo);
      
      // Use cleaned text if available from Universal Cleanup, otherwise original transcript
      let processedTranscript = cleanedInput ? (cleanedInput as CleanedInput).cleaned_text : transcript;
      const layerResults: string[] = [];

      // Process each enabled layer in priority order
      // Note: clinicalEntities already set from Universal Cleanup if enabled
      
      for (const layer of enabledLayers) {
        try {
          switch (layer.name) {
            case 'verbatim-layer':
              processedTranscript = await this.processVerbatimLayer(processedTranscript, layer);
              layerResults.push('Verbatim layer processed');
              break;
            case 'voice-commands-layer':
              processedTranscript = await this.processVoiceCommandsLayer(processedTranscript, options.language, layer);
              layerResults.push('Voice commands layer processed');
              break;
            case 'clinical-extraction-layer':
              // If Universal Cleanup is enabled, we already have clinical entities
              if (universalCleanupEnabled && clinicalEntities) {
                layerResults.push('Clinical extraction layer processed (via Universal Cleanup)');
              } else {
                // Legacy path: Use UniversalCleanupLayer internally to avoid drift
                console.log('Legacy clinical extraction - using UniversalCleanupLayer internally');
                const legacyCleanupResult = await this.universalCleanupLayer.process(processedTranscript, {
                  language: options.language,
                  source: 'ambient'
                });
                
                if (legacyCleanupResult.success) {
                  clinicalEntities = legacyCleanupResult.data.clinical_entities;
                  layerResults.push('Clinical extraction layer processed (legacy via UniversalCleanupLayer)');
                } else {
                  layerResults.push('Clinical extraction layer failed, using fallback');
                }
              }
              break;
            case 'universal-cleanup-layer':
              // This layer is handled by Universal Cleanup at the beginning
              if (universalCleanupEnabled) {
                layerResults.push('Universal cleanup layer processed');
              } else {
                layerResults.push('Universal cleanup layer skipped (flag disabled)');
              }
              break;
            default:
              console.warn(`Unknown layer: ${layer.name}`);
          }
        } catch (layerError) {
          console.error(`Layer ${layer.name} processing failed:`, layerError);
          // Check if layer has fallback configured
          if (layer.fallback?.enabled && layer.fallback.action === 'return_original') {
            console.log(`Layer ${layer.name} fallback: returning original transcript`);
            processedTranscript = transcript;
            layerResults.push(`${layer.name} failed, using fallback`);
          } else {
            throw layerError;
          }
        }
      }

      // Extract name whitelist from processed transcript
      const nameWhitelist = extractNameWhitelist(processedTranscript);
      
      // Apply AI formatting with guardrails (this is the core Mode 2 functionality)
      const result = await formatWithGuardrails('7', options.language, processedTranscript, undefined, { nameWhitelist });
      
      // Post-process layers that need restoration
      let finalFormatted = result.formatted;
      for (const layer of enabledLayers) {
        if (layer.name === 'verbatim-layer') {
          finalFormatted = await this.restoreVerbatimContent(finalFormatted, transcript);
        }
      }
      
      return {
        formatted: finalFormatted,
        issues: [...result.issues, ...layerResults, ...issues],
        confidence_score: result.confidence_score || 0.9,
        clinical_entities: clinicalEntities || null // S6.5 - Pass entities to frontend
      };
    } catch (error) {
      issues.push(`Section 7 formatting error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        formatted: transcript,
        issues,
        confidence_score: 0,
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

  /**
   * Process verbatim layer
   * Converts verbatim markers to placeholders for AI processing
   */
  private async processVerbatimLayer(transcript: string, layer: any): Promise<string> {
    // TODO: Implement verbatim marker processing
    // This would convert ___VERBATIM_START___ and ___VERBATIM_END___ markers
    // For now, return the transcript unchanged
    console.log(`Verbatim layer processing (${layer.name}) not yet implemented`);
    return transcript;
  }

  /**
   * Process voice commands layer
   * Converts spoken commands to their replacements
   */
  private async processVoiceCommandsLayer(transcript: string, language: 'fr' | 'en', layer: any): Promise<string> {
    try {
      console.log(`Processing voice commands layer (${layer.name}) for language ${language}`);
      
      // Import the Word-for-Word formatter that handles spoken commands
      const { formatWordForWordText } = await import('../../utils/wordForWordFormatter.js');
      
      // Apply voice command processing using the existing formatter
      const processedTranscript = formatWordForWordText(transcript);
      
      console.log(`Voice commands layer processed: ${transcript.length} → ${processedTranscript.length} characters`);
      return processedTranscript;
    } catch (error) {
      console.error(`Voice commands layer processing failed:`, error);
      // Return original transcript on error (fallback behavior)
      return transcript;
    }
  }

  /**
   * Restore verbatim content after AI processing
   * Replaces verbatim placeholders with original content
   */
  private async restoreVerbatimContent(formattedText: string, originalText: string): Promise<string> {
    // TODO: Implement verbatim content restoration
    // This would restore the original verbatim content from the original text
    // For now, return the formatted text unchanged
    console.log(`Verbatim content restoration not yet implemented (original length: ${originalText.length})`);
    return formattedText;
  }
}
