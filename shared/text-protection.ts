export const TEMPLATE_START = '___TEMPLATE_START___';
export const TEMPLATE_END   = '___TEMPLATE_END___';
export const VERBATIM_START = '___VERBATIM_START___';
export const VERBATIM_END   = '___VERBATIM_END___';

export function separateProtectedRegions(text: string) {
  const out: Array<{ text: string; isProtected: boolean }> = [];
  if (!text.includes(TEMPLATE_START)) return [{ text, isProtected: false }];
  const parts = text.split(TEMPLATE_START);
  if (parts[0]) out.push({ text: parts[0], isProtected: false });
  for (let i = 1; i < parts.length; i++) {
    const [prot, rest] = parts[i].split(TEMPLATE_END);
    if (prot) out.push({ text: prot, isProtected: true });
    if (rest) out.push({ text: rest, isProtected: false });
  }
  return out;
}
