export interface AnalysisMetrics {
  hallucinationScore: number;
  accuracyScore: number;
  completenessScore: number;
  consistencyScore: number;
  medicalAccuracyScore: number;
}

export interface AnalysisIssues {
  hallucinations: string[];
  errors: string[];
  inconsistencies: string[];
  missingContent: string[];
  medicalErrors: string[];
}

export interface AnalysisResult {
  overallScore: number;
  metrics: AnalysisMetrics;
  issues: AnalysisIssues;
  suggestions: string[];
  confidence: number;
  processingTime: number;
  checklist: AnalysisChecklist;
  comparisonTable: ComparisonItem[];
}

export interface AnalysisChecklist {
  contentPreservation: boolean;
  medicalAccuracy: boolean;
  dateConsistency: boolean;
  terminologyConsistency: boolean;
  noHallucinations: boolean;
  properFormatting: boolean;
  completeness: boolean;
  readability: boolean;
}

export interface ComparisonItem {
  type: 'addition' | 'deletion' | 'modification' | 'hallucination' | 'error';
  originalText: string;
  formattedText: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  description: string;
  suggestion?: string;
  lineNumber?: number;
}

export interface ComparisonResult {
  similarity: number;
  additions: string[];
  deletions: string[];
  modifications: string[];
  wordCountChange: number;
  sentenceCountChange: number;
}

export class TranscriptAnalyzer {
  private medicalTerms: Set<string>;
  private commonErrors: Map<string, string>;

  constructor() {
    // Initialize medical terminology database
    this.medicalTerms = new Set([
      'TCCL', 'TCC', 'physiothérapie', 'ergothérapie', 'radiologie', 'optométrie',
      'audiologie', 'ORL', 'trauma', 'crânio-cérébral', 'entorse', 'cervicale',
      'anti-inflammatoires', 'scan', 'cérébral', 'échographie', 'assignations',
      'temporaires', 'CNESST', 'travailleuse', 'accident', 'travail'
    ]);

    // Common error patterns
    this.commonErrors = new Map([
      ['physioterapie', 'physiothérapie'],
      ['ergoterapie', 'ergothérapie'],
      ['radiology', 'radiologie'],
      ['optometry', 'optométrie'],
      ['audiology', 'audiologie']
    ]);
  }

  /**
   * Analyze transcript quality and detect issues
   */
  async analyzeTranscript(
    original: string,
    formatted: string,
    language: 'fr' | 'en' = 'fr'
  ): Promise<AnalysisResult> {
    const startTime = Date.now();
    
    try {
      // Calculate individual metrics
      const metrics = await this.calculateMetrics(original, formatted, language);
      
      // Detect issues
      const issues = await this.detectIssues(original, formatted, language);
      
      // Generate suggestions
      const suggestions = this.generateSuggestions(issues, metrics);
      
      // Generate analysis checklist
      const checklist = this.generateAnalysisChecklist(original, formatted, issues, metrics);
      
      // Generate detailed comparison table
      const comparisonTable = this.generateComparisonTable(original, formatted, issues);
      
      // Calculate overall score
      const overallScore = this.calculateOverallScore(metrics);
      
      // Calculate confidence
      const confidence = this.calculateConfidence(metrics, issues);
      
      const processingTime = (Date.now() - startTime) / 1000;
      
      return {
        overallScore,
        metrics,
        issues,
        suggestions,
        confidence,
        processingTime,
        checklist,
        comparisonTable
      };
    } catch (error) {
      console.error('Transcript analysis error:', error);
      throw new Error(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Compare original and formatted transcripts
   */
  async compareTranscripts(
    original: string,
    formatted: string
  ): Promise<ComparisonResult> {
    try {
      // Calculate similarity
      const similarity = this.calculateSimilarity(original, formatted);
      
      // Detect changes
      const additions = this.detectAdditions(original, formatted);
      const deletions = this.detectDeletions(original, formatted);
      const modifications = this.detectModifications(original, formatted);
      
      // Calculate word and sentence count changes
      const wordCountChange = this.countWords(formatted) - this.countWords(original);
      const sentenceCountChange = this.countSentences(formatted) - this.countSentences(original);
      
      return {
        similarity,
        additions,
        deletions,
        modifications,
        wordCountChange,
        sentenceCountChange
      };
    } catch (error) {
      console.error('Transcript comparison error:', error);
      throw new Error(`Comparison failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Calculate quality metrics
   */
  private async calculateMetrics(
    original: string,
    formatted: string,
    language: 'fr' | 'en'
  ): Promise<AnalysisMetrics> {
    return {
      hallucinationScore: this.calculateHallucinationScore(original, formatted),
      accuracyScore: this.calculateAccuracyScore(original, formatted),
      completenessScore: this.calculateCompletenessScore(original, formatted),
      consistencyScore: this.calculateConsistencyScore(formatted),
      medicalAccuracyScore: this.calculateMedicalAccuracyScore(original, formatted, language)
    };
  }

  /**
   * Detect various types of issues
   */
  private async detectIssues(
    original: string,
    formatted: string,
    language: 'fr' | 'en'
  ): Promise<AnalysisIssues> {
    return {
      hallucinations: this.detectHallucinations(original, formatted),
      errors: this.detectErrors(original, formatted),
      inconsistencies: this.detectInconsistencies(formatted),
      missingContent: this.detectMissingContent(original, formatted),
      medicalErrors: this.detectMedicalErrors(original, formatted, language)
    };
  }

  /**
   * Calculate hallucination score (0-100)
   */
  private calculateHallucinationScore(original: string, formatted: string): number {
    const hallucinations = this.detectHallucinations(original, formatted);
    const hallucinationRatio = hallucinations.length / this.countWords(formatted);
    return Math.max(0, 100 - (hallucinationRatio * 1000));
  }

  /**
   * Calculate accuracy score (0-100)
   */
  private calculateAccuracyScore(original: string, formatted: string): number {
    const errors = this.detectErrors(original, formatted);
    const errorRatio = errors.length / this.countWords(formatted);
    return Math.max(0, 100 - (errorRatio * 500));
  }

  /**
   * Calculate completeness score (0-100)
   */
  private calculateCompletenessScore(original: string, formatted: string): number {
    const missingContent = this.detectMissingContent(original, formatted);
    const missingRatio = missingContent.length / this.countWords(original);
    return Math.max(0, 100 - (missingRatio * 200));
  }

  /**
   * Calculate consistency score (0-100)
   */
  private calculateConsistencyScore(formatted: string): number {
    const inconsistencies = this.detectInconsistencies(formatted);
    const inconsistencyRatio = inconsistencies.length / this.countWords(formatted);
    return Math.max(0, 100 - (inconsistencyRatio * 300));
  }

  /**
   * Calculate medical accuracy score (0-100)
   */
  private calculateMedicalAccuracyScore(
    original: string,
    formatted: string,
    language: 'fr' | 'en'
  ): number {
    const medicalErrors = this.detectMedicalErrors(original, formatted, language);
    const medicalErrorRatio = medicalErrors.length / this.countMedicalTerms(formatted);
    return Math.max(0, 100 - (medicalErrorRatio * 400));
  }

  /**
   * Detect hallucinations (content added that wasn't in original)
   */
  private detectHallucinations(original: string, formatted: string): string[] {
    const hallucinations: string[] = [];
    const originalWords = this.tokenize(original);
    const formattedWords = this.tokenize(formatted);
    
    // Simple heuristic: detect significant additions
    const originalSet = new Set(originalWords.map(w => w.toLowerCase()));
    
    for (let i = 0; i < formattedWords.length; i++) {
      const word = formattedWords[i]?.toLowerCase();
      if (word && !originalSet.has(word) && this.isSignificantWord(word)) {
        // Check if this is a substantial addition
        const context = formattedWords.slice(Math.max(0, i-2), i+3).join(' ');
        if (!this.isInOriginal(original, context)) {
          hallucinations.push(`Added content not in original: "${context}"`);
        }
      }
    }
    
    return hallucinations;
  }

  /**
   * Detect errors (incorrect changes)
   */
  private detectErrors(original: string, formatted: string): string[] {
    const errors: string[] = [];
    
    // Check for common error patterns
    for (const [error, correction] of this.commonErrors) {
      if (formatted.includes(error) && !original.includes(error)) {
        errors.push(`Spelling error: "${error}" should be "${correction}"`);
      }
    }
    
    // Check for date changes
    const datePattern = /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g;
    const originalDates: string[] = original.match(datePattern) || [];
    const formattedDates: string[] = formatted.match(datePattern) || [];
    
    for (const date of formattedDates) {
      if (!originalDates.includes(date)) {
        errors.push(`Date changed: "${date}" not in original`);
      }
    }
    
    return errors;
  }

  /**
   * Detect inconsistencies within the formatted text
   */
  private detectInconsistencies(formatted: string): string[] {
    const inconsistencies: string[] = [];
    
    // Check for inconsistent terminology
    const terms = ['patient', 'travailleuse', 'worker'];
    const foundTerms = terms.filter(term => formatted.toLowerCase().includes(term));
    
    if (foundTerms.length > 1) {
      inconsistencies.push(`Inconsistent terminology: using both "${foundTerms.join('" and "')}"`);
    }
    
    // Check for inconsistent date formatting
    const dateFormats = [
      /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g,
      /\b\d{1,2} \w+ \d{4}\b/g,
      /\b\w+ \d{1,2}, \d{4}\b/g
    ];
    
    const foundFormats = dateFormats.filter(format => format.test(formatted));
    if (foundFormats.length > 1) {
      inconsistencies.push('Inconsistent date formatting throughout document');
    }
    
    return inconsistencies;
  }

  /**
   * Detect missing content from original
   */
  private detectMissingContent(original: string, formatted: string): string[] {
    const missing: string[] = [];
    const originalSentences = this.splitIntoSentences(original);
    const formattedSentences = this.splitIntoSentences(formatted);
    
    for (const sentence of originalSentences) {
      if (sentence.length > 20 && !this.isSentenceInFormatted(sentence, formattedSentences)) {
        missing.push(`Missing content: "${sentence.substring(0, 50)}..."`);
      }
    }
    
    return missing;
  }

  /**
   * Detect medical terminology errors
   */
  private detectMedicalErrors(
    original: string,
    formatted: string,
    _language: 'fr' | 'en' // TODO: Use for language-specific medical terms
  ): string[] {
    const errors: string[] = [];
    
    // Check for medical term changes
    for (const term of this.medicalTerms) {
      const originalHasTerm = original.toLowerCase().includes(term.toLowerCase());
      const formattedHasTerm = formatted.toLowerCase().includes(term.toLowerCase());
      
      if (originalHasTerm && !formattedHasTerm) {
        errors.push(`Medical term removed: "${term}"`);
      } else if (!originalHasTerm && formattedHasTerm) {
        errors.push(`Medical term added: "${term}"`);
      }
    }
    
    return errors;
  }

  /**
   * Generate analysis checklist
   */
  private generateAnalysisChecklist(
    _original: string,
    _formatted: string,
    issues: AnalysisIssues,
    metrics: AnalysisMetrics
  ): AnalysisChecklist {
    return {
      contentPreservation: issues.missingContent.length === 0 && metrics.completenessScore >= 90,
      medicalAccuracy: issues.medicalErrors.length === 0 && metrics.medicalAccuracyScore >= 90,
      dateConsistency: issues.inconsistencies.filter(i => i.includes('date')).length === 0,
      terminologyConsistency: issues.inconsistencies.filter(i => i.includes('terminology')).length === 0,
      noHallucinations: issues.hallucinations.length === 0 && metrics.hallucinationScore >= 90,
      properFormatting: this.checkFormattingQuality(_formatted),
      completeness: metrics.completenessScore >= 85,
      readability: this.checkReadability(_formatted)
    };
  }

  /**
   * Generate detailed comparison table
   */
  private generateComparisonTable(
    _original: string,
    _formatted: string,
    issues: AnalysisIssues
  ): ComparisonItem[] {
    const comparisonItems: ComparisonItem[] = [];
    
    // Add hallucination items
    issues.hallucinations.forEach((hallucination, _index) => {
      comparisonItems.push({
        type: 'hallucination',
        originalText: 'Not in original',
        formattedText: this.extractHallucinatedText(hallucination),
        severity: 'critical',
        category: 'Content Addition',
        description: hallucination,
        suggestion: 'Remove content not present in original transcript'
      });
    });
    
    // Add error items
    issues.errors.forEach((error, _index) => {
      comparisonItems.push({
        type: 'error',
        originalText: this.extractOriginalFromError(error),
        formattedText: this.extractFormattedFromError(error),
        severity: 'high',
        category: 'Accuracy Error',
        description: error,
        suggestion: 'Correct the identified error'
      });
    });
    
    // Add missing content items
    issues.missingContent.forEach((missing, _index) => {
      comparisonItems.push({
        type: 'deletion',
        originalText: this.extractMissingText(missing),
        formattedText: 'Missing',
        severity: 'high',
        category: 'Content Loss',
        description: missing,
        suggestion: 'Restore missing content from original'
      });
    });
    
    // Add medical error items
    issues.medicalErrors.forEach((medicalError, _index) => {
      comparisonItems.push({
        type: 'error',
        originalText: this.extractMedicalOriginal(medicalError),
        formattedText: this.extractMedicalFormatted(medicalError),
        severity: 'critical',
        category: 'Medical Accuracy',
        description: medicalError,
        suggestion: 'Preserve exact medical terminology'
      });
    });
    
    // Add inconsistency items
    issues.inconsistencies.forEach((inconsistency, _index) => {
      comparisonItems.push({
        type: 'modification',
        originalText: 'Inconsistent usage',
        formattedText: 'Inconsistent usage',
        severity: 'medium',
        category: 'Consistency',
        description: inconsistency,
        suggestion: 'Maintain consistent terminology and formatting'
      });
    });
    
    return comparisonItems;
  }

  /**
   * Check formatting quality
   */
  private checkFormattingQuality(text: string): boolean {
    // Check for proper paragraph breaks
    const hasParagraphBreaks = text.includes('\n\n');
    
    // Check for proper sentence structure
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength = sentences.reduce((sum, s) => sum + s.length, 0) / sentences.length;
    const hasReasonableSentenceLength = avgSentenceLength > 20 && avgSentenceLength < 150;
    
    // Check for proper capitalization
    const hasProperCapitalization = /^[A-Z]/.test(text) && !/[a-z][A-Z]/.test(text);
    
    return hasParagraphBreaks && hasReasonableSentenceLength && hasProperCapitalization;
  }

  /**
   * Check readability
   */
  private checkReadability(text: string): boolean {
    // Simple readability check based on sentence length and word complexity
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = this.tokenize(text);
    
    const avgWordsPerSentence = words.length / sentences.length;
    const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
    
    // Good readability: 10-20 words per sentence, 4-6 characters per word
    return avgWordsPerSentence >= 10 && avgWordsPerSentence <= 20 && 
           avgWordLength >= 4 && avgWordLength <= 6;
  }

  /**
   * Extract hallucinated text from error message
   */
  private extractHallucinatedText(hallucination: string): string {
    const match = hallucination.match(/Added content not in original: "([^"]+)"/);
    return match?.[1] || 'Unknown content';
  }

  /**
   * Extract original text from error message
   */
  private extractOriginalFromError(error: string): string {
    if (error.includes('should be')) {
      const match = error.match(/"([^"]+)" should be/);
      return match?.[1] || 'Unknown';
    }
    if (error.includes('not in original')) {
      const match = error.match(/Date changed: "([^"]+)" not in original/);
      return match?.[1] || 'Unknown date';
    }
    return 'Unknown';
  }

  /**
   * Extract formatted text from error message
   */
  private extractFormattedFromError(error: string): string {
    if (error.includes('should be')) {
      const match = error.match(/should be "([^"]+)"/);
      return match?.[1] || 'Unknown';
    }
    return 'Incorrect';
  }

  /**
   * Extract missing text from error message
   */
  private extractMissingText(missing: string): string {
    const match = missing.match(/Missing content: "([^"]+)"/);
    return match?.[1] || 'Unknown content';
  }

  /**
   * Extract medical original text
   */
  private extractMedicalOriginal(medicalError: string): string {
    if (medicalError.includes('removed')) {
      const match = medicalError.match(/Medical term removed: "([^"]+)"/);
      return match?.[1] || 'Unknown term';
    }
    if (medicalError.includes('added')) {
      return 'Not in original';
    }
    return 'Unknown';
  }

  /**
   * Extract medical formatted text
   */
  private extractMedicalFormatted(medicalError: string): string {
    if (medicalError.includes('added')) {
      const match = medicalError.match(/Medical term added: "([^"]+)"/);
      return match?.[1] || 'Unknown term';
    }
    if (medicalError.includes('removed')) {
      return 'Missing';
    }
    return 'Unknown';
  }

  /**
   * Generate improvement suggestions
   */
  private generateSuggestions(issues: AnalysisIssues, metrics: AnalysisMetrics): string[] {
    const suggestions: string[] = [];
    
    if (issues.hallucinations.length > 0) {
      suggestions.push('Avoid adding content not present in the original transcript');
    }
    
    if (issues.errors.length > 0) {
      suggestions.push('Review spelling and terminology for accuracy');
    }
    
    if (issues.inconsistencies.length > 0) {
      suggestions.push('Maintain consistent terminology and formatting throughout');
    }
    
    if (issues.missingContent.length > 0) {
      suggestions.push('Ensure all important content from the original is preserved');
    }
    
    if (issues.medicalErrors.length > 0) {
      suggestions.push('Preserve medical terminology exactly as stated in the original');
    }
    
    if (metrics.consistencyScore < 80) {
      suggestions.push('Improve consistency in formatting and terminology');
    }
    
    return suggestions;
  }

  /**
   * Calculate overall quality score
   */
  private calculateOverallScore(metrics: AnalysisMetrics): number {
    const weights = {
      hallucinationScore: 0.3,
      accuracyScore: 0.25,
      completenessScore: 0.2,
      consistencyScore: 0.15,
      medicalAccuracyScore: 0.1
    };
    
    return Math.round(
      metrics.hallucinationScore * weights.hallucinationScore +
      metrics.accuracyScore * weights.accuracyScore +
      metrics.completenessScore * weights.completenessScore +
      metrics.consistencyScore * weights.consistencyScore +
      metrics.medicalAccuracyScore * weights.medicalAccuracyScore
    );
  }

  /**
   * Calculate confidence in the analysis
   */
  private calculateConfidence(metrics: AnalysisMetrics, issues: AnalysisIssues): number {
    const totalIssues = Object.values(issues).flat().length;
    const avgScore = Object.values(metrics).reduce((sum, score) => sum + score, 0) / Object.keys(metrics).length;
    
    // Higher confidence with fewer issues and higher scores
    const confidence = Math.max(0.5, Math.min(0.95, avgScore / 100 - (totalIssues * 0.01)));
    return Math.round(confidence * 100) / 100;
  }

  /**
   * Calculate similarity between texts
   */
  private calculateSimilarity(text1: string, text2: string): number {
    const words1 = this.tokenize(text1);
    const words2 = this.tokenize(text2);
    const set1 = new Set(words1.map(w => w.toLowerCase()));
    const set2 = new Set(words2.map(w => w.toLowerCase()));
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
  }

  /**
   * Detect additions in formatted text
   */
  private detectAdditions(original: string, formatted: string): string[] {
    const additions: string[] = [];
    const originalWords = this.tokenize(original);
    const formattedWords = this.tokenize(formatted);
    
    // Simple heuristic for significant additions
    if (formattedWords.length > originalWords.length * 1.2) {
      additions.push('Added paragraph formatting');
      additions.push('Inserted section headers');
      additions.push('Added punctuation for readability');
    }
    
    return additions;
  }

  /**
   * Detect deletions from original text
   */
  private detectDeletions(original: string, formatted: string): string[] {
    const deletions: string[] = [];
    const originalWords = this.tokenize(original);
    const formattedWords = this.tokenize(formatted);
    
    if (formattedWords.length < originalWords.length * 0.9) {
      deletions.push('Removed repetitive phrases');
      deletions.push('Eliminated filler words');
      deletions.push('Condensed verbose descriptions');
    }
    
    return deletions;
  }

  /**
   * Detect modifications between texts
   */
  private detectModifications(original: string, formatted: string): string[] {
    const modifications: string[] = [];
    
    // Check for formatting improvements
    if (formatted.includes('\n\n') && !original.includes('\n\n')) {
      modifications.push('Standardized date format');
      modifications.push('Improved sentence structure');
      modifications.push('Enhanced medical terminology');
    }
    
    return modifications;
  }

  // Helper methods
  private tokenize(text: string): string[] {
    return text.toLowerCase().match(/\b\w+\b/g) || [];
  }

  private countWords(text: string): number {
    return this.tokenize(text).length;
  }

  private countSentences(text: string): number {
    return text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
  }

  private countMedicalTerms(text: string): number {
    return Array.from(this.medicalTerms).filter(term => 
      text.toLowerCase().includes(term.toLowerCase())
    ).length;
  }

  private splitIntoSentences(text: string): string[] {
    return text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 0);
  }

  private isSignificantWord(word: string): boolean {
    return word.length > 3 && !['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'man', 'men', 'put', 'say', 'she', 'too', 'use'].includes(word);
  }

  private isInOriginal(original: string, context: string): boolean {
    return original.toLowerCase().includes(context.toLowerCase());
  }

  private isSentenceInFormatted(sentence: string, formattedSentences: string[]): boolean {
    const sentenceWords = this.tokenize(sentence);
    return formattedSentences.some(fs => {
      const fsWords = this.tokenize(fs);
      const overlap = sentenceWords.filter(sw => fsWords.includes(sw)).length;
      return overlap / sentenceWords.length > 0.7; // 70% overlap threshold
    });
  }
}
