import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { ClinicalEntities } from '../../../shared/types/clinical.js';
import { FLAGS } from '../../config/flags.js';

export interface Section8AIResult {
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
 * Enhanced Section 8 AI Formatter with comprehensive prompt system
 * Integrates master prompts, JSON configurations, and golden examples
 */
export class Section8AIFormatter {
  
  /**
   * Format Section 8 content using comprehensive AI prompt system
   * Follows exact flowchart implementation with 6-step process
   */
  static async formatSection8Content(
    content: string,
    clinicalEntities: ClinicalEntities,
    inputLanguage: 'fr' | 'en' = 'fr',
    model?: string,
    temperature?: number,
    seed?: number
  ): Promise<Section8AIResult> {
    const startTime = Date.now();
    const correlationId = `s8-ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      console.log(`[${correlationId}] 🎯 Starting Section 8 AI formatting (Flowchart Step 1-6)`, {
        inputLanguage,
        contentLength: content.length,
        hasClinicalEntities: !!clinicalEntities,
        timestamp: new Date().toISOString()
      });

      // STEP 1: Load language-specific files (Flowchart Step 1) - Always use French prompts
      console.log(`[${correlationId}] 📁 STEP 1: Loading French prompt files`);
      const promptFiles = await this.loadLanguageSpecificFiles('fr', correlationId);
      
      // STEP 2: Construct comprehensive system prompt (Flowchart Step 2-4)
      console.log(`[${correlationId}] 🔧 STEP 2-4: Constructing comprehensive system prompt`);
      const { systemPrompt, promptLength } = this.constructSystemPrompt(promptFiles, inputLanguage, correlationId);
      
      // STEP 3: Call AI provider with comprehensive prompt (Flowchart Step 5)
      console.log(`[${correlationId}] 🤖 STEP 5: Calling AI API`);
      const result = await this.callOpenAI(systemPrompt, content, inputLanguage, correlationId, model, temperature, seed);
      
      // STEP 4: Post-processing and validation (Flowchart Step 6)
      console.log(`[${correlationId}] ✅ STEP 6: Post-processing and validation`);
      const finalResult = this.postProcessResult(result, content, inputLanguage, correlationId, startTime, promptFiles, promptLength);
      
      console.log(`[${correlationId}] 🎉 Section 8 AI formatting completed successfully`, {
        inputLength: content.length,
        outputLength: finalResult.formatted.length,
        processingTime: finalResult.metadata?.processingTime,
        filesLoaded: finalResult.metadata?.filesLoaded
      });
      
      return finalResult;
      
    } catch (error) {
      console.error(`[${correlationId}] ❌ Section 8 AI formatting failed:`, error);
      
      // Fallback to basic formatting
      return this.fallbackFormatting(content, inputLanguage, correlationId, startTime);
    }
  }

  /**
   * Load language-specific prompt files (Flowchart Step 1)
   * Implements exact file selection logic from flowchart
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
      
      const promptsDir = join(process.cwd(), 'backend', 'prompts');
      const filesLoaded: string[] = [];
      
      // Load master prompt
      const masterPromptFile = language === 'fr' ? 'section8_master.md' : 'section8_master_en.md';
      const masterPromptPath = join(promptsDir, masterPromptFile);
      
      if (!existsSync(masterPromptPath)) {
        throw new Error(`Master prompt file not found: ${masterPromptFile}`);
      }
      
      const masterPrompt = readFileSync(masterPromptPath, 'utf8');
      filesLoaded.push(masterPromptFile);
      console.log(`[${correlationId}] ✅ Loaded master prompt: ${masterPromptFile}`);
      
      // Load JSON configuration
      const jsonConfigFile = language === 'fr' ? 'section8_master.json' : 'section8_master_en.json';
      const jsonConfigPath = join(promptsDir, jsonConfigFile);
      
      if (!existsSync(jsonConfigPath)) {
        throw new Error(`JSON config file not found: ${jsonConfigFile}`);
      }
      
      const jsonConfigContent = readFileSync(jsonConfigPath, 'utf8');
      const jsonConfig = JSON.parse(jsonConfigContent);
      filesLoaded.push(jsonConfigFile);
      console.log(`[${correlationId}] ✅ Loaded JSON config: ${jsonConfigFile}`);
      
      // Load golden example
      const goldenExampleFile = language === 'fr' ? 'section8_golden_example.md' : 'section8_golden_example_en.md';
      const goldenExamplePath = join(promptsDir, goldenExampleFile);
      
      if (!existsSync(goldenExamplePath)) {
        throw new Error(`Golden example file not found: ${goldenExampleFile}`);
      }
      
      const goldenExample = readFileSync(goldenExamplePath, 'utf8');
      filesLoaded.push(goldenExampleFile);
      console.log(`[${correlationId}] ✅ Loaded golden example: ${goldenExampleFile}`);
      
      console.log(`[${correlationId}] 📁 Successfully loaded ${filesLoaded.length} files for ${language}`);
      
      return {
        masterPrompt,
        jsonConfig,
        goldenExample,
        filesLoaded
      };
      
    } catch (error) {
      console.error(`[${correlationId}] ❌ Error loading language-specific files:`, error);
      throw error;
    }
  }

  /**
   * Construct comprehensive system prompt (Flowchart Step 2-4)
   * Combines master prompt, JSON config, and golden example
   */
  private static constructSystemPrompt(
    promptFiles: {
      masterPrompt: string;
      jsonConfig: any;
      goldenExample: string;
      filesLoaded: string[];
    },
    inputLanguage: 'fr' | 'en',
    correlationId: string
  ): { systemPrompt: string; promptLength: number } {
    try {
      console.log(`[${correlationId}] 🔧 Constructing comprehensive system prompt for input language: ${inputLanguage}`);
      
      // Extract key sections from JSON config
      const { structure, style_rules, terminology, qa_checks } = promptFiles.jsonConfig;
      
      // Build comprehensive system prompt with input language context
      let systemPrompt = '';
      
      // Add English input context if needed
      if (inputLanguage === 'en') {
        systemPrompt += `
## CONTEXTE D'ENTRÉE: Anglais
Le contenu fourni est en anglais. Formatez et traduisez-le en français selon les standards médicaux CNESST du Québec.

## INSTRUCTIONS DE TRADUCTION
- Traduisez le contenu anglais en français médical
- Maintenez la précision médicale pendant la traduction
- Utilisez la terminologie médicale française appropriée
- Préservez tous les détails cliniques et mesures
- Assurez-vous de la conformité CNESST en français

## TRADUCTION MÉDICALE (Anglais → Français)
- "patient" → "travailleur/travailleuse"
- "back pain" → "douleur dorsale"
- "knee injury" → "blessure au genou"
- "shoulder pain" → "douleur à l'épaule"
- "stiffness" → "raideur"
- "numbness" → "engourdissement"
- "swelling" → "enflure"
- "examination" → "examen"
- "assessment" → "évaluation"
- "treatment" → "traitement"
- "physiotherapy" → "physiothérapie"
- "occupational therapy" → "ergothérapie"

---
`;
      }
      
      systemPrompt += `${promptFiles.masterPrompt}

---

## CONFIGURATION JSON (FRANÇAIS)

### Structure Requirements:
${JSON.stringify(structure, null, 2)}

### Style Rules:
${JSON.stringify(style_rules, null, 2)}

### Terminology:
${JSON.stringify(terminology, null, 2)}

### Quality Assurance Checks:
${JSON.stringify(qa_checks, null, 2)}

---

## GOLDEN STANDARD EXAMPLE (FRANÇAIS)

${promptFiles.goldenExample}

---

## INSTRUCTIONS FINALES

1. **FORMATAGE OBLIGATOIRE**: Suivre exactement la structure des 7 sections requises
2. **TERMINOLOGIE MÉDICALE**: Utiliser exclusivement la terminologie médicale exacte
3. **PRÉSERVATION**: Conserver toutes les informations positives ET négatives
4. **QUALITÉ**: Respecter les standards CNESST professionnels
5. **LANGUE**: Formater en français québécois (toujours)

FORMATEZ LE TEXTE SUIVANT SELON CES INSTRUCTIONS:`;

      const promptLength = systemPrompt.length;
      console.log(`[${correlationId}] ✅ System prompt constructed (${promptLength} characters)`);
      
      return { systemPrompt, promptLength };
      
    } catch (error) {
      console.error(`[${correlationId}] ❌ Error constructing system prompt:`, error);
      throw error;
    }
  }

  /**
   * Call AI provider with comprehensive prompt (Flowchart Step 5)
   */
  private static async callOpenAI(
    systemPrompt: string,
    content: string,
    language: 'fr' | 'en',
    correlationId: string,
    model?: string,
    temperature?: number,
    seed?: number
  ): Promise<string> {
    try {
      // Use provided model, or check feature flag for default, or fallback to gpt-4o-mini
      const defaultModel = FLAGS.USE_CLAUDE_SONNET_4_AS_DEFAULT 
        ? 'claude-3-5-sonnet'  // Maps to claude-sonnet-4-20250514
        : (process.env['OPENAI_MODEL'] || 'gpt-4o-mini');
      const modelId = model || defaultModel;
      const temp = temperature !== undefined 
        ? temperature 
        : parseFloat(process.env['OPENAI_TEMPERATURE'] || '0.1');
      
      console.log(`[${correlationId}] 🤖 Calling AI API for ${language}`, {
        model: modelId,
        temperature: temp
      });
      
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
            content: content
          }
        ],
        temperature: temp,
        max_tokens: 2000,
        ...(seed !== undefined && { seed })
      });
      
      const result = response.content || '';
      
      if (!result) {
        throw new Error('AI provider returned empty response');
      }
      
      console.log(`[${correlationId}] ✅ AI API call successful`, {
        outputLength: result.length,
        usage: response.usage,
        cost: response.cost_usd,
        deterministic: response.deterministic
      });
      return result;
      
    } catch (error) {
      console.error(`[${correlationId}] ❌ AI API call failed:`, error);
      throw error;
    }
  }

  /**
   * Post-process and validate result (Flowchart Step 6)
   */
  private static postProcessResult(
    result: string,
    _originalContent: string,
    language: 'fr' | 'en',
    correlationId: string,
    startTime: number,
    promptFiles: { filesLoaded: string[] },
    promptLength: number
  ): Section8AIResult {
    try {
      console.log(`[${correlationId}] ✅ Post-processing and validating result`);
      
      const processingTime = Date.now() - startTime;
      const defaultModel = FLAGS.USE_CLAUDE_SONNET_4_AS_DEFAULT 
        ? 'claude-3-5-sonnet'  // Maps to claude-sonnet-4-20250514
        : (process.env['OPENAI_MODEL'] || 'gpt-4o-mini');
      const model = defaultModel;
      
      // Basic validation
      const issues: string[] = [];
      const suggestions: string[] = [];
      
      // Check if result contains required sections
      const requiredSections = [
        language === 'fr' ? 'Appréciation subjective de l\'évolution' : 'Subjective appreciation of progression',
        language === 'fr' ? 'Plaintes et problèmes' : 'Complaints and problems',
        language === 'fr' ? 'Impact fonctionnel' : 'Functional impact',
        language === 'fr' ? 'Observations neurologiques' : 'Neurological observations',
        language === 'fr' ? 'Autres observations' : 'Other observations',
        language === 'fr' ? 'Mentions d\'exclusion' : 'Exclusions/negative mentions',
        language === 'fr' ? 'Références externes' : 'External references'
      ];
      
      const missingSections = requiredSections.filter(section => 
        !result.toLowerCase().includes(section.toLowerCase())
      );
      
      if (missingSections.length > 0) {
        issues.push(`Missing required sections: ${missingSections.join(', ')}`);
      }
      
      // Check for worker terminology
      if (result.includes('patient') || result.includes('patiente')) {
        issues.push('Found "patient" terminology - should use "travailleur/travailleuse"');
      }
      
      // Performance warning
      if (processingTime > 10000) {
        suggestions.push(`Processing took ${processingTime}ms - consider optimization`);
      }
      
      console.log(`[${correlationId}] ✅ Post-processing completed`, {
        processingTime,
        issuesCount: issues.length,
        suggestionsCount: suggestions.length
      });
      
      return {
        formatted: result,
        ...(suggestions.length > 0 && { suggestions }),
        ...(issues.length > 0 && { issues }),
        metadata: {
          language,
          filesLoaded: promptFiles.filesLoaded,
          promptLength,
          processingTime,
          model
        }
      };
      
    } catch (error) {
      console.error(`[${correlationId}] ❌ Error in post-processing:`, error);
      throw error;
    }
  }

  /**
   * Fallback formatting when main process fails
   */
  private static fallbackFormatting(
    content: string,
    language: 'fr' | 'en',
    correlationId: string,
    startTime: number
  ): Section8AIResult {
    console.log(`[${correlationId}] 🔄 Using fallback formatting`);
    
    const processingTime = Date.now() - startTime;
    const model = process.env['OPENAI_MODEL'] || 'gpt-4o-mini';
    
    // Basic fallback - just clean up the content
    const fallbackResult = content
      .replace(/\bpatient\b/gi, language === 'fr' ? 'travailleur' : 'worker')
      .replace(/\bpatiente\b/gi, language === 'fr' ? 'travailleuse' : 'worker')
      .trim();
    
    return {
      formatted: fallbackResult,
      issues: ['Used fallback formatting due to processing error'],
      metadata: {
        language,
        filesLoaded: ['fallback'],
        promptLength: 0,
        processingTime,
        model
      }
    };
  }
}
