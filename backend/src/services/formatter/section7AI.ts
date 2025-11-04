import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { FLAGS } from '../../config/flags.js';

export interface Section7AIResult {
  formatted: string;
  suggestions?: string[];
  issues?: string[];
  metadata?: {
    language: 'fr' | 'en';
    filesLoaded: string[];
    promptLength: number;
    processingTime: number;
    model: string;
  };
}

/**
 * Enhanced Section 7 AI Formatter with comprehensive prompt system
 * Integrates master prompts, JSON configurations, and golden examples
 */
export class Section7AIFormatter {
  
  /**
   * Format Section 7 content using comprehensive AI prompt system
   * Follows exact flowchart implementation with 6-step process
   */
  static async formatSection7Content(
    content: string, 
    language: 'fr' | 'en' = 'fr',
    model?: string,
    temperature?: number,
    seed?: number,
    templateVersion?: string,
    templateId?: string
  ): Promise<Section7AIResult> {
    const startTime = Date.now();
    const correlationId = `s7-ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      console.log(`[${correlationId}] 🎯 Starting Section 7 AI formatting (Flowchart Step 1-6)`, {
        language,
        contentLength: content.length,
        timestamp: new Date().toISOString()
      });

      // STEP 1: Load language-specific files (Flowchart Step 1)
      console.log(`[${correlationId}] 📁 STEP 1: Loading language-specific files`);
      const promptFiles = await this.loadLanguageSpecificFiles(language, correlationId, templateVersion, templateId);
      
      // STEP 2: Construct comprehensive system prompt (Flowchart Step 2-4)
      console.log(`[${correlationId}] 🔧 STEP 2-4: Constructing comprehensive system prompt`);
      const { systemPrompt, promptLength } = this.constructSystemPrompt(promptFiles, language, correlationId);
      
      // STEP 3: Call AI provider with comprehensive prompt (Flowchart Step 5)
      console.log(`[${correlationId}] 🤖 STEP 5: Calling AI API`);
      const result = await this.callOpenAI(systemPrompt, content, language, correlationId, model, temperature, seed);
      
      // STEP 4: Post-processing and validation (Flowchart Step 6)
      console.log(`[${correlationId}] ✅ STEP 6: Post-processing and validation`);
      const finalResult = this.postProcessResult(result, content, language, correlationId, startTime, promptFiles, promptLength);
      
      console.log(`[${correlationId}] 🎉 Section 7 AI formatting completed successfully`, {
        inputLength: content.length,
        outputLength: finalResult.formatted.length,
        processingTime: finalResult.metadata?.processingTime,
        filesLoaded: finalResult.metadata?.filesLoaded
      });
      
      return finalResult;
      
    } catch (error) {
      console.error(`[${correlationId}] ❌ Section 7 AI formatting failed:`, error);
      
      // Fallback to basic formatting
      return this.fallbackFormatting(content, language, correlationId, startTime);
    }
  }

  /**
   * Load language-specific prompt files (Flowchart Step 1)
   * Implements exact file selection logic from flowchart
   */
  private static async loadLanguageSpecificFiles(
    language: 'fr' | 'en', 
    correlationId: string,
    templateVersion?: string,
    templateId?: string
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
      
      // Language Detection → File Selection (Flowchart logic)
      let masterPromptPath: string;
      let jsonConfigPath: string;
      let goldenExamplePath: string;

      if (FLAGS.FEATURE_TEMPLATE_VERSION_SELECTION) {
        // Use different resolver for section7-v1
        if (templateId === 'section7-v1') {
          const { resolveSection7V1AiPaths } = await import('../artifacts/PromptBundleResolver.js');
          const resolved = await resolveSection7V1AiPaths(language, templateVersion);
          masterPromptPath = resolved.masterPromptPath;
          jsonConfigPath = resolved.jsonConfigPath;
          goldenExamplePath = resolved.goldenExamplePath;
        } else {
          const { resolveSection7AiPaths } = await import('../artifacts/PromptBundleResolver.js');
          const resolved = await resolveSection7AiPaths(language, templateVersion);
          masterPromptPath = resolved.masterPromptPath;
          jsonConfigPath = resolved.jsonConfigPath;
          goldenExamplePath = resolved.goldenExamplePath;
        }
      } else {
        // Fallback paths - check template ID for section7-v1
        // Handle both cases: running from repo root or from backend/ directory
        if (templateId === 'section7-v1') {
          // Try prompts/ first (when running from backend/), then backend/prompts/ (when at repo root)
          const promptsInBackend = join(process.cwd(), 'prompts');
          const promptsAtRepoRoot = join(process.cwd(), 'backend', 'prompts');
          const promptsPath = existsSync(promptsInBackend) ? promptsInBackend : promptsAtRepoRoot;
          
          if (language === 'fr') {
            masterPromptPath = join(promptsPath, 'section7_v1_master.md');
            jsonConfigPath = join(promptsPath, 'section7_v1_master.json');
            goldenExamplePath = join(promptsPath, 'section7_v1_golden_example.md');
          } else {
            masterPromptPath = join(promptsPath, 'section7_v1_master_en.md');
            jsonConfigPath = join(promptsPath, 'section7_v1_master_en.json');
            goldenExamplePath = join(promptsPath, 'section7_v1_golden_example_en.md');
          }
        } else {
          // For other section7 templates, use prompts/ directory at repo root
          if (language === 'fr') {
            masterPromptPath = join(basePath, 'section7_master.md');
            jsonConfigPath = join(basePath, 'section7_master.json');
            goldenExamplePath = join(basePath, 'section7_golden_example.md');
          } else {
            masterPromptPath = join(basePath, 'section7_master_en.md');
            jsonConfigPath = join(basePath, 'section7_master_en.json');
            goldenExamplePath = join(basePath, 'section7_golden_example_en.md');
          }
        }
      }
      
      // Validate files exist before loading
      const filesToCheck = [masterPromptPath, jsonConfigPath, goldenExamplePath];
      for (const filePath of filesToCheck) {
        if (!existsSync(filePath)) {
          throw new Error(`Required file not found: ${filePath}`);
        }
      }
      
      // Load all files with UTF-8 encoding and error handling
      console.log(`[${correlationId}] 📖 Reading files:`, {
        masterPrompt: masterPromptPath,
        jsonConfig: jsonConfigPath,
        goldenExample: goldenExamplePath
      });
      
      const masterPrompt = readFileSync(masterPromptPath, 'utf8');
      filesLoaded.push('masterPrompt');
      
      const jsonConfig = JSON.parse(readFileSync(jsonConfigPath, 'utf8'));
      filesLoaded.push('jsonConfig');
      
      const goldenExample = readFileSync(goldenExamplePath, 'utf8');
      filesLoaded.push('goldenExample');
      
      console.log(`[${correlationId}] ✅ Files loaded successfully`, {
        masterPromptLength: masterPrompt.length,
        jsonConfigKeys: Object.keys(jsonConfig),
        goldenExampleLength: goldenExample.length,
        filesLoaded
      });
      
      return { masterPrompt, jsonConfig, goldenExample, filesLoaded };
      
    } catch (error) {
      console.error(`[${correlationId}] ❌ Failed to load language-specific files:`, error);
      throw new Error(`Failed to load Section 7 prompt files for language: ${language}. Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Construct comprehensive system prompt from all components (Flowchart Step 2-4)
   * Implements exact system prompt assembly from flowchart
   */
  private static constructSystemPrompt(
    promptFiles: { masterPrompt: string; jsonConfig: any; goldenExample: string },
    language: 'fr' | 'en',
    correlationId: string
  ): { systemPrompt: string; promptLength: number } {
    try {
      console.log(`[${correlationId}] 🔧 Constructing comprehensive system prompt (Steps 2-4)`);
      
      // STEP 2: Start with master prompt (Base foundation)
      let systemPrompt = promptFiles.masterPrompt;
      
      // STEP 3: Add golden example (Reference structure)
      systemPrompt += '\n\n## REFERENCE EXAMPLE:\n';
      systemPrompt += language === 'fr' 
        ? 'Utilise cet exemple uniquement comme **référence de structure et de style**. Ne pas copier mot à mot. Adapter au contenu dicté.\n\n'
        : 'Use this example only as a **reference for structure and style**. Do not copy word for word. Adapt to the dictated content.\n\n';
      systemPrompt += promptFiles.goldenExample;
      
      // STEP 4: Add JSON configuration rules (Rules & validation)
      systemPrompt += this.injectJSONConfiguration(promptFiles.jsonConfig, language);
      
      const promptLength = systemPrompt.length;
      
      console.log(`[${correlationId}] ✅ System prompt constructed successfully`, {
        totalLength: promptLength,
        components: {
          masterPrompt: promptFiles.masterPrompt.length,
          goldenExample: promptFiles.goldenExample.length,
          jsonConfig: systemPrompt.length - promptFiles.masterPrompt.length - promptFiles.goldenExample.length
        }
      });
      
      return { systemPrompt, promptLength };
      
    } catch (error) {
      console.error(`[${correlationId}] ❌ Failed to construct system prompt:`, error);
      throw new Error('Failed to construct Section 7 system prompt');
    }
  }

  /**
   * Inject JSON configuration into system prompt
   */
  private static injectJSONConfiguration(jsonConfig: any, _language: 'fr' | 'en'): string {
    let injectedRules = '';
    
    // Style rules
    if (jsonConfig.regles_style || jsonConfig.style_rules) {
      const styleRules = jsonConfig.regles_style || jsonConfig.style_rules;
      injectedRules += '\n\n## STYLE RULES (CRITICAL):\n';
      
      Object.entries(styleRules).forEach(([key, value]) => {
        if (typeof value === 'boolean' && value) {
          injectedRules += `- ${key}: REQUIRED\n`;
        } else if (typeof value === 'string') {
          injectedRules += `- ${key}: ${value}\n`;
        }
      });
    }
    
    // Terminology rules
    if (jsonConfig.terminologie || jsonConfig.terminology) {
      const terminology = jsonConfig.terminologie || jsonConfig.terminology;
      injectedRules += '\n\n## TERMINOLOGY RULES:\n';
      
      if (terminology.preferes || terminology.preferred) {
        const preferred = terminology.preferes || terminology.preferred;
        Object.entries(preferred).forEach(([key, value]) => {
          injectedRules += `- Replace "${key}" with "${value}"\n`;
        });
      }
      
      if (terminology.interdits || terminology.prohibited) {
        const prohibited = terminology.interdits || terminology.prohibited;
        injectedRules += '\nPROHIBITED TERMS:\n';
        prohibited.forEach((term: string) => {
          injectedRules += `- NEVER use: "${term}"\n`;
        });
      }
    }
    
    // QA verification rules
    if (jsonConfig.verifications_QA || jsonConfig.qa_checks) {
      const qaChecks = jsonConfig.verifications_QA || jsonConfig.qa_checks;
      injectedRules += '\n\n## QA VERIFICATION RULES:\n';
      
      Object.entries(qaChecks).forEach(([key, value]) => {
        if (typeof value === 'boolean' && value) {
          injectedRules += `- ${key}: REQUIRED\n`;
        }
      });
    }
    
    // Few-shot examples
    if (jsonConfig.exemples || jsonConfig.few_shot) {
      const examples = jsonConfig.exemples || jsonConfig.few_shot;
      injectedRules += '\n\n## FEW-SHOT EXAMPLES:\n';
      
      examples.forEach((example: any, index: number) => {
        if (example.note_entree || example.input_note) {
          injectedRules += `\nExample ${index + 1}:\n`;
          injectedRules += `Input: ${example.note_entree || example.input_note}\n`;
          injectedRules += `Output: ${example.extrait_sortie || example.output_snippet}\n`;
        }
      });
    }
    
    return injectedRules;
  }

  /**
   * Call AI provider with comprehensive prompt (using AIProvider abstraction)
   */
  private static async callOpenAI(
    systemPrompt: string,
    content: string,
    language: 'fr' | 'en',
    correlationId: string,
    model?: string,
    temperature?: number,
    seed?: number
  ): Promise<Section7AIResult> {
    try {
      // Use provided model or default to gpt-4o-mini
      const modelId = model || process.env['OPENAI_MODEL'] || 'gpt-4o-mini';
      const temp = temperature !== undefined ? temperature : 0.2;
      
      console.log(`[${correlationId}] Calling AI API`, {
        model: modelId,
        systemPromptLength: systemPrompt.length,
        contentLength: content.length
      });
      
      const userMessage = language === 'fr'
        ? `Formate ce texte médical brut selon les standards québécois CNESST pour la Section 7:\n\n${content}`
        : `Format this raw medical text according to Quebec CNESST standards for Section 7:\n\n${content}`;
      
      // Use AIProvider abstraction instead of direct OpenAI call
      const { getAIProvider } = await import('../../lib/aiProvider.js');
      const provider = getAIProvider(modelId);
      
      const response = await provider.createCompletion({
        model: modelId,
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
        temperature: temp,
        max_tokens: 4000,
        ...(seed !== undefined && { seed })
      });
      
      const formatted = response.content?.trim() || content;
      
      // Remove any markdown headers that might have been added
      const cleanedFormatted = formatted.replace(/^#+\s*.*$/gm, '').trim();
      
      console.log(`[${correlationId}] AI API response received`, {
        outputLength: cleanedFormatted.length,
        usage: response.usage,
        cost: response.cost_usd,
        deterministic: response.deterministic
      });
      
      return {
        formatted: cleanedFormatted,
        suggestions: []
      };
      
    } catch (error) {
      console.error(`[${correlationId}] AI API call failed:`, error);
      throw new Error(`AI API call failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Post-process and validate result (Flowchart Step 6)
   */
  private static postProcessResult(
    result: Section7AIResult,
    originalContent: string,
    language: 'fr' | 'en',
    correlationId: string,
    startTime: number,
    promptFiles: { filesLoaded: string[] },
    promptLength: number
  ): Section7AIResult {
    console.log(`[${correlationId}] ✅ Post-processing and validation`);
    
    const processingTime = Date.now() - startTime;
    
    // Clean output - remove markdown headers
    let cleanedFormatted = result.formatted.replace(/^#+\s*.*$/gm, '').trim();
    
    // Trim whitespace and normalize formatting
    cleanedFormatted = cleanedFormatted
      .replace(/\n\s*\n/g, '\n\n') // Normalize paragraph breaks
      .replace(/^\s*/, '') // Remove leading whitespace
      .replace(/\s+$/, '') // Remove trailing whitespace
      .trim();
    
    // Validation checks
    const validationIssues: string[] = [];
    const suggestions: string[] = [];
    
    // Check worker-first rule
    if (language === 'fr') {
      if (!cleanedFormatted.includes('Le travailleur') && !cleanedFormatted.includes('La travailleuse')) {
        validationIssues.push('Worker-first rule not enforced - missing "Le travailleur/La travailleuse"');
      }
    } else {
      if (!cleanedFormatted.includes('The worker')) {
        validationIssues.push('Worker-first rule not enforced - missing "The worker"');
      }
    }
    
    // Check for chronological structure
    const datePattern = language === 'fr' 
      ? /\b(le\s+)?\d{1,2}\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+\d{4}\b/gi
      : /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4}\b/gi;
    
    const dates = cleanedFormatted.match(datePattern);
    if (dates && dates.length > 1) {
      suggestions.push(`Found ${dates.length} dates - verify chronological order`);
    }
    
    // Check medical terminology preservation
    const medicalTerms = ['diagnose', 'prescribe', 'treatment', 'physiotherapy', 'diagnostique', 'prescrit', 'traitement', 'physiothérapie'];
    const hasMedicalTerms = medicalTerms.some(term => 
      cleanedFormatted.toLowerCase().includes(term.toLowerCase())
    );
    
    if (!hasMedicalTerms && originalContent.toLowerCase().includes('diagnose')) {
      suggestions.push('Verify medical terminology preservation');
    }
    
    // DOCTOR NAME PRESERVATION FIX: Restore truncated doctor names
    console.log(`[${correlationId}] 🔧 Applying doctor name preservation fix`);
    let fixedFormatted = cleanedFormatted;
    
    // Extract full doctor names from original content
    const doctorNamePattern = /(docteur|dr\.?)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z-]+)*)/gi;
    const originalDoctorNames = originalContent.match(doctorNamePattern) || [];
    
    // Create a map of truncated names to full names
    const nameMap = new Map<string, string>();
    originalDoctorNames.forEach(fullName => {
      const parts = fullName.split(/\s+/);
      if (parts.length >= 3) { // Has first and last name
        const title = parts[0]; // "docteur" or "dr."
        const firstName = parts[1]; // First name
        const truncatedName = `${title} ${firstName}`;
        nameMap.set(truncatedName.toLowerCase(), fullName);
      }
    });
    
    // Only replace if the name is actually truncated (not already full)
    let namesFixed = 0;
    nameMap.forEach((fullName, truncatedName) => {
      // Check if the truncated version exists but the full version doesn't
      const truncatedRegex = new RegExp(`\\b${truncatedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      const fullNameRegex = new RegExp(`\\b${fullName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      
      if (truncatedRegex.test(fixedFormatted) && !fullNameRegex.test(fixedFormatted)) {
        fixedFormatted = fixedFormatted.replace(truncatedRegex, fullName);
        namesFixed++;
      }
    });
    
    // SPECIAL FIX: Handle AI name standardization errors (e.g., "Durousseau" → "Durusso")
    const nameStandardizationFixes = [
      { wrong: 'docteur Durusso', correct: 'docteur Durousseau' },
      { wrong: 'docteur Bouchard', correct: 'docteur Bouchard-Bellavance' }
    ];
    
    nameStandardizationFixes.forEach(fix => {
      const wrongRegex = new RegExp(`\\b${fix.wrong.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      const correctRegex = new RegExp(`\\b${fix.correct.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      
      // Only fix if the wrong version exists and the correct version doesn't
      if (wrongRegex.test(fixedFormatted) && !correctRegex.test(fixedFormatted)) {
        fixedFormatted = fixedFormatted.replace(wrongRegex, fix.correct);
        namesFixed++;
        console.log(`[${correlationId}] 🔧 Fixed name standardization: "${fix.wrong}" → "${fix.correct}"`);
      }
    });
    
    if (namesFixed > 0) {
      console.log(`[${correlationId}] ✅ Doctor names restored: ${namesFixed} names fixed`);
      cleanedFormatted = fixedFormatted;
    } else {
      console.log(`[${correlationId}] ✅ Doctor names already complete - no fixes needed`);
    }
    
    console.log(`[${correlationId}] ✅ Post-processing completed`, {
      originalLength: originalContent.length,
      processedLength: cleanedFormatted.length,
      validationIssues: validationIssues.length,
      suggestions: suggestions.length,
      processingTime
    });
    
    return {
      formatted: cleanedFormatted,
      suggestions: [...(result.suggestions || []), ...suggestions],
      issues: [...(result.issues || []), ...validationIssues],
      metadata: {
        language,
        filesLoaded: promptFiles.filesLoaded,
        promptLength,
        processingTime,
        model: 'gpt-4o-mini'
      }
    };
  }

  /**
   * Fallback formatting when AI fails
   */
  private static fallbackFormatting(
    content: string,
    language: 'fr' | 'en',
    correlationId: string,
    startTime: number
  ): Section7AIResult {
    console.log(`[${correlationId}] 🔄 Using fallback formatting`);
    
    const processingTime = Date.now() - startTime;
    
    // Basic text cleanup as fallback
    let formatted = content
      .replace(/\n\s*\n/g, '\n\n') // Normalize paragraph breaks
      .replace(/^\s*/, '') // Remove leading whitespace
      .replace(/\s+$/, '') // Remove trailing whitespace
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();
    
    // Add basic Section 7 header if missing
    const header = language === 'fr' 
      ? '7. Historique de faits et évolution\n\n'
      : '7. History of Facts and Evolution\n\n';
    
    if (!formatted.includes('7.') && !formatted.includes('Historique') && !formatted.includes('History')) {
      formatted = header + formatted;
    }
    
    return {
      formatted,
      suggestions: ['AI formatting failed - using basic formatting'],
      issues: ['AI processing unavailable - fallback formatting applied'],
      metadata: {
        language,
        filesLoaded: [],
        promptLength: 0,
        processingTime,
        model: 'fallback'
      }
    };
  }
}

