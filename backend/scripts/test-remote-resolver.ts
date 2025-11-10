/**
 * End-to-end test: Upload bundle → Enable flag → Test resolver
 * This script validates the complete remote storage workflow
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';
import { getSql } from '../src/database/connection.js';
import { resolveSection7AiPaths, resolveSection7RdPaths } from '../src/services/artifacts/PromptBundleResolver.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

async function testRemoteResolver() {
  console.log('🧪 Testing Remote Resolver End-to-End\n');
  
  // Check feature flag
  const flagEnabled = process.env['FEATURE_TEMPLATE_VERSION_REMOTE_STORAGE'] === 'true';
  if (!flagEnabled) {
    console.log('⚠️  FEATURE_TEMPLATE_VERSION_REMOTE_STORAGE is not enabled');
    console.log('   Set FEATURE_TEMPLATE_VERSION_REMOTE_STORAGE=true in .env\n');
    return;
  }
  
  console.log('✅ Feature flag enabled\n');
  
  // Check Postgres for bundles
  console.log('1️⃣ Checking Postgres for bundles...');
  const sql = getSql();
  
  const bundles = await sql`
    SELECT b.name, v.semver, b.default_version_id
    FROM template_bundles b
    LEFT JOIN template_bundle_versions v ON b.id = v.template_bundle_id
    ORDER BY b.name, v.semver
  `;
  
  if (!bundles || bundles.length === 0) {
    console.log('❌ No bundles found in Postgres');
    console.log('   Run: npx tsx scripts/upload-template-bundle.ts all current --set-default\n');
    return;
  }
  
  console.log(`✅ Found ${bundles.length} bundle version(s):`);
  bundles.forEach((b: any) => {
    console.log(`   - ${b.name} v${b.semver}`);
  });
  console.log();
  
  // Test Section 7 AI Formatter resolver (FR)
  console.log('2️⃣ Testing Section 7 AI Formatter resolver (FR)...');
  try {
    const aiPaths = await resolveSection7AiPaths('fr');
    console.log(`   ✅ Resolved paths:`);
    console.log(`      Master: ${aiPaths.masterPromptPath}`);
    console.log(`      JSON:   ${aiPaths.jsonConfigPath}`);
    console.log(`      Golden: ${aiPaths.goldenExamplePath}`);
    console.log(`      Version: ${aiPaths.versionUsed}`);
    console.log(`      Source: ${aiPaths.source || 'unknown'}`);
    
    // Verify files exist
    const allExist = existsSync(aiPaths.masterPromptPath) && 
                     existsSync(aiPaths.jsonConfigPath) && 
                     existsSync(aiPaths.goldenExamplePath);
    
    if (allExist) {
      console.log(`   ✅ All files exist`);
    } else {
      console.log(`   ⚠️  Some files missing`);
    }
  } catch (error) {
    console.error(`   ❌ Error:`, error);
  }
  console.log();
  
  // Test Section 7 R&D resolver
  console.log('3️⃣ Testing Section 7 R&D resolver...');
  try {
    const rdPaths = await resolveSection7RdPaths();
    console.log(`   ✅ Resolved paths:`);
    console.log(`      Master Config: ${rdPaths.masterConfigPath}`);
    console.log(`      System XML:    ${rdPaths.systemConductorPath}`);
    console.log(`      Plan XML:      ${rdPaths.planPath}`);
    console.log(`      Golden Cases:  ${rdPaths.goldenCasesPath}`);
    console.log(`      Version: ${rdPaths.versionUsed}`);
    console.log(`      Source: ${rdPaths.source || 'unknown'}`);
    
    // Verify files exist
    const allExist = existsSync(rdPaths.masterConfigPath) && 
                     existsSync(rdPaths.systemConductorPath) && 
                     existsSync(rdPaths.planPath) && 
                     existsSync(rdPaths.goldenCasesPath);
    
    if (allExist) {
      console.log(`   ✅ All files exist`);
    } else {
      console.log(`   ⚠️  Some files missing`);
    }
  } catch (error) {
    console.error(`   ❌ Error:`, error);
  }
  console.log();
  
  console.log('✨ Remote resolver test completed\n');
}

testRemoteResolver()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 Test failed:', error);
    process.exit(1);
  });

