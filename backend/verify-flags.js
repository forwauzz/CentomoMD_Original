/**
 * Verify Feature Flags Configuration
 * 
 * Checks if flags are correctly loaded from .env file
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from backend/.env
config({ path: join(__dirname, '.env') });

console.log('🔍 Verifying Feature Flags Configuration\n');
console.log('='.repeat(60));

// Check raw environment variables
console.log('\n📋 Raw Environment Variables:');
console.log(`  FEATURE_TEMPLATE_VERSION_SELECTION: "${process.env.FEATURE_TEMPLATE_VERSION_SELECTION || 'undefined'}"`);
console.log(`  FEATURE_TEMPLATE_VERSION_REMOTE_STORAGE: "${process.env.FEATURE_TEMPLATE_VERSION_REMOTE_STORAGE || 'undefined'}"`);

// Check flags module (how backend reads them)
console.log('\n📋 Backend Flags Module (how backend reads them):');
try {
  const flagsModule = await import('./dist/src/config/flags.js');
  const FLAGS = flagsModule.FLAGS;
  
  console.log(`  FEATURE_TEMPLATE_VERSION_SELECTION: ${FLAGS.FEATURE_TEMPLATE_VERSION_SELECTION}`);
  console.log(`  FEATURE_TEMPLATE_VERSION_REMOTE_STORAGE: ${FLAGS.FEATURE_TEMPLATE_VERSION_REMOTE_STORAGE}`);
  
  // Verify they match
  const expectedSelection = (process.env.FEATURE_TEMPLATE_VERSION_SELECTION ?? 'false') === 'true';
  const expectedRemote = (process.env.FEATURE_TEMPLATE_VERSION_REMOTE_STORAGE ?? 'false') === 'true';
  
  console.log('\n✅ Verification:');
  if (FLAGS.FEATURE_TEMPLATE_VERSION_SELECTION === expectedSelection) {
    console.log(`  ✅ FEATURE_TEMPLATE_VERSION_SELECTION matches env (${expectedSelection})`);
  } else {
    console.log(`  ❌ FEATURE_TEMPLATE_VERSION_SELECTION mismatch! Expected ${expectedSelection}, got ${FLAGS.FEATURE_TEMPLATE_VERSION_SELECTION}`);
  }
  
  if (FLAGS.FEATURE_TEMPLATE_VERSION_REMOTE_STORAGE === expectedRemote) {
    console.log(`  ✅ FEATURE_TEMPLATE_VERSION_REMOTE_STORAGE matches env (${expectedRemote})`);
  } else {
    console.log(`  ❌ FEATURE_TEMPLATE_VERSION_REMOTE_STORAGE mismatch! Expected ${expectedRemote}, got ${FLAGS.FEATURE_TEMPLATE_VERSION_REMOTE_STORAGE}`);
  }
  
} catch (error) {
  console.error('❌ Error loading flags module:', error.message);
  console.log('\n💡 Make sure to run: npm run build');
}

// Check .env file location
console.log('\n📁 .env File Location:');
const envPath = join(__dirname, '.env');
console.log(`  ${envPath}`);
const { existsSync } = await import('fs');
if (existsSync(envPath)) {
  console.log('  ✅ .env file exists');
} else {
  console.log('  ❌ .env file NOT found');
}

// Instructions
console.log('\n' + '='.repeat(60));
console.log('📋 Instructions:');
console.log('='.repeat(60));
console.log('1. Make sure flags are in: backend/.env');
console.log('2. Format should be exactly:');
console.log('   FEATURE_TEMPLATE_VERSION_SELECTION=true');
console.log('   FEATURE_TEMPLATE_VERSION_REMOTE_STORAGE=true');
console.log('3. No spaces around = sign');
console.log('4. No quotes around true/false');
console.log('5. Restart backend server after changing flags');
console.log('6. Run: npm run build (if using compiled code)');

