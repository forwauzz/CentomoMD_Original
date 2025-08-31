import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
export class TemplateLibraryService {
    templates = {
        section7: [],
        section8: [],
        section11: []
    };
    constructor() {
        this.loadTemplates();
    }
    loadTemplates() {
        try {
            const jsonPath = join(__dirname, 'json');
            const section7Path = join(jsonPath, 'section7');
            if (this.directoryExists(section7Path)) {
                this.templates.section7 = this.loadTemplatesFromDirectory(section7Path);
            }
            const section8Path = join(jsonPath, 'section8');
            this.templates.section8 = this.loadTemplatesFromDirectory(section8Path);
            const section11Path = join(jsonPath, 'section11');
            this.templates.section11 = this.loadTemplatesFromDirectory(section11Path);
            console.log(`Template Library loaded: ${this.templates.section7.length} Section 7, ${this.templates.section8.length} Section 8, ${this.templates.section11.length} Section 11 templates`);
        }
        catch (error) {
            console.error('Error loading templates:', error);
            throw error;
        }
    }
    directoryExists(path) {
        try {
            const fs = require('fs');
            return fs.existsSync(path);
        }
        catch {
            return false;
        }
    }
    loadTemplatesFromDirectory(directoryPath) {
        const templates = [];
        try {
            const files = readdirSync(directoryPath).filter(file => file.endsWith('.json'));
            for (const file of files) {
                const filePath = join(directoryPath, file);
                const templateData = JSON.parse(readFileSync(filePath, 'utf-8'));
                templates.push(templateData);
            }
        }
        catch (error) {
            console.error(`Error loading templates from ${directoryPath}:`, error);
        }
        return templates;
    }
    getTemplatesBySection(section) {
        const sectionKey = `section${section}`;
        return this.templates[sectionKey] || [];
    }
    getTemplates(section, language = "fr") {
        const templates = this.getTemplatesBySection(section);
        return templates.filter(template => !template.language || template.language === language);
    }
    getTemplatesByTags(section, tags) {
        const templates = this.getTemplatesBySection(section);
        return templates.filter(template => tags.some(tag => template.tags.includes(tag)));
    }
    getTemplatesByComplexity(section, complexity) {
        const templates = this.getTemplatesBySection(section);
        return templates.filter(template => !template.complexity || template.complexity === complexity);
    }
    searchTemplates(section, query) {
        const templates = this.getTemplatesBySection(section);
        const lowerQuery = query.toLowerCase();
        return templates.filter(template => template.title.toLowerCase().includes(lowerQuery) ||
            template.content.toLowerCase().includes(lowerQuery) ||
            template.tags.some(tag => tag.toLowerCase().includes(lowerQuery)));
    }
    getTemplateById(section, templateId) {
        const templates = this.getTemplatesBySection(section);
        return templates.find(template => template.source_file.replace('.docx', '') === templateId) || null;
    }
    getAvailableSections() {
        const sections = [];
        if (this.templates.section7.length > 0)
            sections.push("7");
        if (this.templates.section8.length > 0)
            sections.push("8");
        if (this.templates.section11.length > 0)
            sections.push("11");
        return sections;
    }
    getTemplateStats() {
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
        const byLanguage = {};
        const byComplexity = {};
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
    reloadTemplates() {
        this.loadTemplates();
    }
}
export const templateLibrary = new TemplateLibraryService();
//# sourceMappingURL=index.js.map