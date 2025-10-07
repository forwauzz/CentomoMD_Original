// Template name configuration - easily customizable
export const TEMPLATE_NAMES = {
  // Original templates
  WORD_FOR_WORD: 'Word-for-Word Formatter',
  SECTION_7_AI: 'Section 7 AI Formatter',
  
  // Template combination names
  SECTION_7_ONLY: 'Section 7 Template Only',
  SECTION_7_VERBATIM: 'Section 7 Template + Verbatim', 
  SECTION_7_FULL: 'Section 7 Template + Verbatim + Voice Commands',
  
  // French versions (if needed)
  FR: {
    WORD_FOR_WORD: 'Formateur Mot-à-Mot',
    SECTION_7_AI: 'Formateur IA Section 7',
    SECTION_7_ONLY: 'Template Section 7 Seulement',
    SECTION_7_VERBATIM: 'Template Section 7 + Verbatim',
    SECTION_7_FULL: 'Template Section 7 + Verbatim + Commandes Vocales',
  }
} as const;

// Type for template keys (excluding FR)
type TemplateKey = Exclude<keyof typeof TEMPLATE_NAMES, 'FR'>;

// Helper function to get template name based on language
export const getTemplateName = (key: TemplateKey, language: 'en' | 'fr' = 'en'): string => {
  if (language === 'fr' && key in TEMPLATE_NAMES.FR) {
    return TEMPLATE_NAMES.FR[key as keyof typeof TEMPLATE_NAMES.FR];
  }
  return TEMPLATE_NAMES[key];
};
