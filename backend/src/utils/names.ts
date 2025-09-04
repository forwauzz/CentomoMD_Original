/**
 * Extract name whitelist from raw transcript
 * Only captures what the user actually dictated
 */
export function extractNameWhitelist(raw: string): string[] {
  // Capture "Dr.|Dre.|docteur|docteure <LastName>" and keep only titles + last names
  const re = /\b(Dr\.|Dre\.|docteur|docteure)\s+([A-ZÀÂÄÇÉÈÊËÎÏÔÖÙÛÜŸ][\p{L}\-']+)\b/gu;
  const set = new Set<string>();
  
  for (const m of raw.matchAll(re)) {
    const normalized = `${m[1]} ${m[2]}`.replace(/\s+/g, ' ').trim();
    set.add(normalized);
  }
  
  return [...set]; // e.g., ["docteur Bussière","docteur Tremblay","docteur Dubois","docteur Leclerc"]
}

/**
 * Strip invented first names from formatted text
 * Enforces the whitelist by removing any first names not in the original transcript
 */
export function stripInventedFirstNames(text: string, whitelist: string[]): string {
  // Preserve paragraph breaks by normalizing spaces within paragraphs only
  let t = text.replace(/[ \t]+/g, ' '); // Only normalize spaces and tabs, preserve newlines
  
  // Any occurrence of "docteur <First> <Last>" where "docteur <Last>" isn't in whitelist → demote to "docteur <Last>"
  const reTwo = /\b(docteur|docteure|Dr\.|Dre\.)\s+([A-ZÀÂÄÇÉÈÊËÎÏÔÖÙÛÜŸ][\p{L}'\-]+)\s+([A-ZÀÂÄÇÉÈÊËÎÏÔÖÙÛÜŸ][\p{L}'\-]+)\b/gu;
  
  t = t.replace(reTwo, (_m, title, _first, last) => {
    const candidate = `${title} ${last}`.replace(/\s+/g, ' ').trim();
    return whitelist.includes(candidate) ? candidate : candidate; // always collapse to title+last
  });
  
  return t;
}
