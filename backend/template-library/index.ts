import { readFileSync, readdirSync } from 'fs';
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
      const jsonPath = join(__dirname, 'json');
      
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
      const fs = require('fs');
      return fs.existsSync(path);
    } catch {
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
