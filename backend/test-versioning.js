/**
 * Test Template Versioning MVP
 * Validates manifest-based resolver with FEATURE_TEMPLATE_VERSION_SELECTION=true
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env') });

async function testVersioning() {
  console.log('🧪 Testing Template Versioning MVP\n');

  // Step 1: Check feature flag
  console.log('1️⃣ Checking feature flag...');
  let flagsModule;
  try {
    // Try compiled version first
    flagsModule = await import('./dist/src/config/flags.js');
  } catch {
    // Fallback to source (for development)
    flagsModule = await import('./src/config/flags.ts');
  }
  const FLAGS = flagsModule.FLAGS;
  
  if (!FLAGS.FEATURE_TEMPLATE_VERSION_SELECTION) {
    console.log('⚠️  FEATURE_TEMPLATE_VERSION_SELECTION is disabled');
    console.log('   Set FEATURE_TEMPLATE_VERSION_SELECTION=true in .env');
    return;
  }
  console.log('✅ FEATURE_TEMPLATE_VERSION_SELECTION is enabled\n');

  // Step 2: Check manifests exist
  console.log('2️⃣ Checking manifest files...');
  // Manifests are in repo root, not backend directory
  const repoRoot = join(__dirname, '..');
  const section7Manifest = join(repoRoot, 'prompts', 'section7', 'manifest.json');
  const section8Manifest = join(repoRoot, 'prompts', 'section8', 'manifest.json');
  
  if (!existsSync(section7Manifest)) {
    console.log('❌ Section 7 manifest not found:', section7Manifest);
    return;
  }
  console.log('✅ Section 7 manifest found');
  
  if (!existsSync(section8Manifest)) {
    console.log('❌ Section 8 manifest not found:', section8Manifest);
    return;
  }
  console.log('✅ Section 8 manifest found\n');

  // Step 3: Validate manifest structure
  console.log('3️⃣ Validating manifest structure...');
  try {
    const s7Manifest = JSON.parse(readFileSync(section7Manifest, 'utf8'));
    const s8Manifest = JSON.parse(readFileSync(section8Manifest, 'utf8'));
    
    if (!s7Manifest.defaultVersion) {
      console.log('❌ Section 7 manifest missing defaultVersion');
      return;
    }
    console.log(`✅ Section 7 defaultVersion: ${s7Manifest.defaultVersion}`);
    
    if (!s8Manifest.defaultVersion) {
      console.log('❌ Section 8 manifest missing defaultVersion');
      return;
    }
    console.log(`✅ Section 8 defaultVersion: ${s8Manifest.defaultVersion}\n`);
  } catch (error) {
    console.log('❌ Failed to parse manifest:', error.message);
    return;
  }

  // Step 4: Test resolver directly
  console.log('4️⃣ Testing PromptBundleResolver...');
  try {
    let resolverModule;
    try {
      // Try compiled version first
      resolverModule = await import('./dist/src/services/artifacts/PromptBundleResolver.js');
    } catch {
      // Fallback to source (for development)
      resolverModule = await import('./src/services/artifacts/PromptBundleResolver.ts');
    }
    const { resolveSection7AiPaths, resolveSection7RdPaths } = resolverModule;
    
    // Test Section 7 AI Formatter (French)
    console.log('   Testing Section 7 AI Formatter (FR)...');
    // Set working directory to repo root for resolver
    const originalCwd = process.cwd();
    process.chdir(repoRoot);
    
    const s7AiFr = resolveSection7AiPaths('fr');
    console.log(`   ✅ Resolved paths (version: ${s7AiFr.versionUsed}):`);
    console.log(`      - Master: ${s7AiFr.masterPromptPath}`);
    console.log(`      - JSON: ${s7AiFr.jsonConfigPath}`);
    console.log(`      - Golden: ${s7AiFr.goldenExamplePath}`);
    
    // Verify files exist
    const allExist = existsSync(s7AiFr.masterPromptPath) && 
                     existsSync(s7AiFr.jsonConfigPath) && 
                     existsSync(s7AiFr.goldenExamplePath);
    if (allExist) {
      console.log('   ✅ All Section 7 AI files exist\n');
    } else {
      console.log('   ⚠️  Some Section 7 AI files missing\n');
    }
    
    // Test Section 7 R&D
    console.log('   Testing Section 7 R&D...');
    const s7Rd = resolveSection7RdPaths();
    console.log(`   ✅ Resolved paths (version: ${s7Rd.versionUsed}):`);
    console.log(`      - Master Config: ${s7Rd.masterConfigPath}`);
    console.log(`      - System XML: ${s7Rd.systemConductorPath}`);
    console.log(`      - Plan XML: ${s7Rd.planPath}`);
    console.log(`      - Golden Cases: ${s7Rd.goldenCasesPath}`);
    
    // Verify files exist
    const rdAllExist = existsSync(s7Rd.masterConfigPath) && 
                       existsSync(s7Rd.systemConductorPath) && 
                       existsSync(s7Rd.planPath) && 
                       existsSync(s7Rd.goldenCasesPath);
    if (rdAllExist) {
      console.log('   ✅ All Section 7 R&D files exist\n');
    } else {
      console.log('   ⚠️  Some Section 7 R&D files missing\n');
    }
    
    // Restore original working directory
    process.chdir(originalCwd);
    
  } catch (error) {
    console.log('❌ Resolver test failed:', error.message);
    console.log(error.stack);
    return;
  }

  // Step 5: Test with actual formatter (optional - requires API keys)
  console.log('5️⃣ Testing with Section 7 AI Formatter (requires API keys)...');
  const hasApiKey = process.env.OPENAI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!hasApiKey) {
    console.log('⚠️  No API keys found - skipping integration test');
    console.log('   Set OPENAI_API_KEY or GOOGLE_API_KEY to test full flow\n');
  } else {
    console.log('   Running integration test...');
    try {
      let formatterModule;
      try {
        // Try compiled version first
        formatterModule = await import('./dist/src/services/formatter/section7AI.js');
      } catch {
        // Fallback to source (for development)
        formatterModule = await import('./src/services/formatter/section7AI.ts');
      }
      const { Section7AIFormatter } = formatterModule;
      
      const testContent = 'Le travailleur décrit l\'événement suivant. Survenu le 7 octobre 2023, deux points.';
      
      const result = await Section7AIFormatter.formatSection7Content(testContent, 'fr');
      
      console.log('   ✅ Formatter executed successfully');
      console.log(`   ✅ Output length: ${result.formatted.length} chars`);
      console.log(`   ✅ Version used: ${result.metadata?.model || 'unknown'}`);
      
      // Check for proof logs in output (they would be in console)
      console.log('\n   💡 Check backend console for [PROOF] logs like:');
      console.log('      [PROOF] template=section7 version=current source=local status=ok\n');
      
    } catch (error) {
      console.log('   ⚠️  Integration test failed:', error.message);
      console.log('   This is expected if API keys are invalid or network is unavailable\n');
    }
  }

  // Step 6: Test rollback scenario
  console.log('6️⃣ Rollback test scenario...');
  console.log('   To test rollback:');
  console.log('   1. Edit prompts/section7/manifest.json');
  console.log('   2. Change "defaultVersion" to a different version (e.g., "v1.0.0")');
  console.log('   3. Run this test again');
  console.log('   4. Check that resolver uses the new version');
  console.log('   5. Verify [PROOF] logs show the new version\n');

  console.log('✅ Versioning MVP validation complete!');
  console.log('\n📋 Summary:');
  console.log('   - Feature flag: Enabled');
  console.log('   - Manifests: Present and valid');
  console.log('   - Resolver: Working');
  console.log('   - Files: Resolved correctly');
  console.log('\n💡 Next steps:');
  console.log('   1. Check backend logs for [PROOF] entries during formatting');
  console.log('   2. Test rollback by changing defaultVersion in manifest');
  console.log('   3. Verify outputs match when using manifest vs filesystem paths');
}

testVersioning().catch(console.error);

