export interface Section7ValidationResult {
  isValid: boolean;
  issues: string[];
  warnings: string[];
  critical_issues: string[];
}

export interface Section7ValidationRules {
  worker_first: boolean;
  no_date_first: boolean;
  doctor_title_required: boolean;
  no_repetition_blocks: boolean;
  verb_variety: boolean;
  citation_handling: boolean;
}

export class Section7Validator {
  private rules: Section7ValidationRules;

  constructor() {
    this.rules = {
      worker_first: true,
      no_date_first: true,
      doctor_title_required: true,
      no_repetition_blocks: true,
      verb_variety: true,
      citation_handling: true
    };
  }

  /**
   * Validate Section 7 content according to CNESST requirements
   */
  validate(content: string, language: 'fr' | 'en'): Section7ValidationResult {
    // const issues: string[] = [];
    const warnings: string[] = [];
    const critical_issues: string[] = [];

    // Check worker-first rule
    if (this.rules.worker_first) {
      const workerFirstIssue = this.validateWorkerFirst(content, language);
      if (workerFirstIssue) {
        critical_issues.push(workerFirstIssue);
      }
    }

    // Check no date first rule
    if (this.rules.no_date_first) {
      const dateFirstIssue = this.validateNoDateFirst(content, language);
      if (dateFirstIssue) {
        critical_issues.push(dateFirstIssue);
      }
    }

    // Check doctor title requirement
    if (this.rules.doctor_title_required) {
      const doctorTitleIssue = this.validateDoctorTitle(content, language);
      if (doctorTitleIssue) {
        warnings.push(doctorTitleIssue);
      }
    }

    // Check for repetition blocks
    if (this.rules.no_repetition_blocks) {
      const repetitionIssue = this.validateNoRepetition(content);
      if (repetitionIssue) {
        warnings.push(repetitionIssue);
      }
    }

    // Check verb variety
    if (this.rules.verb_variety) {
      const verbVarietyIssue = this.validateVerbVariety(content, language);
      if (verbVarietyIssue) {
        warnings.push(verbVarietyIssue);
      }
    }

    // Check citation handling
    if (this.rules.citation_handling) {
      const citationIssue = this.validateCitationHandling(content, language);
      if (citationIssue) {
        warnings.push(citationIssue);
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
   * Validate that content starts with worker reference, not date
   */
  private validateWorkerFirst(content: string, language: 'fr' | 'en'): string | null {
    const firstSentence = content.split(/[.!?]/)[0]?.trim();
    if (!firstSentence) return null;

    const datePattern = /^\s*\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/;
    const workerPattern = language === 'fr' 
      ? /^(le\s+)?travailleur|(la\s+)?travailleuse/i
      : /^(the\s+)?worker/i;

    if (datePattern.test(firstSentence)) {
      return language === 'fr' 
        ? "La phrase ne doit pas commencer par une date. Commencez par 'Le travailleur' ou 'La travailleuse'."
        : "Sentence should not start with a date. Start with 'The worker'.";
    }

    if (!workerPattern.test(firstSentence)) {
      return language === 'fr'
        ? "La phrase doit commencer par 'Le travailleur' ou 'La travailleuse'."
        : "Sentence should start with 'The worker'.";
    }

    return null;
  }

  /**
   * Validate that dates are not at the beginning of sentences
   */
  private validateNoDateFirst(content: string, language: 'fr' | 'en'): string | null {
    const sentences = content.split(/[.!?]/);
    const dateFirstSentences: string[] = [];

    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      if (!trimmed) continue;

      const datePattern = /^\s*\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/;
      if (datePattern.test(trimmed)) {
        dateFirstSentences.push(trimmed);
      }
    }

    if (dateFirstSentences.length > 0) {
      return language === 'fr'
        ? `Les phrases suivantes commencent par une date: ${dateFirstSentences.slice(0, 3).join(', ')}`
        : `The following sentences start with a date: ${dateFirstSentences.slice(0, 3).join(', ')}`;
    }

    return null;
  }

  /**
   * Validate that doctor titles are properly formatted
   */
  private validateDoctorTitle(content: string, language: 'fr' | 'en'): string | null {
    const doctorPattern = language === 'fr'
      ? /docteur|dr\.|dr\s/i
      : /doctor|dr\.|dr\s/i;

    const fullNamePattern = language === 'fr'
      ? /docteur\s+[A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞ][a-zàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþ]+\s+[A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞ][a-zàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþ]+/i
      : /doctor\s+[A-Z][a-z]+\s+[A-Z][a-z]+/i;

    const doctorMatches = content.match(doctorPattern);
    const fullNameMatches = content.match(fullNamePattern);

    if (doctorMatches && !fullNameMatches) {
      return language === 'fr'
        ? "Les références au docteur devraient inclure le nom complet (ex: 'docteur Jean Dupont')."
        : "Doctor references should include full name (e.g., 'doctor John Smith').";
    }

    return null;
  }

  /**
   * Validate that there are no excessive repetition blocks
   */
  private validateNoRepetition(content: string): string | null {
    const words = content.toLowerCase().split(/\s+/);
    const wordCounts = new Map<string, number>();

    // Count word frequencies
    for (const word of words) {
      if (word.length > 3) { // Only count words longer than 3 characters
        wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
      }
    }

    // Check for excessive repetition
    const totalWords = words.length;
    const repetitionIssues: string[] = [];

    for (const [word, count] of wordCounts) {
      const percentage = (count / totalWords) * 100;
      if (percentage > 5) { // More than 5% repetition
        repetitionIssues.push(`${word} (${count} fois, ${percentage.toFixed(1)}%)`);
      }
    }

    if (repetitionIssues.length > 0) {
      return `Mots répétés excessivement: ${repetitionIssues.slice(0, 3).join(', ')}`;
    }

    return null;
  }

  /**
   * Validate verb variety in the content
   */
  private validateVerbVariety(content: string, language: 'fr' | 'en'): string | null {
    const commonVerbs = language === 'fr'
      ? ['consulte', 'revoit', 'examine', 'évalue', 'diagnostique', 'traite', 'prescrit']
      : ['consults', 'reviews', 'examines', 'evaluates', 'diagnoses', 'treats', 'prescribes'];

    const verbCounts = new Map<string, number>();
    
    for (const verb of commonVerbs) {
      const regex = new RegExp(`\\b${verb}\\b`, 'gi');
      const matches = content.match(regex);
      if (matches) {
        verbCounts.set(verb, matches.length);
      }
    }

    // Check if any verb is used more than 3 times
    const overusedVerbs: string[] = [];
    for (const [verb, count] of verbCounts) {
      if (count > 3) {
        overusedVerbs.push(`${verb} (${count} fois)`);
      }
    }

    if (overusedVerbs.length > 0) {
      return language === 'fr'
        ? `Verbes surutilisés: ${overusedVerbs.join(', ')}. Variez les verbes.`
        : `Overused verbs: ${overusedVerbs.join(', ')}. Vary your verbs.`;
    }

    return null;
  }

  /**
   * Validate citation handling
   */
  private validateCitationHandling(content: string, language: 'fr' | 'en'): string | null {
    const citationPattern = language === 'fr'
      ? /"[^"]*"/g
      : /"[^"]*"/g;

    const citations = content.match(citationPattern);
    
    if (citations && citations.length > 0) {
      // Check if citations are properly attributed
      const attributionPattern = language === 'fr'
        ? /(selon|d'après|selon le patient|le patient dit|il dit|elle dit)/i
        : /(according to|the patient says|he says|she says)/i;

      const hasAttribution = attributionPattern.test(content);
      
      if (!hasAttribution) {
        return language === 'fr'
          ? "Les citations devraient être attribuées (ex: 'selon le patient', 'il dit')."
          : "Citations should be attributed (e.g., 'according to the patient', 'he says').";
      }
    }

    return null;
  }

  /**
   * Get validation rules
   */
  getRules(): Section7ValidationRules {
    return { ...this.rules };
  }

  /**
   * Update validation rules
   */
  updateRules(newRules: Partial<Section7ValidationRules>): void {
    this.rules = { ...this.rules, ...newRules };
  }
}
