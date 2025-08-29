import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { Template, CNESSTSection, VoiceCommand, VoiceCommandAction } from '@/types/index.js';
import { logger } from '@/utils/logger.js';

export class TemplateService {
  private templates: Map<string, Template> = new Map();
  private voiceCommandMappings: Map<string, VoiceCommand> = new Map();

  constructor() {
    this.loadTemplates();
    this.buildVoiceCommandMappings();
  }

  /**
   * Load all templates from the templates directory
   */
  private loadTemplates(): void {
    try {
      const templatesDir = join(process.cwd(), 'templates');
      const files = readdirSync(templatesDir).filter(file => file.endsWith('.json'));

      for (const file of files) {
        const templatePath = join(templatesDir, file);
        const templateData = JSON.parse(readFileSync(templatePath, 'utf-8'));
        
        this.templates.set(templateData.id, templateData);
        
        logger.info('Template loaded', {
          templateId: templateData.id,
          section: templateData.section,
          language: templateData.language,
          version: templateData.version
        });
      }

      logger.info('Templates loaded successfully', {
        count: this.templates.size,
        sections: Array.from(this.templates.values()).map(t => t.section)
      });

    } catch (error) {
      logger.error('Failed to load templates', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Build voice command mappings from all templates
   */
  private buildVoiceCommandMappings(): void {
    for (const template of this.templates.values()) {
      if (template.voice_commands) {
        for (const command of template.voice_commands) {
          const key = `${template.section}_${command.trigger}`;
          this.voiceCommandMappings.set(key, {
            command: command.trigger,
            action: this.mapActionString(command.action),
            section: template.section as CNESSTSection,
            parameters: command.parameters
          });
        }
      }
    }

    logger.info('Voice command mappings built', {
      count: this.voiceCommandMappings.size
    });
  }

  /**
   * Map action string to VoiceCommandAction enum
   */
  private mapActionString(action: string): VoiceCommandAction {
    const actionMap: Record<string, VoiceCommandAction> = {
      'start_section': VoiceCommandAction.START_TRANSCRIPTION,
      'end_section': VoiceCommandAction.END_SECTION,
      'insert_paragraph_break': VoiceCommandAction.NEW_PARAGRAPH,
      'clear_buffer': VoiceCommandAction.CLEAR_BUFFER,
      'save_and_continue': VoiceCommandAction.SAVE_AND_CONTINUE,
      'add_complaint': VoiceCommandAction.NEW_PARAGRAPH,
      'add_activity_impact': VoiceCommandAction.NEW_PARAGRAPH,
      'start_medical_summary': VoiceCommandAction.START_TRANSCRIPTION,
      'insert_impairment_percentage': VoiceCommandAction.NEW_PARAGRAPH
    };

    return actionMap[action] || VoiceCommandAction.START_TRANSCRIPTION;
  }

  /**
   * Get template by section and language
   */
  getTemplate(section: CNESSTSection, language: 'fr' | 'en' = 'fr'): Template | null {
    const templateKey = `${section}_template_${language}`;
    return this.templates.get(templateKey) || null;
  }

  /**
   * Get all templates for a section
   */
  getTemplatesForSection(section: CNESSTSection): Template[] {
    return Array.from(this.templates.values())
      .filter(template => template.section === section && template.is_active);
  }

  /**
   * Get all active templates
   */
  getAllActiveTemplates(): Template[] {
    return Array.from(this.templates.values())
      .filter(template => template.is_active);
  }

  /**
   * Process voice command and return template-specific action
   */
  processVoiceCommand(
    command: string, 
    section: CNESSTSection, 
    language: 'fr' | 'en' = 'fr'
  ): VoiceCommand | null {
    const template = this.getTemplate(section, language);
    if (!template) return null;

    const key = `${section}_${command.toLowerCase()}`;
    return this.voiceCommandMappings.get(key) || null;
  }

  /**
   * Get all voice commands for a section
   */
  getVoiceCommandsForSection(section: CNESSTSection, language: 'fr' | 'en' = 'fr'): VoiceCommand[] {
    const template = this.getTemplate(section, language);
    if (!template || !template.voice_commands) return [];

    return template.voice_commands.map(cmd => ({
      command: cmd.trigger,
      action: this.mapActionString(cmd.action),
      section: section,
      parameters: cmd.parameters
    }));
  }

  /**
   * Format transcript content according to template structure
   */
  formatTranscriptContent(
    content: string,
    section: CNESSTSection,
    language: 'fr' | 'en' = 'fr'
  ): string {
    const template = this.getTemplate(section, language);
    if (!template) return content;

    try {
      const templateStructure = template.content.structure;
      let formattedContent = templateStructure.title + '\n\n';

      // Split content into sections based on voice triggers
      const sections = this.splitContentIntoSections(content, template);
      
      for (const sectionData of templateStructure.sections) {
        const sectionContent = sections[sectionData.name] || '';
        if (sectionContent.trim()) {
          formattedContent += `${sectionData.title}:\n${sectionContent}\n\n`;
        }
      }

      return formattedContent.trim();

    } catch (error) {
      logger.error('Failed to format transcript content', {
        section,
        language,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return content;
    }
  }

  /**
   * Split content into sections based on template structure
   */
  private splitContentIntoSections(content: string, template: Template): Record<string, string> {
    const sections: Record<string, string> = {};
    const templateStructure = template.content.structure;

    for (const sectionData of templateStructure.sections) {
      // Look for voice triggers in content to identify section boundaries
      const triggers = sectionData.voice_triggers || [];
      let sectionContent = '';

      for (const trigger of triggers) {
        const triggerIndex = content.toLowerCase().indexOf(trigger.toLowerCase());
        if (triggerIndex !== -1) {
          // Extract content after this trigger
          const startIndex = triggerIndex + trigger.length;
          const endIndex = this.findNextSectionBoundary(content, startIndex, templateStructure.sections);
          sectionContent = content.substring(startIndex, endIndex).trim();
          break;
        }
      }

      if (sectionContent) {
        sections[sectionData.name] = sectionContent;
      }
    }

    return sections;
  }

  /**
   * Find the next section boundary in content
   */
  private findNextSectionBoundary(
    content: string, 
    startIndex: number, 
    allSections: any[]
  ): number {
    let nextBoundary = content.length;

    for (const section of allSections) {
      const triggers = section.voice_triggers || [];
      for (const trigger of triggers) {
        const triggerIndex = content.toLowerCase().indexOf(trigger.toLowerCase(), startIndex);
        if (triggerIndex !== -1 && triggerIndex < nextBoundary) {
          nextBoundary = triggerIndex;
        }
      }
    }

    return nextBoundary;
  }

  /**
   * Validate content against template requirements
   */
  validateContent(
    content: string,
    section: CNESSTSection,
    language: 'fr' | 'en' = 'fr'
  ): { isValid: boolean; errors: string[]; warnings: string[] } {
    const template = this.getTemplate(section, language);
    if (!template) {
      return {
        isValid: false,
        errors: ['Template not found'],
        warnings: []
      };
    }

    const errors: string[] = [];
    const warnings: string[] = [];
    const validationRules = template.content.validation_rules;

    // Check minimum length
    if (validationRules.min_length && content.length < validationRules.min_length) {
      errors.push(`Content too short. Minimum ${validationRules.min_length} characters required.`);
    }

    // Check maximum length
    if (validationRules.max_length && content.length > validationRules.max_length) {
      warnings.push(`Content exceeds recommended length of ${validationRules.max_length} characters.`);
    }

    // Check required sections
    if (validationRules.required_sections) {
      const missingSections = this.checkRequiredSections(content, template);
      if (missingSections.length > 0) {
        errors.push(`Missing required sections: ${missingSections.join(', ')}`);
      }
    }

    // Check for required elements based on section type
    if (section === CNESSTSection.SECTION_8 && validationRules.pain_scale_required) {
      if (!this.containsPainScale(content)) {
        errors.push('Pain scale assessment is required for Section 8');
      }
    }

    if (section === CNESSTSection.SECTION_11 && validationRules.percentage_required) {
      if (!this.containsImpairmentPercentage(content)) {
        errors.push('Impairment percentage is required for Section 11');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Check if content contains required sections
   */
  private checkRequiredSections(content: string, template: Template): string[] {
    const requiredSections = template.content.validation_rules.required_sections || [];
    const missingSections: string[] = [];

    for (const sectionName of requiredSections) {
      const sectionData = template.content.structure.sections.find(s => s.name === sectionName);
      if (sectionData) {
        const triggers = sectionData.voice_triggers || [];
        const hasSection = triggers.some(trigger => 
          content.toLowerCase().includes(trigger.toLowerCase())
        );
        
        if (!hasSection) {
          missingSections.push(sectionData.title);
        }
      }
    }

    return missingSections;
  }

  /**
   * Check if content contains pain scale assessment
   */
  private containsPainScale(content: string): boolean {
    const painScalePatterns = [
      /\d+\/10/,
      /échelle.*douleur/i,
      /intensité.*douleur/i,
      /niveau.*douleur/i
    ];

    return painScalePatterns.some(pattern => pattern.test(content));
  }

  /**
   * Check if content contains impairment percentage
   */
  private containsImpairmentPercentage(content: string): boolean {
    const percentagePatterns = [
      /\d+%/,
      /pourcentage.*atteinte/i,
      /évaluation.*atteinte/i,
      /invalidité.*\d+%/i
    ];

    return percentagePatterns.some(pattern => pattern.test(content));
  }

  /**
   * Get template statistics
   */
  getTemplateStats(): {
    totalTemplates: number;
    activeTemplates: number;
    sections: Record<string, number>;
    languages: Record<string, number>;
  } {
    const templates = Array.from(this.templates.values());
    const sections: Record<string, number> = {};
    const languages: Record<string, number> = {};

    for (const template of templates) {
      sections[template.section] = (sections[template.section] || 0) + 1;
      languages[template.language] = (languages[template.language] || 0) + 1;
    }

    return {
      totalTemplates: templates.length,
      activeTemplates: templates.filter(t => t.is_active).length,
      sections,
      languages
    };
  }

  /**
   * Reload templates from disk
   */
  reloadTemplates(): void {
    this.templates.clear();
    this.voiceCommandMappings.clear();
    this.loadTemplates();
    this.buildVoiceCommandMappings();
    
    logger.info('Templates reloaded successfully');
  }
}

// Export singleton instance
export const templateService = new TemplateService();
