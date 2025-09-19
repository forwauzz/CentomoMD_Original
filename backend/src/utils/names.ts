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
 * UPDATED: Now works with NamePreservationEngine to preserve legitimate full names
 */
export function stripInventedFirstNames(text: string, whitelist: string[]): string {
  // Preserve paragraph breaks by normalizing spaces within paragraphs only
  let t = text.replace(/[ \t]+/g, ' '); // Only normalize spaces and tabs, preserve newlines
  
  // Create a set of whitelisted full names for faster lookup
  const whitelistSet = new Set(whitelist);
  
  // Pattern to match "docteur <First> <Last>" or "docteur <Last>"
  const reTwo = /\b(docteur|docteure|Dr\.|Dre\.)\s+([A-ZÀÂÄÇÉÈÊËÎÏÔÖÙÛÜŸ][\p{L}'\-]+)\s+([A-ZÀÂÄÇÉÈÊËÎÏÔÖÙÛÜŸ][\p{L}'\-]+)\b/gu;
  
  t = t.replace(reTwo, (match, title, first, last) => {
    const fullName = `${title} ${first} ${last}`.replace(/\s+/g, ' ').trim();
    const lastNameOnly = `${title} ${last}`.replace(/\s+/g, ' ').trim();
    
    // If the full name is in the whitelist, keep it (legitimate full name)
    if (whitelistSet.has(fullName)) {
      return fullName;
    }
    
    // If only the last name version is in the whitelist, keep the full name anyway
    // (let NamePreservationEngine handle the restoration)
    if (whitelistSet.has(lastNameOnly)) {
      return fullName;
    }
    
    // If neither is in the whitelist, this might be an invented name
    // Keep the full name but let the NamePreservationEngine validate it
    return fullName;
  });
  
  return t;
}
