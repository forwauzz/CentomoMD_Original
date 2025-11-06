import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { FLAGS } from '../../config/flags.js';
import { getAIProvider } from '../../lib/aiProvider.js';

// SECTION7_GUARD: Enhanced result interface with JSON contract
export interface Section7AIResult {
  formatted: string;
  ok: boolean;
  violations: string[];
  doctor_names_seen: string[];
  started_with_worker: boolean;
  chronology_ok: boolean;
  suggestions?: string[];
  issues?: string[];
  metadata?: {
    language: 'fr' | 'en';
    filesLoaded: string[];
    promptLength: number;
    processingTime: number;
    model: string;
    fallback?: boolean;
    guard_applied?: string[];
    token_usage?: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
  };
}

// SECTION7_GUARD: JSON response contract interface
interface OpenAIJSONResponse {
  ok: boolean;
  violations: string[];
  doctor_names_seen: string[];
  started_with_worker: boolean;
  chronology_ok: boolean;
  rendered_text: string;
}

// SECTION7_GUARD: Language detection and routing
export class LanguageRouter {
  static detectLanguage(content: string, explicitLang?: 'fr' | 'en'): 'fr' | 'en' {
    if (explicitLang) return explicitLang;
    
    // French indicators
    const frenchIndicators = [
      'le travailleur', 'la travailleuse', 'docteur', 'le', 'la', 'les',
      'janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
      '1er', '2e', '3e', 'physiothérapie', 'ergothérapie'
    ];
    
    // English indicators  
    const englishIndicators = [
      'the worker', 'doctor', 'dr.', 'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december',
      'physiotherapy', 'occupational therapy'
    ];
    
    const contentLower = content.toLowerCase();
    const frenchScore = frenchIndicators.reduce((score, indicator) => 
      score + (contentLower.includes(indicator) ? 1 : 0), 0);
    const englishScore = englishIndicators.reduce((score, indicator) => 
      score + (contentLower.includes(indicator) ? 1 : 0), 0);
    
    return frenchScore > englishScore ? 'fr' : 'en';
  }
}

// SECTION7_GUARD: Prompt cache for performance
export class PromptCache {
  private static cache = new Map<string, string>();
  
  static get(language: 'fr' | 'en', type: 'master' | 'golden'): string | null {
    return this.cache.get(`${language}-${type}`) || null;
  }
  
  static set(language: 'fr' | 'en', type: 'master' | 'golden', content: string): void {
    this.cache.set(`${language}-${type}`, content);
  }
  
  static clear(): void {
    this.cache.clear();
  }
}

// SECTION7_GUARD: Deterministic post-processors
export class Section7Guards {
  
  // WorkerFirstGuard: Ensure worker-first structure
  static workerFirstGuard(text: string, language: 'fr' | 'en'): { text: string; violations: string[] } {
    const violations: string[] = [];
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) return { text, violations };
    
    const firstLine = lines[0]?.trim() || '';
    const datePatterns = language === 'fr' 
      ? /^(Le\s+\d|En\s+\w+|Le\s+\d{1,2}\s+\w+)/i
      : /^(On\s+\w+\s+\d|On\s+\d{1,2})/i;
    
    if (datePatterns.test(firstLine)) {
      violations.push('date_first_opener');
      // Try to rewrite to worker-first
      const workerPattern = language === 'fr' 
        ? /(Le travailleur|La travailleuse)/
        : /(The worker)/;
      
      const workerMatch = text.match(workerPattern);
      if (workerMatch) {
        const workerRef = workerMatch[1];
        // Simple rewrite: move worker reference to front
        const rewritten = text.replace(firstLine, `${workerRef} [action from original: ${firstLine}]`);
        return { text: rewritten, violations };
      }
    }
    
    return { text, violations };
  }
  
  // OrderGuard: Ensure chronological order
  static orderGuard(text: string, language: 'fr' | 'en'): { text: string; violations: string[]; metadata: any } {
    const violations: string[] = [];
    const metadata: any = { date_reorderings: [] };
    
    const lines = text.split('\n').filter(line => line.trim());
    const datePattern = language === 'fr'
      ? /(?:le\s+)?(\d{1,2}(?:er)?)\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+(\d{4})/gi
      : /(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2}),?\s+(\d{4})/gi;
    
    const monthMap: { [key: string]: number } = language === 'fr' 
      ? { janvier: 1, février: 2, mars: 3, avril: 4, mai: 5, juin: 6, juillet: 7, août: 8, septembre: 9, octobre: 10, novembre: 11, décembre: 12 }
      : { january: 1, february: 2, march: 3, april: 4, may: 5, june: 6, july: 7, august: 8, september: 9, october: 10, november: 11, december: 12 };
    
    const entriesWithDates: Array<{ line: string; date: Date; originalIndex: number }> = [];
    
    lines.forEach((line, index) => {
      const match = line.match(datePattern);
      if (match) {
        let day: number, month: number, year: number;
        
        if (language === 'fr') {
          day = parseInt(match[1]?.replace('er', '') || '0');
          month = monthMap[match[2]?.toLowerCase() || ''] || 0;
          year = parseInt(match[3] || '0');
        } else {
          month = monthMap[match[1]?.toLowerCase() || ''] || 0;
          day = parseInt(match[2] || '0');
          year = parseInt(match[3] || '0');
        }
        
        entriesWithDates.push({
          line,
          date: new Date(year, month - 1, day),
          originalIndex: index
        });
      }
    });
    
    // Check if dates are in order
    const sortedEntries = [...entriesWithDates].sort((a, b) => a.date.getTime() - b.date.getTime());
    const isOrdered = entriesWithDates.every((entry, index) => 
      entry.date.getTime() === sortedEntries[index]?.date.getTime());
    
    if (!isOrdered) {
      violations.push('chronology_fail');
      metadata.date_reorderings = sortedEntries.map((entry, index) => ({
        from: entriesWithDates[index]?.originalIndex || 0,
        to: index,
        date: entry.date.toISOString().split('T')[0]
      }));
    }
    
    return { text, violations, metadata };
  }
  
  // QuoteGuard: Normalize quotes per language
  static quoteGuard(text: string, language: 'fr' | 'en'): { text: string; violations: string[] } {
    const violations: string[] = [];
    let normalizedText = text;
    
    if (language === 'fr') {
      // Normalize to French quotes « ... »
      normalizedText = normalizedText
        .replace(/"([^"]*)"/g, '« $1 »')
        .replace(/'([^']*)'/g, '« $1 »');
    } else {
      // Normalize to English quotes "..."
      normalizedText = normalizedText
        .replace(/«\s*([^»]*)\s*»/g, '"$1"')
        .replace(/'([^']*)'/g, '"$1"');
    }
    
    // Check for unbalanced quotes
    const openQuotes = (normalizedText.match(/«/g) || []).length;
    const closeQuotes = (normalizedText.match(/»/g) || []).length;
    
    if (language === 'fr' && openQuotes !== closeQuotes) {
      violations.push('unbalanced_quotes');
    }
    
    const openQuotesEN = (normalizedText.match(/"/g) || []).length;
    if (language === 'en' && openQuotesEN % 2 !== 0) {
      violations.push('unbalanced_quotes');
    }
    
    return { text: normalizedText, violations };
  }
  
  // TerminologyGuard: Apply JSON mappings strictly
  static terminologyGuard(text: string, language: 'fr' | 'en'): { text: string; violations: string[]; metadata: any } {
    const violations: string[] = [];
    const metadata: any = { terminology_changes: [] };
    let normalizedText = text;
    
    if (language === 'fr') {
      const replacements = [
        { from: /\ble patient\b/g, to: 'le travailleur', count: 0 },
        { from: /\bla patiente\b/g, to: 'la travailleuse', count: 0 },
        { from: /\bDocteur\b/g, to: 'docteur', count: 0 }
      ];
      
      replacements.forEach(replacement => {
        const matches = normalizedText.match(replacement.from);
        if (matches) {
          replacement.count = matches.length;
          normalizedText = normalizedText.replace(replacement.from, replacement.to);
          metadata.terminology_changes.push({
            from: replacement.from.source,
            to: replacement.to,
            count: replacement.count
          });
        }
      });
    } else {
      const replacements = [
        { from: /\bthe patient\b/g, to: 'the worker', count: 0 },
        { from: /\bDoctor\b/g, to: 'Dr.', count: 0 }
      ];
      
      replacements.forEach(replacement => {
        const matches = normalizedText.match(replacement.from);
        if (matches) {
          replacement.count = matches.length;
          normalizedText = normalizedText.replace(replacement.from, replacement.to);
          metadata.terminology_changes.push({
            from: replacement.from.source,
            to: replacement.to,
            count: replacement.count
          });
        }
      });
    }
    
    return { text: normalizedText, violations, metadata };
  }
  
  // VertebraeGuard: Normalize spine levels with hyphen
  static vertebraeGuard(text: string): { text: string; violations: string[] } {
    const violations: string[] = [];
    let normalizedText = text;
    
    // Normalize C5-C6, L5-S1, etc.
    const vertebraePattern = /\b([CLT])\s*(\d+)\s*[-–]\s*([CLT])\s*(\d+)\b/g;
    const matches = normalizedText.match(vertebraePattern);
    
    if (matches) {
      normalizedText = normalizedText.replace(vertebraePattern, '$1$2-$3$4');
    }
    
    // Check for inconsistent spacing
    const inconsistentPattern = /\b([CLT])\s+(\d+)\s+([CLT])\s+(\d+)\b/g;
    if (inconsistentPattern.test(text)) {
      violations.push('inconsistent_vertebrae_spacing');
    }
    
    return { text: normalizedText, violations };
  }
  
  // SectionHeaderGuard: Ensure exactly one header line
  static sectionHeaderGuard(text: string, language: 'fr' | 'en'): { text: string; violations: string[] } {
    const violations: string[] = [];
    const lines = text.split('\n');
    
    const expectedHeader = language === 'fr' 
      ? '7. Historique de faits et évolution'
      : '7. History of Facts and Clinical Evolution';
    
    const headerLines = lines.filter(line => 
      line.trim().startsWith('7.') && 
      (line.includes('Historique') || line.includes('History'))
    );
    
    if (headerLines.length === 0) {
      violations.push('missing_section_header');
      // Add header at the beginning
      return { text: expectedHeader + '\n\n' + text, violations };
    } else if (headerLines.length > 1) {
      violations.push('duplicate_section_headers');
      // Keep only the first header
      const firstHeaderIndex = lines.findIndex(line => 
        line.trim().startsWith('7.') && 
        (line.includes('Historique') || line.includes('History'))
      );
      
      const filteredLines = lines.filter((line, index) => 
        index === firstHeaderIndex || 
        !(line.trim().startsWith('7.') && (line.includes('Historique') || line.includes('History')))
      );
      
      return { text: filteredLines.join('\n'), violations };
    }
    
    return { text, violations };
  }
}

/**
 * Hardened Section 7 AI Formatter with deterministic guards and JSON contract
 */
export class Section7AIFormatter {
  
  /**
   * Format Section 7 content with hardened guards and JSON response contract
   */
  static async formatSection7Content(
    content: string, 
    language: 'fr' | 'en' = 'fr'
  ): Promise<Section7AIResult> {
    const startTime = Date.now();
    const correlationId = `s7-ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      console.log(`[${correlationId}] 🎯 Starting hardened Section 7 AI formatting`, {
        language,
        contentLength: content.length,
        timestamp: new Date().toISOString()
      });

      // SECTION7_GUARD: Language detection and routing
      const detectedLanguage = LanguageRouter.detectLanguage(content, language);
      console.log(`[${correlationId}] 🌐 Language detected: ${detectedLanguage}`);

      // STEP 1: Load language-specific files with caching
      console.log(`[${correlationId}] 📁 STEP 1: Loading language-specific files with caching`);
      const promptFiles = await this.loadLanguageSpecificFiles(detectedLanguage, correlationId);
      
      // STEP 2: Construct system prompt with shortened golden example
      console.log(`[${correlationId}] 🔧 STEP 2: Constructing system prompt with token optimization`);
      const { systemPrompt, promptLength } = this.constructOptimizedSystemPrompt(promptFiles, detectedLanguage, correlationId);
      
      // STEP 3: Call OpenAI with JSON response contract
      console.log(`[${correlationId}] 🤖 STEP 3: Calling OpenAI with JSON response contract`);
      const result = await this.callOpenAIWithJSONContract(systemPrompt, content, detectedLanguage, correlationId);
      
      // STEP 4: Apply deterministic guards
      console.log(`[${correlationId}] ✅ STEP 4: Applying deterministic guards`);
      const finalResult = this.applyDeterministicGuards(result, content, detectedLanguage, correlationId, startTime, promptFiles, promptLength);
      
      console.log(`[${correlationId}] 🎉 Hardened Section 7 AI formatting completed`, {
        inputLength: content.length,
        outputLength: finalResult.formatted.length,
        processingTime: finalResult.metadata?.processingTime,
        ok: finalResult.ok,
        violations: finalResult.violations.length,
        guard_applied: finalResult.metadata?.guard_applied
      });
      
      return finalResult;
      
    } catch (error) {
      console.error(`[${correlationId}] ❌ Section 7 AI formatting failed:`, error);
      
      // SECTION7_GUARD: Fallback to rules-only mode
      return this.fallbackRulesOnlyMode(content, language, correlationId, startTime);
    }
  }

  /**
   * Load language-specific files with caching
   */
  private static async loadLanguageSpecificFiles(
    language: 'fr' | 'en', 
    correlationId: string
  ): Promise<{
    masterPrompt: string;
    jsonConfig: any;
    goldenExample: string;
    filesLoaded: string[];
  }> {
    try {
      console.log(`[${correlationId}] 📁 Loading language-specific files for: ${language}`);
      
      const basePath = join(process.cwd(), 'prompts');
      const filesLoaded: string[] = [];
      
      // Check cache first
      let masterPrompt = PromptCache.get(language, 'master');
      let goldenExample = PromptCache.get(language, 'golden');
      
      if (!masterPrompt || !goldenExample) {
        // Language Detection → File Selection
        let masterPromptPath: string;
        let jsonConfigPath: string;
        let goldenExamplePath: string;
        
        if (language === 'fr') {
          masterPromptPath = join(basePath, 'section7_master.md');
          jsonConfigPath = join(basePath, 'section7_master.json');
          goldenExamplePath = join(basePath, 'section7_golden_example.md');
        } else {
          masterPromptPath = join(basePath, 'section7_master_en.md');
          jsonConfigPath = join(basePath, 'section7_master_en.json');
          goldenExamplePath = join(basePath, 'section7_golden_example_en.md');
        }
        
        // Validate files exist
        const filesToCheck = [masterPromptPath, jsonConfigPath, goldenExamplePath];
        for (const filePath of filesToCheck) {
          if (!existsSync(filePath)) {
            throw new Error(`Required file not found: ${filePath}`);
          }
        }
        
        // Load files
        masterPrompt = readFileSync(masterPromptPath, 'utf8');
        PromptCache.set(language, 'master', masterPrompt);
        filesLoaded.push('masterPrompt');
        
        const jsonConfig = JSON.parse(readFileSync(jsonConfigPath, 'utf8'));
        filesLoaded.push('jsonConfig');
        
        goldenExample = readFileSync(goldenExamplePath, 'utf8');
        PromptCache.set(language, 'golden', goldenExample);
        filesLoaded.push('goldenExample');
        
        console.log(`[${correlationId}] ✅ Files loaded and cached`, {
          masterPromptLength: masterPrompt.length,
          jsonConfigKeys: Object.keys(jsonConfig),
          goldenExampleLength: goldenExample.length,
          filesLoaded
        });
        
        return { masterPrompt, jsonConfig, goldenExample, filesLoaded };
      } else {
        // Load from cache
        const jsonConfigPath = language === 'fr' 
          ? join(basePath, 'section7_master.json')
          : join(basePath, 'section7_master_en.json');
        
        const jsonConfig = JSON.parse(readFileSync(jsonConfigPath, 'utf8'));
        filesLoaded.push('masterPrompt', 'jsonConfig', 'goldenExample');
        
        console.log(`[${correlationId}] ✅ Files loaded from cache`, {
          masterPromptLength: masterPrompt.length,
          goldenExampleLength: goldenExample.length,
          filesLoaded
        });
        
        return { masterPrompt, jsonConfig, goldenExample, filesLoaded };
      }
      
    } catch (error) {
      console.error(`[${correlationId}] ❌ Failed to load language-specific files:`, error);
      throw new Error(`Failed to load Section 7 prompt files for language: ${language}. Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Construct optimized system prompt with shortened golden example
   */
  private static constructOptimizedSystemPrompt(
    promptFiles: { masterPrompt: string; jsonConfig: any; goldenExample: string },
    language: 'fr' | 'en',
    correlationId: string
  ): { systemPrompt: string; promptLength: number } {
    try {
      console.log(`[${correlationId}] 🔧 Constructing optimized system prompt`);
      
      // Start with master prompt
      let systemPrompt = promptFiles.masterPrompt;
      
      // SECTION7_GUARD: Use only shortened golden example (first 2-3 entries)
      const goldenLines = promptFiles.goldenExample.split('\n');
      const shortenedGolden = goldenLines.slice(0, 15).join('\n'); // First ~15 lines
      
      systemPrompt += '\n\n## REFERENCE EXAMPLE (SHORTENED):\n';
      systemPrompt += language === 'fr' 
        ? 'Utilise cet exemple comme référence de structure. Notez la préservation des noms complets des médecins.\n\n'
        : 'Use this example as structure reference. Note the preservation of complete doctor names.\n\n';
      systemPrompt += shortenedGolden;
      
      // Add JSON response contract instructions
      systemPrompt += '\n\n## CRITICAL: RESPONSE FORMAT\n';
      systemPrompt += 'You MUST respond with valid JSON in this exact format:\n';
      systemPrompt += '{\n';
      systemPrompt += '  "ok": boolean,\n';
      systemPrompt += '  "violations": string[],\n';
      systemPrompt += '  "doctor_names_seen": string[],\n';
      systemPrompt += '  "started_with_worker": boolean,\n';
      systemPrompt += '  "chronology_ok": boolean,\n';
      systemPrompt += '  "rendered_text": string\n';
      systemPrompt += '}\n';
      systemPrompt += 'The rendered_text field contains the formatted Section 7 content.';
      
      const promptLength = systemPrompt.length;
      
      console.log(`[${correlationId}] ✅ Optimized system prompt constructed`, {
        totalLength: promptLength,
        goldenExampleShortened: true
      });
      
      return { systemPrompt, promptLength };
      
    } catch (error) {
      console.error(`[${correlationId}] ❌ Failed to construct optimized system prompt:`, error);
      throw new Error('Failed to construct Section 7 optimized system prompt');
    }
  }

  /**
   * Call OpenAI with JSON response contract
   */
  private static async callOpenAIWithJSONContract(
    systemPrompt: string,
    content: string,
    language: 'fr' | 'en',
    correlationId: string
  ): Promise<OpenAIJSONResponse> {
    try {
      // Use flag-controlled default model
      const defaultModel = FLAGS.USE_CLAUDE_SONNET_4_AS_DEFAULT 
        ? 'claude-3-5-sonnet'  // Maps to claude-sonnet-4-20250514
        : (process.env['OPENAI_MODEL'] || 'gpt-4o-mini');

      console.log(`[${correlationId}] Calling OpenAI API with JSON contract`, {
        model: defaultModel,
        systemPromptLength: systemPrompt.length,
        contentLength: content.length
      });
      
      const userMessage = language === 'fr'
        ? `Formate ce texte médical brut selon les standards québécois CNESST pour la Section 7. Réponds UNIQUEMENT en JSON selon le format requis:\n\n${content}`
        : `Format this raw medical text according to Quebec CNESST standards for Section 7. Respond ONLY in JSON according to the required format:\n\n${content}`;
      
      // Use AIProvider abstraction instead of direct OpenAI call
      const provider = getAIProvider(defaultModel);
      
      const response = await provider.createCompletion({
        model: defaultModel,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userMessage
          }
        ],
        temperature: 0.1, // Very low temperature for deterministic formatting
        max_tokens: 4000
      });
      
      const rawResponse = response.content?.trim() || '';
      
      console.log(`[${correlationId}] OpenAI API response received`, {
        outputLength: rawResponse.length,
        usage: response.usage
      });
      
      // SECTION7_GUARD: Parse JSON response
      try {
        const jsonResponse: OpenAIJSONResponse = JSON.parse(rawResponse);
        
        // Validate required keys
        const requiredKeys = ['ok', 'violations', 'doctor_names_seen', 'started_with_worker', 'chronology_ok', 'rendered_text'];
        const missingKeys = requiredKeys.filter(key => !(key in jsonResponse));
        
        if (missingKeys.length > 0) {
          console.warn(`[${correlationId}] Missing JSON keys: ${missingKeys.join(', ')}`);
          return {
            ok: false,
            violations: ['missing_json_keys', ...missingKeys],
            doctor_names_seen: [],
            started_with_worker: false,
            chronology_ok: false,
            rendered_text: rawResponse
          };
        }
        
        return jsonResponse;
        
      } catch (parseError) {
        console.warn(`[${correlationId}] Failed to parse JSON response:`, parseError);
        return {
          ok: false,
          violations: ['non_json_output'],
          doctor_names_seen: [],
          started_with_worker: false,
          chronology_ok: false,
          rendered_text: rawResponse
        };
      }
      
    } catch (error) {
      console.error(`[${correlationId}] OpenAI API call failed:`, error);
      throw new Error(`OpenAI API call failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Apply deterministic guards and make QA a hard gate
   */
  private static applyDeterministicGuards(
    aiResponse: OpenAIJSONResponse,
    _originalContent: string,
    language: 'fr' | 'en',
    correlationId: string,
    startTime: number,
    promptFiles: { filesLoaded: string[] },
    promptLength: number
  ): Section7AIResult {
    console.log(`[${correlationId}] ✅ Applying deterministic guards`);
    
    const processingTime = Date.now() - startTime;
    const guardApplied: string[] = [];
    let allViolations: string[] = [...aiResponse.violations];
    let processedText = aiResponse.rendered_text;
    
    // SECTION7_GUARD: Apply all guards in sequence
    const sectionHeaderResult = Section7Guards.sectionHeaderGuard(processedText, language);
    processedText = sectionHeaderResult.text;
    allViolations.push(...sectionHeaderResult.violations);
    if (sectionHeaderResult.violations.length > 0) guardApplied.push('SectionHeaderGuard');
    
    const terminologyResult = Section7Guards.terminologyGuard(processedText, language);
    processedText = terminologyResult.text;
    allViolations.push(...terminologyResult.violations);
    if (terminologyResult.violations.length > 0) guardApplied.push('TerminologyGuard');
    
    const workerFirstResult = Section7Guards.workerFirstGuard(processedText, language);
    processedText = workerFirstResult.text;
    allViolations.push(...workerFirstResult.violations);
    if (workerFirstResult.violations.length > 0) guardApplied.push('WorkerFirstGuard');
    
    const vertebraeResult = Section7Guards.vertebraeGuard(processedText);
    processedText = vertebraeResult.text;
    allViolations.push(...vertebraeResult.violations);
    if (vertebraeResult.violations.length > 0) guardApplied.push('VertebraeGuard');
    
    const quoteResult = Section7Guards.quoteGuard(processedText, language);
    processedText = quoteResult.text;
    allViolations.push(...quoteResult.violations);
    if (quoteResult.violations.length > 0) guardApplied.push('QuoteGuard');
    
    const orderResult = Section7Guards.orderGuard(processedText, language);
    processedText = orderResult.text;
    allViolations.push(...orderResult.violations);
    if (orderResult.violations.length > 0) guardApplied.push('OrderGuard');
    
    // SECTION7_GUARD: Make QA a hard gate
    const criticalViolations = allViolations.filter(v => 
      ['date_first_opener', 'worker_first', 'chronology_fail', 'incomplete_quotes'].includes(v)
    );
    
    const finalOk = criticalViolations.length === 0 && aiResponse.ok;
    
    console.log(`[${correlationId}] ✅ Guards applied`, {
      guardApplied,
      totalViolations: allViolations.length,
      criticalViolations: criticalViolations.length,
      finalOk
    });
    
    return {
      formatted: processedText,
      ok: finalOk,
      violations: allViolations,
      doctor_names_seen: aiResponse.doctor_names_seen,
      started_with_worker: aiResponse.started_with_worker,
      chronology_ok: aiResponse.chronology_ok,
      suggestions: criticalViolations.length > 0 ? [`Critical violations found: ${criticalViolations.join(', ')}`] : [],
      issues: allViolations,
      metadata: {
        language,
        filesLoaded: promptFiles.filesLoaded,
        promptLength,
        processingTime,
        // Use flag-controlled default model for metadata
        model: FLAGS.USE_CLAUDE_SONNET_4_AS_DEFAULT 
          ? 'claude-3-5-sonnet'  // Maps to claude-sonnet-4-20250514
          : (process.env['OPENAI_MODEL'] || 'gpt-4o-mini'),
        guard_applied: guardApplied
      }
    };
  }

  /**
   * Fallback rules-only mode if OpenAI fails
   */
  private static fallbackRulesOnlyMode(
    content: string,
    language: 'fr' | 'en',
    correlationId: string,
    startTime: number
  ): Section7AIResult {
    console.log(`[${correlationId}] 🔄 Using fallback rules-only mode`);
    
    const processingTime = Date.now() - startTime;
    let processedText = content;
    const violations: string[] = [];
    const guardApplied: string[] = [];
    
    // Apply guards in sequence
    const sectionHeaderResult = Section7Guards.sectionHeaderGuard(processedText, language);
    processedText = sectionHeaderResult.text;
    violations.push(...sectionHeaderResult.violations);
    guardApplied.push('SectionHeaderGuard');
    
    const terminologyResult = Section7Guards.terminologyGuard(processedText, language);
    processedText = terminologyResult.text;
    violations.push(...terminologyResult.violations);
    guardApplied.push('TerminologyGuard');
    
    const workerFirstResult = Section7Guards.workerFirstGuard(processedText, language);
    processedText = workerFirstResult.text;
    violations.push(...workerFirstResult.violations);
    guardApplied.push('WorkerFirstGuard');
    
    const vertebraeResult = Section7Guards.vertebraeGuard(processedText);
    processedText = vertebraeResult.text;
    violations.push(...vertebraeResult.violations);
    guardApplied.push('VertebraeGuard');
    
    const quoteResult = Section7Guards.quoteGuard(processedText, language);
    processedText = quoteResult.text;
    violations.push(...quoteResult.violations);
    guardApplied.push('QuoteGuard');
    
    const orderResult = Section7Guards.orderGuard(processedText, language);
    processedText = orderResult.text;
    violations.push(...orderResult.violations);
    guardApplied.push('OrderGuard');
    
    return {
      formatted: processedText,
      ok: false, // Always false for fallback mode
      violations: ['openai_failed', ...violations],
      doctor_names_seen: [],
      started_with_worker: false,
      chronology_ok: false,
      suggestions: ['AI processing failed - using rules-only fallback mode'],
      issues: ['AI processing unavailable - fallback formatting applied'],
      metadata: {
        language,
        filesLoaded: [],
        promptLength: 0,
        processingTime,
        model: 'fallback',
        fallback: true,
        guard_applied: guardApplied
      }
    };
  }
}
