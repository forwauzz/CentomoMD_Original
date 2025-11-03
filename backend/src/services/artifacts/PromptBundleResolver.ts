import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

type Language = 'fr' | 'en';

interface Section7AiPaths {
  masterPromptPath: string;
  jsonConfigPath: string;
  goldenExamplePath: string;
  versionUsed: string;
}

interface Section7RdPaths {
  masterConfigPath: string;
  systemConductorPath: string;
  planPath: string;
  goldenCasesPath: string;
  versionUsed: string;
}

function readManifest(templateId: string): { defaultVersion: string; versions: any } | null {
  const manifestPath = join(process.cwd(), 'prompts', templateId, 'manifest.json');
  if (!existsSync(manifestPath)) return null;
  try {
    const raw = readFileSync(manifestPath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function resolveSection7AiPaths(language: Language): Section7AiPaths {
  const manifest = readManifest('section7');
  // Defaults mirror current repo paths
  const defaults = language === 'fr'
    ? {
        masterPromptPath: join(process.cwd(), 'prompts', 'section7_master.md'),
        jsonConfigPath: join(process.cwd(), 'prompts', 'section7_master.json'),
        goldenExamplePath: join(process.cwd(), 'prompts', 'section7_golden_example.md'),
      }
    : {
        masterPromptPath: join(process.cwd(), 'prompts', 'section7_master_en.md'),
        jsonConfigPath: join(process.cwd(), 'prompts', 'section7_master_en.json'),
        goldenExamplePath: join(process.cwd(), 'prompts', 'section7_golden_example_en.md'),
      };

  if (!manifest) {
    console.log('[PROOF] template=section7 version=none source=filesystem status=fallback');
    return { ...defaults, versionUsed: 'none' };
  }

  const version = manifest.defaultVersion || 'current';
  const ai = manifest.versions?.[version]?.ai_formatter?.[language];
  const resolved = {
    masterPromptPath: ai?.master || defaults.masterPromptPath,
    jsonConfigPath: ai?.json || defaults.jsonConfigPath,
    goldenExamplePath: ai?.golden || defaults.goldenExamplePath,
  };
  console.log(`[PROOF] template=section7 version=${version} source=local status=ok`);
  return { ...resolved, versionUsed: version };
}

export function resolveSection7RdPaths(): Section7RdPaths {
  const manifest = readManifest('section7');
  const defaults = {
    masterConfigPath: join(process.cwd(), 'configs', 'master_prompt_section7.json'),
    systemConductorPath: join(process.cwd(), 'prompts', 'system_section7_fr.xml'),
    planPath: join(process.cwd(), 'prompts', 'plan_section7_fr.xml'),
    goldenCasesPath: join(process.cwd(), 'training', 'golden_cases_section7.jsonl'),
  };

  if (!manifest) {
    console.log('[PROOF] template=section7-rd version=none source=filesystem status=fallback');
    return { ...defaults, versionUsed: 'none' };
  }

  const version = manifest.defaultVersion || 'current';
  const rd = manifest.versions?.[version]?.rd;
  const resolved = {
    masterConfigPath: rd?.master_config || defaults.masterConfigPath,
    systemConductorPath: rd?.system_xml || defaults.systemConductorPath,
    planPath: rd?.plan_xml || defaults.planPath,
    goldenCasesPath: rd?.golden_cases || defaults.goldenCasesPath,
  };
  console.log(`[PROOF] template=section7-rd version=${version} source=local status=ok`);
  return { ...resolved, versionUsed: version };
}


