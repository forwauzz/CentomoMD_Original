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
export declare class TemplateLibraryService {
    private templates;
    constructor();
    private loadTemplates;
    private directoryExists;
    private loadTemplatesFromDirectory;
    getTemplatesBySection(section: "7" | "8" | "11"): TemplateJSON[];
    getTemplates(section: "7" | "8" | "11", language?: "fr" | "en"): TemplateJSON[];
    getTemplatesByTags(section: "7" | "8" | "11", tags: string[]): TemplateJSON[];
    getTemplatesByComplexity(section: "7" | "8" | "11", complexity: "low" | "medium" | "high"): TemplateJSON[];
    searchTemplates(section: "7" | "8" | "11", query: string): TemplateJSON[];
    getTemplateById(section: "7" | "8" | "11", templateId: string): TemplateJSON | null;
    getAvailableSections(): ("7" | "8" | "11")[];
    getTemplateStats(): {
        total: number;
        bySection: Record<string, number>;
        byLanguage: Record<string, number>;
        byComplexity: Record<string, number>;
    };
    reloadTemplates(): void;
}
export declare const templateLibrary: TemplateLibraryService;
export type { TemplateJSON, TemplateLibrary };
//# sourceMappingURL=index.d.ts.map