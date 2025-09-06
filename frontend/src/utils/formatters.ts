/**
 * Post-processor for AWS Transcribe Word-for-Word mode
 * Converts spoken commands like "new line", "period", etc. into proper formatting
 */

/**
 * Mapping of spoken phrases to formatting characters
 */
const SPOKEN_COMMAND_MAPPING = {
  // Line breaks
  'new line': '\n',
  'new paragraph': '\n\n',
  
  // Punctuation
  'period': '.',
  'comma': ',',
  'colon': ':',
  'semicolon': ';',
  'exclamation': '!',
  'exclamation mark': '!',
  'question mark': '?',
  
  // Parentheses and quotes
  'open parenthesis': '(',
  'close parenthesis': ')',
  'open quotation marks': '"',
  'close quotation marks': '"',
} as const;

/**
 * Apply spoken command formatting to raw transcript text
 * Converts spoken commands like "new line", "period", etc. into proper formatting
 * 
 * @param rawText - Raw transcript string that may contain spoken commands
 * @returns Cleaned string with spoken commands converted to formatting
 */
export function applySpokenCommandFormatting(rawText: string): string {
  let formatted = rawText;
  
  // Convert each spoken command to its formatting equivalent
  // Using case-insensitive matching with word boundaries
  for (const [spokenCommand, formatting] of Object.entries(SPOKEN_COMMAND_MAPPING)) {
    const regex = new RegExp(`\\b${spokenCommand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    formatted = formatted.replace(regex, formatting);
  }
  
  // Clean up extra spaces around punctuation
  formatted = formatted.replace(/\s+([.,:;!?])/g, '$1');
  formatted = formatted.replace(/\s{2,}/g, ' ');
  
  return formatted;
}
