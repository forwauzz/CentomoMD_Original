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
  id?: string;
  version?: string;
  created_at?: string;
  updated_at?: string;
  usage_count?: number;
  last_used?: string;
  performance_score?: number;
  is_default?: boolean;
  status?: "active" | "inactive" | "draft";
}

export interface TemplateVersion {
  id: string;
  templateId: string;
  version: string;
  content: string;
  changes: string[];
  created_at: string;
  created_by?: string;
}

export interface TemplateUsage {
  templateId: string;
  section: string;
  language: string;
  used_at: string;
  user_id?: string;
  session_id?: string;
  performance_rating?: number;
}

export interface TemplateAnalytics {
  total_usage: number;
  average_performance: number;
  usage_by_section: Record<string, number>;
  usage_by_language: Record<string, number>;
  recent_usage: TemplateUsage[];
  top_templates: Array<{ id: string; title: string; usage_count: number }>;
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

  private versions: Map<string, TemplateVersion[]> = new Map();
  private usage: TemplateUsage[] = [];
  private analytics: TemplateAnalytics | null = null;

  constructor() {
    this.loadTemplates();
    this.loadVersions();
    this.loadUsage();
    this.calculateAnalytics();
  }

  /**
   * Load all templates from JSON files
   */
  private loadTemplates(): void {
    try {
      // Use relative path from the backend directory
      const jsonPath = join(process.cwd(), 'src', 'template-library', 'json');
      
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
   * Load template versions from disk
   */
  private loadVersions(): void {
    try {
      const versionsPath = join(process.cwd(), 'template-library', 'versions');
      if (this.directoryExists(versionsPath)) {
        const files = readdirSync(versionsPath).filter(file => file.endsWith('.json'));
        
        for (const file of files) {
          const filePath = join(versionsPath, file);
          const versionData = JSON.parse(readFileSync(filePath, 'utf-8'));
          const templateId = file.replace('.json', '');
          
          if (!this.versions.has(templateId)) {
            this.versions.set(templateId, []);
          }
          this.versions.get(templateId)!.push(versionData);
        }
      }
    } catch (error) {
      console.error('Error loading template versions:', error);
    }
  }

  /**
   * Load usage data from disk
   */
  private loadUsage(): void {
    try {
      const usagePath = join(process.cwd(), 'template-library', 'usage.json');
      if (this.directoryExists(usagePath)) {
        this.usage = JSON.parse(readFileSync(usagePath, 'utf-8'));
      }
    } catch (error) {
      console.error('Error loading usage data:', error);
      this.usage = [];
    }
  }

  /**
   * Calculate template analytics
   */
  private calculateAnalytics(): void {
    const allTemplates = [
      ...this.templates.section7,
      ...this.templates.section8,
      ...this.templates.section11
    ];

    const usageBySection: Record<string, number> = {};
    const usageByLanguage: Record<string, number> = {};
    const templateUsageCounts: Record<string, number> = {};

    // Calculate usage statistics
    this.usage.forEach(usage => {
      usageBySection[usage.section] = (usageBySection[usage.section] || 0) + 1;
      usageByLanguage[usage.language] = (usageByLanguage[usage.language] || 0) + 1;
      templateUsageCounts[usage.templateId] = (templateUsageCounts[usage.templateId] || 0) + 1;
    });

    // Calculate average performance
    const performanceRatings = this.usage
      .filter(u => u.performance_rating !== undefined)
      .map(u => u.performance_rating!);
    
    const averagePerformance = performanceRatings.length > 0 
      ? performanceRatings.reduce((sum, rating) => sum + rating, 0) / performanceRatings.length 
      : 0;

    // Get top templates (if no usage data, show templates with highest usage_count)
    let topTemplates;
    if (Object.keys(templateUsageCounts).length > 0) {
      topTemplates = Object.entries(templateUsageCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([templateId, usageCount]) => {
          const template = allTemplates.find(t => t.id === templateId);
          return {
            id: templateId,
            title: template?.title || 'Unknown Template',
            usage_count: usageCount
          };
        });
    } else {
      // Fallback: show templates with highest usage_count field
      topTemplates = allTemplates
        .sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0))
        .slice(0, 10)
        .map(template => ({
          id: template.id || 'unknown',
          title: template.title,
          usage_count: template.usage_count || 0
        }));
    }

    this.analytics = {
      total_usage: this.usage.length,
      average_performance: averagePerformance,
      usage_by_section: usageBySection,
      usage_by_language: usageByLanguage,
      recent_usage: this.usage.slice(-20).reverse(), // Last 20 usages
      top_templates: topTemplates
    };
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
        try {
          const filePath = join(directoryPath, file);
          const templateData = JSON.parse(readFileSync(filePath, 'utf-8'));
          
          // Ensure template has a proper ID
          if (!templateData.id || templateData.id === 'undefined') {
            // Generate ID from filename or timestamp
            const fileName = file.replace('.json', '');
            templateData.id = fileName.startsWith('template_') ? fileName : `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            console.log(`Fixed missing ID for template: ${templateData.title} -> ${templateData.id}`);
          }
          
          // Ensure template has required fields
          if (!templateData.status) {
            templateData.status = 'active';
          }
          
          if (!templateData.usage_count) {
            templateData.usage_count = 0;
          }
          
          templates.push(templateData);
        } catch (fileError) {
          console.error(`Error loading template file ${file}:`, fileError);
          // Continue loading other files
        }
      }
      
      console.log(`Loaded ${templates.length} templates from ${directoryPath}`);
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
   * Advanced search with multiple criteria
   */
  public advancedSearch(criteria: {
    section?: "7" | "8" | "11";
    language?: "fr" | "en";
    complexity?: "low" | "medium" | "high";
    tags?: string[];
    query?: string;
    status?: "active" | "inactive" | "draft";
    is_default?: boolean;
  }): TemplateJSON[] {
    let templates = this.getAllTemplates();

    if (criteria.section) {
      templates = templates.filter(t => t.section === criteria.section);
    }

    if (criteria.language) {
      templates = templates.filter(t => t.language === criteria.language);
    }

    if (criteria.complexity) {
      templates = templates.filter(t => t.complexity === criteria.complexity);
    }

    if (criteria.tags && criteria.tags.length > 0) {
      templates = templates.filter(t => 
        criteria.tags!.some(tag => t.tags.includes(tag))
      );
    }

    if (criteria.query) {
      const lowerQuery = criteria.query.toLowerCase();
      templates = templates.filter(t => 
        t.title.toLowerCase().includes(lowerQuery) ||
        t.content.toLowerCase().includes(lowerQuery) ||
        t.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
      );
    }

    if (criteria.status) {
      templates = templates.filter(t => t.status === criteria.status);
    }

    if (criteria.is_default !== undefined) {
      templates = templates.filter(t => t.is_default === criteria.is_default);
    }

    return templates;
  }

  /**
   * Get all templates across all sections
   */
  public getAllTemplates(): TemplateJSON[] {
    return [
      ...this.templates.section7,
      ...this.templates.section8,
      ...this.templates.section11
    ];
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
   * Get template versions
   */
  public getTemplateVersions(templateId: string): TemplateVersion[] {
    return this.versions.get(templateId) || [];
  }

  /**
   * Get template analytics
   */
  public getAnalytics(): TemplateAnalytics | null {
    return this.analytics;
  }

  /**
   * Track template usage
   */
  public async trackUsage(usage: Omit<TemplateUsage, 'used_at'>): Promise<void> {
    const newUsage: TemplateUsage = {
      ...usage,
      used_at: new Date().toISOString()
    };

    this.usage.push(newUsage);
    await this.saveUsage();
    this.calculateAnalytics();

    // Update template usage count
    const allTemplates = this.getAllTemplates();
    const template = allTemplates.find(t => t.id === usage.templateId);
    if (template) {
      template.usage_count = (template.usage_count || 0) + 1;
      template.last_used = newUsage.used_at;
    }
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
    byStatus: Record<string, number>;
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
    const byStatus: Record<string, number> = {};

    allTemplates.forEach(template => {
      const lang = template.language || "fr";
      byLanguage[lang] = (byLanguage[lang] || 0) + 1;

      const complexity = template.complexity || "medium";
      byComplexity[complexity] = (byComplexity[complexity] || 0) + 1;

      const status = template.status || "active";
      byStatus[status] = (byStatus[status] || 0) + 1;
    });

    return {
      total: allTemplates.length,
      bySection,
      byLanguage,
      byComplexity,
      byStatus
    };
  }

  /**
   * Export templates to JSON
   */
  public exportTemplates(section?: "7" | "8" | "11"): TemplateJSON[] {
    if (section) {
      return this.getTemplatesBySection(section);
    }
    return this.getAllTemplates();
  }

  /**
   * Import templates from JSON
   */
  public async importTemplates(templates: TemplateJSON[]): Promise<void> {
    for (const template of templates) {
      await this.addTemplate(template);
    }
  }

  /**
   * Bulk operations
   */
  public async bulkUpdateStatus(templateIds: string[], status: "active" | "inactive" | "draft"): Promise<void> {
    const allTemplates = this.getAllTemplates();
    
    for (const templateId of templateIds) {
      const template = allTemplates.find(t => t.id === templateId);
      if (template) {
        template.status = status;
        template.updated_at = new Date().toISOString();
      }
    }

    // Save all sections
    await this.saveTemplatesToDisk("7");
    await this.saveTemplatesToDisk("8");
    await this.saveTemplatesToDisk("11");
  }

  public async bulkDelete(templateIds: string[]): Promise<void> {
    const sections = ["7", "8", "11"] as const;
    
    for (const section of sections) {
      const sectionTemplates = this.getTemplatesBySection(section);
      const templatesToDelete = sectionTemplates.filter(t => templateIds.includes(t.id!));
      
      for (const template of templatesToDelete) {
        await this.deleteTemplate(template.id!, section);
      }
    }
  }

  /**
   * Add a new template to the library
   */
  public async addTemplate(template: TemplateJSON): Promise<void> {
    try {
      // Add template to the appropriate section
      const sectionKey = `section${template.section}` as keyof TemplateLibrary;
      this.templates[sectionKey].push(template);
      
      // Create initial version
      if (template.id) {
        await this.createVersion(template.id, template.content, "Initial version");
      }
      
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
  public async updateTemplate(templateId: string, updatedTemplate: TemplateJSON): Promise<void> {
    try {
      const sectionKey = `section${updatedTemplate.section}` as keyof TemplateLibrary;
      const templateIndex = this.templates[sectionKey].findIndex(t => t.id === templateId);
      
      if (templateIndex === -1) {
        throw new Error(`Template with ID ${templateId} not found`);
      }

      const oldTemplate = this.templates[sectionKey][templateIndex];
      
      // Create new version if content changed
      if (oldTemplate && oldTemplate.content !== updatedTemplate.content) {
        const changes = this.detectChanges(oldTemplate.content, updatedTemplate.content);
        await this.createVersion(templateId, updatedTemplate.content, changes.join(", "));
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
      
      // Remove versions
      this.versions.delete(templateId);
      
      // Save the updated templates to disk
      await this.saveTemplatesToDisk(section);
      
      if (deletedTemplate) {
        console.log(`Template "${deletedTemplate.title}" deleted from section ${section}`);
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      throw error;
    }
  }

  /**
   * Create a new version of a template
   */
  private async createVersion(templateId: string, content: string, changes: string): Promise<void> {
    try {
      const versions = this.versions.get(templateId) || [];
      const versionNumber = (versions.length + 1).toString();
      
      const version: TemplateVersion = {
        id: `${templateId}_v${versionNumber}`,
        templateId,
        version: versionNumber,
        content,
        changes: [changes],
        created_at: new Date().toISOString()
      };

      versions.push(version);
      this.versions.set(templateId, versions);
      
      await this.saveVersions(templateId);
    } catch (error) {
      console.error('Error creating template version:', error);
      throw error;
    }
  }

  /**
   * Detect changes between two content strings
   */
  private detectChanges(oldContent: string, newContent: string): string[] {
    const changes: string[] = [];
    
    if (oldContent.length !== newContent.length) {
      changes.push(`Content length changed from ${oldContent.length} to ${newContent.length} characters`);
    }
    
    // Simple word count comparison
    const oldWords = oldContent.split(/\s+/).length;
    const newWords = newContent.split(/\s+/).length;
    
    if (oldWords !== newWords) {
      changes.push(`Word count changed from ${oldWords} to ${newWords} words`);
    }
    
    return changes;
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
   * Save versions to disk
   */
  private async saveVersions(templateId: string): Promise<void> {
    try {
      const { writeFileSync, mkdirSync } = await import('fs');
      const versions = this.versions.get(templateId) || [];
      
      const versionsPath = join(process.cwd(), 'template-library', 'versions');
      mkdirSync(versionsPath, { recursive: true });
      
      const filePath = join(versionsPath, `${templateId}.json`);
      writeFileSync(filePath, JSON.stringify(versions, null, 2), 'utf-8');
    } catch (error) {
      console.error(`Error saving versions for template ${templateId}:`, error);
      throw error;
    }
  }

  /**
   * Save usage data to disk
   */
  private async saveUsage(): Promise<void> {
    try {
      const { writeFileSync, mkdirSync } = await import('fs');
      const usagePath = join(process.cwd(), 'template-library', 'usage.json');
      
      // Ensure directory exists
      mkdirSync(join(process.cwd(), 'template-library'), { recursive: true });
      
      writeFileSync(usagePath, JSON.stringify(this.usage, null, 2), 'utf-8');
    } catch (error) {
      console.error('Error saving usage data:', error);
    }
  }

  /**
   * Reload templates from disk
   */
  public reloadTemplates(): void {
    this.loadTemplates();
    this.loadVersions();
    this.loadUsage();
    this.calculateAnalytics();
  }
}

// Export singleton instance
export const templateLibrary = new TemplateLibraryService();


