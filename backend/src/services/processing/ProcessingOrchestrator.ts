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

    try {
      // Check compatibility first
      const compatibility = this.checkCompatibility(request);
      if (!compatibility.compatible) {
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
  private async applyTemplateProcessing(content: string, template: TemplateConfig, _request: ProcessingRequest): Promise<string> {
    // This would integrate with the existing template processing logic
    // For now, return content as-is
    console.log(`Applying template processing: ${template.id}`);
    return content;
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
