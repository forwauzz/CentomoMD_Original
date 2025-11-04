/**
 * End-to-End Test: Template Version Selection
 * 
 * Tests version selection functionality across all endpoints:
 * - /api/format/mode2
 * - /api/analyze/ab-test
 * - /api/benchmark
 * 
 * Tests both with flags enabled and disabled (backward compatibility)
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Load environment variables
config({ path: join(projectRoot, '.env') });

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';
const USER_EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com';

// Test transcript
const TEST_TRANSCRIPT = `La fiche de réclamation du travailleur décrit l'événement suivant. Survenu le 7 octobre 2023, deux points. Ouvrir la parenthèse, guillemets. Je versais la chaudière d'eau. Ressenti de douleur côté gauche, bas du dos. Ensuite, j'ai poussé le chariot direction l'ascenseur. La roue devant du chariot reste prise dans la craque de l'ascenseur. Ressenti, point. Pression côté gauche au moment et quand j'ai retiré le chariot, sensation de chaud dans le bas du dos.`;

// Test results
const results = {
  passed: 0,
  failed: 0,
  skipped: 0,
  errors: []
};

// Helper: Make API request
async function apiRequest(endpoint, method = 'POST', body = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-user-email': USER_EMAIL
      },
      body: method === 'POST' ? JSON.stringify(body) : undefined
    });

    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    return { status: 500, error: error.message };
  }
}

// Test helper
function test(name, fn) {
  return async () => {
    try {
      console.log(`\n🧪 Testing: ${name}`);
      await fn();
      results.passed++;
      console.log(`✅ PASSED: ${name}`);
    } catch (error) {
      results.failed++;
      results.errors.push({ test: name, error: error.message });
      console.error(`❌ FAILED: ${name}`);
      console.error(`   Error: ${error.message}`);
    }
  };
}

// Test 1: Backward Compatibility (Flags Disabled)
async function testBackwardCompatibility() {
  await test('Backward Compatibility: /api/format/mode2 without templateVersion', async () => {
    const response = await apiRequest('/api/format/mode2', 'POST', {
      transcript: TEST_TRANSCRIPT,
      section: '7',
      language: 'fr',
      templateRef: 'section7-ai-formatter'
    });

    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}: ${JSON.stringify(response.data)}`);
    }

    if (!response.data.formatted) {
      throw new Error('Response missing formatted content');
    }

    console.log(`   ✓ Response received (${response.data.formatted.length} chars)`);
  })();

  await test('Backward Compatibility: /api/analyze/ab-test without templateVersion', async () => {
    const response = await apiRequest('/api/analyze/ab-test', 'POST', {
      original: TEST_TRANSCRIPT,
      templateA: 'section7-ai-formatter',
      templateB: 'section7-rd',
      language: 'fr'
    });

    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}: ${JSON.stringify(response.data)}`);
    }

    if (!response.data.templateA || !response.data.templateB) {
      throw new Error('Response missing template results');
    }

    console.log(`   ✓ Both templates processed successfully`);
  })();

  await test('Backward Compatibility: /api/benchmark without templateVersion', async () => {
    const response = await apiRequest('/api/benchmark', 'POST', {
      original: TEST_TRANSCRIPT,
      reference: 'Test reference output',
      autoGenerate: true,
      combinations: [
        {
          name: 'GPT-4o-mini + Section 7 AI',
          model: 'gpt-4o-mini',
          templateId: 'section7-ai-formatter'
        }
      ],
      config: {
        section: 'section_7',
        language: 'fr'
      }
    });

    // Note: This may fail if feature flag is disabled, which is expected
    if (response.status === 403) {
      console.log(`   ⚠ Feature flag disabled (expected)`);
      results.skipped++;
      return;
    }

    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}: ${JSON.stringify(response.data)}`);
    }

    console.log(`   ✓ Benchmark processed successfully`);
  })();
}

// Test 2: Version Selection (Flags Enabled)
async function testVersionSelection() {
  // Check if flags are enabled
  const flagsEnabled = process.env.FEATURE_TEMPLATE_VERSION_SELECTION === 'true';
  
  if (!flagsEnabled) {
    console.log('\n⚠️  FEATURE_TEMPLATE_VERSION_SELECTION is disabled');
    console.log('   Set FEATURE_TEMPLATE_VERSION_SELECTION=true to test version selection');
    results.skipped += 3;
    return;
  }

  await test('Version Selection: /api/format/mode2 with templateVersion', async () => {
    const response = await apiRequest('/api/format/mode2', 'POST', {
      transcript: TEST_TRANSCRIPT,
      section: '7',
      language: 'fr',
      templateRef: 'section7-ai-formatter',
      templateVersion: 'current' // Use 'current' version
    });

    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}: ${JSON.stringify(response.data)}`);
    }

    if (!response.data.formatted) {
      throw new Error('Response missing formatted content');
    }

    console.log(`   ✓ Version selection working (${response.data.formatted.length} chars)`);
  })();

  await test('Version Selection: /api/analyze/ab-test with templateVersionA and templateVersionB', async () => {
    const response = await apiRequest('/api/analyze/ab-test', 'POST', {
      original: TEST_TRANSCRIPT,
      templateA: 'section7-ai-formatter',
      templateB: 'section7-rd',
      language: 'fr',
      templateVersionA: 'current',
      templateVersionB: 'current'
    });

    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}: ${JSON.stringify(response.data)}`);
    }

    if (!response.data.templateA || !response.data.templateB) {
      throw new Error('Response missing template results');
    }

    console.log(`   ✓ Both templates processed with version selection`);
  })();

  await test('Version Selection: /api/benchmark with templateVersion', async () => {
    const response = await apiRequest('/api/benchmark', 'POST', {
      original: TEST_TRANSCRIPT,
      reference: 'Test reference output',
      autoGenerate: true,
      combinations: [
        {
          name: 'GPT-4o-mini + Section 7 AI (with version)',
          model: 'gpt-4o-mini',
          templateId: 'section7-ai-formatter',
          templateVersion: 'current'
        }
      ],
      config: {
        section: 'section_7',
        language: 'fr'
      }
    });

    if (response.status === 403) {
      throw new Error('Feature flag disabled - cannot test version selection');
    }

    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}: ${JSON.stringify(response.data)}`);
    }

    console.log(`   ✓ Benchmark processed with version selection`);
  })();
}

// Test 3: Version Alias Resolution
async function testVersionAliases() {
  const flagsEnabled = process.env.FEATURE_TEMPLATE_VERSION_SELECTION === 'true';
  const remoteStorageEnabled = process.env.FEATURE_TEMPLATE_VERSION_REMOTE_STORAGE === 'true';

  if (!flagsEnabled) {
    console.log('\n⚠️  FEATURE_TEMPLATE_VERSION_SELECTION is disabled');
    results.skipped += 2;
    return;
  }

  await test('Version Alias: /api/format/mode2 with "latest" alias', async () => {
    const response = await apiRequest('/api/format/mode2', 'POST', {
      transcript: TEST_TRANSCRIPT,
      section: '7',
      language: 'fr',
      templateRef: 'section7-ai-formatter',
      templateVersion: 'latest' // Use 'latest' alias
    });

    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}: ${JSON.stringify(response.data)}`);
    }

    console.log(`   ✓ 'latest' alias resolved successfully`);
  })();

  if (remoteStorageEnabled) {
    await test('Version Alias: /api/format/mode2 with "stable" alias', async () => {
      const response = await apiRequest('/api/format/mode2', 'POST', {
        transcript: TEST_TRANSCRIPT,
        section: '7',
        language: 'fr',
        templateRef: 'section7-ai-formatter',
        templateVersion: 'stable' // Use 'stable' alias
      });

      if (response.status !== 200) {
        throw new Error(`Expected 200, got ${response.status}: ${JSON.stringify(response.data)}`);
      }

      console.log(`   ✓ 'stable' alias resolved successfully`);
    })();
  } else {
    console.log('\n⚠️  FEATURE_TEMPLATE_VERSION_REMOTE_STORAGE is disabled');
    console.log('   Skipping alias resolution tests (requires remote storage)');
    results.skipped += 1;
  }
}

// Test 4: Version Resolution Chain
async function testVersionResolutionChain() {
  const flagsEnabled = process.env.FEATURE_TEMPLATE_VERSION_SELECTION === 'true';

  if (!flagsEnabled) {
    console.log('\n⚠️  FEATURE_TEMPLATE_VERSION_SELECTION is disabled');
    results.skipped += 1;
    return;
  }

  await test('Version Resolution: Default version when templateVersion is undefined', async () => {
    // This should use default version resolution
    const response = await apiRequest('/api/format/mode2', 'POST', {
      transcript: TEST_TRANSCRIPT,
      section: '7',
      language: 'fr',
      templateRef: 'section7-ai-formatter'
      // No templateVersion provided - should use default
    });

    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}: ${JSON.stringify(response.data)}`);
    }

    console.log(`   ✓ Default version resolution working`);
  })();
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Template Version Selection End-to-End Tests\n');
  console.log(`API Base URL: ${API_BASE_URL}`);
  console.log(`User Email: ${USER_EMAIL}`);
  console.log(`\nFeature Flags:`);
  console.log(`  FEATURE_TEMPLATE_VERSION_SELECTION: ${process.env.FEATURE_TEMPLATE_VERSION_SELECTION || 'false'}`);
  console.log(`  FEATURE_TEMPLATE_VERSION_REMOTE_STORAGE: ${process.env.FEATURE_TEMPLATE_VERSION_REMOTE_STORAGE || 'false'}`);

  try {
    // Test 1: Backward Compatibility
    console.log('\n' + '='.repeat(60));
    console.log('Test Suite 1: Backward Compatibility (Flags Disabled)');
    console.log('='.repeat(60));
    await testBackwardCompatibility();

    // Test 2: Version Selection
    console.log('\n' + '='.repeat(60));
    console.log('Test Suite 2: Version Selection (Flags Enabled)');
    console.log('='.repeat(60));
    await testVersionSelection();

    // Test 3: Version Aliases
    console.log('\n' + '='.repeat(60));
    console.log('Test Suite 3: Version Alias Resolution');
    console.log('='.repeat(60));
    await testVersionAliases();

    // Test 4: Version Resolution Chain
    console.log('\n' + '='.repeat(60));
    console.log('Test Suite 4: Version Resolution Chain');
    console.log('='.repeat(60));
    await testVersionResolutionChain();

  } catch (error) {
    console.error('\n❌ Test execution error:', error);
    results.errors.push({ test: 'Test Execution', error: error.message });
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('Test Summary');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`⚠️  Skipped: ${results.skipped}`);
  console.log(`Total: ${results.passed + results.failed + results.skipped}`);

  if (results.errors.length > 0) {
    console.log('\n❌ Errors:');
    results.errors.forEach(({ test, error }) => {
      console.log(`   - ${test}: ${error}`);
    });
  }

  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

