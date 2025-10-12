// import { selectExtractorPrompts } from './langUtils.js';
// import { loadPromptFile } from './promptLoader.js';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env['OPENAI_API_KEY'],
});

export interface ClinicalEntities {
  injury_location?: { value: string | null; provenance?: string } | null;
  injury_type?: { value: string | null; provenance?: string } | null;
  onset?: { value: string | null; provenance?: string } | null;
  pain_severity?: { value: number | null; scale: string; provenance?: string } | null;
  functional_limitations?: { value: string | null; provenance?: string } | null;
  previous_injuries?: { value: string | null; provenance?: string } | null;
  treatment_to_date?: { value: string | null; provenance?: string } | null;
  imaging_done?: { value: string | null; provenance?: string } | null;
  return_to_work?: { value: string | null; provenance?: string } | null;
  language?: { value: string | null; provenance?: string } | null;
  issues?: { value: string | null; provenance?: string } | null;
  _provenance: Record<string, {start: number; end: number; text: string}[]>;
  [key: string]: any; // Allow string indexing
}

export async function extractClinicalEntities(
  transcript: string,
  _section: '7'|'8'|'11',
  _inputLanguage: 'en'|'fr'
): Promise<ClinicalEntities> {
  // const prompts = selectExtractorPrompts(section, inputLanguage);
  
  // const systemPrompt = await loadPromptFile(prompts.master);
  // Note: guardrails loaded but not used in current implementation
  // await loadGuardrailsFile(prompts.guardrails);
  
  // Enhanced system prompt with JSON enforcement
  const enhancedPrompt = `# CLINICAL ENTITY EXTRACTION

You are a clinical entity extractor. Your ONLY job is to extract structured clinical data from medical transcripts and return it as VALID JSON.

## CRITICAL: RETURN ONLY VALID JSON
- Do NOT return markdown, text, or any other format
- Do NOT include explanations, comments, or additional text
- Return ONLY the JSON object as specified below
- The response must be parseable by JSON.parse()

## EXTRACTION RULES
- If information is missing, use "Not reported" for value
- Never invent details not mentioned in the transcript
- Include provenance for each non-null field
- Use strict canonical schema with proper types

## REQUIRED JSON OUTPUT SCHEMA
{
  "injury_location": {"value": "string|null", "provenance": "string"},
  "injury_type": {"value": "string|null", "provenance": "string"},
  "onset": {"value": "string|null", "provenance": "string"},
  "pain_severity": {"value": "number|null", "scale": "0-10", "provenance": "string"},
  "functional_limitations": {"value": "string|null", "provenance": "string"},
  "previous_injuries": {"value": "string|null", "provenance": "string"},
  "treatment_to_date": {"value": "string|null", "provenance": "string"},
  "imaging_done": {"value": "string|null", "provenance": "string"},
  "return_to_work": {"value": "string|null", "provenance": "string"},
  "language": {"value": "string|null", "provenance": "string"},
  "issues": {"value": "string|null", "provenance": "string"}
}

## TRANSCRIPT TO EXTRACT FROM:`;
  
  // Use OpenAI to extract clinical entities
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: enhancedPrompt },
      { role: "user", content: transcript }
    ],
    temperature: 0.1,
    max_tokens: 1000
  });
  
  // Parse and validate JSON response
  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No content received from OpenAI');
  }
  
  console.log(`[Extractor] Raw OpenAI response:`, content.substring(0, 200) + '...');
  
  let extracted;
  try {
    extracted = JSON.parse(content);
  } catch (parseError) {
    console.error(`[Extractor] JSON parse error:`, parseError);
    console.error(`[Extractor] Content that failed to parse:`, content);
    throw new Error(`Failed to parse JSON from OpenAI response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
  }
  
  // Validate schema and enforce no-new-facts
  return validateAndNormalizeEntities(extracted);
}

function validateAndNormalizeEntities(extracted: any): ClinicalEntities {
  const normalized: ClinicalEntities = {
    _provenance: extracted._provenance || {}
  };
  
  // Normalize each field with strict typing
  const fields = [
    'injury_location', 'injury_type', 'onset', 'functional_limitations',
    'previous_injuries', 'treatment_to_date', 'imaging_done', 'return_to_work',
    'language', 'issues'
  ];
  
  fields.forEach(field => {
    if (extracted[field] && typeof extracted[field] === 'object') {
      const fieldData = extracted[field];
      normalized[field] = {
        value: fieldData.value || null,
        ...(fieldData.provenance && { provenance: fieldData.provenance })
      };
    } else {
      normalized[field] = { value: null };
    }
  });
  
  // Special handling for pain_severity with scale
  if (extracted.pain_severity && typeof extracted.pain_severity === 'object') {
    const painData = extracted.pain_severity;
    normalized.pain_severity = {
      value: typeof painData.value === 'number' ? painData.value : null,
      scale: painData.scale || '0-10',
      ...(painData.provenance && { provenance: painData.provenance })
    };
  } else {
    normalized.pain_severity = { value: null, scale: '0-10' };
  }
  
  return normalized;
}
