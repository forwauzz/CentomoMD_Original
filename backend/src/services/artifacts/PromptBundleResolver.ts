import { readFileSync, existsSync, mkdirSync, writeFileSync, statSync } from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';
import { FLAGS } from '../../config/flags.js';
import { getSql } from '../../database/connection.js';
import { createClient } from '@supabase/supabase-js';
import { ENV } from '../../config/env.js';

type Language = 'fr' | 'en';
type SourceType = 'remote' | 'cache' | 'local' | 'filesystem';

interface Section7AiPaths {
  masterPromptPath: string;
  jsonConfigPath: string;
  goldenExamplePath: string;
  versionUsed: string;
  source?: SourceType;
}

interface Section7RdPaths {
  masterConfigPath: string;
  systemConductorPath: string;
  planPath: string;
  goldenCasesPath: string;
  versionUsed: string;
  source?: SourceType;
}

interface Section11RdPaths {
  masterConfigPath: string;
  schemaPath: string;
  logicmapPath: string;
  masterPromptPath: string;
  goldenCasesPath: string;
  versionUsed: string;
  source?: SourceType;
}

// Cache directory for downloaded artifacts
const CACHE_DIR = join(process.cwd(), 'cache', 'template-artifacts');
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Initialize Supabase Storage client (service role for upload/download)
let _supabaseStorageClient: ReturnType<typeof createClient> | null = null;
function getSupabaseStorageClient() {
  if (_supabaseStorageClient) return _supabaseStorageClient;
  
  const supabaseUrl = process.env['SUPABASE_URL'] || ENV.SUPABASE_URL || '';
  const serviceRoleKey = process.env['SUPABASE_SERVICE_ROLE_KEY'] || '';
  
  if (!supabaseUrl || !serviceRoleKey) {
    // Return null if not configured - will fallback to local
    return null;
  }
  
  _supabaseStorageClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  
  return _supabaseStorageClient;
}

// Ensure cache directory exists
function ensureCacheDir() {
  if (!existsSync(CACHE_DIR)) {
    mkdirSync(CACHE_DIR, { recursive: true });
  }
}

// Get cache file path for an artifact
function getCachePath(templateId: string, version: string, kind: string, locale?: string): string {
  ensureCacheDir();
  const cacheKey = locale ? `${templateId}-${version}-${kind}-${locale}` : `${templateId}-${version}-${kind}`;
  return join(CACHE_DIR, `${cacheKey}.cached`);
}

// Check if cache is valid (exists and not expired)
function isCacheValid(cachePath: string, expectedHash?: string): boolean {
  if (!existsSync(cachePath)) return false;
  
  // Check expiration (24 hours)
  const stats = statSync(cachePath);
  const age = Date.now() - stats.mtimeMs;
  if (age > CACHE_TTL_MS) return false;
  
  // If hash provided, verify integrity
  if (expectedHash) {
    try {
      const content = readFileSync(cachePath, 'utf8');
      const actualHash = createHash('sha256').update(content).digest('hex');
      return actualHash === expectedHash.toLowerCase();
    } catch {
      return false;
    }
  }
  
  return true;
}

// Download artifact from Supabase Storage and cache it
async function downloadAndCache(
  storagePath: string,
  expectedHash: string,
  cachePath: string
): Promise<string | null> {
  const supabase = getSupabaseStorageClient();
  if (!supabase) return null;
  
  try {
    const { data, error } = await supabase.storage
      .from('template-artifacts')
      .download(storagePath);
    
    if (error) {
      console.error(`[PROOF] Failed to download ${storagePath}:`, error.message);
      return null;
    }
    
    if (!data) {
      console.error(`[PROOF] No data returned for ${storagePath}`);
      return null;
    }
    
    // Convert Blob to text
    const content = await data.text();
    
    // Verify SHA256 integrity
    const actualHash = createHash('sha256').update(content).digest('hex');
    if (actualHash.toLowerCase() !== expectedHash.toLowerCase()) {
      console.error(`[PROOF] Hash mismatch for ${storagePath}: expected ${expectedHash}, got ${actualHash}`);
      return null;
    }
    
    // Cache the content
    writeFileSync(cachePath, content, 'utf8');
    console.log(`[PROOF] Downloaded and cached ${storagePath} (hash: ${actualHash.substring(0, 8)}...)`);
    
    return content;
  } catch (error) {
    console.error(`[PROOF] Error downloading ${storagePath}:`, error);
    return null;
  }
}

// Resolve version alias to actual semver (e.g., 'latest' -> '1.2.0', 'stable' -> '1.1.0')
async function resolveVersionAlias(
  bundleName: string,
  version: string
): Promise<string | null> {
  // If version is already a semver (contains digits), return as-is
  if (/^\d+\.\d+\.\d+/.test(version)) {
    return version;
  }
  
  // If not remote storage, can't resolve aliases
  if (!FLAGS.FEATURE_TEMPLATE_VERSION_REMOTE_STORAGE) {
    return null;
  }
  
  try {
    const sql = getSql();
    
    if (version === 'latest') {
      // Get version with highest semver (most recent)
      const result = await sql`
        SELECT v.semver
        FROM template_bundle_versions v
        JOIN template_bundles b ON v.template_bundle_id = b.id
        WHERE b.name = ${bundleName}
          AND v.status != 'deprecated'
        ORDER BY v.created_at DESC, v.semver DESC
        LIMIT 1
      `;
      if (result && result.length > 0) {
        return (result[0] as { semver: string }).semver;
      }
    } else if (version === 'stable') {
      // Get version with status='stable'
      const result = await sql`
        SELECT v.semver
        FROM template_bundle_versions v
        JOIN template_bundles b ON v.template_bundle_id = b.id
        WHERE b.name = ${bundleName}
          AND v.status = 'stable'
        ORDER BY v.created_at DESC
        LIMIT 1
      `;
      if (result && result.length > 0) {
        return (result[0] as { semver: string }).semver;
      }
    }
    
    return null;
  } catch (error) {
    console.error(`[PROOF] Failed to resolve version alias ${version}:`, error);
    return null;
  }
}

// Resolve artifact path from Postgres manifest
async function resolveFromRemote(
  bundleName: string,
  version: string,
  kind: string,
  locale?: string
): Promise<{ storagePath: string; sha256: string; content: string | null; source: SourceType } | null> {
  if (!FLAGS.FEATURE_TEMPLATE_VERSION_REMOTE_STORAGE) {
    return null;
  }
  
  try {
    const sql = getSql();
    
    // Resolve alias to actual semver if needed
    const actualVersion = await resolveVersionAlias(bundleName, version);
    const versionToUse = actualVersion || version;
    
    // Query Postgres for artifact metadata
    const artifacts = await sql`
      SELECT 
        a.storage_path,
        a.sha256,
        a.content_type
      FROM template_bundle_artifacts a
      JOIN template_bundle_versions v ON a.template_bundle_version_id = v.id
      JOIN template_bundles b ON v.template_bundle_id = b.id
      WHERE b.name = ${bundleName}
        AND v.semver = ${versionToUse}
        AND a.kind = ${kind}
        AND (a.locale = ${locale || null} OR a.locale IS NULL)
      LIMIT 1
    `;
    
    if (!artifacts || artifacts.length === 0) {
      return null;
    }
    
    const artifact = artifacts[0] as { storage_path: string; sha256: string; content_type: string };
    const storagePath = artifact.storage_path;
    const expectedHash = artifact.sha256;
    
    // Check cache first
    const cachePath = getCachePath(bundleName, version, kind, locale);
    if (isCacheValid(cachePath, expectedHash)) {
      const cachedContent = readFileSync(cachePath, 'utf8');
      console.log(`[PROOF] Using cached artifact: ${storagePath} (source: cache)`);
      return { storagePath, sha256: expectedHash, content: cachedContent, source: 'cache' };
    }
    
    // Download from Storage
    const content = await downloadAndCache(storagePath, expectedHash, cachePath);
    if (content) {
      return { storagePath, sha256: expectedHash, content, source: 'remote' };
    }
    
    return null;
  } catch (error) {
    console.error(`[PROOF] Error resolving from remote:`, error);
    return null;
  }
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

export async function resolveSection7AiPaths(language: Language, version?: string): Promise<Section7AiPaths> {
  const bundleName = 'section7-ai-formatter';
  const basePath = resolveBasePath();
  
  // Defaults mirror current repo paths
  const defaults = language === 'fr'
    ? {
        masterPromptPath: join(basePath, 'backend', 'prompts', 'section7_master.md'),
        jsonConfigPath: join(basePath, 'backend', 'prompts', 'section7_master.json'),
        goldenExamplePath: join(basePath, 'backend', 'prompts', 'section7_golden_example.md'),
      }
    : {
        masterPromptPath: join(basePath, 'backend', 'prompts', 'section7_master_en.md'),
        jsonConfigPath: join(basePath, 'backend', 'prompts', 'section7_master_en.json'),
        goldenExamplePath: join(basePath, 'backend', 'prompts', 'section7_golden_example_en.md'),
      };

  // Determine which version to use: provided parameter > default > alias
  let versionToUse = version;
  
  // Try remote first (if flag enabled)
  if (FLAGS.FEATURE_TEMPLATE_VERSION_REMOTE_STORAGE) {
    try {
      const sql = getSql();
      
      if (!versionToUse) {
        // Get default version from Postgres (could be semver or alias)
        const bundles = await sql`
          SELECT v.semver, b.default_version_id
          FROM template_bundles b
          LEFT JOIN template_bundle_versions v ON b.default_version_id = v.id
          WHERE b.name = ${bundleName}
          LIMIT 1
        `;
        
        if (bundles && bundles.length > 0) {
          versionToUse = (bundles[0] as { semver: string | null }).semver || undefined;
          
          // If no default_version_id set, try 'stable' alias, then 'latest'
          if (!versionToUse) {
            versionToUse = await resolveVersionAlias(bundleName, 'stable') || 
                          await resolveVersionAlias(bundleName, 'latest') || 
                          'current';
          }
        } else {
          versionToUse = 'current';
        }
      }
      
      // Resolve alias if needed
      if (versionToUse && versionToUse !== 'current') {
        const resolvedAlias = await resolveVersionAlias(bundleName, versionToUse);
        if (resolvedAlias) {
          versionToUse = resolvedAlias;
        }
      }
      
      // Try to resolve all artifacts from remote
      const masterResult = await resolveFromRemote(bundleName, versionToUse, 'master_prompt', language);
      const jsonResult = await resolveFromRemote(bundleName, versionToUse, 'json_config', language);
      const goldenResult = await resolveFromRemote(bundleName, versionToUse, 'golden_example', language);
        
        if (masterResult?.content && jsonResult?.content && goldenResult?.content) {
          // Write to temp paths for compatibility with existing code
          const tempDir = join(basePath, 'backend', 'prompts', 'temp');
          if (!existsSync(tempDir)) mkdirSync(tempDir, { recursive: true });
          
          const masterPath = join(tempDir, `section7_master_${language}_${versionToUse}.md`);
          const jsonPath = join(tempDir, `section7_master_${language}_${versionToUse}.json`);
          const goldenPath = join(tempDir, `section7_golden_example_${language}_${versionToUse}.md`);
          
          writeFileSync(masterPath, masterResult.content, 'utf8');
          writeFileSync(jsonPath, jsonResult.content, 'utf8');
          writeFileSync(goldenPath, goldenResult.content, 'utf8');
          
          console.log(`[PROOF] template=section7 version=${versionToUse} source=${masterResult.source} status=ok`);
          
          return {
            masterPromptPath: masterPath,
            jsonConfigPath: jsonPath,
            goldenExamplePath: goldenPath,
            versionUsed: versionToUse,
            source: masterResult.source,
          };
        }
    } catch (error) {
      console.error(`[PROOF] Remote resolution failed, falling back to local:`, error);
      // Fall through to local manifest
    }
  }

  // Fallback to local manifest
  const manifest = readManifest('section7');
  
  if (!manifest) {
    console.log('[PROOF] template=section7 version=none source=filesystem status=fallback');
    return { ...defaults, versionUsed: 'none', source: 'filesystem' };
  }

  const manifestVersion = version || manifest.defaultVersion || 'current';
  const ai = manifest.versions?.[manifestVersion]?.ai_formatter?.[language];
  
  // Resolve paths relative to base path (repo root)
  const resolved = {
    masterPromptPath: ai?.master ? join(basePath, ai.master) : defaults.masterPromptPath,
    jsonConfigPath: ai?.json ? join(basePath, ai.json) : defaults.jsonConfigPath,
    goldenExamplePath: ai?.golden ? join(basePath, ai.golden) : defaults.goldenExamplePath,
  };
  
  // Log resolved paths for debugging
  console.log(`[PROOF] template=section7 version=${manifestVersion} source=local status=ok`, {
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
  
  return { ...resolved, versionUsed: manifestVersion, source: 'local' };
}

export async function resolveSection7V1AiPaths(language: Language, version?: string): Promise<Section7AiPaths> {
  const bundleName = 'section7-v1';
  const basePath = resolveBasePath();
  
  // Defaults for section7-v1
  const defaults = language === 'fr'
    ? {
        masterPromptPath: join(basePath, 'backend', 'prompts', 'section7_v1_master.md'),
        jsonConfigPath: join(basePath, 'backend', 'prompts', 'section7_v1_master.json'),
        goldenExamplePath: join(basePath, 'backend', 'prompts', 'section7_v1_golden_example.md'),
      }
    : {
        masterPromptPath: join(basePath, 'backend', 'prompts', 'section7_v1_master_en.md'),
        jsonConfigPath: join(basePath, 'backend', 'prompts', 'section7_v1_master_en.json'),
        goldenExamplePath: join(basePath, 'backend', 'prompts', 'section7_v1_golden_example_en.md'),
      };

  // Determine which version to use: provided parameter > default > alias
  let versionToUse = version;
  
  // Try remote first (if flag enabled)
  if (FLAGS.FEATURE_TEMPLATE_VERSION_REMOTE_STORAGE) {
    try {
      const sql = getSql();
      
      if (!versionToUse) {
        // Get default version from Postgres (could be semver or alias)
        const bundles = await sql`
          SELECT v.semver, b.default_version_id
          FROM template_bundles b
          LEFT JOIN template_bundle_versions v ON b.default_version_id = v.id
          WHERE b.name = ${bundleName}
          LIMIT 1
        `;
        
        if (bundles && bundles.length > 0) {
          versionToUse = (bundles[0] as { semver: string | null }).semver || undefined;
          
          // If no default_version_id set, try 'stable' alias, then 'latest'
          if (!versionToUse) {
            versionToUse = await resolveVersionAlias(bundleName, 'stable') || 
                          await resolveVersionAlias(bundleName, 'latest') || 
                          'v1';
          }
        } else {
          versionToUse = 'v1';
        }
      }
      
      // Resolve alias if needed
      if (versionToUse && versionToUse !== 'v1') {
        const resolvedAlias = await resolveVersionAlias(bundleName, versionToUse);
        if (resolvedAlias) {
          versionToUse = resolvedAlias;
        }
      }
      
      // Try to resolve all artifacts from remote
      const masterResult = await resolveFromRemote(bundleName, versionToUse || 'v1', 'master_prompt', language);
      const jsonResult = await resolveFromRemote(bundleName, versionToUse || 'v1', 'json_config', language);
      const goldenResult = await resolveFromRemote(bundleName, versionToUse || 'v1', 'golden_example', language);
        
      if (masterResult?.content && jsonResult?.content && goldenResult?.content) {
        // Write to temp paths for compatibility with existing code
        const tempDir = join(basePath, 'backend', 'prompts', 'temp');
        if (!existsSync(tempDir)) mkdirSync(tempDir, { recursive: true });
        
        const masterPath = join(tempDir, `section7_v1_master_${language}_${versionToUse || 'v1'}.md`);
        const jsonPath = join(tempDir, `section7_v1_master_${language}_${versionToUse || 'v1'}.json`);
        const goldenPath = join(tempDir, `section7_v1_golden_example_${language}_${versionToUse || 'v1'}.md`);
        
        writeFileSync(masterPath, masterResult.content, 'utf8');
        writeFileSync(jsonPath, jsonResult.content, 'utf8');
        writeFileSync(goldenPath, goldenResult.content, 'utf8');
        
        console.log(`[PROOF] template=section7-v1 version=${versionToUse || 'v1'} source=${masterResult.source} status=ok`);
        
        return {
          masterPromptPath: masterPath,
          jsonConfigPath: jsonPath,
          goldenExamplePath: goldenPath,
          versionUsed: versionToUse || 'v1',
          source: masterResult.source,
        };
      }
    } catch (error) {
      console.error(`[PROOF] Error resolving from remote:`, error);
    }
  }
  
  // Fallback to local manifest
  const manifest = readManifest('section7-v1');
  if (manifest) {
    const manifestVersion = versionToUse || manifest.defaultVersion || 'v1';
    const versionConfig = manifest.versions?.[manifestVersion];
    
    if (versionConfig?.ai_formatter?.[language]) {
      const config = versionConfig.ai_formatter[language];
      const resolved = {
        masterPromptPath: join(basePath, config.master),
        jsonConfigPath: join(basePath, config.json),
        goldenExamplePath: join(basePath, config.golden),
      };
      
      // Verify files exist
      const filesExist = {
        master: existsSync(resolved.masterPromptPath),
        json: existsSync(resolved.jsonConfigPath),
        golden: existsSync(resolved.goldenExamplePath),
      };
      
      if (filesExist.master && filesExist.json && filesExist.golden) {
        console.log(`[PROOF] template=section7-v1 version=${manifestVersion} source=local status=ok`);
        return { ...resolved, versionUsed: manifestVersion, source: 'local' };
      }
    }
  }
  
  // Final fallback to defaults
  console.log(`[PROOF] template=section7-v1 version=v1 source=filesystem status=fallback`);
  return { ...defaults, versionUsed: 'v1', source: 'filesystem' };
}

export async function resolveSection7RdPaths(version?: string): Promise<Section7RdPaths> {
  const bundleName = 'section7-rd';
  const basePath = resolveBasePath();
  
  const defaults = {
    masterConfigPath: join(basePath, 'backend', 'configs', 'master_prompt_section7.json'),
    systemConductorPath: join(basePath, 'backend', 'prompts', 'system_section7_fr.xml'),
    planPath: join(basePath, 'backend', 'prompts', 'plan_section7_fr.xml'),
    goldenCasesPath: join(basePath, 'backend', 'training', 'golden_cases_section7.jsonl'),
  };

  // Determine which version to use: provided parameter > default > alias
  let versionToUse = version;
  
  // Try remote first (if flag enabled)
  if (FLAGS.FEATURE_TEMPLATE_VERSION_REMOTE_STORAGE) {
    try {
      const sql = getSql();
      
      if (!versionToUse) {
        // Get default version from Postgres (could be semver or alias)
        const bundles = await sql`
          SELECT v.semver, b.default_version_id
          FROM template_bundles b
          LEFT JOIN template_bundle_versions v ON b.default_version_id = v.id
          WHERE b.name = ${bundleName}
          LIMIT 1
        `;
        
        if (bundles && bundles.length > 0) {
          versionToUse = (bundles[0] as { semver: string | null }).semver || undefined;
          
          // If no default_version_id set, try 'stable' alias, then 'latest'
          if (!versionToUse) {
            versionToUse = await resolveVersionAlias(bundleName, 'stable') || 
                          await resolveVersionAlias(bundleName, 'latest') || 
                          'current';
          }
        } else {
          versionToUse = 'current';
        }
      }
      
      // Resolve alias if needed
      if (versionToUse && versionToUse !== 'current') {
        const resolvedAlias = await resolveVersionAlias(bundleName, versionToUse);
        if (resolvedAlias) {
          versionToUse = resolvedAlias;
        }
      }
      
      // Try to resolve all artifacts from remote
      const masterResult = await resolveFromRemote(bundleName, versionToUse, 'master_config', undefined);
      const systemResult = await resolveFromRemote(bundleName, versionToUse, 'system_xml', undefined);
      const planResult = await resolveFromRemote(bundleName, versionToUse, 'plan_xml', undefined);
      const goldenResult = await resolveFromRemote(bundleName, versionToUse, 'golden_cases', undefined);
        
        if (masterResult?.content && systemResult?.content && planResult?.content && goldenResult?.content) {
          // Write to temp paths for compatibility
          const tempDir = join(basePath, 'backend', 'prompts', 'temp');
          if (!existsSync(tempDir)) mkdirSync(tempDir, { recursive: true });
          
          const masterPath = join(tempDir, `master_prompt_section7_${versionToUse}.json`);
          const systemPath = join(tempDir, `system_section7_fr_${versionToUse}.xml`);
          const planPath = join(tempDir, `plan_section7_fr_${versionToUse}.xml`);
          const goldenPath = join(tempDir, `golden_cases_section7_${versionToUse}.jsonl`);
          
          writeFileSync(masterPath, masterResult.content, 'utf8');
          writeFileSync(systemPath, systemResult.content, 'utf8');
          writeFileSync(planPath, planResult.content, 'utf8');
          writeFileSync(goldenPath, goldenResult.content, 'utf8');
          
          console.log(`[PROOF] template=section7-rd version=${versionToUse} source=${masterResult.source} status=ok`);
          
          return {
            masterConfigPath: masterPath,
            systemConductorPath: systemPath,
            planPath: planPath,
            goldenCasesPath: goldenPath,
            versionUsed: versionToUse,
            source: masterResult.source,
          };
        }
    } catch (error) {
      console.error(`[PROOF] Remote resolution failed, falling back to local:`, error);
      // Fall through to local manifest
    }
  }

  // Fallback to local manifest
  const manifest = readManifest('section7');
  
  if (!manifest) {
    console.log('[PROOF] template=section7-rd version=none source=filesystem status=fallback');
    return { ...defaults, versionUsed: 'none', source: 'filesystem' };
  }

  const manifestVersion = version || manifest.defaultVersion || 'current';
  const rd = manifest.versions?.[manifestVersion]?.rd;
  
  // Resolve paths relative to base path (repo root)
  const resolved = {
    masterConfigPath: rd?.master_config ? join(basePath, rd.master_config) : defaults.masterConfigPath,
    systemConductorPath: rd?.system_xml ? join(basePath, rd.system_xml) : defaults.systemConductorPath,
    planPath: rd?.plan_xml ? join(basePath, rd.plan_xml) : defaults.planPath,
    goldenCasesPath: rd?.golden_cases ? join(basePath, rd.golden_cases) : defaults.goldenCasesPath,
  };
  console.log(`[PROOF] template=section7-rd version=${manifestVersion} source=local status=ok`);
  return { ...resolved, versionUsed: manifestVersion, source: 'local' };
}

export async function resolveSection11RdPaths(version?: string): Promise<Section11RdPaths> {
  const bundleName = 'section11-rd';
  const basePath = resolveBasePath();
  
  const defaults = {
    masterConfigPath: join(basePath, 'backend', 'configs', 'master_prompt_section11.json'),
    schemaPath: join(basePath, 'prompts', 'section11_schema.json'),
    logicmapPath: join(basePath, 'prompts', 'section11_logicmap.yaml'),
    masterPromptPath: join(basePath, 'prompts', 'section11_master.fr.md'),
    goldenCasesPath: join(basePath, 'training', 'section11_examples.jsonl'),
  };

  // Determine which version to use: provided parameter > default > alias
  let versionToUse = version;
  
  // Try remote first (if flag enabled)
  if (FLAGS.FEATURE_TEMPLATE_VERSION_REMOTE_STORAGE) {
    try {
      const sql = getSql();
      
      if (!versionToUse) {
        // Get default version from Postgres (could be semver or alias)
        const bundles = await sql`
          SELECT v.semver, b.default_version_id
          FROM template_bundles b
          LEFT JOIN template_bundle_versions v ON b.default_version_id = v.id
          WHERE b.name = ${bundleName}
          LIMIT 1
        `;
        
        if (bundles && bundles.length > 0) {
          versionToUse = (bundles[0] as { semver: string | null }).semver || undefined;
          
          // If no default_version_id set, try 'stable' alias, then 'latest'
          if (!versionToUse) {
            versionToUse = await resolveVersionAlias(bundleName, 'stable') || 
                          await resolveVersionAlias(bundleName, 'latest') || 
                          'current';
          }
        } else {
          versionToUse = 'current';
        }
      }
      
      // Resolve alias if needed
      if (versionToUse && versionToUse !== 'current') {
        const resolvedAlias = await resolveVersionAlias(bundleName, versionToUse);
        if (resolvedAlias) {
          versionToUse = resolvedAlias;
        }
      }
      
      // Try to resolve all artifacts from remote
      const masterResult = await resolveFromRemote(bundleName, versionToUse, 'master_config', undefined);
      const schemaResult = await resolveFromRemote(bundleName, versionToUse, 'schema', undefined);
      const logicmapResult = await resolveFromRemote(bundleName, versionToUse, 'logicmap', undefined);
      const masterPromptResult = await resolveFromRemote(bundleName, versionToUse, 'master_prompt', undefined);
      const goldenResult = await resolveFromRemote(bundleName, versionToUse, 'golden_cases', undefined);
        
        if (masterResult?.content && schemaResult?.content && logicmapResult?.content && masterPromptResult?.content && goldenResult?.content) {
          // Write to temp paths for compatibility
          const tempDir = join(basePath, 'backend', 'prompts', 'temp');
          if (!existsSync(tempDir)) mkdirSync(tempDir, { recursive: true });
          
          const masterPath = join(tempDir, `master_prompt_section11_${versionToUse}.json`);
          const schemaPath = join(tempDir, `section11_schema_${versionToUse}.json`);
          const logicmapPath = join(tempDir, `section11_logicmap_${versionToUse}.yaml`);
          const masterPromptPath = join(tempDir, `section11_master_fr_${versionToUse}.md`);
          const goldenPath = join(tempDir, `section11_examples_${versionToUse}.jsonl`);
          
          writeFileSync(masterPath, masterResult.content, 'utf8');
          writeFileSync(schemaPath, schemaResult.content, 'utf8');
          writeFileSync(logicmapPath, logicmapResult.content, 'utf8');
          writeFileSync(masterPromptPath, masterPromptResult.content, 'utf8');
          writeFileSync(goldenPath, goldenResult.content, 'utf8');
          
          console.log(`[PROOF] template=section11-rd version=${versionToUse} source=${masterResult.source} status=ok`);
          
          return {
            masterConfigPath: masterPath,
            schemaPath: schemaPath,
            logicmapPath: logicmapPath,
            masterPromptPath: masterPromptPath,
            goldenCasesPath: goldenPath,
            versionUsed: versionToUse,
            source: masterResult.source,
          };
        }
    } catch (error) {
      console.error(`[PROOF] Remote resolution failed, falling back to local:`, error);
      // Fall through to local manifest
    }
  }

  // Fallback to local manifest
  const manifest = readManifest('section11');
  
  if (!manifest) {
    console.log('[PROOF] template=section11-rd version=none source=filesystem status=fallback');
    return { ...defaults, versionUsed: 'none', source: 'filesystem' };
  }

  const manifestVersion = version || manifest.defaultVersion || 'current';
  const rd = manifest.versions?.[manifestVersion]?.rd;
  
  // Resolve paths relative to base path (repo root)
  const resolved = {
    masterConfigPath: rd?.master_config ? join(basePath, rd.master_config) : defaults.masterConfigPath,
    schemaPath: rd?.schema ? join(basePath, rd.schema) : defaults.schemaPath,
    logicmapPath: rd?.logicmap ? join(basePath, rd.logicmap) : defaults.logicmapPath,
    masterPromptPath: rd?.master_prompt ? join(basePath, rd.master_prompt) : defaults.masterPromptPath,
    goldenCasesPath: rd?.golden_cases ? join(basePath, rd.golden_cases) : defaults.goldenCasesPath,
  };
  console.log(`[PROOF] template=section11-rd version=${manifestVersion} source=local status=ok`);
  return { ...resolved, versionUsed: manifestVersion, source: 'local' };
}
