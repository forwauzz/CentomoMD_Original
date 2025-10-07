// Text protection constants
const VERBATIM_START = '___VERBATIM_START___';
const VERBATIM_END = '___VERBATIM_END___';

export interface Mode1FormattingOptions {
  language: 'fr' | 'en';
  quote_style: 'smart' | 'straight';
  radiology_mode: boolean;
  preserve_verbatim: boolean;
}

export interface Mode1FormattingResult {
  formatted: string;
  issues: string[];
  verbatim_blocks: Array<{
    start: number;
    end: number;
    content: string;
    type: 'basic' | 'radiology' | 'quotes' | 'technical' | 'lab' | 'diagnosis' | 'prescription';
  }>;
}

export class Mode1Formatter {
  private verbatimState: {
    isOpen: boolean;
    customOpen: string | null;
    blocks: Array<{ start: number; end: number; content: string; type: 'basic' | 'radiology' | 'quotes' | 'technical' | 'lab' | 'diagnosis' | 'prescription' }>;
  } = {
    isOpen: false,
    customOpen: null,
    blocks: []
  };

  /**
   * Format transcript using deterministic Mode 1 processing
   * Handles voice commands, verbatim protection, and basic punctuation
   */
  format(transcript: string, options: Mode1FormattingOptions): Mode1FormattingResult {
    const issues: string[] = [];
    let formatted = transcript;

    // Reset verbatim state for new formatting
    this.verbatimState = {
      isOpen: false,
      customOpen: null,
      blocks: []
    };

    // Step 1: Process verbatim blocks and voice commands
    formatted = this.processVerbatimBlocks(formatted, options);
    
    // Step 2: Apply basic punctuation rules
    formatted = this.applyPunctuationRules(formatted, options);
    
    // Step 3: Handle special formatting for radiology mode
    if (options.radiology_mode) {
      formatted = this.applyRadiologyFormatting(formatted);
    }
    
    // Step 4: Clean up and finalize
    formatted = this.finalizeFormatting(formatted, options);

    return {
      formatted,
      issues,
      verbatim_blocks: this.verbatimState.blocks
    };
  }

  /**
   * Process verbatim blocks and voice commands
   */
  private processVerbatimBlocks(text: string, options: Mode1FormattingOptions): string {
    const lines = text.split('\n');
    const processedLines: string[] = [];
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Check for verbatim commands
      const verbatimCmd = this.detectVerbatimCommand(trimmedLine, options.language);
      
      if (verbatimCmd) {
        // Handle verbatim command
        if (verbatimCmd.kind === 'open') {
          this.verbatimState.isOpen = true;
          processedLines.push(''); // Remove command from output
        } else if (verbatimCmd.kind === 'close') {
          this.verbatimState.isOpen = false;
          processedLines.push(''); // Remove command from output
        } else if (verbatimCmd.kind === 'customOpen') {
          this.verbatimState.customOpen = verbatimCmd.key || null;
          processedLines.push(''); // Remove command from output
        } else if (verbatimCmd.kind === 'customClose') {
          this.verbatimState.customOpen = null;
          processedLines.push(''); // Remove command from output
        }
        continue;
      }
      
      // Check for other voice commands
      const coreCmd = this.detectCoreCommand(trimmedLine, options.language);
      if (coreCmd) {
        processedLines.push(this.processCoreCommand(coreCmd, options));
        continue;
      }
      
      // Process regular text
      if (this.verbatimState.isOpen || this.verbatimState.customOpen) {
        // Text is in verbatim mode - protect it
        const protectedText = this.protectVerbatimText(trimmedLine);
        processedLines.push(protectedText);
      } else {
        // Regular text - apply formatting
        processedLines.push(trimmedLine);
      }
    }
    
    return processedLines.join('\n');
  }

  /**
   * Detect verbatim commands in text
   */
  private detectVerbatimCommand(text: string, language: 'fr' | 'en'): {
    kind: 'open' | 'close' | 'customOpen' | 'customClose';
    key?: string;
  } | null {
    const normalized = this.normalizeText(text);
    
    const FR_OPEN = ['ouvrir parenthèse', 'ouvrir parenthese', 'début verbatim', 'debut verbatim', 'commencer verbatim'];
    const FR_CLOSE = ['fermer parenthèse', 'fermer parenthese', 'fin verbatim', 'terminer verbatim'];
    const EN_OPEN = ['open parenthesis', 'start verbatim'];
    const EN_CLOSE = ['close parenthesis', 'end verbatim'];
    
    const FR_CUSTOM = [
      { trigger: 'rapport radiologique', end: 'fin rapport', key: 'radiology' },
      { trigger: 'citation patient', end: 'fin citation', key: 'quotes' },
      { trigger: 'spécifications techniques', end: 'fin spécifications', key: 'technical' },
      { trigger: 'résultats laboratoire', end: 'fin résultats', key: 'lab' },
      { trigger: 'diagnostic médical', end: 'fin diagnostic', key: 'diagnosis' },
      { trigger: 'prescription exacte', end: 'fin prescription', key: 'prescription' },
    ];
    
    const EN_CUSTOM = [
      { trigger: 'radiology report', end: 'end report', key: 'radiology' },
      { trigger: 'patient quote', end: 'end quote', key: 'quotes' },
      { trigger: 'lab results', end: 'end results', key: 'lab' },
    ];
    
    if (language === 'fr') {
      if (FR_OPEN.some(cmd => normalized === this.normalizeText(cmd))) {
        return { kind: 'open' };
      }
      if (FR_CLOSE.some(cmd => normalized === this.normalizeText(cmd))) {
        return { kind: 'close' };
      }
      for (const custom of FR_CUSTOM) {
        if (normalized === this.normalizeText(custom.trigger)) {
          return { kind: 'customOpen', key: custom.key };
        }
        if (normalized === this.normalizeText(custom.end)) {
          return { kind: 'customClose', key: custom.key };
        }
      }
    } else {
      if (EN_OPEN.some(cmd => normalized === this.normalizeText(cmd))) {
        return { kind: 'open' };
      }
      if (EN_CLOSE.some(cmd => normalized === this.normalizeText(cmd))) {
        return { kind: 'close' };
      }
      for (const custom of EN_CUSTOM) {
        if (normalized === this.normalizeText(custom.trigger)) {
          return { kind: 'customOpen', key: custom.key };
        }
        if (normalized === this.normalizeText(custom.end)) {
          return { kind: 'customClose', key: custom.key };
        }
      }
    }
    
    return null;
  }

  /**
   * Detect core voice commands
   */
  private detectCoreCommand(text: string, language: 'fr' | 'en'): {
    intent: string;
    arg?: string;
  } | null {
    const normalized = this.normalizeText(text);
    
    const FR_COMMANDS = {
      paragraph: ['nouveau paragraphe', 'paragraphe'],
      pause: ['pause', 'pause transcription'],
      resume: ['reprendre', 'reprendre transcription', 'continuer'],
      clear: ['effacer', 'vider'],
      save: ['sauvegarder', 'enregistrer'],
      export: ['export', 'exporter'],
      undo: ['annuler', 'retour'],
      format: ['formatage médical', 'formatage cnesst', 'format cnesst'],
      validation: ['validation', 'valider', 'vérifier'],
      vocabulary: ['vocabulaire personnalisé', 'vocabulaire médical'],
      template: ['charger template', 'template'],
      section: /^section\s+(\d{1,2})$/
    };
    
    const EN_COMMANDS = {
      paragraph: ['new paragraph', 'paragraph'],
      pause: ['pause', 'pause transcription'],
      resume: ['resume', 'resume transcription', 'continue'],
      clear: ['clear', 'erase'],
      save: ['save'],
      export: ['export'],
      undo: ['undo', 'go back'],
      format: ['medical formatting', 'cnesst formatting', 'format cnesst'],
      validation: ['validation', 'validate', 'verify'],
      vocabulary: ['custom vocabulary', 'medical vocabulary'],
      template: ['load template', 'template'],
      section: /^section\s+(\d{1,2})$/
    };
    
    const commands = language === 'fr' ? FR_COMMANDS : EN_COMMANDS;
    
    if (commands.paragraph.includes(normalized)) return { intent: 'paragraph.break' };
    if (commands.pause.includes(normalized)) return { intent: 'stream.pause' };
    if (commands.resume.includes(normalized)) return { intent: 'stream.resume' };
    if (commands.clear.includes(normalized)) return { intent: 'buffer.clear' };
    if (commands.save.includes(normalized)) return { intent: 'doc.save' };
    if (commands.export.includes(normalized)) return { intent: 'doc.export' };
    if (commands.undo.includes(normalized)) return { intent: 'undo' };
    if (commands.format.includes(normalized)) return { intent: 'format.cnesst' };
    if (commands.validation.includes(normalized)) return { intent: 'validation' };
    if (commands.vocabulary.includes(normalized)) return { intent: 'custom.vocabulary' };
    if (commands.template.includes(normalized)) return { intent: 'template.load' };
    
    const sectionMatch = normalized.match(commands.section);
    if (sectionMatch && sectionMatch[1]) return { intent: 'section.switch', arg: sectionMatch[1] };
    
    return null;
  }

  /**
   * Process core voice commands
   */
  private processCoreCommand(cmd: { intent: string; arg?: string }, _options: Mode1FormattingOptions): string {
    switch (cmd.intent) {
      case 'paragraph.break':
        return '\n\n';
      case 'stream.pause':
        return '[PAUSE]';
      case 'stream.resume':
        return '[RESUME]';
      case 'buffer.clear':
        return '[CLEAR]';
      case 'doc.save':
        return '[SAVE]';
      case 'doc.export':
        return '[EXPORT]';
      case 'undo':
        return '[UNDO]';
      case 'format.cnesst':
        return '[CNESST_FORMAT]';
      case 'validation':
        return '[VALIDATION]';
      case 'custom.vocabulary':
        return '[CUSTOM_VOCABULARY]';
      case 'template.load':
        return '[LOAD_TEMPLATE]';
      case 'section.switch':
        return `[SECTION_${cmd.arg}]`;
      default:
        return '';
    }
  }

  /**
   * Protect verbatim text with markers
   */
  private protectVerbatimText(text: string): string {
    if (!text) return text;
    
    // const blockType = this.verbatimState.customOpen || 'basic';
    return `${VERBATIM_START} ${text} ${VERBATIM_END}`;
  }

  /**
   * Apply basic punctuation rules
   */
  private applyPunctuationRules(text: string, options: Mode1FormattingOptions): string {
    let formatted = text;
    
    // Convert speech-to-text punctuation markers
    formatted = formatted.replace(/\bcomma\b/g, ',');
    formatted = formatted.replace(/\bperiod\b/g, '.');
    formatted = formatted.replace(/\bcolon\b/g, ':');
    formatted = formatted.replace(/\bsemicolon\b/g, ';');
    formatted = formatted.replace(/\bexclamation\b/g, '!');
    formatted = formatted.replace(/\bquestion\b/g, '?');
    
    // Handle smart quotes if enabled
    if (options.quote_style === 'smart') {
      formatted = formatted.replace(/"([^"]*)"/g, '"$1"');
      formatted = formatted.replace(/'([^']*)'/g, '\u2018$1\u2019');
    }
    
    // Add periods at end of sentences if missing
    formatted = formatted.replace(/([.!?])\s*([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞ])/g, '$1 $2');
    
    // Ensure proper spacing around punctuation
    formatted = formatted.replace(/\s*([,.!?;:])\s*/g, '$1 ');
    formatted = formatted.replace(/\s+/g, ' ');
    
    return formatted.trim();
  }

  /**
   * Apply radiology-specific formatting
   */
  private applyRadiologyFormatting(text: string): string {
    // Protect radiology reports from any formatting changes
    const radiologyPattern = /rapport radiologique[\s\S]*?fin rapport/gi;
    return text.replace(radiologyPattern, (match) => {
      return `${VERBATIM_START} ${match} ${VERBATIM_END}`;
    });
  }

  /**
   * Finalize formatting
   */
  private finalizeFormatting(text: string, _options: Mode1FormattingOptions): string {
    let formatted = text;
    
    // Remove empty lines and normalize spacing
    formatted = formatted.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    // Clean up command markers
    formatted = formatted.replace(/\[(PAUSE|RESUME|CLEAR|SAVE|EXPORT|UNDO|CNESST_FORMAT|VALIDATION|CUSTOM_VOCABULARY|LOAD_TEMPLATE|SECTION_\d+)\]/g, '');
    
    // Final cleanup
    formatted = formatted.trim();
    
    return formatted;
  }

  /**
   * Normalize text for command detection
   */
  private normalizeText(text: string): string {
    return text.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
