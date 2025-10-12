export interface FormattingOptions {
  section: "7" | "8" | "11" | "history_evolution";
  inputLanguage: "fr" | "en";
  outputLanguage?: "fr" | "en";
  complexity?: "low" | "medium" | "high";
  formattingLevel?: "basic" | "standard" | "advanced";
  includeSuggestions?: boolean;
}

export interface FormattedContent {
  original: string;
  formatted: string;
  changes: string[];
  suggestions: string[];
  compliance: {
    cnesst: boolean;
    medical_terms: boolean;
    structure: boolean;
    terminology: boolean;
    chronology: boolean;
  };
  statistics: {
    wordCount: number;
    sentenceCount: number;
    medicalTermsCount: number;
    complianceScore: number;
  };
}

export class FormattingService {
  private static API_BASE = '/api';

  /**
   * Format template content using AI formatting service
   */
  static async formatTemplateContent(
    content: string, 
    options: FormattingOptions
  ): Promise<FormattedContent> {
    try {
      const requestBody = {
        content,
        section: options.section,
        inputLanguage: options.inputLanguage,
        outputLanguage: options.outputLanguage || options.inputLanguage,
        complexity: options.complexity || 'medium',
        formattingLevel: options.formattingLevel || 'standard',
        includeSuggestions: options.includeSuggestions || false
      };
      
      console.log('🔍 FormattingService request:', requestBody);
      
      const response = await fetch(`${this.API_BASE}/templates/format`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ FormattingService error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
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
        suggestions: ['Check content format and try again'],
        compliance: {
          cnesst: false,
          medical_terms: false,
          structure: false,
          terminology: false,
          chronology: false
        },
        statistics: {
          wordCount: 0,
          sentenceCount: 0,
          medicalTermsCount: 0,
          complianceScore: 0
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
      "11": "11. Conclusion médicale",
      "history_evolution": "Historique d'évolution"
    };

    if (!content.includes(sectionHeaders[options.section])) {
      suggestions.push(`Add section header: "${sectionHeaders[options.section]}"`);
    }

    // Check for proper terminology (always check for patient terminology)
    if (content.includes("patient")) {
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
      "11": "11. Conclusion médicale",
      "history_evolution": "Historique d'évolution"
    };

    if (!formatted.includes(sectionHeaders[options.section])) {
      formatted = `${sectionHeaders[options.section]}\n\n${formatted}`;
    }

    // Apply French terminology (always use French output)
    formatted = formatted.replace(/patient/g, "travailleur");
    formatted = formatted.replace(/patiente/g, "travailleuse");

    return formatted;
  }
}
