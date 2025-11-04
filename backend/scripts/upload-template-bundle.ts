/**
 * Upload template bundle to Supabase Storage and Postgres
 * Reads local manifest, uploads artifacts, and creates metadata
 */

import { readFileSync, existsSync, statSync } from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { getSql } from '../src/database/connection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

const SUPABASE_URL = process.env['SUPABASE_URL'];
const SUPABASE_SERVICE_ROLE_KEY = process.env['SUPABASE_SERVICE_ROLE_KEY'];

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials');
  console.error('   Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Helper functions
function readManifest(templateId: string): { defaultVersion: string; versions: any } | null {
  const repoRoot = join(__dirname, '..', '..');
  const manifestPath = join(repoRoot, 'prompts', templateId, 'manifest.json');
  
  if (!existsSync(manifestPath)) {
    return null;
  }
  
  try {
    const raw = readFileSync(manifestPath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function getTemplateIdFromBundleName(bundleName: string): string {
  // Extract template ID from bundle name for manifest lookup
  // section7-ai-formatter -> section7
  // section7-rd -> section7
  // section7-v1 -> section7-v1 (has its own manifest)
  // section8-ai-formatter -> section8
  if (bundleName === 'section7-v1') return 'section7-v1';
  if (bundleName.startsWith('section7')) return 'section7';
  if (bundleName.startsWith('section8')) return 'section8';
  return bundleName;
}

function resolveBasePath(): string {
  const repoRoot = join(__dirname, '..', '..');
  return repoRoot;
}

function computeSHA256(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

function getContentType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'md': return 'text/markdown';
    case 'json': return 'application/json';
    case 'jsonl': return 'application/x-ndjson';
    case 'xml': return 'application/xml';
    default: return 'text/plain';
  }
}

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

async function uploadBundle(
  bundleName: string,
  version: string,
  artifacts: ArtifactInfo[]
): Promise<void> {
  const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  console.log(`\n📤 Uploading ${artifacts.length} artifact(s) to Supabase Storage...`);
  
  // Upload all artifacts
  for (const artifact of artifacts) {
    try {
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

async function insertMetadata(
  bundleName: string,
  version: string,
  artifacts: ArtifactInfo[],
  setAsDefault: boolean = false
): Promise<void> {
  const sql = getSql();
  
  console.log(`\n💾 Inserting metadata into Postgres...`);
  
  try {
    // 1. Create or get template bundle
    let bundleResult = await sql`
      SELECT id FROM template_bundles WHERE name = ${bundleName} LIMIT 1
    `;
    
    let bundleId: string;
    if (bundleResult && bundleResult.length > 0) {
      bundleId = bundleResult[0].id;
      console.log(`   ✅ Found existing bundle: ${bundleName} (${bundleId})`);
    } else {
      const insertBundle = await sql`
        INSERT INTO template_bundles (name, enabled)
        VALUES (${bundleName}, true)
        RETURNING id
      `;
      bundleId = insertBundle[0].id;
      console.log(`   ✅ Created new bundle: ${bundleName} (${bundleId})`);
    }
    
    // 2. Create template version
    const versionResult = await sql`
      INSERT INTO template_bundle_versions (template_bundle_id, semver, status)
      VALUES (${bundleId}, ${version}, 'stable')
      ON CONFLICT (template_bundle_id, semver) DO UPDATE
      SET status = 'stable', updated_at = now()
      RETURNING id
    `;
    
    const versionId = versionResult[0].id;
    console.log(`   ✅ Created/updated version: ${version} (${versionId})`);
    
    // 3. Set as default if requested
    if (setAsDefault) {
      await sql`
        UPDATE template_bundles
        SET default_version_id = ${versionId}
        WHERE id = ${bundleId}
      `;
      console.log(`   ✅ Set ${version} as default version`);
    }
    
    // 4. Insert artifacts metadata
    for (const artifact of artifacts) {
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
        ON CONFLICT DO NOTHING
      `;
    }
    
    console.log(`   ✅ Inserted ${artifacts.length} artifact metadata record(s)\n`);
    
  } catch (error) {
    console.error('❌ Failed to insert metadata:', error);
    throw error;
  }
}

async function uploadTemplateBundle(
  bundleName: string,
  version: string,
  setAsDefault: boolean = false
): Promise<void> {
  console.log(`🚀 Uploading Template Bundle: ${bundleName} v${version}\n`);
  
  // Step 1: Read manifest
  console.log('1️⃣ Reading local manifest...');
  const templateId = getTemplateIdFromBundleName(bundleName);
  const manifest = readManifest(templateId);
  
  if (!manifest) {
    throw new Error(`Manifest not found: prompts/${templateId}/manifest.json`);
  }
  
  // Use version from manifest or provided version
  const versionToUse = version === 'current' ? manifest.defaultVersion : version;
  const versionData = manifest.versions[versionToUse];
  if (!versionData) {
    throw new Error(`Version ${versionToUse} not found in manifest`);
  }
  
  console.log(`✅ Manifest found: defaultVersion=${manifest.defaultVersion}`);
  console.log(`✅ Version ${versionToUse} found in manifest\n`);
  
  // Step 2: Collect artifacts
  console.log('2️⃣ Collecting artifacts...');
  const basePath = resolveBasePath();
  const artifacts: ArtifactInfo[] = [];
  
  // Collect AI formatter artifacts (for section7-ai-formatter and section7-v1 bundles)
  if ((bundleName === 'section7-ai-formatter' || bundleName === 'section7-v1') && versionData.ai_formatter?.fr) {
    const aiFr = versionData.ai_formatter.fr;
    const artifactsFr = [
      { kind: 'master_prompt', path: aiFr.master, locale: 'fr' },
      { kind: 'json_config', path: aiFr.json, locale: 'fr' },
      { kind: 'golden_example', path: aiFr.golden, locale: 'fr' },
    ];
    
    for (const { kind, path, locale } of artifactsFr) {
      const localPath = join(basePath, path);
      if (!existsSync(localPath)) {
        console.warn(`⚠️  File not found: ${localPath}`);
        continue;
      }
      
      const content = readFileSync(localPath, 'utf8');
      const sha256 = computeSHA256(content);
      const stats = statSync(localPath);
      const filename = path.split('/').pop() || '';
      // Use bundle-specific path structure: bundleName/version/filename
      const storagePath = `${bundleName}/${versionToUse}/${filename}`;
      
      artifacts.push({
        kind,
        storagePath,
        localPath,
        sha256,
        sizeBytes: stats.size,
        contentType: getContentType(filename),
        locale,
        content,
      });
      
      console.log(`   ✅ Collected: ${kind} (${locale}) - ${storagePath}`);
    }
  }
  
  // Collect AI formatter artifacts (EN)
  if (versionData.ai_formatter?.en) {
    const aiEn = versionData.ai_formatter.en;
    const artifactsEn = [
      { kind: 'master_prompt', path: aiEn.master, locale: 'en' },
      { kind: 'json_config', path: aiEn.json, locale: 'en' },
      { kind: 'golden_example', path: aiEn.golden, locale: 'en' },
    ];
    
    for (const { kind, path, locale } of artifactsEn) {
      const localPath = join(basePath, path);
      if (!existsSync(localPath)) {
        console.warn(`⚠️  File not found: ${localPath}`);
        continue;
      }
      
      const content = readFileSync(localPath, 'utf8');
      const sha256 = computeSHA256(content);
      const stats = statSync(localPath);
      const filename = path.split('/').pop() || '';
      // Use bundle-specific path structure: bundleName/version/filename
      const storagePath = `${bundleName}/${versionToUse}/${filename}`;
      
      artifacts.push({
        kind,
        storagePath,
        localPath,
        sha256,
        sizeBytes: stats.size,
        contentType: getContentType(filename),
        locale,
        content,
      });
      
      console.log(`   ✅ Collected: ${kind} (${locale}) - ${storagePath}`);
    }
  }
  
  // Collect R&D artifacts (only for section7-rd bundle)
  if (bundleName === 'section7-rd' && versionData.rd) {
    const rd = versionData.rd;
    const rdArtifacts = [
      { kind: 'master_config', path: rd.master_config },
      { kind: 'system_xml', path: rd.system_xml },
      { kind: 'plan_xml', path: rd.plan_xml },
      { kind: 'golden_cases', path: rd.golden_cases },
    ];
    
    for (const { kind, path } of rdArtifacts) {
      const localPath = join(basePath, path);
      if (!existsSync(localPath)) {
        console.warn(`⚠️  File not found: ${localPath}`);
        continue;
      }
      
      const content = readFileSync(localPath, 'utf8');
      const sha256 = computeSHA256(content);
      const stats = statSync(localPath);
      const filename = path.split('/').pop() || '';
      // Use bundle-specific path structure: bundleName/version/filename
      const storagePath = `${bundleName}/${versionToUse}/${filename}`;
      
      artifacts.push({
        kind,
        storagePath,
        localPath,
        sha256,
        sizeBytes: stats.size,
        contentType: getContentType(filename),
        content,
      });
      
      console.log(`   ✅ Collected: ${kind} - ${storagePath}`);
    }
  }
  
  if (artifacts.length === 0) {
    throw new Error('No artifacts found to upload');
  }
  
  console.log(`\n✅ Collected ${artifacts.length} artifact(s)\n`);
  
  // Step 3: Upload to Storage
  await uploadBundle(bundleName, versionToUse, artifacts);
  
  // Step 4: Insert metadata into Postgres
  await insertMetadata(bundleName, versionToUse, artifacts, setAsDefault);
  
  console.log(`✅ Template bundle ${bundleName} v${versionToUse} uploaded successfully!\n`);
}

// Upload all bundles for a template
async function uploadAllBundlesForTemplate(templateId: string, version: string, setAsDefault: boolean = false): Promise<void> {
  console.log(`🚀 Uploading All Bundles for ${templateId}\n`);
  
  if (templateId === 'section7') {
    // Upload AI formatter bundle
    await uploadTemplateBundle('section7-ai-formatter', version, setAsDefault);
    
    // Upload R&D bundle
    await uploadTemplateBundle('section7-rd', version, setAsDefault);
    
    // Upload Section 7 v1 bundle
    await uploadTemplateBundle('section7-v1', version === 'current' ? 'v1' : version, setAsDefault);
  } else if (templateId === 'section8') {
    // Upload AI formatter bundle only (Section 8 has no R&D bundle)
    await uploadTemplateBundle('section8-ai-formatter', version, setAsDefault);
  } else {
    throw new Error(`Unknown template: ${templateId}`);
  }
  
  console.log('✅ All bundles uploaded successfully!\n');
}

// Upload all bundles (Section 7 + Section 8)
async function uploadAllBundles(version: string, setAsDefault: boolean = false): Promise<void> {
  console.log('🚀 Uploading All Template Bundles (Section 7 + Section 8)\n');
  
  // Upload Section 7 bundles
  await uploadAllBundlesForTemplate('section7', version, setAsDefault);
  
  // Upload Section 8 bundles
  await uploadAllBundlesForTemplate('section8', version, setAsDefault);
  
  console.log('✅ All template bundles uploaded successfully!\n');
}

// Main execution
const args = process.argv.slice(2);
const command = args[0];

if (command === 'all') {
  // Upload all bundles
  const version = args[1] || '1.0.0';
  const setAsDefault = args.includes('--set-default');
  const enableFlag = args.includes('--enable-flag');
  
  uploadAllBundles(version, setAsDefault)
    .then(() => {
      if (enableFlag) {
        console.log('📝 Feature flag reminder:');
        console.log('   Set FEATURE_TEMPLATE_VERSION_REMOTE_STORAGE=true in .env');
        console.log('   Then restart backend server\n');
      }
      console.log('✨ Upload completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Upload failed:', error);
      process.exit(1);
    });
} else {
  // Upload single bundle
  const bundleName = command || 'section7-ai-formatter';
  const version = args[1] || '1.0.0';
  const setAsDefault = args.includes('--set-default');
  
  uploadTemplateBundle(bundleName, version, setAsDefault)
    .then(() => {
      console.log('📝 Feature flag reminder:');
      console.log('   Set FEATURE_TEMPLATE_VERSION_REMOTE_STORAGE=true in .env');
      console.log('   Then restart backend server\n');
      console.log('✨ Upload completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Upload failed:', error);
      process.exit(1);
    });
}

