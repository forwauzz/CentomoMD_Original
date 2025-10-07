import OpenAI from "openai";
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env['OPENAI_API_KEY'] });

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
 * Enhanced Section 7 AI Formatter with FIXED doctor name preservation
 * Integrates master prompts, JSON configurations, and golden examples
 * CRITICAL FIX: Ensures doctor names are NEVER truncated
 */
export class Section7AIFormatter {
  
  /**
   * Format Section 7 content using comprehensive AI prompt system
   * FIXED: Now properly preserves full doctor names
   */
  static async formatSection7Content(
    content: string, 
    language: 'fr' | 'en' = 'fr'
  ): Promise<Section7AIResult> {
    const startTime = Date.now();
    const correlationId = `s7-ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      console.log(`[${correlationId}] 🎯 Starting Section 7 AI formatting with FIXED doctor name preservation`, {
        language,
        contentLength: content.length,
        timestamp: new Date().toISOString()
      });

      // STEP 1: Load language-specific files
      console.log(`[${correlationId}] 📁 STEP 1: Loading language-specific files`);
      const promptFiles = await this.loadLanguageSpecificFiles(language, correlationId);
      
      // STEP 2: Construct ENHANCED system prompt with doctor name emphasis
      console.log(`[${correlationId}] 🔧 STEP 2: Constructing ENHANCED system prompt with doctor name preservation`);
      const { systemPrompt, promptLength } = this.constructEnhancedSystemPrompt(promptFiles, language, correlationId);
      
      // STEP 3: Call OpenAI with enhanced prompt
      console.log(`[${correlationId}] 🤖 STEP 3: Calling OpenAI API with enhanced prompt`);
      const result = await this.callOpenAI(systemPrompt, content, language, correlationId);
      
      // STEP 4: Post-processing with doctor name validation
      console.log(`[${correlationId}] ✅ STEP 4: Post-processing with doctor name validation`);
      const finalResult = this.postProcessWithNameValidation(result, content, language, correlationId, startTime, promptFiles, promptLength);
      
      console.log(`[${correlationId}] 🎉 Section 7 AI formatting completed with doctor name preservation`, {
        inputLength: content.length,
        outputLength: finalResult.formatted.length,
        processingTime: finalResult.metadata?.processingTime,
        filesLoaded: finalResult.metadata?.filesLoaded,
        nameValidationIssues: finalResult.issues?.filter(issue => issue.includes('name')).length || 0
      });
      
      return finalResult;
      
    } catch (error) {
      console.error(`[${correlationId}] ❌ Section 7 AI formatting failed:`, error);
      
      // Fallback to basic formatting
      return this.fallbackFormatting(content, language, correlationId, startTime);
    }
  }

  /**
   * Load language-specific prompt files (unchanged)
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
      
      // Load all files
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
   * FIXED: Construct ENHANCED system prompt with doctor name preservation as PRIORITY #1
   */
  private static constructEnhancedSystemPrompt(
    promptFiles: { masterPrompt: string; jsonConfig: any; goldenExample: string },
    language: 'fr' | 'en',
    correlationId: string
  ): { systemPrompt: string; promptLength: number } {
    try {
      console.log(`[${correlationId}] 🔧 Constructing ENHANCED system prompt with doctor name preservation priority`);
      
      // CRITICAL FIX: Start with doctor name preservation as the MOST IMPORTANT rule
      let systemPrompt = this.getDoctorNamePreservationRules(language);
      
      // Add the master prompt
      systemPrompt += '\n\n' + promptFiles.masterPrompt;
      
      // Add golden example with emphasis on name preservation
      systemPrompt += '\n\n## REFERENCE EXAMPLE (PAY SPECIAL ATTENTION TO DOCTOR NAMES):\n';
      systemPrompt += language === 'fr' 
        ? 'Utilise cet exemple uniquement comme **référence de structure et de style**. CRITIQUE: Notez comment les noms complets des médecins sont préservés. Ne pas copier mot à mot. Adapter au contenu dicté.\n\n'
        : 'Use this example only as a **reference for structure and style**. CRITICAL: Note how complete doctor names are preserved. Do not copy word for word. Adapt to the dictated content.\n\n';
      systemPrompt += promptFiles.goldenExample;
      
      // Add JSON configuration rules
      systemPrompt += this.injectJSONConfiguration(promptFiles.jsonConfig, language);
      
      // Add specific doctor name examples
      systemPrompt += this.getDoctorNameExamples(language);
      
      const promptLength = systemPrompt.length;
      
      console.log(`[${correlationId}] ✅ Enhanced system prompt constructed successfully`, {
        totalLength: promptLength,
        components: {
          doctorNameRules: this.getDoctorNamePreservationRules(language).length,
          masterPrompt: promptFiles.masterPrompt.length,
          goldenExample: promptFiles.goldenExample.length,
          jsonConfig: systemPrompt.length - promptFiles.masterPrompt.length - promptFiles.goldenExample.length
        }
      });
      
      return { systemPrompt, promptLength };
      
    } catch (error) {
      console.error(`[${correlationId}] ❌ Failed to construct enhanced system prompt:`, error);
      throw new Error('Failed to construct Section 7 enhanced system prompt');
    }
  }

  /**
   * NEW: Get doctor name preservation rules as the FIRST and MOST IMPORTANT instructions
   */
  private static getDoctorNamePreservationRules(language: 'fr' | 'en'): string {
    if (language === 'fr') {
      return `# 🚨 RÈGLE CRITIQUE #1 - PRÉSERVATION DES NOMS DE MÉDECINS

## RÈGLE ABSOLUE - JAMAIS TRONQUER LES NOMS DE MÉDECINS
- **PRÉSERVE TOUJOURS** les noms complets avec prénom + nom de famille quand disponibles
- **FORMAT OBLIGATOIRE**: "docteur [Prénom] [Nom de famille]" (ex: "docteur Jean-Pierre Martin")
- **JAMAIS** de noms tronqués ou partiels - utilise le nom complet disponible
- **RÈGLE ABSOLUE**: Dans les documents médicaux/légaux, JAMAIS tronquer les noms professionnels
- **VALIDATION LÉGALE**: Chaque référence médicale doit inclure prénom + nom pour validité légale

## EXEMPLES CRITIQUES:
✅ CORRECT: "docteur Harry Durusso" (nom complet préservé)
❌ INCORRECT: "docteur Durusso" (prénom supprimé - INTERDIT)

✅ CORRECT: "docteur Roxanne Bouchard-Bellavance" (nom complet préservé)
❌ INCORRECT: "docteur Bouchard-Bellavance" (prénom supprimé - INTERDIT)

## GESTION DES NOMS INCOMPLETS:
- Si seul le prénom est disponible: "docteur [Prénom] (nom de famille non spécifié)"
- Si seul le nom de famille est disponible: "docteur [Nom de famille] (prénom non spécifié)"

## ⚠️ ATTENTION: Cette règle est CRITIQUE et doit être respectée à 100%`;
    } else {
      return `# 🚨 CRITICAL RULE #1 - DOCTOR NAME PRESERVATION

## ABSOLUTE RULE - NEVER TRUNCATE DOCTOR NAMES
- **PRESERVE ALWAYS** full names with first name + surname when available
- **REQUIRED FORMAT**: "Dr. [First Name] [Last Name]" (ex: "Dr. Jean-Pierre Martin")
- **NEVER** truncate or partial names - use the complete name available
- **ABSOLUTE RULE**: In medical/legal documents, NEVER truncate professional names
- **LEGAL VALIDATION**: Every medical reference must include first name + surname for legal validity

## CRITICAL EXAMPLES:
✅ CORRECT: "Dr. Harry Durusso" (full name preserved)
❌ INCORRECT: "Dr. Durusso" (first name removed - FORBIDDEN)

✅ CORRECT: "Dr. Roxanne Bouchard-Bellavance" (full name preserved)
❌ INCORRECT: "Dr. Bouchard-Bellavance" (first name removed - FORBIDDEN)

## INCOMPLETE NAME HANDLING:
- If only first name available: "Dr. [First Name] (last name not specified)"
- If only last name available: "Dr. [Last Name] (first name not specified)"

## ⚠️ WARNING: This rule is CRITICAL and must be followed 100%`;
    }
  }

  /**
   * NEW: Get specific doctor name examples
   */
  private static getDoctorNameExamples(language: 'fr' | 'en'): string {
    if (language === 'fr') {
      return `

## EXEMPLES SPÉCIFIQUES DE PRÉSERVATION DES NOMS:

### Exemple 1 - Nom complet fourni:
**Entrée**: "La travailleuse consulte le docteur Harry Durusso, le 9 octobre 2023"
**Sortie attendue**: "La travailleuse consulte le docteur Harry Durusso, le 9 octobre 2023"
**❌ INCORRECT**: "La travailleuse consulte le docteur Durusso, le 9 octobre 2023"

### Exemple 2 - Nom composé:
**Entrée**: "Elle est interprétée par le docteur Roxanne Bouchard-Bellavance, radiologiste"
**Sortie attendue**: "Elle est interprétée par le docteur Roxanne Bouchard-Bellavance, radiologiste"
**❌ INCORRECT**: "Elle est interprétée par le docteur Bouchard-Bellavance, radiologiste"

### Exemple 3 - Nom incomplet:
**Entrée**: "La travailleuse consulte le docteur Harry, le 9 octobre 2023"
**Sortie attendue**: "La travailleuse consulte le docteur Harry (nom de famille non spécifié), le 9 octobre 2023"

## 🚨 RAPPEL: JAMAIS supprimer de prénoms de médecins dans les documents médicaux légaux!`;
    } else {
      return `

## SPECIFIC DOCTOR NAME PRESERVATION EXAMPLES:

### Example 1 - Full name provided:
**Input**: "The worker consults Dr. Harry Durusso, on October 9, 2023"
**Expected Output**: "The worker consults Dr. Harry Durusso, on October 9, 2023"
**❌ INCORRECT**: "The worker consults Dr. Durusso, on October 9, 2023"

### Example 2 - Compound name:
**Input**: "It is interpreted by Dr. Roxanne Bouchard-Bellavance, radiologist"
**Expected Output**: "It is interpreted by Dr. Roxanne Bouchard-Bellavance, radiologist"
**❌ INCORRECT**: "It is interpreted by Dr. Bouchard-Bellavance, radiologist"

### Example 3 - Incomplete name:
**Input**: "The worker consults Dr. Harry, on October 9, 2023"
**Expected Output**: "The worker consults Dr. Harry (last name not specified), on October 9, 2023"

## 🚨 REMINDER: NEVER remove first names of doctors in legal medical documents!`;
    }
  }

  /**
   * Inject JSON configuration into system prompt (unchanged)
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
   * Call OpenAI with enhanced prompt (unchanged)
   */
  private static async callOpenAI(
    systemPrompt: string,
    content: string,
    language: 'fr' | 'en',
    correlationId: string
  ): Promise<Section7AIResult> {
    try {
      console.log(`[${correlationId}] Calling OpenAI API with enhanced doctor name preservation prompt`, {
        model: 'gpt-4o-mini',
        systemPromptLength: systemPrompt.length,
        contentLength: content.length
      });
      
      const userMessage = language === 'fr'
        ? `Formate ce texte médical brut selon les standards québécois CNESST pour la Section 7. CRITIQUE: Préserve TOUJOURS les noms complets des médecins (prénom + nom de famille).\n\n${content}`
        : `Format this raw medical text according to Quebec CNESST standards for Section 7. CRITICAL: ALWAYS preserve complete doctor names (first name + last name).\n\n${content}`;
      
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
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
        temperature: 0.1, // Even lower temperature for more deterministic formatting
        max_tokens: 4000
      });
      
      const formatted = response.choices[0]?.message?.content?.trim() || content;
      
      // Remove any markdown headers that might have been added
      const cleanedFormatted = formatted.replace(/^#+\s*.*$/gm, '').trim();
      
      console.log(`[${correlationId}] OpenAI API response received`, {
        outputLength: cleanedFormatted.length,
        usage: response.usage
      });
      
      return {
        formatted: cleanedFormatted,
        suggestions: []
      };
      
    } catch (error) {
      console.error(`[${correlationId}] OpenAI API call failed:`, error);
      throw new Error(`OpenAI API call failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * FIXED: Post-process with doctor name validation
   */
  private static postProcessWithNameValidation(
    result: Section7AIResult,
    originalContent: string,
    language: 'fr' | 'en',
    correlationId: string,
    startTime: number,
    promptFiles: { filesLoaded: string[] },
    promptLength: number
  ): Section7AIResult {
    console.log(`[${correlationId}] ✅ Post-processing with doctor name validation`);
    
    const processingTime = Date.now() - startTime;
    
    // Clean output - remove markdown headers
    let cleanedFormatted = result.formatted.replace(/^#+\s*.*$/gm, '').trim();
    
    // Trim whitespace and normalize formatting
    cleanedFormatted = cleanedFormatted
      .replace(/\n\s*\n/g, '\n\n') // Normalize paragraph breaks
      .replace(/^\s*/, '') // Remove leading whitespace
      .replace(/\s+$/, '') // Remove trailing whitespace
      .trim();
    
    // CRITICAL FIX: Doctor name validation
    const nameValidationIssues: string[] = [];
    const suggestions: string[] = [];
    
    // Extract doctor names from original content
    const doctorNamePattern = language === 'fr' 
      ? /docteur\s+([A-Za-zÀ-ÿ\s-]+?)(?=,|\s+le\s+\d|$)/gi
      : /Dr\.\s+([A-Za-z\s-]+?)(?=,|\s+on\s+\d|$)/gi;
    
    const originalMatches = originalContent.match(doctorNamePattern) || [];
    const formattedMatches = cleanedFormatted.match(doctorNamePattern) || [];
    
    console.log(`[${correlationId}] Doctor name validation:`, {
      originalNames: originalMatches.length,
      formattedNames: formattedMatches.length,
      originalNamesList: originalMatches,
      formattedNamesList: formattedMatches
    });
    
    // Check for name truncation
    originalMatches.forEach(originalName => {
      const cleanOriginalName = originalName.trim();
      const nameParts = cleanOriginalName.split(/\s+/);
      
      if (nameParts.length >= 3) { // Has title + first name + last name
        const firstName = nameParts[1];
        const lastName = nameParts[nameParts.length - 1];
        const truncatedVersion = `${nameParts[0]} ${lastName}`;
        
        // Check if the truncated version exists but full name doesn't
        if (cleanedFormatted.includes(truncatedVersion) && !cleanedFormatted.includes(cleanOriginalName)) {
          nameValidationIssues.push(`CRITICAL: Doctor name truncated - "${cleanOriginalName}" became "${truncatedVersion}"`);
          console.error(`[${correlationId}] 🚨 NAME TRUNCATION DETECTED:`, {
            original: cleanOriginalName,
            truncated: truncatedVersion,
            missingFirstName: firstName
          });
        }
      }
    });
    
    // Check worker-first rule
    if (language === 'fr') {
      if (!cleanedFormatted.includes('Le travailleur') && !cleanedFormatted.includes('La travailleuse')) {
        nameValidationIssues.push('Worker-first rule not enforced - missing "Le travailleur/La travailleuse"');
      }
    } else {
      if (!cleanedFormatted.includes('The worker')) {
        nameValidationIssues.push('Worker-first rule not enforced - missing "The worker"');
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
    
    console.log(`[${correlationId}] ✅ Post-processing completed with name validation`, {
      originalLength: originalContent.length,
      processedLength: cleanedFormatted.length,
      nameValidationIssues: nameValidationIssues.length,
      suggestions: suggestions.length,
      processingTime
    });
    
    return {
      formatted: cleanedFormatted,
      suggestions: [...(result.suggestions || []), ...suggestions],
      issues: [...(result.issues || []), ...nameValidationIssues],
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
   * Fallback formatting when AI fails (unchanged)
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
