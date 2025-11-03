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
  // Try repo root first (if running from backend directory)
  const repoRootManifest = join(process.cwd(), '..', 'prompts', templateId, 'manifest.json');
  const cwdManifest = join(process.cwd(), 'prompts', templateId, 'manifest.json');
  
  // Check repo root first (common case when backend runs from backend/)
  if (existsSync(repoRootManifest)) {
    try {
      const raw = readFileSync(repoRootManifest, 'utf8');
      return JSON.parse(raw);
    } catch {
      // Fall through to next attempt
    }
  }
  
  // Fallback to current directory
  if (existsSync(cwdManifest)) {
    try {
      const raw = readFileSync(cwdManifest, 'utf8');
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  
  return null;
}

function resolveBasePath(): string {
  // Check if we're in backend/ directory and need to go up one level
  const repoPrompts = join(process.cwd(), '..', 'prompts');
  
  // Check if repo root prompts exist (common case)
  if (existsSync(repoPrompts)) {
    return join(process.cwd(), '..');
  }
  
  return process.cwd();
}

export function resolveSection7AiPaths(language: Language): Section7AiPaths {
  const manifest = readManifest('section7');
  const basePath = resolveBasePath();
  
  // Defaults mirror current repo paths
  const defaults = language === 'fr'
    ? {
        masterPromptPath: join(basePath, 'prompts', 'section7_master.md'),
        jsonConfigPath: join(basePath, 'prompts', 'section7_master.json'),
        goldenExamplePath: join(basePath, 'prompts', 'section7_golden_example.md'),
      }
    : {
        masterPromptPath: join(basePath, 'prompts', 'section7_master_en.md'),
        jsonConfigPath: join(basePath, 'prompts', 'section7_master_en.json'),
        goldenExamplePath: join(basePath, 'prompts', 'section7_golden_example_en.md'),
      };

  if (!manifest) {
    console.log('[PROOF] template=section7 version=none source=filesystem status=fallback');
    return { ...defaults, versionUsed: 'none' };
  }

  const version = manifest.defaultVersion || 'current';
  const ai = manifest.versions?.[version]?.ai_formatter?.[language];
  
  // Resolve paths relative to base path (repo root)
  // Manifest paths are relative to repo root (e.g., "prompts/section7_master.md")
  const resolved = {
    masterPromptPath: ai?.master ? join(basePath, ai.master) : defaults.masterPromptPath,
    jsonConfigPath: ai?.json ? join(basePath, ai.json) : defaults.jsonConfigPath,
    goldenExamplePath: ai?.golden ? join(basePath, ai.golden) : defaults.goldenExamplePath,
  };
  
  // Log resolved paths for debugging
  console.log(`[PROOF] template=section7 version=${version} source=local status=ok`, {
    basePath,
    manifestPaths: ai ? { master: ai.master, json: ai.json, golden: ai.golden } : 'none',
    resolvedPaths: {
      master: resolved.masterPromptPath,
      json: resolved.jsonConfigPath,
      golden: resolved.goldenExamplePath
    },
    filesExist: {
      master: existsSync(resolved.masterPromptPath),
      json: existsSync(resolved.jsonConfigPath),
      golden: existsSync(resolved.goldenExamplePath)
    }
  });
  
  return { ...resolved, versionUsed: version };
}

export function resolveSection7RdPaths(): Section7RdPaths {
  const manifest = readManifest('section7');
  const basePath = resolveBasePath();
  
  const defaults = {
    masterConfigPath: join(basePath, 'configs', 'master_prompt_section7.json'),
    systemConductorPath: join(basePath, 'prompts', 'system_section7_fr.xml'),
    planPath: join(basePath, 'prompts', 'plan_section7_fr.xml'),
    goldenCasesPath: join(basePath, 'training', 'golden_cases_section7.jsonl'),
  };

  if (!manifest) {
    console.log('[PROOF] template=section7-rd version=none source=filesystem status=fallback');
    return { ...defaults, versionUsed: 'none' };
  }

  const version = manifest.defaultVersion || 'current';
  const rd = manifest.versions?.[version]?.rd;
  
  // Resolve paths relative to base path (repo root)
  const resolved = {
    masterConfigPath: rd?.master_config ? join(basePath, rd.master_config) : defaults.masterConfigPath,
    systemConductorPath: rd?.system_xml ? join(basePath, rd.system_xml) : defaults.systemConductorPath,
    planPath: rd?.plan_xml ? join(basePath, rd.plan_xml) : defaults.planPath,
    goldenCasesPath: rd?.golden_cases ? join(basePath, rd.golden_cases) : defaults.goldenCasesPath,
  };
  console.log(`[PROOF] template=section7-rd version=${version} source=local status=ok`);
  return { ...resolved, versionUsed: version };
}


