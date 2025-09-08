/**
 * Processing Orchestrator
 * Coordinates sections, modes, and templates in a decoupled way
 */

import { sectionManager } from '../../config/sections.js';
import { modeManager, ModeConfig } from '../../config/modes.js';
import { templateManager, TemplateConfig } from '../../config/templates.js';

export interface ProcessingRequest {
  sectionId: string;
  modeId: string;
  templateId?: string;
  language: string;
  content: string;
  correlationId?: string;
  options?: {
    timeout?: number;
    retryAttempts?: number;
    fallbackMode?: string;
    fallbackTemplate?: string;
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

      // Apply template processing if template is specified
      if (template) {
        processedContent = await this.applyTemplateProcessing(processedContent, template, request);
      }

      // Apply mode processing
      processedContent = await this.applyModeProcessing(processedContent, mode, request);

      const processingTime = Date.now() - startTime;

      return {
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
        }
      };

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
      
      // Apply AI formatting using the AI formatting service
      const { AIFormattingService } = await import('../../services/aiFormattingService.js');
      
      const result = AIFormattingService.formatTemplateContent(content, {
        section: '7',
        language: request.language as 'fr' | 'en',
        complexity: 'medium',
        formattingLevel: 'standard',
        includeSuggestions: true
      });
      
      const processedContent = result.formatted;
      
      console.log(`[${correlationId}] Section 7 AI formatting completed`, {
        originalLength: content.length,
        processedLength: processedContent.length,
        templateId: template.id
      });
      
      return processedContent;
    } catch (error) {
      console.error(`[${correlationId}] Section 7 AI formatting error:`, error);
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
   * Apply mode-specific processing
   */
  private async applyModeProcessing(content: string, mode: ModeConfig, _request: ProcessingRequest): Promise<string> {
    // This would integrate with the existing mode processing logic
    // For now, return content as-is
    console.log(`Applying mode processing: ${mode.id}`);
    return content;
  }
}

// Export singleton instance
export const processingOrchestrator = new ProcessingOrchestrator();
