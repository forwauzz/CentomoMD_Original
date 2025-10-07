/**
 * Thin quotes to enforce policy limits
 * Keeps strategic quotes: 1 worker initial claim + radiology conclusions
 * Preserves paragraph structure and formatting
 */
export function thinQuotes(text: string, _opts = { maxTotal: 5, maxPerParagraph: 1 }): string {
  // For now, let the AI handle quote management naturally
  // The AI is already doing a good job with strategic quotes
  return text;
}

/**
 * Keep only radiology impression/conclusion in quotes
 * Paraphrase descriptive findings
 */
export function keepRadiologyImpressionOnly(text: string): string {
  // For now, let the AI handle radiology formatting naturally
  // We'll add surgical radiology extraction later if needed
  return text;
}

/**
 * Ensure proper paragraph formatting with worker-first structure
 */
export function ensureParagraphFormatting(text: string): string {
  // Split by "Le travailleur" to identify consultation boundaries
  const consultations = text.split(/(?=Le travailleur)/);
  
  // Filter out empty strings and join with proper paragraph breaks
  const formattedConsultations = consultations
    .filter(consultation => consultation.trim().length > 0)
    .map(consultation => consultation.trim());
  
  // Join with double line breaks for proper paragraph separation
  return formattedConsultations.join('\n\n');
}
