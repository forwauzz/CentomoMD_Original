/**
 * Processing Orchestrator
 * Coordinates sections, modes, and templates in a decoupled way
 */

import { sectionManager } from '../../config/sections.js';
import { modeManager, ModeConfig } from '../../config/modes.js';
import { templateManager, TemplateConfig } from '../../config/templates.js';
import { FLAGS } from '../../config/flags.js';

export interface ProcessingRequest {
  sectionId: string;
  modeId: string;
  templateId?: string;
  language: string;
  content: string;
  correlationId?: string;
  // NEW: Layer support
  layerStack?: string[];
  stack_fingerprint?: string;
  // NEW: Model selection
  model?: string;
  seed?: number;
  temperature?: number;
  // NEW: Template version selection
  templateVersion?: string; // e.g., '1.0.0', 'latest', 'stable', or bundle-specific version
  options?: {
    timeout?: number;
    retryAttempts?: number;
    fallbackMode?: string;
    fallbackTemplate?: string;
    prompt_hash?: string; // NEW: Prompt version tracking
  };
}

export interface ProcessingResult {
  success: boolean;
  processedContent: string;
  metadata: {
    sectionId: string;
    modeId: string;
    templateId?: string;
    language: string;
    processingTime: number;
    warnings: string[];
    errors: string[];
  };
  // NEW: Operational metadata
  operational?: {
    latencyMs: number;
    tokensIn?: number;
    tokensOut?: number;
    costUsd?: number;
    model?: string;
    deterministic?: boolean;
  };
}

export interface CompatibilityCheck {
  compatible: boolean;
  issues: string[];
  suggestions: string[];
  alternatives: {
    sections: string[];
    modes: string[];
    templates: string[];
  };
}

/**
 * Main orchestrator for decoupled processing
 */
export class ProcessingOrchestrator {
  /**
   * Check compatibility between section, mode, and template
   */
  checkCompatibility(request: ProcessingRequest): CompatibilityCheck {
    const issues: string[] = [];
    const suggestions: string[] = [];
    const alternatives = {
      sections: [] as string[],
      modes: [] as string[],
      templates: [] as string[]
    };

    // Check section exists
    const section = sectionManager.getSection(request.sectionId);
    if (!section) {
      issues.push(`Section '${request.sectionId}' not found`);
      alternatives.sections = sectionManager.getAllSections().map(s => s.id);
    }

    // Check mode exists
    const mode = modeManager.getMode(request.modeId);
    if (!mode) {
      issues.push(`Mode '${request.modeId}' not found`);
      alternatives.modes = modeManager.getAllModes().map(m => m.id);
    }

    // Check template exists (if provided)
    if (request.templateId) {
      const template = templateManager.getTemplate(request.templateId);
      if (!template) {
        issues.push(`Template '${request.templateId}' not found`);
        alternatives.templates = templateManager.getAllTemplates().map(t => t.id);
      }
    }

    // Check section-mode compatibility
    if (section && mode) {
      if (!modeManager.isSectionSupported(request.modeId, request.sectionId)) {
        issues.push(`Mode '${request.modeId}' does not support section '${request.sectionId}'`);
        const compatibleModes = sectionManager.getSectionsByMode(request.sectionId);
        alternatives.modes = compatibleModes.map(m => m.id);
      }
    }

    // Check section-language compatibility
    if (section) {
      if (!sectionManager.isLanguageSupported(request.sectionId, request.language)) {
        issues.push(`Section '${request.sectionId}' does not support language '${request.language}'`);
        suggestions.push(`Supported languages: ${section.supportedLanguages.join(', ')}`);
      }
    }

    // Check mode-language compatibility
    if (mode) {
      if (!modeManager.isLanguageSupported(request.modeId, request.language)) {
        issues.push(`Mode '${request.modeId}' does not support language '${request.language}'`);
        suggestions.push(`Supported languages: ${mode.supportedLanguages.join(', ')}`);
      }
    }

    // Check template compatibility (if provided)
    if (request.templateId && section && mode) {
      const template = templateManager.getTemplate(request.templateId);
      if (template) {
        if (!templateManager.isSectionCompatible(request.templateId, request.sectionId)) {
          issues.push(`Template '${request.templateId}' is not compatible with section '${request.sectionId}'`);
          const compatibleTemplates = templateManager.getTemplatesBySection(request.sectionId);
          alternatives.templates = compatibleTemplates.map(t => t.id);
        }

        if (!templateManager.isModeCompatible(request.templateId, request.modeId)) {
          issues.push(`Template '${request.templateId}' is not compatible with mode '${request.modeId}'`);
          const compatibleTemplates = templateManager.getTemplatesByMode(request.modeId);
          alternatives.templates = compatibleTemplates.map(t => t.id);
        }

        if (!templateManager.isLanguageSupported(request.templateId, request.language)) {
          issues.push(`Template '${request.templateId}' does not support language '${request.language}'`);
          suggestions.push(`Supported languages: ${template.supportedLanguages.join(', ')}`);
        }
      }
    }

    // Generate suggestions
    if (issues.length > 0) {
      suggestions.push('Consider using the suggested alternatives above');
    }

    return {
      compatible: issues.length === 0,
      issues,
      suggestions,
      alternatives
    };
  }

  /**
   * Find the best template for a section/mode/language combination
   */
  findBestTemplate(sectionId: string, modeId: string, language: string, requiredFeatures: (keyof TemplateConfig['features'])[] = []): TemplateConfig | null {
    return templateManager.getBestTemplate(sectionId, modeId, language, requiredFeatures);
  }

  /**
   * Find the best mode for a section/language combination
   */
  findBestMode(sectionId: string, language: string, requiredCapabilities: (keyof ModeConfig['capabilities'])[] = []): ModeConfig | null {
    return modeManager.getBestMode(sectionId, language, requiredCapabilities);
  }

  /**
   * Get all compatible combinations for a given section
   */
  getCompatibleCombinations(sectionId: string, language: string): {
    modes: ModeConfig[];
    templates: TemplateConfig[];
    combinations: Array<{
      mode: ModeConfig;
      template: TemplateConfig;
      compatibility: number; // 0-1 score
    }>;
  } {
    const compatibleModes = modeManager.getCompatibleModes(sectionId, language);
    const compatibleTemplates = templateManager.getTemplatesBySection(sectionId)
      .filter(template => template.supportedLanguages.includes(language));

    const combinations = [];
    for (const mode of compatibleModes) {
      for (const template of compatibleTemplates) {
        if (templateManager.isModeCompatible(template.id, mode.id)) {
          // Calculate compatibility score based on feature alignment
          const modeCapabilities = Object.values(mode.capabilities).filter(Boolean).length;
          const templateFeatures = Object.values(template.features).filter(Boolean).length;
          const alignment = Math.min(modeCapabilities, templateFeatures) / Math.max(modeCapabilities, templateFeatures);
          
          combinations.push({
            mode,
            template,
            compatibility: alignment
          });
        }
      }
    }

    // Sort by compatibility score
    combinations.sort((a, b) => b.compatibility - a.compatibility);

    return {
      modes: compatibleModes,
      templates: compatibleTemplates,
      combinations
    };
  }

  /**
   * Process content using the decoupled architecture
   */
  async processContent(request: ProcessingRequest): Promise<ProcessingResult> {
    const startTime = Date.now();
    const warnings: string[] = [];
    const errors: string[] = [];
    const correlationId = request.correlationId || 'no-correlation-id';

    console.info(`[${correlationId}] ProcessingOrchestrator.processContent started`, {
      templateId: request.templateId,
      modeId: request.modeId,
      language: request.language,
      contentLength: request.content.length
    });

    try {
      // Check compatibility first
      const compatibility = this.checkCompatibility(request);
      if (!compatibility.compatible) {
        console.warn(`[${correlationId}] Compatibility check failed:`, compatibility.issues);
        return {
          success: false,
          processedContent: request.content,
          metadata: {
            sectionId: request.sectionId,
            modeId: request.modeId,
            ...(request.templateId && { templateId: request.templateId }),
            language: request.language,
            processingTime: Date.now() - startTime,
            warnings,
            errors: [...errors, ...compatibility.issues]
          }
        };
      }

      // Get configurations
      const section = sectionManager.getSection(request.sectionId);
      const mode = modeManager.getMode(request.modeId);
      const template = request.templateId ? templateManager.getTemplate(request.templateId) : null;

      if (!section || !mode) {
        throw new Error('Invalid section or mode configuration');
      }

      // Validate section content
      const validation = sectionManager.validateSectionContent(request.sectionId, request.content);
      if (!validation.valid) {
        errors.push(...validation.errors);
      }
      warnings.push(...validation.warnings);

      // Process content based on mode and template
      let processedContent = request.content;

      // NEW: Apply pre-layers if layerStack provided (feature-flagged)
      if (FLAGS.FEATURE_LAYER_PROCESSING && request.layerStack && request.layerStack.length > 0) {
        // Filter pre-layers (layers that should run before template)
        const preLayers = request.layerStack.filter(layerName => this.isPreLayer(layerName));
        
        for (const layerName of preLayers) {
          try {
            console.log(`[${correlationId}] Applying pre-layer: ${layerName}`);
            // Get layer processor directly
            const processor = await this.getLayerProcessor(layerName);
            if (processor) {
              const layerResult = await processor.process(processedContent, {
                language: request.language,
                correlationId,
              });
              if (layerResult.success && layerResult.data?.cleaned_text) {
                processedContent = layerResult.data.cleaned_text;
                console.log(`[${correlationId}] Pre-layer ${layerName} processed successfully`);
              }
            }
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            warnings.push(`Pre-layer ${layerName} processing failed: ${errorMsg}`);
            console.error(`[${correlationId}] Pre-layer ${layerName} error:`, errorMsg);
          }
        }
      }

      // Apply template processing if template is specified
      if (template) {
        processedContent = await this.applyTemplateProcessing(processedContent, template, request);
      }

      // NEW: Apply post-layers if layerStack provided (feature-flagged)
      if (FLAGS.FEATURE_LAYER_PROCESSING && request.layerStack && request.layerStack.length > 0) {
        // Filter post-layers (layers that should run after template)
        const postLayers = request.layerStack.filter(layerName => !this.isPreLayer(layerName));
        
        for (const layerName of postLayers) {
          try {
            console.log(`[${correlationId}] Applying post-layer: ${layerName}`);
            // Get layer processor directly
            const processor = await this.getLayerProcessor(layerName);
            if (processor) {
              const layerResult = await processor.process(processedContent, {
                language: request.language,
                correlationId,
              });
              if (layerResult.success && layerResult.data?.cleaned_text) {
                processedContent = layerResult.data.cleaned_text;
                console.log(`[${correlationId}] Post-layer ${layerName} processed successfully`);
              }
            }
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            warnings.push(`Post-layer ${layerName} processing failed: ${errorMsg}`);
            console.error(`[${correlationId}] Post-layer ${layerName} error:`, errorMsg);
          }
        }
      }

      // Apply mode processing
      processedContent = await this.applyModeProcessing(processedContent, mode, request);

      const processingTime = Date.now() - startTime;

      // NEW: Collect operational metadata
      const operational: ProcessingResult['operational'] = {
        latencyMs: processingTime,
        deterministic: request.seed !== undefined,
      };
      
      // Only add model if provided
      if (request.model) {
        operational.model = request.model;
        console.log(`[PROOF] ProcessingOrchestrator - Model requested: ${request.model}, correlationId: ${correlationId}`);
      }

      const result: ProcessingResult = {
        success: errors.length === 0,
        processedContent,
        metadata: {
          sectionId: request.sectionId,
          modeId: request.modeId,
          ...(request.templateId && { templateId: request.templateId }),
          language: request.language,
          processingTime,
          warnings,
          errors
        },
      };
      
      // Add operational metadata if we have it
      result.operational = operational;
      
      return result;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      errors.push(`Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);

      return {
        success: false,
        processedContent: request.content,
        metadata: {
          sectionId: request.sectionId,
          modeId: request.modeId,
          ...(request.templateId && { templateId: request.templateId }),
          language: request.language,
          processingTime,
          warnings,
          errors
        }
      };
    }
  }

  /**
   * Apply template-specific processing
   */
  private async applyTemplateProcessing(content: string, template: TemplateConfig, request: ProcessingRequest): Promise<string> {
    const correlationId = request.correlationId || 'no-correlation-id';
    console.log(`[${correlationId}] Applying template processing: ${template.id}`, {
      templateId: template.id,
      templateName: template.name,
      contentLength: content.length
    });
    
    // Handle Word-for-Word (with AI) template
    if (template.id === 'word-for-word-with-ai') {
      console.log(`[${correlationId}] Routing to processWordForWordWithAI`);
      return await this.processWordForWordWithAI(content, template, request);
    }
    
    // Handle regular Word-for-Word formatter template
    if (template.id === 'word-for-word-formatter') {
      console.log(`[${correlationId}] Routing to processWordForWordFormatter`);
      return await this.processWordForWordFormatter(content, template, request);
    }
    
    // Handle Section 7 AI Formatter template
    if (template.id === 'section7-ai-formatter') {
      console.log(`[${correlationId}] Routing to processSection7AIFormatter`);
      return await this.processSection7AIFormatter(content, template, request);
    }
    
    // Handle Section 7 v1 template (uses same formatter, different manifest)
    if (template.id === 'section7-v1') {
      console.log(`[${correlationId}] Routing to processSection7AIFormatter (v1)`);
      return await this.processSection7AIFormatter(content, template, request);
    }
    
    // Handle Section 7 R&D Pipeline template
    if (template.id === 'section7-rd') {
      console.log(`[${correlationId}] Routing to processSection7Rd`);
      return await this.processSection7Rd(content, template, request);
    }
    
    // Handle Section 8 AI Formatter template
    if (template.id === 'section8-ai-formatter') {
      console.log(`[${correlationId}] Routing to processSection8AIFormatter`);
      return await this.processSection8AIFormatter(content, template, request);
    }
    
    // Handle History of Evolution AI Formatter template
    if (template.id === 'history-evolution-ai-formatter') {
      console.log(`[${correlationId}] Routing to processHistoryEvolutionAIFormatter`);
      return await this.processHistoryEvolutionAIFormatter(content, template, request);
    }
    
    // Handle Section 7 Template Only
    if (template.id === 'section-7-only') {
      console.log(`[${correlationId}] Routing to processSection7TemplateOnly`);
      return await this.processSection7TemplateOnly(content, template, request);
    }
    
    // Handle Section 7 Template + Verbatim
    if (template.id === 'section-7-verbatim') {
      console.log(`[${correlationId}] Routing to processSection7Verbatim`);
      return await this.processSection7Verbatim(content, template, request);
    }
    
    // Handle Section 7 Template + Verbatim + Voice Commands
    if (template.id === 'section-7-full') {
      console.log(`[${correlationId}] Routing to processSection7Full`);
      return await this.processSection7Full(content, template, request);
    }
    
    // Handle other templates as needed
    // For now, return content as-is for other templates
    console.log(`[${correlationId}] No specific handler found for template: ${template.id}, returning content as-is`);
    return content;
  }

  /**
   * Process Word-for-Word (with AI) template
   */
  private async processWordForWordWithAI(content: string, template: TemplateConfig, request: ProcessingRequest): Promise<string> {
    const correlationId = request.correlationId || 'no-correlation-id';
    
    try {
      console.info(`[${correlationId}] processWordForWordWithAI started`, {
        templateId: template.id,
        contentLength: content.length
      });
      
      // Step 1: Apply deterministic word-for-word formatting first
      const { formatWordForWordText } = await import('../../utils/wordForWordFormatter.js');
      let processedContent = formatWordForWordText(content);
      
      console.info(`[${correlationId}] deterministic_ok`, {
        inputLength: content.length,
        outputLength: processedContent.length
      });
      
      // Step 2: Check if AI formatting is enabled (from frontend config)
      // For now, we'll enable it by default since the template is designed for AI formatting
      const aiFormattingEnabled = true; // TODO: Get this from template config
      
      if (aiFormattingEnabled && template.features.aiFormatting) {
        console.info(`[${correlationId}] ai_start`);
        
        // Step 3: Apply AI formatting using the custom Word-for-Word AI prompt
        const result = await this.applyWordForWordAIFormatting(processedContent, request.language as 'fr' | 'en', correlationId);
        processedContent = result.formatted;
        
        console.info(`[${correlationId}] ai_ok`, {
          inputLength: processedContent.length,
          outputLength: result.formatted.length,
          issues: result.issues.length
        });
      }
      
      return processedContent;
    } catch (error) {
      console.error(`[${correlationId}] ai_error:`, error);
      // Fallback to basic word-for-word formatting
      const { formatWordForWordText } = await import('../../utils/wordForWordFormatter.js');
      return formatWordForWordText(content);
    }
  }

  /**
   * Apply Word-for-Word AI formatting using the custom prompt
   */
  private async applyWordForWordAIFormatting(content: string, _language: 'fr' | 'en', correlationId: string): Promise<{ formatted: string; issues: string[] }> {
    try {
      console.info(`[${correlationId}] applyWordForWordAIFormatting started`, {
        contentLength: content.length
      });
      
      const OpenAI = (await import('openai')).default;
      const fs = await import('fs');
      const path = await import('path');
      
      // Initialize OpenAI client
      const openai = new OpenAI({
        apiKey: process.env['OPENAI_API_KEY'],
      });

      // Load the Word-for-Word AI formatting prompt
      const promptPath = path.join(process.cwd(), 'prompts', 'word-for-word-ai-formatting.md');
      let systemPrompt: string;
      
      try {
        systemPrompt = fs.readFileSync(promptPath, 'utf8');
        console.info(`[${correlationId}] AI prompt loaded successfully`, {
          promptLength: systemPrompt.length,
          promptPreview: systemPrompt.substring(0, 60) + '...'
        });
      } catch (promptError) {
        console.warn(`[${correlationId}] Failed to load AI prompt, using fallback:`, promptError);
        // Fallback prompt
        systemPrompt = `You are a deterministic Word-for-Word transcription formatter. Strip speaker prefixes (Pt:, Dr:, etc.) from line starts. Convert spoken commands (period, comma, new line, etc.) to actual formatting. Preserve all medical information exactly. Return only the cleaned transcript.`;
      }

      // Prepare the user message
      const userMessage = `RAW TRANSCRIPT:\n${content}`;

      console.info(`[${correlationId}] Calling OpenAI API`, {
        model: 'gpt-4o-mini',
        inputLength: content.length,
        promptLength: systemPrompt.length
      });

      // Call OpenAI with the custom prompt
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userMessage
          }
        ],
        temperature: 0.1, // Low temperature for deterministic formatting
        max_tokens: 4000
      });

      const formatted = completion.choices[0]?.message?.content?.trim() || content;
      
      console.info(`[${correlationId}] OpenAI API response received`, {
        outputLength: formatted.length,
        usage: completion.usage
      });
      
      return {
        formatted,
        issues: []
      };
    } catch (error) {
      console.error(`[${correlationId}] Word-for-Word AI formatting failed:`, error);
      return {
        formatted: content, // Return original content if AI fails
        issues: [`AI formatting failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  /**
   * Process regular Word-for-Word formatter template
   */
  private async processWordForWordFormatter(content: string, template: TemplateConfig, request: ProcessingRequest): Promise<string> {
    const correlationId = request.correlationId || 'no-correlation-id';
    
    try {
      console.log(`[${correlationId}] Processing word-for-word formatter template: ${template.id}`);
      
      // Import and use the word-for-word formatter
      const { formatWordForWordText } = await import('../../utils/wordForWordFormatter.js');
      const processedContent = formatWordForWordText(content);
      
      console.log(`[${correlationId}] Word-for-word formatting completed`, {
        originalLength: content.length,
        processedLength: processedContent.length,
        templateId: template.id
      });
      
      return processedContent;
    } catch (error) {
      console.error(`[${correlationId}] Word-for-word formatting error:`, error);
      // Return original content if formatting fails
      return content;
    }
  }

  /**
   * Process Section 7 AI Formatter template
   */
  private async processSection7AIFormatter(content: string, template: TemplateConfig, request: ProcessingRequest): Promise<string> {
    const correlationId = request.correlationId || 'no-correlation-id';
    
    try {
      console.log(`[${correlationId}] Processing Section 7 AI Formatter template: ${template.id}`);
      
      // Use the original Section 7 AI formatter (working version)
      const { Section7AIFormatter } = await import('../../services/formatter/section7AI.js');
      
      // PROOF: Log model being passed to Section7AIFormatter
      if (request.model) {
        console.log(`[PROOF] ProcessingOrchestrator - Passing model to Section7AIFormatter: ${request.model}`, {
          correlationId,
          requestedModel: request.model,
          temperature: request.temperature,
          seed: request.seed
        });
      }

      const result = await Section7AIFormatter.formatSection7Content(
        content,
        request.language as 'fr' | 'en',
        request.model,
        request.temperature,
        request.seed,
        request.templateVersion,
        template.id
      );
      
      const processedContent = result.formatted;
      
      // Log any issues or suggestions
      if (result.issues && result.issues.length > 0) {
        console.warn(`[${correlationId}] Section 7 AI formatting issues:`, result.issues);
      }
      
      if (result.suggestions && result.suggestions.length > 0) {
        console.info(`[${correlationId}] Section 7 AI formatting suggestions:`, result.suggestions);
      }
      
      console.log(`[${correlationId}] Section 7 AI formatting completed`, {
        originalLength: content.length,
        processedLength: processedContent.length,
        templateId: template.id,
        hasIssues: result.issues ? result.issues.length > 0 : false,
        hasSuggestions: result.suggestions ? result.suggestions.length > 0 : false
      });
      
      return processedContent;
    } catch (error) {
      console.error(`[${correlationId}] Section 7 AI formatting error:`, error);
      // Return original content if formatting fails
      return content;
    }
  }

  /**
   * Process Section 7 R&D Pipeline template
   */
  private async processSection7Rd(content: string, template: TemplateConfig, request: ProcessingRequest): Promise<string> {
    const correlationId = request.correlationId || 'no-correlation-id';
    
    try {
      console.log(`[${correlationId}] Processing Section 7 R&D Pipeline template: ${template.id}`);
      
      // Import the Section 7 R&D service
      const { section7RdService } = await import('../../services/section7RdService.js');
      
      // PROOF: Log model being passed to Section7RdService
      console.log(`[PROOF] ProcessingOrchestrator - Passing model to Section7RdService: ${request.model || 'default'}`, {
        correlationId: correlationId,
        requestedModel: request.model,
        temperature: request.temperature,
        seed: request.seed
      });
      
      // Process through R&D pipeline (pass model, temperature, seed, templateVersion if provided)
      const result = await section7RdService.processInput(
        content,
        request.model,
        request.temperature,
        request.seed,
        request.templateVersion
      );
      
      if (!result.success) {
        console.warn(`[${correlationId}] Section 7 R&D pipeline failed, returning original content`);
        return content;
      }
      
      const processedContent = result.formattedText;
      
      // Log compliance results
      console.log(`[${correlationId}] Section 7 R&D pipeline completed`, {
        originalLength: content.length,
        processedLength: processedContent.length,
        templateId: template.id,
        rulesScore: result.compliance.rulesScore,
        passedRules: result.compliance.passedRules.length,
        failedRules: result.compliance.failedRules.length,
        processingTime: result.metadata.processingTime
      });
      
      // Log any compliance issues
      if (result.compliance.failedRules.length > 0) {
        console.warn(`[${correlationId}] Section 7 R&D compliance issues:`, result.compliance.failedRules);
      }
      
      return processedContent;
    } catch (error) {
      console.error(`[${correlationId}] Section 7 R&D pipeline error:`, error);
      // Return original content if processing fails
      return content;
    }
  }

  /**
   * Process Section 8 AI Formatter template
   */
  private async processSection8AIFormatter(content: string, template: TemplateConfig, request: ProcessingRequest): Promise<string> {
    const correlationId = request.correlationId || 'no-correlation-id';
    
    try {
      console.log(`[${correlationId}] Processing Section 8 AI Formatter template: ${template.id}`);
      
      // Use formatWithGuardrails for consistent processing with Section 7
      const { formatWithGuardrails } = await import('../../services/formatter/shared.js');
      
      const result = await formatWithGuardrails('8', request.language as 'fr' | 'en', content);
      
      const processedContent = result.formatted;
      
      // Log any issues
      if (result.issues && result.issues.length > 0) {
        console.warn(`[${correlationId}] Section 8 AI formatting issues:`, result.issues);
      }
      
      console.log(`[${correlationId}] Section 8 AI formatting completed`, {
        originalLength: content.length,
        processedLength: processedContent.length,
        templateId: template.id,
        hasIssues: result.issues ? result.issues.length > 0 : false
      });
      
      return processedContent;
    } catch (error) {
      console.error(`[${correlationId}] Section 8 AI formatting error:`, error);
      // Return original content if formatting fails
      return content;
    }
  }

  /**
   * Process History of Evolution AI Formatter template
   */
  private async processHistoryEvolutionAIFormatter(content: string, template: TemplateConfig, request: ProcessingRequest): Promise<string> {
    const correlationId = request.correlationId || 'no-correlation-id';
    
    try {
      console.log(`[${correlationId}] Processing History of Evolution AI Formatter template: ${template.id}`);
      
      // Apply AI formatting using the AI formatting service
      const { AIFormattingService } = await import('../../services/aiFormattingService.js');
      
      const result = await AIFormattingService.formatTemplateContent(content, {
        section: 'history_evolution',
        inputLanguage: request.language as 'fr' | 'en',
        complexity: 'medium',
        formattingLevel: 'standard',
        includeSuggestions: true
      });
      
      const processedContent = result.formatted;
      
      console.log(`[${correlationId}] History of Evolution AI formatting completed`, {
        originalLength: content.length,
        processedLength: processedContent.length,
        templateId: template.id
      });
      
      return processedContent;
    } catch (error) {
      console.error(`[${correlationId}] History of Evolution AI formatting error:`, error);
      // Return original content if formatting fails
      return content;
    }
  }

  /**
   * Process Section 7 Template Only
   */
  private async processSection7TemplateOnly(content: string, template: TemplateConfig, request: ProcessingRequest): Promise<string> {
    const correlationId = request.correlationId || 'no-correlation-id';
    
    try {
      console.log(`[${correlationId}] Processing Section 7 Template Only: ${template.id}`);
      
      // Apply basic template formatting without additional features
      // This would use the Section 7 template structure
      const processedContent = content
        .replace(/\n\s*\n/g, '\n\n') // Normalize paragraph breaks
        .replace(/^\s*/, '') // Remove leading whitespace
        .replace(/\s+$/, '') // Remove trailing whitespace
        .replace(/\s+/g, ' ') // Normalize spaces
        .trim();
      
      console.log(`[${correlationId}] Section 7 template formatting completed`, {
        originalLength: content.length,
        processedLength: processedContent.length,
        templateId: template.id
      });
      
      return processedContent;
    } catch (error) {
      console.error(`[${correlationId}] Section 7 template formatting error:`, error);
      // Return original content if formatting fails
      return content;
    }
  }

  /**
   * Process Section 7 Template + Verbatim
   */
  private async processSection7Verbatim(content: string, template: TemplateConfig, request: ProcessingRequest): Promise<string> {
    const correlationId = request.correlationId || 'no-correlation-id';
    
    try {
      console.log(`[${correlationId}] Processing Section 7 Template + Verbatim: ${template.id}`);
      
      // Apply basic template formatting with verbatim support
      const processedContent = content
        .replace(/\n\s*\n/g, '\n\n') // Normalize paragraph breaks
        .replace(/^\s*/, '') // Remove leading whitespace
        .replace(/\s+$/, '') // Remove trailing whitespace
        .replace(/\s+/g, ' ') // Normalize spaces
        .trim();
      
      console.log(`[${correlationId}] Section 7 verbatim formatting completed`, {
        originalLength: content.length,
        processedLength: processedContent.length,
        templateId: template.id
      });
      
      return processedContent;
    } catch (error) {
      console.error(`[${correlationId}] Section 7 verbatim formatting error:`, error);
      // Return original content if formatting fails
      return content;
    }
  }

  /**
   * Process Section 7 Template + Verbatim + Voice Commands
   */
  private async processSection7Full(content: string, template: TemplateConfig, request: ProcessingRequest): Promise<string> {
    const correlationId = request.correlationId || 'no-correlation-id';
    
    try {
      console.log(`[${correlationId}] Processing Section 7 Template + Verbatim + Voice Commands: ${template.id}`);
      
      // Apply full template formatting with verbatim and voice command support
      const processedContent = content
        .replace(/\n\s*\n/g, '\n\n') // Normalize paragraph breaks
        .replace(/^\s*/, '') // Remove leading whitespace
        .replace(/\s+$/, '') // Remove trailing whitespace
        .replace(/\s+/g, ' ') // Normalize spaces
        .trim();
      
      console.log(`[${correlationId}] Section 7 full formatting completed`, {
        originalLength: content.length,
        processedLength: processedContent.length,
        templateId: template.id
      });
      
      return processedContent;
    } catch (error) {
      console.error(`[${correlationId}] Section 7 full formatting error:`, error);
      // Return original content if formatting fails
      return content;
    }
  }

  /**
   * Determine if layer is a pre-layer (runs before template)
   */
  private isPreLayer(layerName: string): boolean {
    // Pre-layers: universal-cleanup, clinical-extraction (run before template)
    const preLayers = ['universal-cleanup-layer', 'clinical-extraction-layer'];
    return preLayers.includes(layerName);
  }

  /**
   * Get layer processor instance
   */
  private async getLayerProcessor(layerName: string): Promise<any> {
    try {
      switch (layerName) {
        case 'clinical-extraction-layer':
          const { ClinicalExtractionLayer } = await import('../layers/ClinicalExtractionLayer.js');
          return new ClinicalExtractionLayer();
        case 'universal-cleanup-layer':
          const { UniversalCleanupLayer } = await import('../layers/UniversalCleanupLayer.js');
          return new UniversalCleanupLayer();
        // Add other layer processors as needed
        default:
          console.warn(`No processor found for layer: ${layerName}`);
          return null;
      }
    } catch (error) {
      console.error(`Failed to load processor for layer ${layerName}:`, error);
      return null;
    }
  }

  /**
   * Apply mode-specific processing
   */
  private async applyModeProcessing(content: string, mode: ModeConfig, request: ProcessingRequest): Promise<string> {
    console.log(`Applying mode processing: ${mode.id}`);
    
    // Route to mode-specific processing
    switch (mode.id) {
      case 'mode1':
        return await this.processMode1(content, request);
      case 'mode2':
        return await this.processMode2(content, request);
      case 'mode3':
        return await this.processMode3(content, request);
      default:
        console.warn(`Unknown mode: ${mode.id}, returning content as-is`);
        return content;
    }
  }

  /**
   * Process Mode 1 (Word-for-Word)
   */
  private async processMode1(content: string, request: ProcessingRequest): Promise<string> {
    const correlationId = request.correlationId || 'no-correlation-id';
    console.log(`[${correlationId}] Processing Mode 1 (Word-for-Word)`);
    
    // Mode 1 processing logic would go here
    // For now, return content as-is
    return content;
  }

  /**
   * Process Mode 2 (Smart Dictation)
   */
  private async processMode2(content: string, request: ProcessingRequest): Promise<string> {
    const correlationId = request.correlationId || 'no-correlation-id';
    console.log(`[${correlationId}] Processing Mode 2 (Smart Dictation)`);
    
    // Mode 2 processing logic would go here
    // For now, return content as-is
    return content;
  }

  /**
   * Process Mode 3 (Ambient/Transcribe) - S1→S5 Pipeline
   */
  private async processMode3(content: string, request: ProcessingRequest): Promise<string> {
    const correlationId = request.correlationId || 'no-correlation-id';
    console.log(`[${correlationId}] Processing Mode 3 (Ambient/Transcribe)`);
    
    try {
      // Import Mode3Pipeline dynamically to avoid circular dependencies
      const { Mode3Pipeline } = await import('../pipeline/index.js');
      const pipeline = new Mode3Pipeline();
      
      // Parse content as AWS Transcribe result
      let awsResult;
      try {
        awsResult = JSON.parse(content);
      } catch (parseError) {
        console.error(`[${correlationId}] Failed to parse AWS Transcribe result:`, parseError);
        throw new Error('Invalid AWS Transcribe JSON format');
      }
      
      // Validate AWS result
      const validation = pipeline.validateAWSResult(awsResult);
      if (!validation.valid) {
        console.error(`[${correlationId}] AWS result validation failed:`, validation.errors);
        throw new Error(`Invalid AWS result: ${validation.errors.join(', ')}`);
      }
      
      // Execute S1→S5 pipeline
      const result = await pipeline.execute(awsResult, 'default');
      
      if (!result.success) {
        console.error(`[${correlationId}] Mode 3 pipeline failed:`, result.error);
        throw new Error(`Pipeline failed: ${result.error}`);
      }
      
      console.log(`[${correlationId}] Mode 3 pipeline completed successfully`, {
        processingTime: result.processingTime,
        narrativeFormat: result.data?.narrative.format,
        speakerCount: result.data?.narrative.metadata.totalSpeakers
      });
      
      // Return the narrative content
      return result.data?.narrative.content || content;
      
    } catch (error) {
      console.error(`[${correlationId}] Mode 3 processing error:`, error);
      // Return original content if processing fails
      return content;
    }
  }
}

// Export singleton instance
export const processingOrchestrator = new ProcessingOrchestrator();
