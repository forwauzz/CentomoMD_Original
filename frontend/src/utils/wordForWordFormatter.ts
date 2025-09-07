/**
 * Word-for-Word mode post-processor (Mode 1)
 * Strict: converts spoken commands + spacing/caps only.
 * Optional: light clinical fixes (ON by default).
 * 
 * Streaming safety: Apply commands + spacing to streaming partials;
 * defer capitalization + clinical fixes to final segments to prevent cursor jumpiness.
 */

export interface WordForWordConfig {
  removeSpeakerPrefixes: boolean;
  convertSpokenCommands: boolean;
  capitalizeSentences: boolean;
  cleanSpacing: boolean;

  applyLightClinicalFixes?: boolean;
  lightClinicalFixes?: {
    normalizeSpineLevels?: boolean;
    normalizeDoctorAbbrev?: boolean;
    dateHeuristics?: boolean;
  };
}

export const DEFAULT_CONFIG: WordForWordConfig = {
  removeSpeakerPrefixes: true,
  convertSpokenCommands: true,
  capitalizeSentences: true,
  cleanSpacing: true,

  applyLightClinicalFixes: true,
  lightClinicalFixes: {
    normalizeSpineLevels: true,
    normalizeDoctorAbbrev: true,
    dateHeuristics: true
  }
};

/** Post-process raw AWS Transcribe output for Word-for-Word mode */
export function formatWordForWordText(rawText: string, cfg: WordForWordConfig = DEFAULT_CONFIG): string {
  let t = rawText ?? "";

  // 1) Strip speaker prefixes (Pt:, Dr:, Dre:, Pat:, Patient:, MD:) - anywhere in text
  if (cfg.removeSpeakerPrefixes) {
    t = t.replace(/(?:^|\s)(?:pt|dr|dre|pat|patient|md)\s*:\s*/gim, " ");
  }

  // 2) Convert spoken commands (EN/FR)
  if (cfg.convertSpokenCommands) {
    t = convertSpokenCommands(t);
  }

  // 3) Optional light clinical fixes (OFF by default)
  if (cfg.applyLightClinicalFixes) {
    t = applyLightClinicalFixes(t, cfg.lightClinicalFixes);
  }

  // 4) Clean spacing (respect \n and \n\n)
  if (cfg.cleanSpacing) {
    t = cleanSpacing(t);
  }

  // 5) Capitalize sentences after ., !, ?, :, ; or newline
  if (cfg.capitalizeSentences) {
    t = capitalizeSentences(t);
  }

  return t.trim();
}

function convertSpokenCommands(text: string): string {
  // First, protect decimal contexts before converting "point" to "."
  let t = text;
  
  // Protect FR decimals: "3 point 5" -> "3.5" (before generic "point" -> ".")
  t = t.replace(/\b(\d+)\s+point\s+(\d+)\b/gi, "$1.$2");
  
  // Protect anatomical "colon" contexts before generic "colon" -> ":"
  // Only convert "colon" to ":" if not followed by anatomical terms
  const anatomicalColonTerms = /\bcolon\s+(?:transverse|ascendant|descendant|sigmoid|droit|gauche|spastique|irritable)\b/gi;
  const protectedText = t.replace(anatomicalColonTerms, (match) => match.replace('colon', 'COLON_PROTECTED'));
  
  const replacements: Array<[RegExp, string]> = [
    // Paragraphs & lines - comprehensive patterns
    [/\b(?:new\s*paragraph|paragraph\s*break|new\s*para)\b/gi, "\n\n"],
    [/\b(?:new\s*line|newline|line\s*break)\b/gi, "\n"],
    [/\b(?:nouveau\s*paragraphe|nouvelle\s*paragraphe)\b/gi, "\n\n"],
    [/\b(?:nouvelle\s*ligne|retour\s*à\s*la\s*ligne)\b/gi, "\n"],

    // Punctuation (EN) - comprehensive patterns
    [/\b(?:period|full\s*stop|fullstop)\b/gi, "."],
    [/\bcomma\b/gi, ","],
    [/\bcolon\b/gi, ":"],
    [/\b(?:semi\s*colon|semicolon)\b/gi, ";"],
    [/\b(?:exclamation(?:\s*mark)?|exclamation\s*point)\b/gi, "!"],
    [/\b(?:question\s*mark|question\s*point)\b/gi, "?"],

    // Punctuation (FR) - with decimal protection
    [/\bpoint\b/gi, "."],
    [/\bvirgule\b/gi, ","],
    [/\b(?:deux\s*[- ]?points)\b/gi, ":"],
    [/\b(?:point\s*[- ]?virgule)\b/gi, ";"],
    [/\bpoint\s*d['']exclamation\b/gi, "!"],
    [/\bpoint\s*d['']interrogation\b/gi, "?"],

    // Quotes & parens
    [/\b(?:open\s*parenthesis|open\s*paren)\b/gi, "("],
    [/\b(?:close\s*parenthesis|close\s*paren)\b/gi, ")"],
    [/\b(?:open\s*quotes?(?:\s*|$)|open\s*quotation\s*marks)\b/gi, "\""],
    [/\b(?:close\s*quotes?(?:\s*|$)|close\s*quotation\s*marks)\b/gi, "\""],
    [/\bouvrir\s*les\s*guillemets\b/gi, "«"],
    [/\bfermer\s*les\s*guillemets\b/gi, "»"],

    // Dashes
    [/\b(?:dash|hyphen)\b/gi, "-"]
  ];

  let out = protectedText;
  for (const [re, rep] of replacements) out = out.replace(re, rep);
  
  // Restore protected anatomical colons
  out = out.replace(/COLON_PROTECTED/g, 'colon');
  
  return out;
}

function applyLightClinicalFixes(text: string, opts?: WordForWordConfig["lightClinicalFixes"]): string {
  let t = text;

  if (opts?.normalizeSpineLevels) {
    // Enhanced spine level normalization with valid ranges and FR joins
    // Valid ranges: C1-C7, T1-T12, L1-L5
    
    // Ranges with various separators: "C 5 - C 6", "C5 à C6", "C5 to C6", "C5 au C6"
    t = t.replace(/\b([ctl])\s*0*([1-9]|1[0-2]?)\s*(?:[- ]|à|au|to)\s*([ctl])\s*0*([1-9]|1[0-2]?)\b/gi, (_, seg1, a, seg2, b) => {
      const seg = seg1.toLowerCase();
      const numA = parseInt(a);
      const numB = parseInt(b);
      
      // Validate ranges
      if (seg === 'c' && numA >= 1 && numA <= 7 && numB >= 1 && numB <= 7) {
        return `${seg.toUpperCase()}${numA}-${seg.toUpperCase()}${numB}`;
      }
      if (seg === 't' && numA >= 1 && numA <= 12 && numB >= 1 && numB <= 12) {
        return `${seg.toUpperCase()}${numA}-${seg.toUpperCase()}${numB}`;
      }
      if (seg === 'l' && numA >= 1 && numA <= 5 && numB >= 1 && numB <= 5) {
        return `${seg.toUpperCase()}${numA}-${seg.toUpperCase()}${numB}`;
      }
      
      // Fallback: don't "correct" out-of-range values
      return `${seg1}${a}-${seg2}${b}`;
    });
    
    // Single levels: "c 6" -> "C6" (with range validation)
    t = t.replace(/\b([ctl])\s*0*([1-9]|1[0-2]?)\b/gi, (_, seg, num) => {
      const segment = seg.toLowerCase();
      const number = parseInt(num);
      
      // Validate single levels
      if (segment === 'c' && number >= 1 && number <= 7) {
        return `${seg.toUpperCase()}${number}`;
      }
      if (segment === 't' && number >= 1 && number <= 12) {
        return `${seg.toUpperCase()}${number}`;
      }
      if (segment === 'l' && number >= 1 && number <= 5) {
        return `${seg.toUpperCase()}${number}`;
      }
      
      // Fallback: don't "correct" out-of-range values
      return `${seg}${num}`;
    });
    
    // Common ASR errors: "sea 5 c 6" -> "C5-C6"
    t = t.replace(/\bsea\s*0*([1-7])\s*c\s*0*([1-7])\b/gi, (_, a, b) => {
      const numA = parseInt(a);
      const numB = parseInt(b);
      if (numA >= 1 && numA <= 7 && numB >= 1 && numB <= 7) {
        return `C${numA}-C${numB}`;
      }
      return `sea ${a} c ${b}`; // Fallback
    });
  }

  if (opts?.normalizeDoctorAbbrev) {
    // "Doctor X" -> "Dr. X"
    t = t.replace(/\bDoctor\b\s+(?=[A-Z])/g, "Dr. ");
  }

  if (opts?.dateHeuristics) {
    // EN year patterns: "two thousand (and) twenty three", "twenty twenty four"
    t = t.replace(/\btwo\s+thousand\s+(?:and\s+)?twenty\s+([0-9]+)\b/gi, (_, decade) => {
      const year = 2000 + parseInt(decade);
      return (year >= 2000 && year <= 2099) ? year.toString() : `two thousand twenty ${decade}`;
    });
    
    t = t.replace(/\btwenty\s+twenty\s+([0-9]+)\b/gi, (_, year) => {
      const fullYear = 2000 + parseInt(year);
      return (fullYear >= 2000 && fullYear <= 2099) ? fullYear.toString() : `twenty twenty ${year}`;
    });
    
    // FR year patterns: "deux mille vingt trois"
    t = t.replace(/\bdeux\s+mille\s+vingt\s+([0-9]+)\b/gi, (_, decade) => {
      const year = 2000 + parseInt(decade);
      return (year >= 2000 && year <= 2099) ? year.toString() : `deux mille vingt ${decade}`;
    });
    
    // Handle "deux mille" + any number 0-99
    t = t.replace(/\bdeux\s+mille\s+([0-9]{1,2})\b/gi, (_, year) => {
      const fullYear = 2000 + parseInt(year);
      return (fullYear >= 2000 && fullYear <= 2099) ? fullYear.toString() : `deux mille ${year}`;
    });
  }

  return t;
}

function cleanSpacing(text: string): string {
  let t = text;

  // Remove spaces before punctuation
  t = t.replace(/\s+([.,:;!?])/g, "$1");

  // Fix double/multiple punctuation (e.g., ",," -> ",")
  t = t.replace(/([.,:;!?])\1+/g, "$1");

  // Ensure a space after punctuation if followed by a word (not newline/end/quote/paren)
  t = t.replace(/([.:;!?])(?!\s|\n|$|["'»\)])/g, "$1 ");

  // Normalize spaces on lines; keep paragraph breaks
  t = t.replace(/[ \t]{2,}/g, " ");

  // Trim space around newlines
  t = t.replace(/\n[ \t]+/g, "\n").replace(/[ \t]+\n/g, "\n");

  // Collapse >2 newlines to exactly 2
  t = t.replace(/\n{3,}/g, "\n\n");

  // Clean up any remaining "Pt:" artifacts that might have been missed
  t = t.replace(/\s+Pt:\s*/g, " ");

  return t.trim();
}

function capitalizeSentences(text: string): string {
  // Capitalize start of text
  let t = text.replace(/^\s*([a-zàâçéèêëîïôûùüÿñæœ])/iu, (_, ch) => ch.toUpperCase());

  // After ., !, ?, :, ; or newline - with abbreviation guards
  t = t.replace(/([\.!?;:]\s+|\n+)([a-zàâçéèêëîïôûùüÿñæœ])/giu,
    (_, sep, ch) => `${sep}${ch.toUpperCase()}`
  );

  // Avoid capitalizing after common abbreviations
  const abbreviations = ['Dr\\.', 'Dre\\.', 'ex\\.', 'etc\\.', 'vs\\.', 'vs', 'cf\\.', 'p\\.', 'pp\\.', 'vol\\.', 'no\\.', 'n°'];
  for (const abbrev of abbreviations) {
    const regex = new RegExp(`(${abbrev})\\s+([A-Z])`, 'g');
    t = t.replace(regex, (match) => match);
  }

  return t;
}
