// Canonical header definitions with regex patterns
export const S8_FR_HEADERS = [
  { canonical: "Appréciation subjective de l'évolution", pattern: /appréciation\s+subjective\s+de\s+l'évolution/i },
  { canonical: "Plaintes et problèmes", pattern: /plaintes\s+et\s+problèmes/i },
  { canonical: "Impact fonctionnel", pattern: /impact\s+fonctionnel/i },
  { canonical: "Observations neurologiques", pattern: /observations?\s+neurologiques?/i },
  { canonical: "Autres observations", pattern: /autres\s+observations?/i },
  { canonical: "Exclusions / mentions négatives", pattern: /exclusions?\s*\/\s*mentions?\s+négatives?/i },
  { canonical: "Références externes", pattern: /références?\s+externes?/i }
];

export const S8_EN_HEADERS = [
  { canonical: "Subjective appraisal of progression", pattern: /subjective\s+appraisal\s+of\s+progression/i },
  { canonical: "Complaints and problems", pattern: /complaints?\s+and\s+problems?/i },
  { canonical: "Functional impact", pattern: /functional\s+impact/i },
  { canonical: "Neurological observations", pattern: /neurological\s+observations?/i },
  { canonical: "Other observations", pattern: /other\s+observations?/i },
  { canonical: "Exclusions / negative mentions", pattern: /exclusions?\s*\/\s*negative\s+mentions?/i },
  { canonical: "External references", pattern: /external\s+references?/i }
];

export const S7_FR_HEADERS = [
  { canonical: "7. Historique de faits et évolution", pattern: /7\.\s*historique\s+de\s+faits\s+et\s+évolution/i }
];

export const S7_EN_HEADERS = [
  { canonical: "7. History of Facts and Clinical Evolution", pattern: /7\.\s*history\s+of\s+facts\s+and\s+clinical\s+evolution/i }
];

// Normalize accents for French
function normalizeAccents(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // Remove diacritics
    .toLowerCase();
}

export function validateSection8Headers(
  formatted: string, 
  outputLanguage: 'en'|'fr'
): { valid: boolean; issues: string[]; foundHeaders: string[] } {
  const issues: string[] = [];
  const foundHeaders: string[] = [];
  const headers = outputLanguage === 'fr' ? S8_FR_HEADERS : S8_EN_HEADERS;
  
  for (const header of headers) {
    const normalizedFormatted = normalizeAccents(formatted);
    const normalizedHeader = normalizeAccents(header.canonical);
    
    if (header.pattern.test(normalizedFormatted) || normalizedFormatted.includes(normalizedHeader)) {
      foundHeaders.push(header.canonical);
    } else {
      issues.push(`Missing required header: ${header.canonical}`);
    }
  }
  
  return {
    valid: issues.length === 0,
    issues,
    foundHeaders
  };
}

export function validateSection7Headers(
  formatted: string, 
  outputLanguage: 'en'|'fr'
): { valid: boolean; issues: string[]; foundHeaders: string[] } {
  const issues: string[] = [];
  const foundHeaders: string[] = [];
  const headers = outputLanguage === 'fr' ? S7_FR_HEADERS : S7_EN_HEADERS;
  
  for (const header of headers) {
    const normalizedFormatted = normalizeAccents(formatted);
    const normalizedHeader = normalizeAccents(header.canonical);
    
    if (header.pattern.test(normalizedFormatted) || normalizedFormatted.includes(normalizedHeader)) {
      foundHeaders.push(header.canonical);
    } else {
      issues.push(`Missing required header: ${header.canonical}`);
    }
  }
  
  return {
    valid: issues.length === 0,
    issues,
    foundHeaders
  };
}

export function validateCNESSTCompliance(
  section: '7'|'8'|'11',
  outputLanguage: 'en'|'fr'
): { valid: boolean; issues: string[]; metadata: any } {
  const issues: string[] = [];
  const metadata: any = {};
  
  if (['7','8','11'].includes(section) && outputLanguage === 'en') {
    issues.push('Non-official translation — CNESST requires French');
    metadata.cnesstTranslated = true;
  } else {
    metadata.cnesstTranslated = false;
  }
  
  return {
    valid: issues.length === 0,
    issues,
    metadata
  };
}

// Locale-specific validation
export function lintLocale(
  formatted: string, 
  outputLanguage: 'en'|'fr'
): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  
  if (outputLanguage === 'fr') {
    // French-Canadian specific rules
    if (!formatted.includes(' :') && formatted.includes(':')) {
      issues.push('Missing non-breaking space before colon in French');
    }
    if (!formatted.includes(' ;') && formatted.includes(';')) {
      issues.push('Missing non-breaking space before semicolon in French');
    }
    if (!formatted.includes(' !') && formatted.includes('!')) {
      issues.push('Missing non-breaking space before exclamation in French');
    }
    if (!formatted.includes(' ?') && formatted.includes('?')) {
      issues.push('Missing non-breaking space before question mark in French');
    }
  }
  
  return {
    valid: issues.length === 0,
    issues
  };
}
