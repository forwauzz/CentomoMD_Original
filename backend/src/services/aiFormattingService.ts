export interface FormattingOptions {
  section: "7" | "8" | "11";
  language: "fr" | "en";
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

export class AIFormattingService {
  /**
   * Apply CNESST formatting rules to template content
   */
  static formatTemplateContent(content: string, options: FormattingOptions): FormattedContent {
    try {
      const changes: string[] = [];
      const suggestions: string[] = [];
      let formattedContent = content;

      // Section-specific formatting rules
      switch (options.section) {
        case "7":
          formattedContent = this.formatSection7(formattedContent, changes, options);
          break;
        case "8":
          formattedContent = this.formatSection8(formattedContent, changes, options);
          break;
        case "11":
          formattedContent = this.formatSection11(formattedContent, changes, options);
          break;
        default:
          console.warn(`Unknown section: ${options.section}`);
      }

      // Language-specific formatting
      if (options.language === "fr") {
        formattedContent = this.formatFrenchContent(formattedContent, changes, options);
      }

      // Advanced formatting based on level
      if (options.formattingLevel === "advanced") {
        formattedContent = this.applyAdvancedFormatting(formattedContent, changes, options);
      }

      // Generate suggestions if requested
      if (options.includeSuggestions) {
        suggestions.push(...this.generateSuggestions(formattedContent, options));
      }

      // Calculate statistics
      const statistics = this.calculateStatistics(formattedContent, options.language);

      // Enhanced compliance validation
      const compliance = this.validateCompliance(formattedContent, options);

      return {
        original: content,
        formatted: formattedContent,
        changes,
        suggestions,
        compliance,
        statistics
      };
    } catch (error) {
      console.error('Error in formatTemplateContent:', error);
      
      // Return original content with error information
      return {
        original: content,
        formatted: content,
        changes: [`Error during formatting: ${error}`],
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
   * Format Section 7 content (Historique de faits et évolution)
   */
  private static formatSection7(content: string, changes: string[], options: FormattingOptions): string {
    let formatted = content;

    // Language-specific section headers
    if (options.language === "fr") {
      if (!formatted.includes("7. Historique de faits et évolution")) {
        formatted = "7. Historique de faits et évolution\n\n" + formatted;
        changes.push("Added Section 7 header (French)");
      }
    } else {
      if (!formatted.includes("7. History of Facts and Evolution")) {
        formatted = "7. History of Facts and Evolution\n\n" + formatted;
        changes.push("Added Section 7 header (English)");
      }
    }

    // Language-specific worker terminology standardization
    if (options.language === "fr") {
      const frenchWorkerTerminology = {
        'patient': 'travailleur',
        'patiente': 'travailleuse',
        'client': 'travailleur',
        'cliente': 'travailleuse',
        'usager': 'travailleur',
        'usagère': 'travailleuse'
      };

      Object.entries(frenchWorkerTerminology).forEach(([oldTerm, newTerm]) => {
        const regex = new RegExp(`\\b${oldTerm}\\b`, 'gi');
        if (formatted.match(regex)) {
          formatted = formatted.replace(regex, newTerm);
          changes.push(`Standardized French terminology: ${oldTerm} → ${newTerm}`);
        }
      });
    } else {
      // English worker terminology - keep as-is or minimal standardization
      const englishWorkerTerminology = {
        'client': 'worker',
        'user': 'worker'
      };

      Object.entries(englishWorkerTerminology).forEach(([oldTerm, newTerm]) => {
        const regex = new RegExp(`\\b${oldTerm}\\b`, 'gi');
        if (formatted.match(regex)) {
          formatted = formatted.replace(regex, newTerm);
          changes.push(`Standardized English terminology: ${oldTerm} → ${newTerm}`);
        }
      });
    }

    // Language-specific date formatting
    if (options.language === "fr") {
      const frenchDatePatterns = [
        { pattern: /(\d{1,2})\/(\d{1,2})\/(\d{4})/g, replacement: "le $1 $2 $3" },
        { pattern: /(\d{1,2})-(\d{1,2})-(\d{4})/g, replacement: "le $1 $2 $3" },
        { pattern: /(\d{1,2})\.(\d{1,2})\.(\d{4})/g, replacement: "le $1 $2 $3" }
      ];

      frenchDatePatterns.forEach(({ pattern, replacement }) => {
        if (formatted.match(pattern)) {
          formatted = formatted.replace(pattern, replacement);
          changes.push("Applied French date format");
        }
      });
    } else {
      // English date formatting - keep standard format
      const englishDatePatterns = [
        { pattern: /(\d{1,2})\/(\d{1,2})\/(\d{4})/g, replacement: "$1/$2/$3" },
        { pattern: /(\d{1,2})-(\d{1,2})-(\d{4})/g, replacement: "$1-$2-$3" },
        { pattern: /(\d{1,2})\.(\d{1,2})\.(\d{4})/g, replacement: "$1.$2.$3" }
      ];

      englishDatePatterns.forEach(({ pattern, replacement }) => {
        if (formatted.match(pattern)) {
          formatted = formatted.replace(pattern, replacement);
          changes.push("Standardized English date format");
        }
      });
    }

    // Language-specific chronological indicators
    if (options.formattingLevel === "advanced") {
      if (options.language === "fr") {
        if (!formatted.includes("le ") && !formatted.includes("Le ")) {
          const sentences = formatted.split(/[.!?]+/);
          const enhancedSentences = sentences.map((sentence, index) => {
            if (sentence.trim() && index > 0) {
              return sentence.replace(/^(\s*)(.+)/, '$1Le $2');
            }
            return sentence;
          });
          formatted = enhancedSentences.join('.');
          changes.push("Added French chronological indicators");
        }
      } else {
        // English chronological indicators - minimal or none
        if (!formatted.includes("On ") && !formatted.includes("The ")) {
          const sentences = formatted.split(/[.!?]+/);
          const enhancedSentences = sentences.map((sentence, index) => {
            if (sentence.trim() && index > 0) {
              return sentence.replace(/^(\s*)(.+)/, '$1On $2');
            }
            return sentence;
          });
          formatted = enhancedSentences.join('.');
          changes.push("Added English chronological indicators");
        }
      }
    }

    // Language-specific medical terminology
    if (options.formattingLevel === "advanced") {
      if (options.language === "fr") {
        const frenchMedicalTerms = {
          'blessure': 'lésion',
          'douleur': 'symptomatologie douloureuse',
          'accident': 'événement traumatique',
          'traitement': 'prise en charge thérapeutique'
        };

        Object.entries(frenchMedicalTerms).forEach(([oldTerm, newTerm]) => {
          const regex = new RegExp(`\\b${oldTerm}\\b`, 'gi');
          if (formatted.match(regex)) {
            formatted = formatted.replace(regex, newTerm);
            changes.push(`Enhanced French medical terminology: ${oldTerm} → ${newTerm}`);
          }
        });
      } else {
        // English medical terminology - keep as-is or minimal enhancement
        const englishMedicalTerms = {
          'hurt': 'injury',
          'pain': 'symptomatology',
          'accident': 'traumatic event',
          'treatment': 'therapeutic management'
        };

        Object.entries(englishMedicalTerms).forEach(([oldTerm, newTerm]) => {
          const regex = new RegExp(`\\b${oldTerm}\\b`, 'gi');
          if (formatted.match(regex)) {
            formatted = formatted.replace(regex, newTerm);
            changes.push(`Enhanced English medical terminology: ${oldTerm} → ${newTerm}`);
          }
        });
      }
    }

    return formatted;
  }

  /**
   * Format Section 8 content (Questionnaire subjectif/Résultats d'examens)
   */
  private static formatSection8(content: string, changes: string[], options: FormattingOptions): string {
    let formatted = content;

    // Ensure proper section structure
    if (!formatted.includes("8. Questionnaire subjectif")) {
      formatted = "8. Questionnaire subjectif\n\n" + formatted;
      changes.push("Added Section 8 header");
    }

    // Enhanced clinical examination structure
    const clinicalStructure = {
      'Examen:': 'Examen clinique:',
      'Examen clinique:': 'Examen clinique:',
      'Examens:': 'Examens paracliniques:',
      'Examens paracliniques:': 'Examens paracliniques:'
    };

    Object.entries(clinicalStructure).forEach(([oldTerm, newTerm]) => {
      if (formatted.includes(oldTerm)) {
        formatted = formatted.replace(new RegExp(oldTerm, 'g'), newTerm);
        changes.push(`Standardized clinical structure: ${oldTerm} → ${newTerm}`);
      }
    });

    // Ensure proper subsections
    if (!formatted.includes("Examen clinique") && !formatted.includes("Examens paracliniques")) {
      formatted = formatted.replace(/Examen:/g, "Examen clinique:");
      changes.push("Added missing clinical examination structure");
    }

    // Enhanced medical terminology for Section 8
    const medicalTerms = {
      'douleur': 'symptomatologie douloureuse',
      'mobilité': 'amplitude articulaire',
      'force': 'force musculaire',
      'sensibilité': 'sensibilité cutanée',
      'réflexes': 'réflexes ostéotendineux'
    };

    if (options.formattingLevel === "advanced") {
      Object.entries(medicalTerms).forEach(([oldTerm, newTerm]) => {
        const regex = new RegExp(`\\b${oldTerm}\\b`, 'gi');
        if (formatted.match(regex)) {
          formatted = formatted.replace(regex, newTerm);
          changes.push(`Enhanced medical terminology: ${oldTerm} → ${newTerm}`);
        }
      });
    }

    // Add measurement units if missing
    if (options.formattingLevel === "advanced") {
      const measurementPatterns = [
        { pattern: /(\d+)\s*degrés?/gi, replacement: "$1°" },
        { pattern: /(\d+)\s*centimètres?/gi, replacement: "$1 cm" },
        { pattern: /(\d+)\s*kilogrammes?/gi, replacement: "$1 kg" }
      ];

      measurementPatterns.forEach(({ pattern, replacement }) => {
        if (formatted.match(pattern)) {
          formatted = formatted.replace(pattern, replacement);
          changes.push("Standardized measurement units");
        }
      });
    }

    return formatted;
  }

  /**
   * Format Section 11 content (Conclusion médicale/Résumé et conclusion)
   */
  private static formatSection11(content: string, changes: string[], options: FormattingOptions): string {
    let formatted = content;

    // Ensure proper section header
    if (!formatted.includes("11. Conclusion médicale")) {
      formatted = "11. Conclusion médicale\n\n" + formatted;
      changes.push("Added Section 11 header");
    }

    // Enhanced conclusion structure
    const conclusionStructure = {
      'Conclusion:': 'Résumé et conclusion:',
      'Résumé:': 'Résumé et conclusion:',
      'Résumé et conclusion:': 'Résumé et conclusion:'
    };

    Object.entries(conclusionStructure).forEach(([oldTerm, newTerm]) => {
      if (formatted.includes(oldTerm)) {
        formatted = formatted.replace(new RegExp(oldTerm, 'g'), newTerm);
        changes.push(`Standardized conclusion structure: ${oldTerm} → ${newTerm}`);
      }
    });

    // Ensure proper conclusion structure
    if (!formatted.includes("Résumé et conclusion")) {
      formatted = formatted.replace(/Conclusion:/g, "Résumé et conclusion:");
      changes.push("Added missing conclusion structure");
    }

    // Enhanced medical-legal terminology for Section 11
    const medicalLegalTerms = {
      'diagnostic': 'diagnostic médical',
      'pronostic': 'pronostic fonctionnel',
      'incapacité': 'incapacité fonctionnelle',
      'handicap': 'limitation fonctionnelle',
      'invalidité': 'invalidité permanente'
    };

    if (options.formattingLevel === "advanced") {
      Object.entries(medicalLegalTerms).forEach(([oldTerm, newTerm]) => {
        const regex = new RegExp(`\\b${oldTerm}\\b`, 'gi');
        if (formatted.match(regex)) {
          formatted = formatted.replace(regex, newTerm);
          changes.push(`Enhanced medical-legal terminology: ${oldTerm} → ${newTerm}`);
        }
      });
    }

    // Add percentage formatting for disability ratings
    if (options.formattingLevel === "advanced") {
      const percentagePatterns = [
        { pattern: /(\d+)\s*pour\s*cent/gi, replacement: "$1%" },
        { pattern: /(\d+)\s*%/gi, replacement: "$1%" }
      ];

      percentagePatterns.forEach(({ pattern, replacement }) => {
        if (formatted.match(pattern)) {
          formatted = formatted.replace(pattern, replacement);
          changes.push("Standardized percentage format");
        }
      });
    }

    return formatted;
  }

  /**
   * Format French-specific content
   */
  private static formatFrenchContent(content: string, changes: string[], options: FormattingOptions): string {
    let formatted = content;

    // Enhanced French medical terminology
    const frenchMedicalTerms = {
      'patient': 'travailleur',
      'patiente': 'travailleuse',
      'client': 'travailleur',
      'cliente': 'travailleuse',
      'usager': 'travailleur',
      'usagère': 'travailleuse'
    };

    Object.entries(frenchMedicalTerms).forEach(([oldTerm, newTerm]) => {
      const regex = new RegExp(`\\b${oldTerm}\\b`, 'gi');
      if (formatted.match(regex)) {
        formatted = formatted.replace(regex, newTerm);
        changes.push(`Applied French medical terminology: ${oldTerm} → ${newTerm}`);
      }
    });

    // Enhanced French date format
    const datePatterns = [
      { pattern: /(\d{1,2})\/(\d{1,2})\/(\d{4})/g, replacement: "le $1 $2 $3" },
      { pattern: /(\d{1,2})-(\d{1,2})-(\d{4})/g, replacement: "le $1 $2 $3" },
      { pattern: /(\d{1,2})\.(\d{1,2})\.(\d{4})/g, replacement: "le $1 $2 $3" }
    ];

    datePatterns.forEach(({ pattern, replacement }) => {
      if (formatted.match(pattern)) {
        formatted = formatted.replace(pattern, replacement);
        changes.push("Applied French date format");
      }
    });

    // French capitalization rules
    if (options.formattingLevel === "advanced") {
      // Capitalize medical terms
      const medicalTerms = ['diagnostic', 'pronostic', 'traitement', 'examen', 'symptôme'];
      medicalTerms.forEach(term => {
        const regex = new RegExp(`\\b${term}\\b`, 'gi');
        if (formatted.match(regex)) {
          formatted = formatted.replace(regex, term.charAt(0).toUpperCase() + term.slice(1));
          changes.push(`Applied French capitalization: ${term}`);
        }
      });
    }

    return formatted;
  }

  /**
   * Apply advanced formatting rules
   */
  private static applyAdvancedFormatting(content: string, changes: string[], options: FormattingOptions): string {
    let formatted = content;

    // Advanced punctuation and spacing
    formatted = formatted.replace(/\s+/g, ' '); // Normalize spaces
    formatted = formatted.replace(/\s+([.!?])/g, '$1'); // Remove spaces before punctuation
    formatted = formatted.replace(/([.!?])\s*([A-Z])/g, '$1 $2'); // Ensure space after punctuation

    // Advanced medical terminology enhancement
    if (options.language === "fr") {
      const advancedTerms = {
        'douleur': 'symptomatologie douloureuse',
        'mobilité': 'amplitude articulaire',
        'force': 'force musculaire',
        'sensibilité': 'sensibilité cutanée',
        'réflexes': 'réflexes ostéotendineux'
      };

      Object.entries(advancedTerms).forEach(([oldTerm, newTerm]) => {
        const regex = new RegExp(`\\b${oldTerm}\\b`, 'gi');
        if (formatted.match(regex)) {
          formatted = formatted.replace(regex, newTerm);
          changes.push(`Advanced terminology enhancement: ${oldTerm} → ${newTerm}`);
        }
      });
    }

    changes.push("Applied advanced formatting rules");
    return formatted;
  }

  /**
   * Generate formatting suggestions
   */
  private static generateSuggestions(content: string, options: FormattingOptions): string[] {
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

    // Check for medical terminology
    if (!content.match(/\b(diagnostic|traitement|examen|symptôme)\b/i)) {
      suggestions.push("Consider adding medical terminology");
    }

    // Check for proper structure
    if (options.section === "8" && !content.includes("Examen clinique")) {
      suggestions.push("Add 'Examen clinique' section");
    }

    return suggestions;
  }

  /**
   * Calculate content statistics
   */
  private static calculateStatistics(content: string, _language: "fr" | "en"): {
    wordCount: number;
    sentenceCount: number;
    medicalTermsCount: number;
    complianceScore: number;
  } {
    const words = content.split(/\s+/).filter(word => word.length > 0);
    const sentences = content.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0);
    
    const medicalTerms = [
      "travailleur", "travailleuse", "accident", "blessure", "douleur", 
      "diagnostic", "traitement", "médical", "clinique", "examen",
      "symptôme", "pronostic", "incapacité", "handicap", "invalidité"
    ];

    const medicalTermsCount = medicalTerms.filter(term => 
      content.toLowerCase().includes(term)
    ).length;

    // Calculate compliance score (0-100)
    let complianceScore = 0;
    if (content.includes("7. Historique de faits et évolution") || 
        content.includes("8. Questionnaire subjectif") || 
        content.includes("11. Conclusion médicale")) {
      complianceScore += 25;
    }
    if (medicalTermsCount > 0) complianceScore += 25;
    if (content.includes("travailleur") || content.includes("travailleuse")) complianceScore += 25;
    if (content.includes("le ") || content.includes("Le ")) complianceScore += 25;

    return {
      wordCount: words.length,
      sentenceCount: sentences.length,
      medicalTermsCount,
      complianceScore
    };
  }

  /**
   * Enhanced compliance validation
   */
  private static validateCompliance(content: string, options: FormattingOptions): {
    cnesst: boolean;
    medical_terms: boolean;
    structure: boolean;
    terminology: boolean;
    chronology: boolean;
  } {
    const sectionHeaders = {
      "7": "7. Historique de faits et évolution",
      "8": "8. Questionnaire subjectif",
      "11": "11. Conclusion médicale"
    };

    const hasStructure = content.includes(sectionHeaders[options.section]);
    const hasMedicalTerms = this.validateMedicalTerms(content, options.language);
    const hasProperTerminology = !content.includes("patient") && !content.includes("patiente");
    const hasChronology = content.includes("le ") || content.includes("Le ");

    return {
      cnesst: hasStructure && hasMedicalTerms,
      medical_terms: hasMedicalTerms,
      structure: hasStructure,
      terminology: hasProperTerminology,
      chronology: hasChronology
    };
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
