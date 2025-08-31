export interface FormattingOptions {
  section: "7" | "8" | "11";
  language: "fr" | "en";
  complexity?: "low" | "medium" | "high";
}

export interface FormattedContent {
  original: string;
  formatted: string;
  changes: string[];
  compliance: {
    cnesst: boolean;
    medical_terms: boolean;
    structure: boolean;
  };
}

export class FormattingService {
  private static API_BASE = 'http://localhost:3001/api';

  /**
   * Format template content using AI formatting service
   */
  static async formatTemplateContent(
    content: string, 
    options: FormattingOptions
  ): Promise<FormattedContent> {
    try {
      const response = await fetch(`${this.API_BASE}/templates/format`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          section: options.section,
          language: options.language,
          complexity: options.complexity || 'medium'
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Formatting failed');
      }

      return result.data;
    } catch (error) {
      console.error('Error formatting template content:', error);
      
      // Return original content if formatting fails
      return {
        original: content,
        formatted: content,
        changes: ['Formatting failed - using original content'],
        compliance: {
          cnesst: false,
          medical_terms: false,
          structure: false
        }
      };
    }
  }

  /**
   * Get formatting suggestions for content
   */
  static getFormattingSuggestions(content: string, options: FormattingOptions): string[] {
    const suggestions: string[] = [];

    // Check for missing section headers
    const sectionHeaders = {
      "7": "7. Historique de faits et évolution",
      "8": "8. Questionnaire subjectif", 
      "11": "11. Conclusion médicale"
    };

    if (!content.includes(sectionHeaders[options.section])) {
      suggestions.push(`Add section header: "${sectionHeaders[options.section]}"`);
    }

    // Check for proper terminology
    if (options.language === "fr" && content.includes("patient")) {
      suggestions.push("Replace 'patient' with 'travailleur/travailleuse'");
    }

    // Check for chronological order
    if (options.section === "7" && !content.includes("le ")) {
      suggestions.push("Add chronological indicators (le + date)");
    }

    return suggestions;
  }

  /**
   * Apply basic formatting rules locally (fallback)
   */
  static applyBasicFormatting(content: string, options: FormattingOptions): string {
    let formatted = content;

    // Add section header if missing
    const sectionHeaders = {
      "7": "7. Historique de faits et évolution",
      "8": "8. Questionnaire subjectif",
      "11": "11. Conclusion médicale"
    };

    if (!formatted.includes(sectionHeaders[options.section])) {
      formatted = `${sectionHeaders[options.section]}\n\n${formatted}`;
    }

    // Apply French terminology if needed
    if (options.language === "fr") {
      formatted = formatted.replace(/patient/g, "travailleur");
      formatted = formatted.replace(/patiente/g, "travailleuse");
    }

    return formatted;
  }
}
