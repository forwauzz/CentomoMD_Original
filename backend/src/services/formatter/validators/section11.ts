export interface Section11ValidationResult {
  isValid: boolean;
  issues: string[];
  warnings: string[];
  critical_issues: string[];
}

export interface Section11ValidationRules {
  required_headings: boolean;
  source_tags: boolean;
  no_invention: boolean;
  consolidation_date: boolean;
  permanent_impairment: boolean;
  limitations: boolean;
}

export class Section11Validator {
  private rules: Section11ValidationRules;

  constructor() {
    this.rules = {
      required_headings: true,
      source_tags: true,
      no_invention: true,
      consolidation_date: true,
      permanent_impairment: true,
      limitations: true
    };
  }

  /**
   * Validate Section 11 content according to CNESST requirements
   */
  validate(content: string, language: 'fr' | 'en'): Section11ValidationResult {
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

    // Check source tags
    if (this.rules.source_tags) {
      const sourceTagsIssue = this.validateSourceTags(content, language);
      if (sourceTagsIssue) {
        critical_issues.push(sourceTagsIssue);
      }
    }

    // Check no invention rule
    if (this.rules.no_invention) {
      const inventionIssue = this.validateNoInvention(content, language);
      if (inventionIssue) {
        critical_issues.push(inventionIssue);
      }
    }

    // Check consolidation date
    if (this.rules.consolidation_date) {
      const consolidationIssue = this.validateConsolidationDate(content, language);
      if (consolidationIssue) {
        critical_issues.push(consolidationIssue);
      }
    }

    // Check permanent impairment
    if (this.rules.permanent_impairment) {
      const impairmentIssue = this.validatePermanentImpairment(content, language);
      if (impairmentIssue) {
        warnings.push(impairmentIssue);
      }
    }

    // Check limitations
    if (this.rules.limitations) {
      const limitationsIssue = this.validateLimitations(content, language);
      if (limitationsIssue) {
        warnings.push(limitationsIssue);
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
          'résumé',
          'diagnostics',
          'date de consolidation',
          'soins nécessaires',
          'déficience permanente',
          'limitations',
          'évaluation'
        ]
      : [
          'summary',
          'diagnoses',
          'consolidation date',
          'necessary care',
          'permanent impairment',
          'limitations',
          'assessment'
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
   * Validate that source tags are present for critical information
   */
  private validateSourceTags(content: string, language: 'fr' | 'en'): string | null {
    const sourceTagPattern = /\(source\s*:\s*s\d+\)/gi;
    const sourceTags = content.match(sourceTagPattern);
    
    if (!sourceTags || sourceTags.length === 0) {
      return language === 'fr'
        ? "Des balises de source sont requises pour les informations critiques (ex: '(source: S7)')."
        : "Source tags are required for critical information (e.g., '(source: S7)').";
    }

    // Check for specific critical sections that need source tags
    const criticalSections = language === 'fr'
      ? [
          'diagnostics',
          'date de consolidation',
          'déficience permanente',
          'limitations'
        ]
      : [
          'diagnoses',
          'consolidation date',
          'permanent impairment',
          'limitations'
        ];

    const missingSourceTags: string[] = [];
    
    for (const section of criticalSections) {
      const sectionPattern = new RegExp(section, 'i');
      const sectionMatch = content.match(sectionPattern);
      
      if (sectionMatch) {
        // Check if this section has source tags nearby
        const sectionIndex = content.toLowerCase().indexOf(section);
        const nearbyText = content.substring(sectionIndex, sectionIndex + 200);
        const hasSourceTag = sourceTagPattern.test(nearbyText);
        
        if (!hasSourceTag) {
          missingSourceTags.push(section);
        }
      }
    }

    if (missingSourceTags.length > 0) {
      return language === 'fr'
        ? `Sections sans balises de source: ${missingSourceTags.join(', ')}`
        : `Sections without source tags: ${missingSourceTags.join(', ')}`;
    }

    return null;
  }

  /**
   * Validate that no new information is invented beyond sources
   */
  private validateNoInvention(content: string, language: 'fr' | 'en'): string | null {
    const inventionPatterns = language === 'fr'
      ? [
          /selon mon évaluation/i,
          /je recommande/i,
          /il est probable que/i,
          /nous suggérons/i,
          /il serait approprié/i
        ]
      : [
          /according to my assessment/i,
          /i recommend/i,
          /it is likely that/i,
          /we suggest/i,
          /it would be appropriate/i
        ];

    const inventionMatches: string[] = [];
    
    for (const pattern of inventionPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        inventionMatches.push(...matches);
      }
    }

    if (inventionMatches.length > 0) {
      return language === 'fr'
        ? `Évitez d'inventer des informations: ${inventionMatches.slice(0, 3).join(', ')}`
        : `Avoid inventing information: ${inventionMatches.slice(0, 3).join(', ')}`;
    }

    return null;
  }

  /**
   * Validate consolidation date format
   */
  private validateConsolidationDate(content: string, language: 'fr' | 'en'): string | null {
    const consolidationPattern = language === 'fr'
      ? /date\s+de\s+consolidation[:\-]?\s*([^.\n]+)/gi
      : /consolidation\s+date[:\-]?\s*([^.\n]+)/gi;

    const consolidationMatches = content.match(consolidationPattern);
    
    if (consolidationMatches) {
      for (const match of consolidationMatches) {
        const dateMatch = match.match(/(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/);
        const notSpecifiedMatch = match.match(/(non\s+précisée|not\s+specified)/i);
        
        if (!dateMatch && !notSpecifiedMatch) {
          return language === 'fr'
            ? `Format de date de consolidation incorrect: ${match}. Utilisez une date ou 'non précisée au dossier'.`
            : `Incorrect consolidation date format: ${match}. Use a date or 'not specified in the file'.`;
        }
      }
    }

    return null;
  }

  /**
   * Validate permanent impairment section
   */
  private validatePermanentImpairment(content: string, language: 'fr' | 'en'): string | null {
    const impairmentPattern = language === 'fr'
      ? /déficience\s+permanente[:\-]?\s*([^.\n]+)/gi
      : /permanent\s+impairment[:\-]?\s*([^.\n]+)/gi;

    const impairmentMatches = content.match(impairmentPattern);
    
    if (impairmentMatches) {
      for (const match of impairmentMatches) {
        // Check if impairment has source tag
        const hasSourceTag = /\(source\s*:\s*s\d+\)/i.test(match);
        
        if (!hasSourceTag) {
          return language === 'fr'
            ? "La déficience permanente doit avoir une balise de source."
            : "Permanent impairment must have a source tag.";
        }
      }
    }

    return null;
  }

  /**
   * Validate limitations section
   */
  private validateLimitations(content: string, language: 'fr' | 'en'): string | null {
    const limitationsPattern = language === 'fr'
      ? /limitations[:\-]?\s*([^.\n]+)/gi
      : /limitations[:\-]?\s*([^.\n]+)/gi;

    const limitationsMatches = content.match(limitationsPattern);
    
    if (limitationsMatches) {
      for (const match of limitationsMatches) {
        // Check if limitations have source tag
        const hasSourceTag = /\(source\s*:\s*s\d+\)/i.test(match);
        
        if (!hasSourceTag) {
          return language === 'fr'
            ? "Les limitations doivent avoir une balise de source."
            : "Limitations must have a source tag.";
        }
      }
    }

    return null;
  }

  /**
   * Get validation rules
   */
  getRules(): Section11ValidationRules {
    return { ...this.rules };
  }

  /**
   * Update validation rules
   */
  updateRules(newRules: Partial<Section11ValidationRules>): void {
    this.rules = { ...this.rules, ...newRules };
  }
}
