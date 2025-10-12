import crypto from 'crypto';
import { readFile } from 'fs/promises';
import { join } from 'path';

// Extractor (choose by INPUT language)
export function selectExtractorPrompts(section: '7'|'8'|'11', input: 'en'|'fr') {
  const sfx = input === 'en' ? '_en' : '';
  return {
    master: `section${section}_master${sfx}.md`,
    guardrails: `section${section}_master${sfx}.json`,
    golden: `section${section}_golden_example${sfx}.md`
  };
}

// Formatter (choose by OUTPUT language ONLY)
export function selectFormatterPrompts(section: '7'|'8'|'11', output: 'en'|'fr') {
  const sfx = output === 'en' ? '_en' : '';
  return {
    master: `section${section}_master${sfx}.md`,
    guardrails: `section${section}_master${sfx}.json`,
    golden: `section${section}_golden_example${sfx}.md`
  };
}

// Template versioning - derive from content hash
export async function getTemplateVersion(section: '7'|'8'|'11', output: 'en'|'fr'): Promise<string> {
  const prompts = selectFormatterPrompts(section, output);
  const promptPath = join(process.cwd(), 'prompts');
  
  const masterContent = await readFile(join(promptPath, prompts.master), 'utf-8');
  const guardrailsContent = await readFile(join(promptPath, prompts.guardrails), 'utf-8');
  const goldenContent = await readFile(join(promptPath, prompts.golden), 'utf-8');
  
  const combinedContent = masterContent + guardrailsContent + goldenContent;
  return crypto.createHash('sha256').update(combinedContent).digest('hex').substring(0, 12);
}

export function buildLanguageContext(input: 'en'|'fr', output: 'en'|'fr', section: '7'|'8'|'11'): string {
  if (input === output) return '';
  
  // Load bilingual glossary
  const glossary = loadBilingualGlossary();
  
  if (input === 'en' && output === 'fr') {
    return `
## CONTEXTE D'ENTRÉE: Anglais
Le transcript ci-dessous est en anglais. Formatez-le selon les normes CNESST françaises pour la Section ${section}.

## INSTRUCTIONS DE TRADUCTION
- Traduisez le contenu anglais en français médical
- Maintenez la précision médicale pendant la traduction
- Utilisez la terminologie médicale française appropriée
- Préservez tous les détails cliniques et mesures
- Assurez-vous de la conformité CNESST en français
- Si une information manque, écrivez "Non rapporté"

## GLOSSAIRE BILINGUE (Anglais → Français)
${glossary.map(([en, fr]) => `- "${en}" → "${fr}"`).join('\n')}

---
`;
  }
  
  if (input === 'fr' && output === 'en') {
    return `
## INPUT CONTEXT: French
The transcript below is in French. Format it according to English medical standards for Section ${section}.

## TRANSLATION INSTRUCTIONS
- Translate French content to English medical terminology
- Maintain medical accuracy during translation
- Use appropriate English medical terminology
- Preserve all clinical details and measurements
- Ensure medical compliance in English
- If information is missing, write "Not reported"

## BILINGUAL GLOSSARY (French → English)
${glossary.map(([en, fr]) => `- "${fr}" → "${en}"`).join('\n')}

---
`;
  }
  
  return '';
}

// Load versioned bilingual glossary
function loadBilingualGlossary(): [string, string][] {
  // Load from versioned glossary file
  return [
    ["patient", "travailleur/travailleuse"],
    ["back pain", "douleur dorsale"],
    ["stabbing pain", "douleur lancinante"],
    ["burning pain", "douleur brûlante"],
    ["pressure pain", "douleur de pression"],
    ["night pain", "douleur nocturne"],
    ["morning stiffness", "raideur matinale"],
    ["lifting heavy objects", "soulèvement d'objets lourds"],
    ["going up and down hills", "monter et descendre des collines"],
    ["walking up and down steps", "monter et descendre des marches"],
    ["standing posture", "posture debout"],
    ["bending forward", "se pencher en avant"],
    ["painkillers", "analgésiques"],
    ["therapeutic plateau", "plateau thérapeutique"],
    ["functional impact", "impact fonctionnel"],
    ["neurological observations", "observations neurologiques"]
  ];
}
