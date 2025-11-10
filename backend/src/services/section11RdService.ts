import fs from 'fs/promises';
import { existsSync } from 'fs';
import yaml from 'js-yaml';
import { logger } from '../utils/logger.js';
import { FLAGS } from '../config/flags.js';

export interface Section11RdResult {
  success: boolean;
  formattedText: string;
  compliance: {
    rulesScore: number;
    passedRules: string[];
    failedRules: string[];
    issues: Array<{
      rule: string;
      ok: boolean;
      message?: string;
    }>;
  };
  quality: {
    managerVerdict?: 'ACCEPT' | 'REJECT' | 'PENDING';
    feedback?: string;
  };
  metadata: {
    processingTime: number;
    version: string;
    timestamp: string;
  };
}

export interface Section11Input {
  meta: {
    age: number;
    sex: string;
    dominance: string;
    occupation: string;
    employment_status: string;
    visit_date_expertise: string;
  };
  S1_mandate_points: string[];
  S2_diagnostics_acceptes: string[];
  S5_antecedents_relevants: {
    medical: string[];
    surgical: string[];
    at_site: string[];
    accidents: string[];
    habits: string[];
  };
  S7_historique: Array<{
    date: string;
    event: string;
    source: string;
  }>;
  S8_subjectif: {
    main_complaints: string[];
    AVQ_AVD: string;
  };
  S9_examen: {
    regions: Record<string, any>;
    findings_summary: string;
  };
  S10_paraclinique: string[];
  clinician_interpretations: {
    plateau_therapeutique: boolean;
    treatment_sufficiency: string;
    limitations_exist: boolean;
    limitations_description: string;
  };
  consolidation: boolean;
  AIPP_percent?: number | null;
  AIPP_details?: any;
}

export class Section11RdService {
  private readonly version = '1.0.0';

  constructor() {
    // Service uses PromptBundleResolver for artifact resolution (no local path needed)
  }

  /**
   * Process structured JSON input through Section 11 R&D pipeline
   */
  async processInput(
    inputData: Section11Input | string,
    model?: string,
    temperature?: number,
    seed?: number,
    templateVersion?: string
  ): Promise<Section11RdResult> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();

    try {
      logger.info('Starting Section 11 R&D pipeline processing');

      // Parse input if string
      let structuredInput: Section11Input;
      if (typeof inputData === 'string') {
        try {
          structuredInput = JSON.parse(inputData);
        } catch (parseError) {
          throw new Error(`Invalid JSON input: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
        }
      } else {
        structuredInput = inputData;
      }

      // Validate input structure
      this.validateInput(structuredInput);

      // Step 1: Load artifacts
      const artifacts = await this.loadArtifacts(templateVersion);

      // Step 2: Apply consolidation logic
      const logicConfig = this.applyConsolidationLogic(structuredInput, artifacts.logicmap);

      // Step 3: Format text using AI
      const formattedText = await this.formatText(structuredInput, artifacts, logicConfig, model, temperature, seed);

      // Step 4: Run compliance check
      const compliance = await this.runComplianceCheck(formattedText, structuredInput);

      // Step 5: Run quality assurance
      const quality = await this.runQualityAssurance(formattedText);

      const processingTime = Date.now() - startTime;

      const result: Section11RdResult = {
        success: true,
        formattedText,
        compliance,
        quality,
        metadata: {
          processingTime,
          version: this.version,
          timestamp
        }
      };

      logger.info(`Section 11 R&D pipeline completed in ${processingTime}ms`);
      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Section 11 R&D pipeline failed:', error);

      return {
        success: false,
        formattedText: `Error: ${errorMessage}`,
        compliance: {
          rulesScore: 0,
          passedRules: [],
          failedRules: [],
          issues: [{
            rule: 'pipeline_error',
            ok: false,
            message: errorMessage
          }]
        },
        quality: {},
        metadata: {
          processingTime: Date.now() - startTime,
          version: this.version,
          timestamp
        }
      };
    }
  }

  /**
   * Validate input structure against schema
   */
  private validateInput(input: Section11Input): void {
    const issues: string[] = [];

    if (!input.meta || !input.meta.age || !input.meta.sex) {
      issues.push('Missing required meta fields (age, sex)');
    }

    if (!input.S1_mandate_points || !Array.isArray(input.S1_mandate_points)) {
      issues.push('Missing or invalid S1_mandate_points');
    }

    if (!input.S2_diagnostics_acceptes || !Array.isArray(input.S2_diagnostics_acceptes)) {
      issues.push('Missing or invalid S2_diagnostics_acceptes');
    }

    if (!input.S7_historique || !Array.isArray(input.S7_historique)) {
      issues.push('Missing or invalid S7_historique');
    }

    if (!input.S8_subjectif || !input.S8_subjectif.main_complaints) {
      issues.push('Missing or invalid S8_subjectif');
    }

    if (!input.S9_examen || !input.S9_examen.findings_summary) {
      issues.push('Missing or invalid S9_examen');
    }

    if (typeof input.consolidation !== 'boolean') {
      issues.push('Missing or invalid consolidation field');
    }

    if (issues.length > 0) {
      throw new Error(`Input validation failed: ${issues.join(', ')}`);
    }
  }

  /**
   * Load all Section 11 artifacts using version-aware resolver
   */
  private async loadArtifacts(templateVersion?: string): Promise<{
    schema: any;
    logicmap: any;
    masterPrompt: string;
    examples: string;
  }> {
    try {
      // Use version-aware artifact resolver (like Section 7)
      const { resolveSection11RdPaths } = await import('../services/artifacts/PromptBundleResolver.js');
      const paths = await resolveSection11RdPaths(templateVersion);

      // Check if files exist
      if (!existsSync(paths.schemaPath)) {
        throw new Error(`Schema file not found: ${paths.schemaPath}`);
      }
      if (!existsSync(paths.logicmapPath)) {
        throw new Error(`Logicmap file not found: ${paths.logicmapPath}`);
      }
      if (!existsSync(paths.masterPromptPath)) {
        throw new Error(`Master prompt file not found: ${paths.masterPromptPath}`);
      }
      if (!existsSync(paths.goldenCasesPath)) {
        throw new Error(`Examples file not found: ${paths.goldenCasesPath}`);
      }

      // Load all artifacts from resolved paths
      const schema = JSON.parse(await fs.readFile(paths.schemaPath, 'utf-8'));
      const logicmapContent = await fs.readFile(paths.logicmapPath, 'utf-8');
      const logicmap = yaml.load(logicmapContent) as any;
      const masterPrompt = await fs.readFile(paths.masterPromptPath, 'utf-8');
      const examples = await fs.readFile(paths.goldenCasesPath, 'utf-8');

      logger.info('Section 11 artifacts loaded successfully', {
        schemaPath: paths.schemaPath,
        logicmapPath: paths.logicmapPath,
        masterPromptPath: paths.masterPromptPath,
        examplesPath: paths.goldenCasesPath,
        versionUsed: paths.versionUsed,
        source: paths.source
      });

      return {
        schema,
        logicmap,
        masterPrompt,
        examples
      };

    } catch (error) {
      logger.error('Failed to load Section 11 artifacts:', error);
      throw error;
    }
  }

  /**
   * Apply consolidation logic from logicmap
   */
  private applyConsolidationLogic(input: Section11Input, logicmap: any): any {
    const consolidationKey = input.consolidation ? 'true' : 'false';
    const logic = logicmap.consolidation?.[consolidationKey];

    if (!logic) {
      logger.warn(`No logic found for consolidation=${consolidationKey}, using default`);
      return {
        section_order: ['Résumé', 'Opinion clinique structurée', 'Motifs', 'Références'],
        include_fields: ['diagnostic', 'date_consolidation', 'soins', 'AIPP', 'limitations']
      };
    }

    return logic;
  }

  /**
   * Format text using AI with all artifacts
   */
  private async formatText(
    input: Section11Input,
    artifacts: { schema: any; logicmap: any; masterPrompt: string; examples: string },
    logicConfig: any,
    model?: string,
    temperature?: number,
    seed?: number
  ): Promise<string> {
    try {
      // Construct comprehensive prompt
      const systemPrompt = this.constructSystemPrompt(
        input,
        artifacts.masterPrompt,
        artifacts.logicmap,
        logicConfig,
        artifacts.examples
      );

      // Use flag-controlled default model
      const defaultModel = FLAGS.USE_CLAUDE_SONNET_4_AS_DEFAULT
        ? 'claude-3-5-sonnet'
        : (process.env['OPENAI_MODEL'] || 'gpt-4o-mini');
      const modelId = model || defaultModel;
      const temp = temperature !== undefined ? temperature : 0.1;

      logger.info('Section 11 AI formatting started', {
        model: modelId,
        temperature: temp,
        promptLength: systemPrompt.length,
        inputSize: JSON.stringify(input).length
      });

      // Use AIProvider abstraction
      const { getAIProvider } = await import('../lib/aiProvider.js');
      const provider = getAIProvider(modelId);

      // Prepare user message with structured input
      const userMessage = `Données structurées JSON:\n\`\`\`json\n${JSON.stringify(input, null, 2)}\n\`\`\``;

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
        max_tokens: 2000,
        ...(seed !== undefined ? { seed } : {})
      });

      const formattedText = response.content?.trim() || '';

      if (!formattedText) {
        throw new Error('Empty response from AI provider');
      }

      logger.info('Section 11 AI formatting completed', {
        originalLength: JSON.stringify(input).length,
        formattedLength: formattedText.length
      });

      return formattedText;

    } catch (error) {
      logger.error('Section 11 AI formatting failed, falling back to basic formatting:', error);

      // Fallback to basic formatting
      return this.basicFormatting(input, logicConfig);
    }
  }

  /**
   * Construct comprehensive system prompt
   */
  private constructSystemPrompt(
    input: Section11Input,
    masterPrompt: string,
    _logicmap: any,
    logicConfig: any,
    examples: string
  ): string {
    let prompt = masterPrompt;

    // Add consolidation logic instructions
    prompt += '\n\n## LOGIQUE DE CONSOLIDATION\n';
    if (input.consolidation) {
      prompt += 'Le travailleur est consolidé. Utiliser la structure standard.\n';
      prompt += `Ordre des sections: ${logicConfig.section_order?.join(', ') || 'Résumé, Opinion clinique structurée, Motifs, Références'}\n`;
    } else {
      prompt += 'Le travailleur n\'est PAS consolidé. Utiliser la structure "Non consolidé".\n';
      prompt += `Ordre des sections: ${logicConfig.section_order?.join(', ') || 'Résumé, Opinion clinique structurée (Non consolidé), Motifs, Références'}\n`;
      if (logicConfig.placeholders) {
        prompt += `Placeholders: ${JSON.stringify(logicConfig.placeholders, null, 2)}\n`;
      }
      if (logicConfig.add_phrase) {
        prompt += `Phrases à ajouter: ${logicConfig.add_phrase.join('; ')}\n`;
      }
    }

    // Add examples (first 2-3 entries from JSONL)
    const exampleLines = examples.split('\n').filter(line => line.trim()).slice(0, 3);
    if (exampleLines.length > 0) {
      prompt += '\n\n## EXEMPLES DE RÉFÉRENCE\n';
      prompt += 'Utilisez ces exemples comme référence pour la structure et le style:\n';
      exampleLines.forEach((line, idx) => {
        try {
          const example = JSON.parse(line);
          prompt += `\nExemple ${idx + 1}: ${example.inputs} → ${example.output}\n`;
        } catch {
          // Skip invalid JSON lines
        }
      });
    }

    return prompt;
  }

  /**
   * Basic formatting fallback
   */
  private basicFormatting(input: Section11Input, _logicConfig: any): string {
    let formatted = '11. Conclusion\n\n';

    // Résumé
    formatted += 'Résumé :\n';
    formatted += `Il s'agit d'un${input.meta.sex === 'F' ? 'e' : ''} ${input.meta.sex === 'F' ? 'travailleuse' : 'travailleur'} de ${input.meta.age} ans. `;
    if (input.S7_historique && input.S7_historique.length > 0) {
      const firstEvent = input.S7_historique[0];
      if (firstEvent) {
        formatted += `Événement d'origine: ${firstEvent.event}. `;
      }
    }
    formatted += '\n\n';

    // Opinion clinique structurée
    formatted += 'Opinion clinique structurée :\n';
    formatted += `Diagnostic :\n${input.S2_diagnostics_acceptes.join(', ')}\n\n`;

    if (input.consolidation) {
      formatted += `Date de consolidation :\nÀ déterminer.\n\n`;
      formatted += 'Existence de l\'atteinte permanente à l\'intégrité physique ou psychique :\n';
      formatted += 'Considérant le diagnostic retenu par la CNESST ainsi que sa consolidation;\n';
      formatted += 'Considérant tous les points mentionnés aux points précédents;\n';
      formatted += 'J\'attribue une atteinte permanente à l\'intégrité physique.\n\n';
    } else {
      formatted += 'Date de consolidation :\nNon consolidé.\n\n';
      formatted += 'Existence de l\'atteinte permanente à l\'intégrité physique ou psychique :\n';
      formatted += 'Étant donné que je ne consolide pas le travailleur;\n';
      formatted += 'Je ne peux statuer sur ce point.\n\n';
    }

    return formatted;
  }

  /**
   * Run compliance check
   */
  private async runComplianceCheck(formattedText: string, input: Section11Input): Promise<Section11RdResult['compliance']> {
    const issues: Array<{ rule: string; ok: boolean; message?: string }> = [];

    // Check header
    const hasCorrectHeader = formattedText.includes('11. Conclusion') || formattedText.includes('11. Conclusion');
    issues.push({
      rule: 'header',
      ok: hasCorrectHeader,
      ...(hasCorrectHeader ? {} : { message: 'Missing Section 11 header' })
    });

    // Check résumé
    const hasResume = /Résumé\s*:/i.test(formattedText);
    issues.push({
      rule: 'resume',
      ok: hasResume,
      ...(hasResume ? {} : { message: 'Missing Résumé section' })
    });

    // Check diagnostic
    const hasDiagnostic = /Diagnostic\s*:/i.test(formattedText);
    issues.push({
      rule: 'diagnostic',
      ok: hasDiagnostic,
      ...(hasDiagnostic ? {} : { message: 'Missing Diagnostic section' })
    });

    // Check consolidation logic
    if (input.consolidation) {
      const hasConsolidation = /Date de consolidation/i.test(formattedText);
      issues.push({
        rule: 'consolidation_date',
        ok: hasConsolidation,
        ...(hasConsolidation ? {} : { message: 'Missing consolidation date' })
      });
    } else {
      const hasNonConsolidated = /Non consolidé|ne consolide pas/i.test(formattedText);
      issues.push({
        rule: 'non_consolidated',
        ok: hasNonConsolidated,
        ...(hasNonConsolidated ? {} : { message: 'Missing non-consolidated statement' })
      });
    }

    // Check "Considérant" format
    const hasConsidérant = /Considérant/i.test(formattedText);
    issues.push({
      rule: 'considérant_format',
      ok: hasConsidérant,
      ...(hasConsidérant ? {} : { message: 'Missing "Considérant" format' })
    });

    const passedRules = issues.filter(issue => issue.ok).map(issue => issue.rule);
    const failedRules = issues.filter(issue => !issue.ok).map(issue => issue.rule);
    const rulesScore = issues.length > 0 ? passedRules.length / issues.length : 1;

    return {
      rulesScore,
      passedRules,
      failedRules,
      issues
    };
  }

  /**
   * Run quality assurance
   */
  private async runQualityAssurance(formattedText: string): Promise<Section11RdResult['quality']> {
    // Basic quality checks
    const hasMinimumLength = formattedText.length > 200;
    const hasStructure = /Résumé|Diagnostic|Opinion/i.test(formattedText);

    if (hasMinimumLength && hasStructure) {
      return {
        managerVerdict: 'ACCEPT',
        feedback: 'Section 11 meets basic quality requirements'
      };
    }

    return {
      managerVerdict: 'PENDING',
      feedback: 'Section 11 may need review'
    };
  }
}

// Export singleton instance
export const section11RdService = new Section11RdService();

