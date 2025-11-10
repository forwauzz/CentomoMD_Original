/**
 * Check which Section 11 artifacts are already stored in Supabase
 * 
 * Usage:
 *   tsx backend/scripts/check-section11-artifacts.ts
 * 
 * Environment variables required:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
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

async function checkSection11Artifacts() {
  console.log(`🔍 Checking Section 11 artifacts in Supabase...\n`);
  console.log(`Bundle: ${bundleName}\n`);

  try {
    const sql = getSql();

    // Step 1: Check if bundle exists
    console.log('1️⃣ Checking bundle registration...');
    const bundleResult = await sql`
      SELECT id, name, enabled, default_version_id
      FROM template_bundles
      WHERE name = ${bundleName}
      LIMIT 1
    `;

    if (!bundleResult || bundleResult.length === 0) {
      console.log('   ❌ Bundle not found in database\n');
      console.log('   📝 No artifacts stored yet. All artifacts need to be uploaded.\n');
      return;
    }

    const bundle = bundleResult[0] as any;
    console.log(`   ✅ Bundle found: ${bundle.id}`);
    console.log(`   📦 Name: ${bundle.name}`);
    console.log(`   🔧 Enabled: ${bundle.enabled}`);
    console.log(`   📌 Default version ID: ${bundle.default_version_id || 'Not set'}\n`);

    // Step 2: Check versions
    console.log('2️⃣ Checking versions...');
    const versionsResult = await sql`
      SELECT id, semver, status, created_at, updated_at
      FROM template_bundle_versions
      WHERE template_bundle_id = ${bundle.id}
      ORDER BY created_at DESC
    `;

    if (!versionsResult || versionsResult.length === 0) {
      console.log('   ❌ No versions found\n');
      console.log('   📝 No artifacts stored yet. All artifacts need to be uploaded.\n');
      return;
    }

    console.log(`   ✅ Found ${versionsResult.length} version(s):\n`);
    for (const version of versionsResult) {
      const v = version as any;
      console.log(`   📌 Version: ${v.semver} (${v.status})`);
      console.log(`      ID: ${v.id}`);
      console.log(`      Created: ${v.created_at}`);
      console.log(`      Updated: ${v.updated_at}\n`);
    }

    // Step 3: Check artifacts for each version
    console.log('3️⃣ Checking artifacts...\n');
    for (const version of versionsResult) {
      const v = version as any;
      console.log(`   📦 Version ${v.semver}:\n`);

      const artifactsResult = await sql`
        SELECT id, kind, storage_path, sha256, size_bytes, content_type, locale, created_at
        FROM template_bundle_artifacts
        WHERE template_bundle_version_id = ${v.id}
        ORDER BY kind
      `;

      if (!artifactsResult || artifactsResult.length === 0) {
        console.log('      ❌ No artifacts found for this version\n');
        continue;
      }

      console.log(`      ✅ Found ${artifactsResult.length} artifact(s):\n`);
      for (const artifact of artifactsResult) {
        const a = artifact as any;
        console.log(`      📄 ${a.kind}`);
        console.log(`         Path: ${a.storage_path}`);
        console.log(`         Size: ${a.size_bytes} bytes`);
        console.log(`         SHA256: ${a.sha256.substring(0, 16)}...`);
        console.log(`         Content-Type: ${a.content_type}`);
        if (a.locale) {
          console.log(`         Locale: ${a.locale}`);
        }
        console.log(`         Created: ${a.created_at}\n`);
      }
    }

    // Step 4: Check Supabase Storage
    console.log('4️⃣ Checking Supabase Storage...\n');
    const storagePath = `${bundleName}/`;
    
    const { data: storageFiles, error: storageError } = await supabase.storage
      .from('template-artifacts')
      .list(storagePath, {
        limit: 100,
        sortBy: { column: 'name', order: 'asc' }
      });

    if (storageError) {
      console.error(`   ❌ Error listing storage: ${storageError.message}\n`);
    } else if (!storageFiles || storageFiles.length === 0) {
      console.log(`   ❌ No files found in storage at ${storagePath}\n`);
    } else {
      console.log(`   ✅ Found ${storageFiles.length} file(s) in storage:\n`);
      
      // Group by version
      const filesByVersion = new Map<string, any[]>();
      for (const file of storageFiles) {
        const pathParts = file.name.split('/');
        if (pathParts.length >= 2) {
          const version = pathParts[0];
          const filename = pathParts[pathParts.length - 1];
          if (!filesByVersion.has(version)) {
            filesByVersion.set(version, []);
          }
          filesByVersion.get(version)!.push({ ...file, filename });
        }
      }

      for (const [version, files] of filesByVersion.entries()) {
        console.log(`   📌 Version ${version}:\n`);
        for (const file of files) {
          console.log(`      📄 ${file.filename}`);
          console.log(`         Size: ${file.metadata?.size || 'unknown'} bytes`);
          console.log(`         Updated: ${file.updated_at || 'unknown'}\n`);
        }
      }
    }

    // Step 5: Summary
    console.log('5️⃣ Summary:\n');
    console.log(`   Bundle: ${bundleName}`);
    console.log(`   Versions in DB: ${versionsResult.length}`);
    
    const allArtifacts = await sql`
      SELECT kind, COUNT(*) as count
      FROM template_bundle_artifacts
      WHERE template_bundle_version_id IN (
        SELECT id FROM template_bundle_versions WHERE template_bundle_id = ${bundle.id}
      )
      GROUP BY kind
      ORDER BY kind
    `;

    console.log(`   Artifacts by kind:\n`);
    for (const row of allArtifacts) {
      const r = row as any;
      console.log(`      ${r.kind}: ${r.count}`);
    }

    console.log('\n✅ Check completed!\n');

  } catch (error) {
    console.error('❌ Error checking artifacts:', error);
    throw error;
  }
}

// Run the check
checkSection11Artifacts()
  .then(() => {
    console.log('✨ Check completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Check failed:', error);
    process.exit(1);
  });

