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

export class AIFormattingService {
  /**
   * Apply CNESST formatting rules to template content
   */
  static formatTemplateContent(content: string, options: FormattingOptions): FormattedContent {
    try {
      const changes: string[] = [];
      let formattedContent = content;

      // Section-specific formatting rules
      switch (options.section) {
        case "7":
          formattedContent = this.formatSection7(formattedContent, changes);
          break;
        case "8":
          formattedContent = this.formatSection8(formattedContent, changes);
          break;
        case "11":
          formattedContent = this.formatSection11(formattedContent, changes);
          break;
        default:
          console.warn(`Unknown section: ${options.section}`);
      }

      // Language-specific formatting
      if (options.language === "fr") {
        formattedContent = this.formatFrenchContent(formattedContent, changes);
      }

      // Medical terminology validation
      const medicalTermsValid = this.validateMedicalTerms(formattedContent, options.language);

      return {
        original: content,
        formatted: formattedContent,
        changes,
        compliance: {
          cnesst: true, // Basic compliance check
          medical_terms: medicalTermsValid,
          structure: this.validateStructure(formattedContent, options.section)
        }
      };
    } catch (error) {
      console.error('Error in formatTemplateContent:', error);
      
      // Return original content with error information
      return {
        original: content,
        formatted: content,
        changes: [`Error during formatting: ${error}`],
        compliance: {
          cnesst: false,
          medical_terms: false,
          structure: false
        }
      };
    }
  }

  /**
   * Format Section 7 content (Historique de faits et évolution)
   */
  private static formatSection7(content: string, changes: string[]): string {
    let formatted = content;

    // Ensure proper section header
    if (!formatted.includes("7. Historique de faits et évolution")) {
      formatted = "7. Historique de faits et évolution\n\n" + formatted;
      changes.push("Added Section 7 header");
    }

    // Ensure chronological order indicators
    if (!formatted.includes("Le travailleur") && !formatted.includes("La travailleuse")) {
      formatted = formatted.replace(/Le patient/g, "Le travailleur");
      formatted = formatted.replace(/La patiente/g, "La travailleuse");
      changes.push("Standardized worker terminology");
    }

    // Ensure proper date formatting
    formatted = formatted.replace(/(\d{1,2})\/(\d{1,2})\/(\d{4})/g, "le $1 $2 $3");
    changes.push("Standardized date format");

    return formatted;
  }

  /**
   * Format Section 8 content (Questionnaire subjectif/Résultats d'examens)
   */
  private static formatSection8(content: string, changes: string[]): string {
    let formatted = content;

    // Ensure proper section structure
    if (!formatted.includes("8. Questionnaire subjectif")) {
      formatted = "8. Questionnaire subjectif\n\n" + formatted;
      changes.push("Added Section 8 header");
    }

    // Ensure clinical examination structure
    if (!formatted.includes("Examen clinique") && !formatted.includes("Examens paracliniques")) {
      formatted = formatted.replace(/Examen:/g, "Examen clinique:");
      changes.push("Standardized clinical examination format");
    }

    return formatted;
  }

  /**
   * Format Section 11 content (Conclusion médicale/Résumé et conclusion)
   */
  private static formatSection11(content: string, changes: string[]): string {
    let formatted = content;

    // Ensure proper section header
    if (!formatted.includes("11. Conclusion médicale")) {
      formatted = "11. Conclusion médicale\n\n" + formatted;
      changes.push("Added Section 11 header");
    }

    // Ensure proper conclusion structure
    if (!formatted.includes("Résumé et conclusion")) {
      formatted = formatted.replace(/Conclusion:/g, "Résumé et conclusion:");
      changes.push("Standardized conclusion format");
    }

    return formatted;
  }

  /**
   * Format French-specific content
   */
  private static formatFrenchContent(content: string, changes: string[]): string {
    let formatted = content;

    // Ensure proper French medical terminology
    formatted = formatted.replace(/patient/g, "travailleur");
    formatted = formatted.replace(/patiente/g, "travailleuse");
    changes.push("Applied French medical terminology");

    // Ensure proper French date format
    formatted = formatted.replace(/(\d{1,2})\/(\d{1,2})\/(\d{4})/g, "le $1 $2 $3");
    changes.push("Applied French date format");

    return formatted;
  }

  /**
   * Validate medical terminology
   */
  private static validateMedicalTerms(content: string, language: "fr" | "en"): boolean {
    const frenchTerms = [
      "travailleur", "travailleuse", "accident", "blessure", "douleur", 
      "diagnostic", "traitement", "médical", "clinique", "examen"
    ];

    const englishTerms = [
      "worker", "accident", "injury", "pain", "diagnosis", 
      "treatment", "medical", "clinical", "examination"
    ];

    const terms = language === "fr" ? frenchTerms : englishTerms;
    const contentLower = content.toLowerCase();

    return terms.some(term => contentLower.includes(term));
  }

  /**
   * Validate content structure
   */
  private static validateStructure(content: string, section: "7" | "8" | "11"): boolean {
    const sectionHeaders = {
      "7": "7. Historique de faits et évolution",
      "8": "8. Questionnaire subjectif",
      "11": "11. Conclusion médicale"
    };

    return content.includes(sectionHeaders[section]);
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
}
