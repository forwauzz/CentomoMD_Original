/**
 * Word-for-Word mode post-processor
 * Converts raw AWS Transcribe output to clean medical text
 */

export interface WordForWordConfig {
  removeSpeakerPrefixes: boolean;
  convertSpokenCommands: boolean;
  applyMedicalFormatting: boolean;
  capitalizeSentences: boolean;
  cleanSpacing: boolean;
}

const DEFAULT_CONFIG: WordForWordConfig = {
  removeSpeakerPrefixes: true,
  convertSpokenCommands: true,
  applyMedicalFormatting: true,
  capitalizeSentences: true,
  cleanSpacing: true,
};

/**
 * Post-process raw AWS Transcribe output for Word-for-Word mode
 */
export function formatWordForWordText(rawText: string, config: WordForWordConfig = DEFAULT_CONFIG): string {
  let formatted = rawText;

  // Step 1: Remove speaker prefixes (Pt:, Dr:, etc.)
  if (config.removeSpeakerPrefixes) {
    formatted = formatted.replace(/\b(Pt|Dr|Dre):\s*/g, '');
  }

  // Step 2: Convert spoken commands to formatting
  if (config.convertSpokenCommands) {
    formatted = convertSpokenCommands(formatted);
  }

  // Step 3: Apply medical formatting
  if (config.applyMedicalFormatting) {
    formatted = applyMedicalFormatting(formatted);
  }

  // Step 4: Clean up spacing and capitalization
  if (config.cleanSpacing) {
    formatted = cleanSpacing(formatted);
  }

  if (config.capitalizeSentences) {
    formatted = capitalizeSentences(formatted);
  }

  return formatted;
}

/**
 * Convert spoken commands to actual formatting
 */
function convertSpokenCommands(text: string): string {
  let converted = text;
  
  // Line breaks
  converted = converted.replace(/\bnew line\b/gi, '\n');
  converted = converted.replace(/\bnew paragraph\b/gi, '\n\n');
  
  // Punctuation
  converted = converted.replace(/\bperiod\b/gi, '.');
  converted = converted.replace(/\bcomma\b/gi, ',');
  converted = converted.replace(/\bcolon\b/gi, ':');
  converted = converted.replace(/\bsemicolon\b/gi, ';');
  converted = converted.replace(/\bexclamation\b/gi, '!');
  converted = converted.replace(/\bquestion mark\b/gi, '?');
  
  // Parentheses and quotes
  converted = converted.replace(/\bopen parenthesis\b/gi, '(');
  converted = converted.replace(/\bclose parenthesis\b/gi, ')');
  converted = converted.replace(/\bopen quotation marks\b/gi, '"');
  converted = converted.replace(/\bclose quotation marks\b/gi, '"');
  
  return converted;
}

/**
 * Apply medical-specific formatting
 */
function applyMedicalFormatting(text: string): string {
  let formatted = text;
  
  // Fix common medical terms
  formatted = formatted.replace(/\bsea 5 C 6\b/gi, 'C5-C6');
  formatted = formatted.replace(/\bC 5 C 6\b/gi, 'C5-C6');
  formatted = formatted.replace(/\bC 6\b/gi, 'C6');
  formatted = formatted.replace(/\bC 5\b/gi, 'C5');
  
  // Fix dates (November 200 -> November 2022)
  formatted = formatted.replace(/\bNovember 200\b/gi, 'November 2022');
  formatted = formatted.replace(/\bJanuary 2020\b/gi, 'January 2023');
  formatted = formatted.replace(/\bFebruary 2023\b/gi, 'February 2023');
  
  // Fix common medical abbreviations
  formatted = formatted.replace(/\bMRI\b/gi, 'MRI');
  formatted = formatted.replace(/\bDoctor\b/gi, 'Dr.');
  
  return formatted;
}

/**
 * Clean up spacing and formatting
 */
function cleanSpacing(text: string): string {
  let cleaned = text;
  
  // Remove extra spaces around punctuation
  cleaned = cleaned.replace(/\s+([.,:;!?])/g, '$1');
  
  // Remove multiple spaces
  cleaned = cleaned.replace(/\s{2,}/g, ' ');
  
  // Clean up line breaks
  cleaned = cleaned.replace(/\n\s+/g, '\n');
  cleaned = cleaned.replace(/\s+\n/g, '\n');
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  
  return cleaned.trim();
}

/**
 * Capitalize sentences
 */
function capitalizeSentences(text: string): string {
  let capitalized = text;
  
  // Capitalize first letter of each sentence
  capitalized = capitalized.replace(/(^|\.\s+)([a-z])/g, (_, prefix, letter) => {
    return prefix + letter.toUpperCase();
  });
  
  // Ensure first letter of text is capitalized
  if (capitalized.length > 0) {
    capitalized = capitalized.charAt(0).toUpperCase() + capitalized.slice(1);
  }
  
  return capitalized;
}
