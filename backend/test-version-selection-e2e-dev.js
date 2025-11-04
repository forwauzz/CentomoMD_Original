/**
 * End-to-End Test: Template Version Selection (Dev Mode)
 * 
 * Uses dev mode bypass or mock token for testing
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Load environment variables
config({ path: join(projectRoot, '.env') });

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

// Test transcript
const TEST_TRANSCRIPT = `La fiche de réclamation du travailleur décrit l'événement suivant. Survenu le 7 octobre 2023, deux points.`;

// Test results
const results = {
  passed: 0,
  failed: 0,
  skipped: 0,
  errors: []
};

// Helper: Make API request with optional auth
async function apiRequest(endpoint, method = 'POST', body = {}, useAuth = false) {
  try {
    const headers = {
      'Content-Type': 'application/json',
      'x-user-email': 'test@example.com'
    };

    // If using auth, add a mock token (won't be validated if optionalAuth works)
    if (useAuth) {
      headers['Authorization'] = 'Bearer mock-token-for-testing';
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers,
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

// Test 1: Backward Compatibility (No Auth)
async function testBackwardCompatibility() {
  await test('Backward Compatibility: /api/format/mode2 without templateVersion (no auth)', async () => {
    const response = await apiRequest('/api/format/mode2', 'POST', {
      transcript: TEST_TRANSCRIPT,
      section: '7',
      language: 'fr',
      templateRef: 'section7-ai-formatter'
    }, false); // No auth

    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}: ${JSON.stringify(response.data)}`);
    }

    if (!response.data.formatted) {
      throw new Error('Response missing formatted content');
    }

    console.log(`   ✓ Response received (${response.data.formatted.length} chars)`);
  })();

  await test('Backward Compatibility: /api/format/mode2 without templateVersion (with mock auth)', async () => {
    const response = await apiRequest('/api/format/mode2', 'POST', {
      transcript: TEST_TRANSCRIPT,
      section: '7',
      language: 'fr',
      templateRef: 'section7-ai-formatter'
    }, true); // With mock auth

    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}: ${JSON.stringify(response.data)}`);
    }

    console.log(`   ✓ Response received with mock auth`);
  })();

  await test('Backward Compatibility: /api/analyze/ab-test without templateVersion', async () => {
    const response = await apiRequest('/api/analyze/ab-test', 'POST', {
      original: TEST_TRANSCRIPT,
      templateA: 'section7-ai-formatter',
      templateB: 'section7-rd',
      language: 'fr'
    }, false);

    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}: ${JSON.stringify(response.data)}`);
    }

    if (!response.data.templateA || !response.data.templateB) {
      throw new Error('Response missing template results');
    }

    console.log(`   ✓ Both templates processed successfully`);
  })();

  await test('Backward Compatibility: /api/benchmark without templateVersion', async () => {
    // Skip if feature flag disabled
    if (process.env.FEATURE_MODEL_SELECTION_TRANSCRIPT_ANALYSIS !== 'true') {
      console.log(`   ⚠ Feature flag disabled (skipping)`);
      results.skipped++;
      return;
    }

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
    }, false);

    if (response.status === 403) {
      console.log(`   ⚠ Feature flag or allowlist check (expected)`);
      results.skipped++;
      return;
    }

    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}: ${JSON.stringify(response.data)}`);
    }

    console.log(`   ✓ Benchmark processed successfully`);
  })();
}

// Test 2: Version Selection (when flags enabled)
async function testVersionSelection() {
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
      templateVersion: 'current'
    }, false);

    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}: ${JSON.stringify(response.data)}`);
    }

    console.log(`   ✓ Version selection working`);
  })();
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Template Version Selection End-to-End Tests (Dev Mode)\n');
  console.log(`API Base URL: ${API_BASE_URL}`);
  console.log(`\nFeature Flags:`);
  console.log(`  FEATURE_TEMPLATE_VERSION_SELECTION: ${process.env.FEATURE_TEMPLATE_VERSION_SELECTION || 'false'}`);
  console.log(`  FEATURE_TEMPLATE_VERSION_REMOTE_STORAGE: ${process.env.FEATURE_TEMPLATE_VERSION_REMOTE_STORAGE || 'false'}`);
  console.log(`  NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
  console.log(`  AUTH_REQUIRED: ${process.env.AUTH_REQUIRED || 'not set'}`);

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

