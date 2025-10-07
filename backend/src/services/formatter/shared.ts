import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { extractNameWhitelist, stripInventedFirstNames } from '../../utils/names.js';
import { thinQuotes, keepRadiologyImpressionOnly, ensureParagraphFormatting } from '../../utils/quotes.js';
import { validateNames, validateQuoteCounts } from '../../utils/validation.js';

// Load environment variables
dotenv.config();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env['OPENAI_API_KEY'],
});

export interface FormattingResult {
  formatted: string;
  issues: string[];
  confidence_score?: number;
}

export interface ValidationResult {
  isValid: boolean;
  issues: string[];
  confidence_score: number;
}

/**
 * Main formatting function with guardrails
 * This is the core function that implements Phase 2 requirements
 */
export async function formatWithGuardrails(
  section: '7' | '8' | '11',
  language: 'fr' | 'en',
  input: string,
  extra?: string,
  options?: { nameWhitelist?: string[] }
): Promise<FormattingResult> {
  try {
    // 1. Pre-parse: Extract name whitelist from raw transcript
    const nameWhitelist = options?.nameWhitelist || extractNameWhitelist(input);
    
    // Load prompt system files
    const suffix = language === 'en' ? '_en' : '';
    const systemPrompt = await loadPromptFile(`section${section}_master${suffix}.md`);
    const guardrails = await loadGuardrailsFile(`section${section}_master${suffix}.json`);
    const goldenExample = await loadGoldenExampleFile(`section${section}_golden_example${suffix}.md`);

    // Prepare user message with name whitelist constraint
    const nameConstraint = nameWhitelist.length > 0 
      ? `\n\n[Contrainte de noms autorisés]\n${nameWhitelist.join('; ')}`
      : '';
    const userMessage = extra 
      ? `${input}\n\n[Extra Context]\n${extra}${nameConstraint}` 
      : `${input}${nameConstraint}`;

    // Call OpenAI with our prompt system
    let formatted = await callOpenAI(systemPrompt, userMessage, goldenExample, guardrails, nameWhitelist);

    // 2. Post-format repair pipeline
    // Step 1: Keep only radiology impression/conclusion
    formatted = keepRadiologyImpressionOnly(formatted);
    
    // Step 2: Thin quotes to enforce policy (strategic quotes only)
    formatted = thinQuotes(formatted, { maxTotal: 5, maxPerParagraph: 1 });
    
    // Step 3: Ensure proper paragraph formatting
    formatted = ensureParagraphFormatting(formatted);
    
    // Step 4: Strip invented first names
    formatted = stripInventedFirstNames(formatted, nameWhitelist);

    // 3. Enhanced validation with new checks
    const validation = await validateOutput(section, language, formatted, input, guardrails, nameWhitelist);

    return {
      formatted,
      issues: validation.issues,
      confidence_score: validation.confidence_score
    };

  } catch (error) {
    console.error('Error in formatWithGuardrails:', error);
    return {
      formatted: input, // Return original on error
      issues: [`Formatting error: ${error instanceof Error ? error.message : 'Unknown error'}`],
      confidence_score: 0
    };
  }
}

/**
 * Call OpenAI API with our prompt system
 */
async function callOpenAI(
  systemPrompt: string,
  userMessage: string,
  goldenExample: string,
  guardrails: any,
  nameWhitelist: string[]
): Promise<string> {
  try {
    // Build the complete system prompt with guardrails
    const fullSystemPrompt = buildSystemPrompt(systemPrompt, guardrails, goldenExample, nameWhitelist);

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Using the more cost-effective model
      messages: [
        {
          role: 'system',
          content: fullSystemPrompt
        },
        {
          role: 'user',
          content: userMessage
        }
      ],
      temperature: 0.1, // Low temperature for consistent formatting
      max_tokens: 2000, // Sufficient for medical reports
    });

    let formatted = response.choices[0]?.message?.content?.trim();
    
    if (!formatted) {
      throw new Error('No response from OpenAI');
    }

    // Remove any markdown headings that might have been added
    formatted = formatted.replace(/^#+\s*.*$/gm, '').trim();
    
    return formatted;

  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error(`OpenAI API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Build the complete system prompt with guardrails and examples
 */
function buildSystemPrompt(systemPrompt: string, guardrails: any, goldenExample: string, nameWhitelist: string[]): string {
  let fullPrompt = systemPrompt;

  // Add name constraint rule
  if (nameWhitelist.length > 0) {
    fullPrompt += '\n\n## NOMS PROPRES – RÈGLE STRICTE :\n';
    fullPrompt += 'Utiliser uniquement les noms/titres présents dans l\'entrée brute (liste transmise par l\'outil).\n';
    fullPrompt += 'Interdiction absolue d\'ajouter des prénoms ou variantes non dictées (p. ex. ne pas transformer « docteur Bussière » en « docteur Nicolas Bussière »).\n';
    fullPrompt += 'Si seule la forme « docteur X » est fournie, conserver telle quelle.\n';
  }

  // Add guardrails information
  if (guardrails?.style_rules) {
    fullPrompt += '\n\n## STYLE RULES (CRITICAL):\n';
    Object.entries(guardrails.style_rules).forEach(([key, value]) => {
      if (typeof value === 'boolean' && value) {
        fullPrompt += `- ${key}: REQUIRED\n`;
      } else if (typeof value === 'string') {
        fullPrompt += `- ${key}: ${value}\n`;
      }
    });
  }

  // Add terminology rules
  if (guardrails?.terminology?.preferred) {
    fullPrompt += '\n\n## TERMINOLOGY RULES:\n';
    Object.entries(guardrails.terminology.preferred).forEach(([key, value]) => {
      fullPrompt += `- Use "${value}" instead of "${key}"\n`;
    });
  }

  // Add golden example if available
  if (goldenExample) {
    fullPrompt += '\n\n## REFERENCE EXAMPLE:\n';
    fullPrompt += 'Use this as a reference for structure and style (DO NOT copy verbatim):\n\n';
    fullPrompt += goldenExample;
  }

  return fullPrompt;
}

/**
 * Validate the formatted output against guardrails
 */
async function validateOutput(
  _section: string,
  language: 'fr' | 'en',
  formatted: string,
  original: string,
  guardrails: any,
  nameWhitelist: string[]
): Promise<ValidationResult> {
  const issues: string[] = [];
  let confidenceScore = 100;

  // Check worker-first rule (allow for headings)
  if (guardrails?.style_rules?.worker_first) {
    if (language === 'fr') {
      // Remove markdown headings and check if content starts with worker designation
      const contentWithoutHeadings = formatted.replace(/^#+\s*.*$/gm, '').trim();
      if (!/^(Le travailleur|La travailleuse)/.test(contentWithoutHeadings)) {
        issues.push('Section must start with "Le travailleur" or "La travailleuse"');
        confidenceScore -= 20;
      }
    } else {
      // Remove markdown headings and check if content starts with worker designation
      const contentWithoutHeadings = formatted.replace(/^#+\s*.*$/gm, '').trim();
      if (!/^(The worker|The employee)/.test(contentWithoutHeadings)) {
        issues.push('Section must start with "The worker" or "The employee"');
        confidenceScore -= 20;
      }
    }
  }

  // Check for date-first violations
  if (guardrails?.style_rules?.forbid_date_first) {
    if (language === 'fr') {
      if (/^Le\s+\d{1,2}/.test(formatted)) {
        issues.push('Cannot start with a date - must start with worker designation');
        confidenceScore -= 15;
      }
    } else {
      if (/^On\s+\d{1,2}/.test(formatted)) {
        issues.push('Cannot start with a date - must start with worker designation');
        confidenceScore -= 15;
      }
    }
  }

  // Check for prohibited terms
  if (guardrails?.terminology?.prohibited) {
    guardrails.terminology.prohibited.forEach((term: string) => {
      const regex = new RegExp(term, 'i');
      if (regex.test(formatted)) {
        issues.push(`Prohibited term detected: ${term}`);
        confidenceScore -= 10;
      }
    });
  }

  // Check for invented content (basic checks)
  if (formatted.includes('diagnostic') && !original.includes('diagnostic')) {
    issues.push('Potential invented diagnosis detected');
    confidenceScore -= 15;
  }

  if (formatted.includes('résultat') && !original.includes('résultat')) {
    issues.push('Potential invented examination result detected');
    confidenceScore -= 15;
  }

  // Enhanced validation: Check for name enrichment
  const nameIssues = validateNames(formatted, nameWhitelist);
  issues.push(...nameIssues);
  confidenceScore -= nameIssues.length * 10;

  // Enhanced validation: Check quote counts
  const quoteIssues = validateQuoteCounts(formatted, 2);
  issues.push(...quoteIssues);
  confidenceScore -= quoteIssues.length * 10;

  return {
    isValid: issues.length === 0,
    issues,
    confidence_score: Math.max(0, confidenceScore)
  };
}

/**
 * Load prompt file
 */
async function loadPromptFile(filename: string): Promise<string> {
  const filepath = path.join(process.cwd(), 'prompts', filename);
  try {
    return await fs.promises.readFile(filepath, 'utf-8');
  } catch (error) {
    console.warn(`Could not load prompt file: ${filepath}`);
    return '';
  }
}

/**
 * Load guardrails configuration
 */
async function loadGuardrailsFile(filename: string): Promise<any> {
  const filepath = path.join(process.cwd(), 'prompts', filename);
  try {
    const content = await fs.promises.readFile(filepath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.warn(`Could not load guardrails file: ${filepath}`);
    return {};
  }
}

/**
 * Load golden example file
 */
async function loadGoldenExampleFile(filename: string): Promise<string> {
  const filepath = path.join(process.cwd(), 'prompts', filename);
  try {
    return await fs.promises.readFile(filepath, 'utf-8');
  } catch (error) {
    console.warn(`Could not load golden example file: ${filepath}`);
    return '';
  }
}
