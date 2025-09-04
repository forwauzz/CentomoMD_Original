export interface Section8ValidationResult {
  isValid: boolean;
  issues: string[];
  warnings: string[];
  critical_issues: string[];
}

export interface Section8ValidationRules {
  required_headings: boolean;
  vas_format: boolean;
  mrc_format: boolean;
  rom_format: boolean;
  preserve_negatives: boolean;
  annex_references: boolean;
  test_format: boolean;
}

export class Section8Validator {
  private rules: Section8ValidationRules;

  constructor() {
    this.rules = {
      required_headings: true,
      vas_format: true,
      mrc_format: true,
      rom_format: true,
      preserve_negatives: true,
      annex_references: true,
      test_format: true
    };
  }

  /**
   * Validate Section 8 content according to CNESST requirements
   */
  validate(content: string, language: 'fr' | 'en'): Section8ValidationResult {
    // const issues: string[] = [];
    const warnings: string[] = [];
    const critical_issues: string[] = [];

    // Check required headings
    if (this.rules.required_headings) {
      const headingsIssue = this.validateRequiredHeadings(content, language);
      if (headingsIssue) {
        warnings.push(headingsIssue);
      }
    }

    // Check VAS format
    if (this.rules.vas_format) {
      const vasIssue = this.validateVASFormat(content, language);
      if (vasIssue) {
        critical_issues.push(vasIssue);
      }
    }

    // Check MRC format
    if (this.rules.mrc_format) {
      const mrcIssue = this.validateMRCFormat(content, language);
      if (mrcIssue) {
        critical_issues.push(mrcIssue);
      }
    }

    // Check ROM format
    if (this.rules.rom_format) {
      const romIssue = this.validateROMFormat(content, language);
      if (romIssue) {
        critical_issues.push(romIssue);
      }
    }

    // Check negative preservation
    if (this.rules.preserve_negatives) {
      const negativesIssue = this.validateNegativePreservation(content, language);
      if (negativesIssue) {
        warnings.push(negativesIssue);
      }
    }

    // Check annex references
    if (this.rules.annex_references) {
      const annexIssue = this.validateAnnexReferences(content, language);
      if (annexIssue) {
        warnings.push(annexIssue);
      }
    }

    // Check test format
    if (this.rules.test_format) {
      const testIssue = this.validateTestFormat(content, language);
      if (testIssue) {
        warnings.push(testIssue);
      }
    }

    return {
      isValid: critical_issues.length === 0,
      issues: [...critical_issues, ...warnings],
      warnings,
      critical_issues
    };
  }

  /**
   * Validate required headings are present and in correct order
   */
  private validateRequiredHeadings(content: string, language: 'fr' | 'en'): string | null {
    const requiredHeadings = language === 'fr'
      ? [
          'questionnaire subjectif',
          'état actuel',
          'plaintes',
          'impact fonctionnel',
          'examen neurologique',
          'négatifs'
        ]
      : [
          'subjective questionnaire',
          'current state',
          'complaints',
          'functional impact',
          'neurological examination',
          'negatives'
        ];

    const contentLower = content.toLowerCase();
    const missingHeadings: string[] = [];

    for (const heading of requiredHeadings) {
      if (!contentLower.includes(heading)) {
        missingHeadings.push(heading);
      }
    }

    if (missingHeadings.length > 0) {
      return language === 'fr'
        ? `En-têtes manquants: ${missingHeadings.join(', ')}`
        : `Missing headings: ${missingHeadings.join(', ')}`;
    }

    return null;
  }

  /**
   * Validate VAS (Visual Analog Scale) format
   */
  private validateVASFormat(content: string, language: 'fr' | 'en'): string | null {
    const vasPattern = /vas\s*[:\-]?\s*(\d{1,2})\s*\/\s*10/gi;
    const vasMatches = content.match(vasPattern);
    
    if (vasMatches) {
      for (const match of vasMatches) {
        const valueMatch = match.match(/(\d{1,2})\s*\/\s*10/);
        if (valueMatch) {
          const value = parseInt(valueMatch[1] || '0');
          if (value < 0 || value > 10) {
            return language === 'fr'
              ? `VAS invalide: ${match}. La valeur doit être entre 0 et 10.`
              : `Invalid VAS: ${match}. Value must be between 0 and 10.`;
          }
        }
      }
    }

    // Check for VAS mentions without proper format
    const vasMentionPattern = /vas\s*[:\-]?\s*(\d+)/gi;
    const vasMentions = content.match(vasMentionPattern);
    
    if (vasMentions) {
      for (const mention of vasMentions) {
        if (!mention.includes('/10')) {
          return language === 'fr'
            ? `Format VAS incorrect: ${mention}. Utilisez le format "X/10".`
            : `Incorrect VAS format: ${mention}. Use "X/10" format.`;
        }
      }
    }

    return null;
  }

  /**
   * Validate MRC (Medical Research Council) scale format
   */
  private validateMRCFormat(content: string, language: 'fr' | 'en'): string | null {
    const mrcPattern = /mrc\s*[:\-]?\s*(\d{1,2})\s*\/\s*5/gi;
    const mrcMatches = content.match(mrcPattern);
    
    if (mrcMatches) {
      for (const match of mrcMatches) {
        const valueMatch = match.match(/(\d{1,2})\s*\/\s*5/);
        if (valueMatch) {
          const value = parseInt(valueMatch[1] || '0');
          if (value < 0 || value > 5) {
            return language === 'fr'
              ? `MRC invalide: ${match}. La valeur doit être entre 0 et 5.`
              : `Invalid MRC: ${match}. Value must be between 0 and 5.`;
          }
        }
      }
    }

    // Check for MRC mentions without proper format
    const mrcMentionPattern = /mrc\s*[:\-]?\s*(\d+)/gi;
    const mrcMentions = content.match(mrcMentionPattern);
    
    if (mrcMentions) {
      for (const mention of mrcMentions) {
        if (!mention.includes('/5')) {
          return language === 'fr'
            ? `Format MRC incorrect: ${mention}. Utilisez le format "X/5".`
            : `Incorrect MRC format: ${mention}. Use "X/5" format.`;
        }
      }
    }

    return null;
  }

  /**
   * Validate ROM (Range of Motion) format
   */
  private validateROMFormat(content: string, language: 'fr' | 'en'): string | null {
    const romPattern = /rom\s*[:\-]?\s*(\d{1,3})\s*°/gi;
    const romMatches = content.match(romPattern);
    
    if (romMatches) {
      for (const match of romMatches) {
        const valueMatch = match.match(/(\d{1,3})\s*°/);
        if (valueMatch) {
          const value = parseInt(valueMatch[1] || '0');
          if (value < 0 || value > 360) {
            return language === 'fr'
              ? `ROM invalide: ${match}. La valeur doit être entre 0 et 360 degrés.`
              : `Invalid ROM: ${match}. Value must be between 0 and 360 degrees.`;
          }
        }
      }
    }

    // Check for ROM mentions without proper format
    const romMentionPattern = /rom\s*[:\-]?\s*(\d+)/gi;
    const romMentions = content.match(romMentionPattern);
    
    if (romMentions) {
      for (const mention of romMentions) {
        if (!mention.includes('°')) {
          return language === 'fr'
            ? `Format ROM incorrect: ${mention}. Utilisez le format "X°".`
            : `Incorrect ROM format: ${mention}. Use "X°" format.`;
        }
      }
    }

    return null;
  }

  /**
   * Validate that negative findings are preserved
   */
  private validateNegativePreservation(content: string, language: 'fr' | 'en'): string | null {
    const negativePatterns = language === 'fr'
      ? [
          /denie\s+[^.]*sphincter/i,
          /négatif\s+[^.]*sphincter/i,
          /pas\s+[^.]*sphincter/i,
          /aucun\s+[^.]*sphincter/i
        ]
      : [
          /denies\s+[^.]*sphincter/i,
          /negative\s+[^.]*sphincter/i,
          /no\s+[^.]*sphincter/i,
          /none\s+[^.]*sphincter/i
        ];

    const hasNegativeFindings = negativePatterns.some(pattern => pattern.test(content));
    
    if (hasNegativeFindings) {
      // Check if negatives are properly preserved
      const preservedPattern = language === 'fr'
        ? /(denie|négatif|pas|aucun)\s+[^.]*sphincter[^.]*symptômes/i
        : /(denies|negative|no|none)\s+[^.]*sphincter[^.]*symptoms/i;

      if (!preservedPattern.test(content)) {
        return language === 'fr'
          ? "Les négatifs devraient être explicitement préservés (ex: 'denie les symptômes sphinctériens')."
          : "Negatives should be explicitly preserved (e.g., 'denies sphincter symptoms').";
      }
    }

    return null;
  }

  /**
   * Validate annex references are kept verbatim
   */
  private validateAnnexReferences(content: string, language: 'fr' | 'en'): string | null {
    const annexPattern = language === 'fr'
      ? /cf\s+annexe|voir\s+annexe|annexe\s+\d+/gi
      : /see\s+annex|refer\s+to\s+annex|annex\s+\d+/gi;

    const annexMatches = content.match(annexPattern);
    
    if (annexMatches) {
      // Check if annex references are kept verbatim
      const verbatimPattern = language === 'fr'
        ? /cf\s+annexe/gi
        : /see\s+annex/gi;

      const hasVerbatimReferences = verbatimPattern.test(content);
      
      if (!hasVerbatimReferences) {
        return language === 'fr'
          ? "Les références aux annexes devraient être conservées verbatim (ex: 'cf annexe')."
          : "Annex references should be kept verbatim (e.g., 'see annex').";
      }
    }

    return null;
  }

  /**
   * Validate test format and structure
   */
  private validateTestFormat(content: string, language: 'fr' | 'en'): string | null {
    const testPattern = language === 'fr'
      ? /(test|examen|évaluation)\s+[^.]*[:\-]\s*[^.]*/gi
      : /(test|exam|evaluation)\s+[^.]*[:\-]\s*[^.]*/gi;

    const testMatches = content.match(testPattern);
    
    if (testMatches) {
      // Check if tests have proper structure
      const structuredTestPattern = language === 'fr'
        ? /(test|examen|évaluation)\s+[^.]*[:\-]\s*(positif|négatif|normal|anormal)/gi
        : /(test|exam|evaluation)\s+[^.]*[:\-]\s*(positive|negative|normal|abnormal)/gi;

      const hasStructuredTests = structuredTestPattern.test(content);
      
      if (!hasStructuredTests) {
        return language === 'fr'
          ? "Les tests devraient avoir une structure claire avec résultats (ex: 'Test X: positif/négatif')."
          : "Tests should have clear structure with results (e.g., 'Test X: positive/negative').";
      }
    }

    return null;
  }

  /**
   * Get validation rules
   */
  getRules(): Section8ValidationRules {
    return { ...this.rules };
  }

  /**
   * Update validation rules
   */
  updateRules(newRules: Partial<Section8ValidationRules>): void {
    this.rules = { ...this.rules, ...newRules };
  }
}
