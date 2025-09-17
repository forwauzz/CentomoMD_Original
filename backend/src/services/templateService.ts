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
            parameters: command.parameters || {}
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
      parameters: cmd.parameters || {}
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
      // For now, return the content as-is since template.content is a string
      // TODO: Implement proper template structure formatting when template structure is defined
      return content;

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

    // Basic validation since template.content is a string
    // TODO: Implement proper validation when template structure is defined
    
    // Check minimum length (basic validation)
    if (content.length < 10) {
      errors.push('Content too short. Minimum 10 characters required.');
    }

    // Check for required elements based on section type
    if (section === CNESSTSection.SECTION_8) {
      if (!this.containsPainScale(content)) {
        warnings.push('Pain scale assessment is recommended for Section 8');
      }
    }

    if (section === CNESSTSection.SECTION_11) {
      if (!this.containsImpairmentPercentage(content)) {
        warnings.push('Impairment percentage is recommended for Section 11');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
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
