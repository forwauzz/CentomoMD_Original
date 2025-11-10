/**
 * Upload Section 11 R&D Pipeline artifacts to Supabase Storage
 * 
 * Usage:
 *   npm run upload-section11-bundle
 *   or
 *   tsx backend/scripts/upload-section11-bundle.ts
 * 
 * Environment variables required:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { readFileSync, existsSync, statSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';
import { getSql } from '../src/database/connection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const bundleName = 'section11-rd';
const version = '1.0.1'; // New version for prompt update (preserves 1.0.0)
const setAsDefault = true;

interface ArtifactInfo {
  kind: string;
  storagePath: string;
  localPath: string;
  sha256: string;
  sizeBytes: number;
  contentType: string;
  locale?: string;
  content: string;
}

// Helper: Compute SHA256 hash
function computeSHA256(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

// Helper: Get content type from filename
function getContentType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'md': return 'text/markdown';
    case 'json': return 'application/json';
    case 'jsonl': return 'application/x-ndjson';
    case 'yaml':
    case 'yml': return 'text/yaml';
    default: return 'text/plain';
  }
}

// Helper: Resolve base path (works from root or backend directory)
function resolveBasePath(): string {
  const isBackendDir = process.cwd().endsWith('backend');
  return isBackendDir ? join(process.cwd(), '..') : process.cwd();
}

/**
 * Upload artifacts to Supabase Storage
 */
async function uploadBundle(
  bundleName: string,
  version: string,
  artifacts: ArtifactInfo[]
): Promise<void> {
  console.log(`\n📤 Uploading ${artifacts.length} artifact(s) to Supabase Storage...`);
  
  for (const artifact of artifacts) {
    try {
      // Upload content as string (Supabase Storage accepts string for text files)
      const { data, error } = await supabase.storage
        .from('template-artifacts')
        .upload(artifact.storagePath, artifact.content, {
          contentType: artifact.contentType,
          upsert: true, // Overwrite if exists
        });

      if (error) {
        console.error(`❌ Failed to upload ${artifact.storagePath}:`, error.message);
        throw error;
      }

      console.log(`✅ Uploaded: ${artifact.storagePath} (${artifact.sizeBytes} bytes, hash: ${artifact.sha256.substring(0, 8)}...)`);
    } catch (error) {
      console.error(`❌ Error uploading ${artifact.storagePath}:`, error);
      throw error;
    }
  }
}

/**
 * Insert metadata into Postgres
 */
async function insertMetadata(
  bundleName: string,
  version: string,
  artifacts: ArtifactInfo[],
  setAsDefault: boolean = false
): Promise<void> {
  console.log(`\n💾 Inserting metadata into Postgres...`);
  
  try {
    const sql = getSql();
    
    // Step 1: Create or get template bundle
    let bundleResult = await sql`
      SELECT id FROM template_bundles WHERE name = ${bundleName} LIMIT 1
    `;
    
    let bundleId: string;
    if (bundleResult && bundleResult.length > 0) {
      bundleId = (bundleResult[0] as any)['id'];
      console.log(`   ✅ Bundle exists: ${bundleId}`);
    } else {
      const insertBundle = await sql`
        INSERT INTO template_bundles (name, enabled)
        VALUES (${bundleName}, true)
        RETURNING id
      `;
      bundleId = (insertBundle[0] as any)['id'];
      console.log(`   ✅ Created bundle: ${bundleId}`);
    }
    
    // Step 2: Create or update template version
    const versionResult = await sql`
      INSERT INTO template_bundle_versions (template_bundle_id, semver, status)
      VALUES (${bundleId}, ${version}, 'stable')
      ON CONFLICT (template_bundle_id, semver) DO UPDATE
      SET status = 'stable', updated_at = now()
      RETURNING id
    `;
    
    const versionId = (versionResult[0] as any)['id'];
    console.log(`   ✅ Version created/updated: ${versionId} (${version})`);
    
    // Step 3: Set as default if requested
    if (setAsDefault) {
      await sql`
        UPDATE template_bundles
        SET default_version_id = ${versionId}
        WHERE id = ${bundleId}
      `;
      console.log(`   ✅ Set as default version`);
    }
    
    // Step 4: Insert or update artifact metadata
    for (const artifact of artifacts) {
      // Check if artifact already exists
      const existing = await sql`
        SELECT id FROM template_bundle_artifacts
        WHERE template_bundle_version_id = ${versionId}
          AND kind = ${artifact.kind}
          AND (locale = ${artifact.locale || null} OR (locale IS NULL AND ${artifact.locale === undefined}))
        LIMIT 1
      `;
      
      if (existing && existing.length > 0) {
        // Update existing artifact
        await sql`
          UPDATE template_bundle_artifacts
          SET storage_path = ${artifact.storagePath},
              sha256 = ${artifact.sha256},
              size_bytes = ${artifact.sizeBytes},
              content_type = ${artifact.contentType}
          WHERE template_bundle_version_id = ${versionId}
            AND kind = ${artifact.kind}
            AND (locale = ${artifact.locale || null} OR (locale IS NULL AND ${artifact.locale === undefined}))
        `;
        console.log(`   ✅ Updated metadata: ${artifact.kind} - ${artifact.storagePath}`);
      } else {
        // Insert new artifact
        await sql`
          INSERT INTO template_bundle_artifacts (
            template_bundle_version_id,
            kind,
            storage_path,
            sha256,
            size_bytes,
            content_type,
            locale
          )
          VALUES (
            ${versionId},
            ${artifact.kind},
            ${artifact.storagePath},
            ${artifact.sha256},
            ${artifact.sizeBytes},
            ${artifact.contentType},
            ${artifact.locale || null}
          )
        `;
        console.log(`   ✅ Inserted metadata: ${artifact.kind} - ${artifact.storagePath}`);
      }
    }
    
    console.log(`\n✅ Inserted ${artifacts.length} artifact metadata record(s)\n`);
    
  } catch (error) {
    console.error('❌ Failed to insert metadata:', error);
    throw error;
  }
}

/**
 * Check which artifacts already exist in the database for a given version
 */
async function getExistingArtifacts(
  bundleName: string,
  version: string
): Promise<Set<string>> {
  try {
    const sql = getSql();
    
    // Get bundle ID
    const bundleResult = await sql`
      SELECT id FROM template_bundles WHERE name = ${bundleName} LIMIT 1
    `;
    
    if (!bundleResult || bundleResult.length === 0) {
      return new Set();
    }
    
    const bundleId = (bundleResult[0] as any)['id'];
    
    // Get version ID
    const versionResult = await sql`
      SELECT id FROM template_bundle_versions
      WHERE template_bundle_id = ${bundleId} AND semver = ${version}
      LIMIT 1
    `;
    
    if (!versionResult || versionResult.length === 0) {
      return new Set();
    }
    
    const versionId = (versionResult[0] as any)['id'];
    
    // Get existing artifact kinds
    const artifactsResult = await sql`
      SELECT kind, locale
      FROM template_bundle_artifacts
      WHERE template_bundle_version_id = ${versionId}
    `;
    
    const existing = new Set<string>();
    for (const row of artifactsResult) {
      const r = row as any;
      // Create unique key: kind + locale (or just kind if locale is null)
      const key = r.locale ? `${r.kind}:${r.locale}` : r.kind;
      existing.add(key);
    }
    
    return existing;
  } catch (error) {
    console.warn(`⚠️  Error checking existing artifacts: ${error}`);
    return new Set();
  }
}

/**
 * Main upload function
 */
async function uploadSection11Bundle(): Promise<void> {
  console.log(`🚀 Uploading Section 11 R&D Pipeline Bundle: ${bundleName} v${version}\n`);
  
  const basePath = resolveBasePath();
  console.log(`📁 Base path: ${basePath}\n`);
  
  // Step 0: Check existing artifacts
  console.log('0️⃣ Checking existing artifacts in database...');
  const existingArtifacts = await getExistingArtifacts(bundleName, version);
  
  if (existingArtifacts.size > 0) {
    console.log(`   ℹ️  Found ${existingArtifacts.size} existing artifact(s):`);
    for (const key of existingArtifacts) {
      console.log(`      - ${key}`);
    }
  } else {
    console.log(`   ℹ️  No existing artifacts found for version ${version}`);
  }
  console.log('');
  
  // Define Section 11 artifacts
  const artifactDefs = [
    {
      kind: 'schema_json',
      path: 'prompts/section11_schema.json',
      filename: 'section11_schema.json',
      locale: undefined,
    },
    {
      kind: 'logicmap_yaml',
      path: 'prompts/section11_logicmap.yaml',
      filename: 'section11_logicmap.yaml',
      locale: undefined,
    },
    {
      kind: 'master_prompt',
      path: 'prompts/section11_master.fr.md',
      filename: 'section11_master.fr.md',
      locale: 'fr',
    },
    {
      kind: 'examples_jsonl',
      path: 'training/section11_examples.jsonl',
      filename: 'section11_examples.jsonl',
      locale: undefined,
    },
    {
      kind: 'master_config',
      path: 'backend/configs/master_prompt_section11.json',
      filename: 'master_prompt_section11.json',
      locale: undefined,
    },
    {
      kind: 'json_config',
      path: 'prompts/section11_master.json',
      filename: 'section11_master.json',
      locale: undefined,
    },
    {
      kind: 'golden_example',
      path: 'prompts/section11_golden_example.fr.md',
      filename: 'section11_golden_example.fr.md',
      locale: 'fr',
    },
  ];
  
  // Step 1: Filter and collect artifacts (only missing ones)
  console.log('1️⃣ Collecting artifacts (filtering out existing ones)...');
  const artifacts: ArtifactInfo[] = [];
  
  for (const def of artifactDefs) {
    // Check if artifact already exists
    const key = def.locale ? `${def.kind}:${def.locale}` : def.kind;
    const localPath = join(basePath, def.path);
    
    if (!existsSync(localPath)) {
      console.warn(`⚠️  File not found: ${localPath}`);
      continue;
    }
    
    // Read file to compute hash
    const content = readFileSync(localPath, 'utf8');
    const sha256 = computeSHA256(content);
    
    // Check if file has changed by comparing with existing artifact
    // If artifact exists but hash is different, we should re-upload
    let shouldUpload = true;
    if (existingArtifacts.has(key)) {
      // Try to get existing hash from database to compare
      try {
        const sql = getSql();
        const bundleResult = await sql`
          SELECT id FROM template_bundles WHERE name = ${bundleName} LIMIT 1
        `;
        if (bundleResult && bundleResult.length > 0) {
          const bundleId = (bundleResult[0] as any)['id'];
          const versionResult = await sql`
            SELECT id FROM template_bundle_versions
            WHERE template_bundle_id = ${bundleId} AND semver = ${version}
            LIMIT 1
          `;
          if (versionResult && versionResult.length > 0) {
            const versionId = (versionResult[0] as any)['id'];
            const existingArtifact = await sql`
              SELECT sha256 FROM template_bundle_artifacts
              WHERE template_bundle_version_id = ${versionId}
                AND kind = ${def.kind}
                AND (locale = ${def.locale || null} OR (locale IS NULL AND ${def.locale === undefined}))
              LIMIT 1
            `;
            if (existingArtifact && existingArtifact.length > 0) {
              const existingHash = (existingArtifact[0] as any)['sha256'];
              if (existingHash === sha256) {
                console.log(`   ⏭️  Skipping unchanged: ${def.kind}${def.locale ? ` (${def.locale})` : ''} (hash: ${sha256.substring(0, 8)}...)`);
                shouldUpload = false;
              } else {
                console.log(`   🔄 Re-uploading updated: ${def.kind}${def.locale ? ` (${def.locale})` : ''} (hash changed: ${existingHash.substring(0, 8)}... → ${sha256.substring(0, 8)}...)`);
                shouldUpload = true;
              }
            }
          }
        }
      } catch (error) {
        // If we can't check, proceed with upload (will use upsert)
        console.log(`   ⚠️  Could not check existing hash, proceeding with upload: ${def.kind}`);
        shouldUpload = true;
      }
    }
    
    if (!shouldUpload) {
      continue;
    }
    
    const stats = statSync(localPath);
    const storagePath = `${bundleName}/${version}/${def.filename}`;
    
    artifacts.push({
      kind: def.kind,
      storagePath,
      localPath,
      sha256,
      sizeBytes: stats.size,
      contentType: getContentType(def.filename),
      locale: def.locale,
      content,
    });
    
    console.log(`   ✅ Collected: ${def.kind} - ${storagePath} (${stats.size} bytes, hash: ${sha256.substring(0, 8)}...)`);
  }
  
  if (artifacts.length === 0) {
    console.log(`\n✅ All artifacts already exist in database. Nothing to upload.\n`);
    return;
  }
  
  console.log(`\n✅ Collected ${artifacts.length} new artifact(s) to upload\n`);
  
  // Step 2: Upload to Storage
  await uploadBundle(bundleName, version, artifacts);
  
  // Step 3: Insert metadata into Postgres
  await insertMetadata(bundleName, version, artifacts, setAsDefault);
  
  console.log(`✅ Section 11 R&D Pipeline bundle ${bundleName} v${version} uploaded successfully!\n`);
}

// Run the upload
uploadSection11Bundle()
  .then(() => {
    console.log('✨ Upload completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Upload failed:', error);
    process.exit(1);
  });

