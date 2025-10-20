#!/usr/bin/env node

/**
 * Test Section 7 R&D Template File Loading
 * Verifies all required files are accessible and loadable
 */

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testSection7RdFiles() {
  console.log('🧪 Testing Section 7 R&D Template File Loading...\n');

// Test 1: Load master configuration
console.log('1️⃣ Loading master configuration...');
try {
  const masterConfigPath = path.join(process.cwd(), '..', 'configs', 'master_prompt_section7.json');
  const masterConfig = JSON.parse(fs.readFileSync(masterConfigPath, 'utf-8'));
  console.log('✅ Master config loaded:', masterConfig.id);
  console.log('   Language:', masterConfig.language);
  console.log('   Artifacts:', Object.keys(masterConfig.artifacts));
} catch (error) {
  console.log('❌ Failed to load master config:', error.message);
}

// Test 2: Check all artifact files exist
console.log('\n2️⃣ Checking artifact files...');
const artifacts = {
  system: '../prompts/system_section7_fr.xml',
  plan: '../prompts/plan_section7_fr.xml', 
  manager: '../prompts/manager_eval_section7_fr.xml',
  golden_standard: '../training/golden_cases_section7.jsonl'
};

for (const [name, filePath] of Object.entries(artifacts)) {
  const fullPath = path.join(process.cwd(), filePath);
  try {
    const exists = fs.existsSync(fullPath);
    if (exists) {
      const stats = fs.statSync(fullPath);
      console.log(`✅ ${name}: ${filePath} (${stats.size} bytes)`);
    } else {
      console.log(`❌ ${name}: ${filePath} - FILE NOT FOUND`);
    }
  } catch (error) {
    console.log(`❌ ${name}: ${filePath} - ERROR: ${error.message}`);
  }
}

// Test 3: Try to load each file content
console.log('\n3️⃣ Testing file content loading...');
for (const [name, filePath] of Object.entries(artifacts)) {
  const fullPath = path.join(process.cwd(), filePath);
  try {
    const content = fs.readFileSync(fullPath, 'utf-8');
    console.log(`✅ ${name}: Loaded ${content.length} characters`);
    
    // Show first few lines for verification
    const lines = content.split('\n').slice(0, 3);
    console.log(`   Preview: ${lines.join(' ').substring(0, 80)}...`);
  } catch (error) {
    console.log(`❌ ${name}: Failed to load content - ${error.message}`);
  }
}

// Test 4: Test Section7RdService file loading
console.log('\n4️⃣ Testing Section7RdService file loading...');
try {
  const { Section7RdService } = await import('./dist/src/services/section7RdService.js');
  console.log('✅ Section7RdService imported successfully');
  
  // Test if the service can be instantiated
  const service = new Section7RdService();
  console.log('✅ Section7RdService instantiated successfully');
} catch (error) {
  console.log('❌ Section7RdService failed:', error.message);
}

  console.log('\n✨ Section 7 R&D Template file loading test completed!');
}

// Run the test
testSection7RdFiles().catch(console.error);
