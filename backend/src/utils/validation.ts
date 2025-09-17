/**
 * Validate names against whitelist
 * Fail when names are enriched beyond what was dictated
 */
export function validateNames(draft: string, whitelist: string[]): string[] {
  const re = /\b(Dr\.|Dre\.|docteur|docteure)\s+[A-ZÀÂÄÇÉÈÊËÎÏÔÖÙÛÜŸ][\p{L}'\-]+\s+[A-ZÀÂÄÇÉÈÊËÎÏÔÖÙÛÜŸ][\p{L}'\-]+\b/gu;
  
  const enriched = [...draft.matchAll(re)]
    .map(m => m[0])
    .filter(full => {
      const parts = full.split(/\s+/);
      const last = parts[parts.length - 1];
      const title = parts[0];
      const candidate = `${title} ${last}`;
      return !whitelist.includes(candidate);
    });
    
  return enriched.length ? [`Name enrichment not allowed: ${enriched.join(', ')}`] : [];
}

/**
 * Validate quote counts against policy
 * Fail when quotes exceed maximum allowed
 */
export function validateQuoteCounts(draft: string, maxTotal = 2): string[] {
  const total = (draft.match(/[«""]/g) || []).length / 2; // rough pair count
  return total > maxTotal ? [`Too many quotes: found ${total}, max ${maxTotal}`] : [];
}
