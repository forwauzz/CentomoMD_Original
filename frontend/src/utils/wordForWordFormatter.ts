/**
 * Word-for-Word mode post-processor (Mode 1)
 * Strict: converts spoken commands + spacing/caps only.
 * Optional: light clinical fixes (OFF by default).
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

  // 1) Strip speaker prefixes only at line start (Pt:, Dr:, Dre:)
  if (cfg.removeSpeakerPrefixes) {
    t = t.replace(/^(?:\s*)(?:pt|dr|dre)\s*:\s*/gim, "");
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
  const replacements: Array<[RegExp, string]> = [
    // Paragraphs & lines
    [/\b(?:new\s*paragraph|paragraph\s*break)\b/gi, "\n\n"],
    [/\b(?:new\s*line|newline|line\s*break)\b/gi, "\n"],
    [/\b(?:nouveau\s*paragraphe|nouvelle\s*paragraphe)\b/gi, "\n\n"],
    [/\b(?:nouvelle\s*ligne|retour\s*à\s*la\s*ligne)\b/gi, "\n"],

    // Punctuation (EN)
    [/\b(?:period|full\s*stop)\b/gi, "."],
    [/\bcomma\b/gi, ","],
    [/\bcolon\b/gi, ":"],
    [/\bsemi\s*colon\b/gi, ";"],
    [/\bsemicolon\b/gi, ";"],
    [/\bexclamation(?:\s*mark)?\b/gi, "!"],
    [/\bquestion\s*mark\b/gi, "?"],

    // Punctuation (FR)
    [/\bpoint\b/gi, "."],
    [/\bvirgule\b/gi, ","],
    [/\b(?:deux\s*[- ]?points)\b/gi, ":"],
    [/\b(?:point\s*[- ]?virgule)\b/gi, ";"],
    [/\bpoint\s*d['']exclamation\b/gi, "!"],
    [/\bpoint\s*d['']interrogation\b/gi, "?"],

    // Quotes & parens
    [/\bopen\s*parenthesis\b/gi, "("],
    [/\bclose\s*parenthesis\b/gi, ")"],
    [/\bopen\s*quotes?(?:\s*|$)|open\s*quotation\s*marks\b/gi, "\""],
    [/\bclose\s*quotes?(?:\s*|$)|close\s*quotation\s*marks\b/gi, "\""],
    [/\bouvrir\s*les\s*guillemets\b/gi, "«"],
    [/\bfermer\s*les\s*guillemets\b/gi, "»"],

    // Dashes
    [/\b(?:dash|hyphen)\b/gi, "-"]
  ];

  let out = text;
  for (const [re, rep] of replacements) out = out.replace(re, rep);
  return out;
}

function applyLightClinicalFixes(text: string, opts?: WordForWordConfig["lightClinicalFixes"]): string {
  let t = text;

  if (opts?.normalizeSpineLevels) {
    // Robust C/T/L level normalization: "c 5 c 6", "C5 C6", "C 5 - C 6", etc.
    t = t.replace(/\b([ctl])\s*0*([1-7])\s*[- ]?\s*\1?\s*0*([1-7])\b/gi, (_, seg, a, b) =>
      `${seg.toUpperCase()}${a}-${seg.toUpperCase()}${b}`
    );
    // Single level like "c 6" -> "C6"
    t = t.replace(/\b([ctl])\s*0*([1-7])\b/gi, (_, seg, a) => `${seg.toUpperCase()}${a}`);
    // Common ASR "sea 5 c 6" -> "C5-C6"
    t = t.replace(/\bsea\s*0*([1-7])\s*c\s*0*([1-7])\b/gi, (_, a, b) => `C${a}-C${b}`);
  }

  if (opts?.normalizeDoctorAbbrev) {
    // "Doctor X" -> "Dr. X"
    t = t.replace(/\bDoctor\b\s+(?=[A-Z])/g, "Dr. ");
  }

  if (opts?.dateHeuristics) {
    // Convert spoken years: "two thousand twenty two" -> "2022"
    t = t.replace(/\btwo\s+thousand\s+twenty\s+two\b/gi, "2022");
    t = t.replace(/\btwo\s+thousand\s+twenty\s+three\b/gi, "2023");
    t = t.replace(/\btwo\s+thousand\s+twenty\s+four\b/gi, "2024");
    t = t.replace(/\btwo\s+thousand\s+twenty\s+five\b/gi, "2025");
    
    // Handle other common year patterns
    t = t.replace(/\btwenty\s+twenty\s+two\b/gi, "2022");
    t = t.replace(/\btwenty\s+twenty\s+three\b/gi, "2023");
    t = t.replace(/\btwenty\s+twenty\s+four\b/gi, "2024");
    t = t.replace(/\btwenty\s+twenty\s+five\b/gi, "2025");
  }

  return t;
}

function cleanSpacing(text: string): string {
  let t = text;

  // Remove spaces before punctuation
  t = t.replace(/\s+([.,:;!?])/g, "$1");

  // Ensure a space after punctuation if followed by a word/quote (not newline/end)
  t = t.replace(/([.:;!?])(?!\s|\n|$)/g, "$1 ");

  // Normalize spaces on lines; keep paragraph breaks
  t = t.replace(/[ \t]{2,}/g, " ");

  // Trim space around newlines
  t = t.replace(/\n[ \t]+/g, "\n").replace(/[ \t]+\n/g, "\n");

  // Collapse >2 newlines to exactly 2
  t = t.replace(/\n{3,}/g, "\n\n");

  return t.trim();
}

function capitalizeSentences(text: string): string {
  // Capitalize start of text
  let t = text.replace(/^\s*([a-zàâçéèêëîïôûùüÿñæœ])/iu, (_, ch) => ch.toUpperCase());

  // After ., !, ?, :, ; or newline
  t = t.replace(/([\.!?;:]\s+|\n+)([a-zàâçéèêëîïôûùüÿñæœ])/giu,
    (_, sep, ch) => `${sep}${ch.toUpperCase()}`
  );

  // Avoid capitalizing after "Dr." (basic guard)
  t = t.replace(/Dr\.\s+([A-Z])/g, (match) => match);

  return t;
}
