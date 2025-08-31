import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

export interface TemplateJSON {
  section: "7" | "8" | "11";
  title: string;
  content: string;
  tags: string[];
  source_file: string;
  language?: "fr" | "en";
  category?: string;
  complexity?: "low" | "medium" | "high";
}

export interface TemplateLibrary {
  section7: TemplateJSON[];
  section8: TemplateJSON[];
  section11: TemplateJSON[];
}

export class TemplateLibraryService {
  private templates: TemplateLibrary = {
    section7: [],
    section8: [],
    section11: []
  };

  constructor() {
    this.loadTemplates();
  }

  /**
   * Load all templates from JSON files
   */
  private loadTemplates(): void {
    try {
      // Use relative path from the original template-library directory
      const jsonPath = join(process.cwd(), 'template-library', 'json');
      
      // Load Section 7 templates (if they exist)
      const section7Path = join(jsonPath, 'section7');
      if (this.directoryExists(section7Path)) {
        this.templates.section7 = this.loadTemplatesFromDirectory(section7Path);
      }

      // Load Section 8 templates
      const section8Path = join(jsonPath, 'section8');
      this.templates.section8 = this.loadTemplatesFromDirectory(section8Path);

      // Load Section 11 templates
      const section11Path = join(jsonPath, 'section11');
      this.templates.section11 = this.loadTemplatesFromDirectory(section11Path);

      console.log(`Template Library loaded: ${this.templates.section7.length} Section 7, ${this.templates.section8.length} Section 8, ${this.templates.section11.length} Section 11 templates`);

    } catch (error) {
      console.error('Error loading templates:', error);
      throw error;
    }
  }

  /**
   * Check if directory exists
   */
  private directoryExists(path: string): boolean {
    try {
      return existsSync(path);
    } catch (error) {
      console.error(`Error checking directory ${path}:`, error);
      return false;
    }
  }

  /**
   * Load templates from a specific directory
   */
  private loadTemplatesFromDirectory(directoryPath: string): TemplateJSON[] {
    const templates: TemplateJSON[] = [];
    
    try {
      const files = readdirSync(directoryPath).filter(file => file.endsWith('.json'));
      
      for (const file of files) {
        const filePath = join(directoryPath, file);
        const templateData = JSON.parse(readFileSync(filePath, 'utf-8'));
        templates.push(templateData);
      }
    } catch (error) {
      console.error(`Error loading templates from ${directoryPath}:`, error);
    }
    
    return templates;
  }

  /**
   * Get all templates for a specific section
   */
  public getTemplatesBySection(section: "7" | "8" | "11"): TemplateJSON[] {
    const sectionKey = `section${section}` as keyof TemplateLibrary;
    return this.templates[sectionKey] || [];
  }

  /**
   * Get templates filtered by section and language
   */
  public getTemplates(section: "7" | "8" | "11", language: "fr" | "en" = "fr"): TemplateJSON[] {
    const templates = this.getTemplatesBySection(section);
    return templates.filter(template => 
      !template.language || template.language === language
    );
  }

  /**
   * Get templates filtered by tags
   */
  public getTemplatesByTags(section: "7" | "8" | "11", tags: string[]): TemplateJSON[] {
    const templates = this.getTemplatesBySection(section);
    return templates.filter(template => 
      tags.some(tag => template.tags.includes(tag))
    );
  }

  /**
   * Get templates filtered by complexity
   */
  public getTemplatesByComplexity(section: "7" | "8" | "11", complexity: "low" | "medium" | "high"): TemplateJSON[] {
    const templates = this.getTemplatesBySection(section);
    return templates.filter(template => 
      !template.complexity || template.complexity === complexity
    );
  }

  /**
   * Search templates by title or content
   */
  public searchTemplates(section: "7" | "8" | "11", query: string): TemplateJSON[] {
    const templates = this.getTemplatesBySection(section);
    const lowerQuery = query.toLowerCase();
    
    return templates.filter(template => 
      template.title.toLowerCase().includes(lowerQuery) ||
      template.content.toLowerCase().includes(lowerQuery) ||
      template.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Get template by ID (filename without extension)
   */
  public getTemplateById(section: "7" | "8" | "11", templateId: string): TemplateJSON | null {
    const templates = this.getTemplatesBySection(section);
    return templates.find(template => 
      template.source_file.replace('.docx', '') === templateId
    ) || null;
  }

  /**
   * Get all available sections
   */
  public getAvailableSections(): ("7" | "8" | "11")[] {
    const sections: ("7" | "8" | "11")[] = [];
    
    if (this.templates.section7.length > 0) sections.push("7");
    if (this.templates.section8.length > 0) sections.push("8");
    if (this.templates.section11.length > 0) sections.push("11");
    
    return sections;
  }

  /**
   * Get template statistics
   */
  public getTemplateStats(): {
    total: number;
    bySection: Record<string, number>;
    byLanguage: Record<string, number>;
    byComplexity: Record<string, number>;
  } {
    const allTemplates = [
      ...this.templates.section7,
      ...this.templates.section8,
      ...this.templates.section11
    ];

    const bySection = {
      "7": this.templates.section7.length,
      "8": this.templates.section8.length,
      "11": this.templates.section11.length
    };

    const byLanguage: Record<string, number> = {};
    const byComplexity: Record<string, number> = {};

    allTemplates.forEach(template => {
      const lang = template.language || "fr";
      byLanguage[lang] = (byLanguage[lang] || 0) + 1;

      const complexity = template.complexity || "medium";
      byComplexity[complexity] = (byComplexity[complexity] || 0) + 1;
    });

    return {
      total: allTemplates.length,
      bySection,
      byLanguage,
      byComplexity
    };
  }

  /**
   * Add a new template to the library
   */
  public async addTemplate(template: TemplateJSON & { id: string }): Promise<void> {
    try {
      // Add template to the appropriate section
      const sectionKey = `section${template.section}` as keyof TemplateLibrary;
      this.templates[sectionKey].push(template);
      
      // Save the updated templates to disk
      await this.saveTemplatesToDisk(template.section);
      
      console.log(`Template "${template.title}" added to section ${template.section}`);
    } catch (error) {
      console.error('Error adding template:', error);
      throw error;
    }
  }

  /**
   * Update an existing template
   */
  public async updateTemplate(templateId: string, updatedTemplate: TemplateJSON & { id: string }): Promise<void> {
    try {
      const sectionKey = `section${updatedTemplate.section}` as keyof TemplateLibrary;
      const templateIndex = this.templates[sectionKey].findIndex(t => t.id === templateId);
      
      if (templateIndex === -1) {
        throw new Error(`Template with ID ${templateId} not found`);
      }
      
      this.templates[sectionKey][templateIndex] = updatedTemplate;
      
      // Save the updated templates to disk
      await this.saveTemplatesToDisk(updatedTemplate.section);
      
      console.log(`Template "${updatedTemplate.title}" updated in section ${updatedTemplate.section}`);
    } catch (error) {
      console.error('Error updating template:', error);
      throw error;
    }
  }

  /**
   * Delete a template from the library
   */
  public async deleteTemplate(templateId: string, section: "7" | "8" | "11"): Promise<void> {
    try {
      const sectionKey = `section${section}` as keyof TemplateLibrary;
      const templateIndex = this.templates[sectionKey].findIndex(t => t.id === templateId);
      
      if (templateIndex === -1) {
        throw new Error(`Template with ID ${templateId} not found`);
      }
      
      const deletedTemplate = this.templates[sectionKey].splice(templateIndex, 1)[0];
      
      // Save the updated templates to disk
      await this.saveTemplatesToDisk(section);
      
      console.log(`Template "${deletedTemplate.title}" deleted from section ${section}`);
    } catch (error) {
      console.error('Error deleting template:', error);
      throw error;
    }
  }

  /**
   * Save templates to disk for a specific section
   */
  private async saveTemplatesToDisk(section: "7" | "8" | "11"): Promise<void> {
    try {
      const { writeFileSync, mkdirSync } = await import('fs');
      const sectionKey = `section${section}` as keyof TemplateLibrary;
      const templates = this.templates[sectionKey];
      
      // Create directory if it doesn't exist
      const jsonPath = join(process.cwd(), 'template-library', 'json', `section${section}`);
      mkdirSync(jsonPath, { recursive: true });
      
      // Save each template as a separate JSON file
      for (const template of templates) {
        const fileName = `${template.id}.json`;
        const filePath = join(jsonPath, fileName);
        writeFileSync(filePath, JSON.stringify(template, null, 2), 'utf-8');
      }
      
      console.log(`Saved ${templates.length} templates to disk for section ${section}`);
    } catch (error) {
      console.error(`Error saving templates to disk for section ${section}:`, error);
      throw error;
    }
  }

  /**
   * Reload templates from disk
   */
  public reloadTemplates(): void {
    this.loadTemplates();
  }
}

// Export singleton instance
export const templateLibrary = new TemplateLibraryService();

// Export types for use in other modules
export type { TemplateJSON, TemplateLibrary };
