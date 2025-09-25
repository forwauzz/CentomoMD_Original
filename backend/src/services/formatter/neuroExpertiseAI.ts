import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { ClinicalEntities } from '../../types/clinicalEntities.js';

export interface NeuroExpertiseAIResult {
  formatted: string;
  issues: string[];
  confidence_score: number;
  clinical_entities?: ClinicalEntities;
  metadata?: {
    processing_time: number;
    files_loaded: string[];
    prompt_length: number;
    language: string;
    error?: string;
  };
}

/**
 * Enhanced Neuro Expertise AI Formatter with comprehensive prompt system
 * Integrates master prompts, JSON configurations, and golden examples
 * Follows exact Section 8 pattern for consistency
 */
export class NeuroExpertiseAIFormatter {
  
  /**
   * Format Neuro Expertise content using comprehensive AI prompt system
   * Follows exact flowchart implementation with 6-step process
   */
  static async formatNeuroExpertiseContent(
    content: string,
    clinicalEntities: ClinicalEntities,
    language: 'fr' | 'en' = 'fr'
  ): Promise<NeuroExpertiseAIResult> {
    const startTime = Date.now();
    const correlationId = `neuro-ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      console.log(`[${correlationId}] 🧠 Starting Neuro Expertise AI formatting (Flowchart Step 1-6)`, {
        language,
        contentLength: content.length,
        hasClinicalEntities: !!clinicalEntities,
        timestamp: new Date().toISOString()
      });

      // STEP 1: Load language-specific files (Flowchart Step 1)
      console.log(`[${correlationId}] 📁 STEP 1: Loading language-specific files`);
      const promptFiles = await this.loadLanguageSpecificFiles(language, correlationId);
      
      // STEP 2: Construct comprehensive system prompt (Flowchart Step 2-4)
      console.log(`[${correlationId}] 🔧 STEP 2-4: Constructing comprehensive system prompt`);
      const { systemPrompt, promptLength } = this.constructSystemPrompt(promptFiles, language, correlationId);
      
      // STEP 3: Call OpenAI with comprehensive prompt (Flowchart Step 5)
      console.log(`[${correlationId}] 🤖 STEP 5: Calling OpenAI API`);
      const result = await this.callOpenAI(systemPrompt, content, language, correlationId);
      
      // STEP 4: Post-processing and validation (Flowchart Step 6)
      console.log(`[${correlationId}] ✅ STEP 6: Post-processing and validation`);
      const finalResult = this.postProcessResult(result, content, language, correlationId, startTime, promptFiles, promptLength);
      
      console.log(`[${correlationId}] 🎯 Neuro Expertise AI formatting completed successfully`, {
        processingTime: finalResult.metadata?.processing_time,
        confidenceScore: finalResult.confidence_score,
        issuesCount: finalResult.issues.length
      });
      
      return finalResult;
      
    } catch (error) {
      console.error(`[${correlationId}] ❌ Neuro Expertise AI formatting error:`, error);
      return this.fallbackFormatting(content, language, correlationId, startTime);
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
      const masterPromptFile = language === 'fr' ? 'neuro_master.md' : 'neuro_master_en.md';
      const masterPromptPath = join(promptsDir, masterPromptFile);
      
      if (!existsSync(masterPromptPath)) {
        throw new Error(`Master prompt file not found: ${masterPromptFile}`);
      }
      
      const masterPrompt = readFileSync(masterPromptPath, 'utf8');
      filesLoaded.push(masterPromptFile);
      console.log(`[${correlationId}] ✅ Loaded master prompt: ${masterPromptFile}`);
      
      // Load JSON configuration
      const jsonConfigFile = language === 'fr' ? 'neuro_master.json' : 'neuro_master_en.json';
      const jsonConfigPath = join(promptsDir, jsonConfigFile);
      
      if (!existsSync(jsonConfigPath)) {
        throw new Error(`JSON config file not found: ${jsonConfigFile}`);
      }
      
      const jsonConfigContent = readFileSync(jsonConfigPath, 'utf8');
      const jsonConfig = JSON.parse(jsonConfigContent);
      filesLoaded.push(jsonConfigFile);
      console.log(`[${correlationId}] ✅ Loaded JSON config: ${jsonConfigFile}`);
      
      // Load golden example
      const goldenExampleFile = language === 'fr' ? 'neuro_golden_example.md' : 'neuro_golden_example_en.md';
      const goldenExamplePath = join(promptsDir, goldenExampleFile);
      
      if (!existsSync(goldenExamplePath)) {
        throw new Error(`Golden example file not found: ${goldenExampleFile}`);
      }
      
      const goldenExample = readFileSync(goldenExamplePath, 'utf8');
      filesLoaded.push(goldenExampleFile);
      console.log(`[${correlationId}] ✅ Loaded golden example: ${goldenExampleFile}`);
      
      console.log(`[${correlationId}] 📚 All files loaded successfully:`, filesLoaded);
      
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
    promptFiles: { masterPrompt: string; jsonConfig: any; goldenExample: string; filesLoaded: string[] },
    language: 'fr' | 'en',
    correlationId: string
  ): { systemPrompt: string; promptLength: number } {
    try {
      console.log(`[${correlationId}] 🔧 Constructing comprehensive system prompt`);
      
      // Extract key configuration elements
      const { jsonConfig, masterPrompt, goldenExample } = promptFiles;
      
      // Build comprehensive system prompt
      let systemPrompt = '';
      
      // Add master prompt (core instructions)
      systemPrompt += masterPrompt + '\n\n';
      
      // Add JSON configuration context
      systemPrompt += `## CONFIGURATION CONTEXT\n`;
      systemPrompt += `Template ID: ${jsonConfig.template_id}\n`;
      systemPrompt += `Language: ${jsonConfig.language}\n`;
      systemPrompt += `Version: ${jsonConfig.version}\n\n`;
      
      // Add mandatory sections from config
      if (jsonConfig.structure_rules?.mandatory_sections) {
        systemPrompt += `## MANDATORY SECTIONS\n`;
        systemPrompt += `You MUST include these sections in your output:\n`;
        jsonConfig.structure_rules.mandatory_sections.forEach((section: string, index: number) => {
          systemPrompt += `${index + 1}. ${section}\n`;
        });
        systemPrompt += '\n';
      }
      
      // Add golden example
      systemPrompt += `## GOLDEN EXAMPLE\n`;
      systemPrompt += `Follow this exact format and structure:\n\n`;
      systemPrompt += goldenExample + '\n\n';
      
      // Add final instructions
      systemPrompt += `## FINAL INSTRUCTIONS\n`;
      systemPrompt += `- Follow the golden example format EXACTLY\n`;
      systemPrompt += `- Preserve all neurological scores and measurements\n`;
      systemPrompt += `- Maintain CNESST compliance structure\n`;
      systemPrompt += `- Use proper medical terminology\n`;
      systemPrompt += `- Never invent content not present in the input\n`;
      
      const promptLength = systemPrompt.length;
      console.log(`[${correlationId}] 📏 System prompt constructed: ${promptLength} characters`);
      
      return { systemPrompt, promptLength };
      
    } catch (error) {
      console.error(`[${correlationId}] ❌ Error constructing system prompt:`, error);
      throw error;
    }
  }

  /**
   * Call OpenAI API with comprehensive prompt (Flowchart Step 5)
   */
  private static async callOpenAI(
    systemPrompt: string,
    content: string,
    language: 'fr' | 'en',
    correlationId: string
  ): Promise<string> {
    try {
      console.log(`[${correlationId}] 🤖 Calling OpenAI API`);
      
      // Import OpenAI dynamically to avoid issues if not available
      const { OpenAI } = await import('openai');
      
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY not found in environment variables');
      }
      
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      
      const userMessage = `Please format this neurological evaluation dictation according to the Neuro Expertise template:\n\n${content}`;
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
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
        temperature: 0.1, // Low temperature for consistent medical formatting
        max_tokens: 4000,
        top_p: 0.9,
        frequency_penalty: 0.1,
        presence_penalty: 0.1
      });
      
      const result = completion.choices[0]?.message?.content || '';
      
      console.log(`[${correlationId}] ✅ OpenAI API call completed`, {
        inputLength: content.length,
        outputLength: result.length,
        tokensUsed: completion.usage?.total_tokens || 0
      });
      
      return result;
      
    } catch (error) {
      console.error(`[${correlationId}] ❌ OpenAI API call failed:`, error);
      throw error;
    }
  }

  /**
   * Post-process and validate result (Flowchart Step 6)
   */
  private static postProcessResult(
    result: string,
    originalContent: string,
    language: 'fr' | 'en',
    correlationId: string,
    startTime: number,
    promptFiles: { filesLoaded: string[] },
    promptLength: number
  ): NeuroExpertiseAIResult {
    try {
      console.log(`[${correlationId}] ✅ Post-processing and validation`);
      
      const processingTime = Date.now() - startTime;
      const issues: string[] = [];
      
      // Basic validation
      if (!result || result.trim().length === 0) {
        issues.push('Empty result from AI formatting');
        return {
          formatted: originalContent,
          issues,
          confidence_score: 0.1,
          metadata: {
            processing_time: processingTime,
            files_loaded: promptFiles.filesLoaded,
            prompt_length: promptLength,
            language,
            error: 'Empty AI result'
          }
        };
      }
      
      // Check for required sections (basic validation)
      const requiredSections = [
        'MANDAT D\'ÉVALUATION',
        'EXAMEN NEUROLOGIQUE',
        'EN RÉPONSE AU MANDAT'
      ];
      
      const englishSections = [
        'EVALUATION MANDATE',
        'NEUROLOGICAL EXAMINATION', 
        'IN RESPONSE TO MANDATE'
      ];
      
      const sectionsToCheck = language === 'fr' ? requiredSections : englishSections;
      
      for (const section of sectionsToCheck) {
        if (!result.includes(section)) {
          issues.push(`Missing required section: ${section}`);
        }
      }
      
      // Calculate confidence score based on validation
      let confidenceScore = 0.8; // Base score
      if (issues.length > 0) {
        confidenceScore = Math.max(0.3, 0.8 - (issues.length * 0.1));
      }
      
      // Check for neurological score preservation
      const hasNeurologicalScores = /(\d+\/\d+)|(\d+\/\d+)|(\d+%)/.test(result);
      if (hasNeurologicalScores) {
        confidenceScore = Math.min(0.95, confidenceScore + 0.1);
      }
      
      console.log(`[${correlationId}] 📊 Post-processing completed`, {
        processingTime,
        issuesCount: issues.length,
        confidenceScore,
        hasNeurologicalScores
      });
      
      return {
        formatted: result,
        issues,
        confidence_score: confidenceScore,
        metadata: {
          processing_time: processingTime,
          files_loaded: promptFiles.filesLoaded,
          prompt_length: promptLength,
          language
        }
      };
      
    } catch (error) {
      console.error(`[${correlationId}] ❌ Post-processing error:`, error);
      return {
        formatted: result || originalContent,
        issues: [`Post-processing error: ${error instanceof Error ? error.message : 'Unknown error'}`],
        confidence_score: 0.2,
        metadata: {
          processing_time: Date.now() - startTime,
          files_loaded: promptFiles.filesLoaded,
          prompt_length: promptLength,
          language,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Fallback formatting when AI processing fails
   */
  private static fallbackFormatting(
    content: string,
    language: 'fr' | 'en',
    correlationId: string,
    startTime: number
  ): NeuroExpertiseAIResult {
    console.log(`[${correlationId}] 🔄 Using fallback formatting`);
    
    const processingTime = Date.now() - startTime;
    
    // Basic fallback: return original content with minimal formatting
    let fallbackContent = content;
    
    // Add basic structure if missing
    if (!fallbackContent.includes('. Évaluation neurologique') && !fallbackContent.includes('. Neurological evaluation')) {
      const header = language === 'fr' 
        ? '. Évaluation neurologique et expertise médicale\n\n'
        : '. Neurological evaluation and medical expertise\n\n';
      fallbackContent = header + fallbackContent;
    }
    
    return {
      formatted: fallbackContent,
      issues: ['AI formatting failed, using fallback formatting'],
      confidence_score: 0.3,
      metadata: {
        processing_time: processingTime,
        files_loaded: [],
        prompt_length: 0,
        language,
        error: 'AI formatting failed'
      }
    };
  }
}
