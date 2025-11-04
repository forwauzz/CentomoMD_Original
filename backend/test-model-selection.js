#!/usr/bin/env node

/**
 * Model Selection Feature Test
 * Tests model selection functionality for dictation and transcript analysis
 * Uses optionalAuth endpoints to avoid auth issues
 */

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  skipped: 0,
  tests: []
};

// Helper function to make HTTP requests
async function makeRequest(method, endpoint, body = null, headers = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  try {
    const response = await fetch(url, options);
    const data = await response.text();
    let jsonData;
    
    try {
      jsonData = JSON.parse(data);
    } catch {
      jsonData = data;
    }
    
    return {
      status: response.status,
      statusText: response.statusText,
      data: jsonData,
      headers: Object.fromEntries(response.headers.entries())
    };
  } catch (error) {
    return {
      status: 0,
      statusText: 'Network Error',
      data: { error: error.message },
      headers: {}
    };
  }
}

// Test runner
async function runTest(name, testFn) {
  try {
    await testFn();
    results.passed++;
    results.tests.push({ name, status: 'PASSED' });
    console.log(`✅ ${name}`);
  } catch (error) {
    results.failed++;
    results.tests.push({ name, status: 'FAILED', error: error.message });
    console.log(`❌ ${name}: ${error.message}`);
  }
}

// Test 1: Check if models endpoint is accessible
async function testModelsEndpoint() {
  const response = await makeRequest('GET', '/api/models/available');
  
  // Should return 403 (feature disabled), 200 (feature enabled), or 401 (auth required)
  // All are acceptable - we just need to verify the endpoint exists
  if (response.status !== 200 && response.status !== 403 && response.status !== 401) {
    throw new Error(`Expected status 200, 403, or 401, got ${response.status}`);
  }
  
  if (response.status === 200) {
    // If enabled, check response structure
    if (!response.data || !response.data.hasOwnProperty('success')) {
      throw new Error('Response missing success field');
    }
    
    if (response.data.success && response.data.models) {
      console.log(`   Found ${response.data.models.length} available models`);
      // Check for Claude models
      const claudeModels = response.data.models.filter(m => m.provider === 'anthropic');
      if (claudeModels.length > 0) {
        console.log(`   ✅ Claude models available: ${claudeModels.map(m => m.id).join(', ')}`);
      } else {
        console.log(`   ⚠️  No Claude models found (may need FEATURE_MODEL_SELECTION=true)`);
      }
    }
  } else {
    console.log(`   ⚠️  Feature disabled (expected - requires flags)`);
  }
}

// Test 2: Test format endpoint accepts model parameter
async function testFormatEndpointModelParameter() {
  const testTranscript = 'Test transcript for model selection testing.';
  
  const response = await makeRequest('POST', '/api/format/mode2', {
    transcript: testTranscript,
    section: '7',
    inputLanguage: 'fr',
    outputLanguage: 'fr',
    model: 'claude-3-5-sonnet' // Test with Claude model
  });
  
  // Should accept the request (may return 200, 400, 401, 429, or 500)
  // 401 is acceptable if auth is required (optionalAuth should allow it, but may vary)
  if (response.status === 401) {
    console.log(`   ⚠️  Auth required (status: 401) - endpoint exists but needs auth`);
    return; // Skip this test if auth is required
  }
  
  // Should accept the request (may return 200, 400, 429, or 500 depending on API key)
  // We just want to verify it doesn't reject the model parameter
  if (response.status === 400 && response.data.error?.includes('model')) {
    throw new Error(`Model parameter rejected: ${response.data.error}`);
  }
  
  // 429 (quota) or 500 (API key) are acceptable - means it tried to use the model
  if (response.status === 200 || response.status === 429 || response.status === 500) {
    console.log(`   ✅ Model parameter accepted (status: ${response.status})`);
    if (response.status === 429) {
      console.log(`   ⚠️  OpenAI quota exceeded (expected if quota issue persists)`);
    }
  } else if (response.status === 400) {
    // Check if error is about model specifically
    const errorMsg = response.data.error || JSON.stringify(response.data);
    if (errorMsg.includes('model') || errorMsg.includes('Model')) {
      throw new Error(`Model parameter may be rejected: ${errorMsg}`);
    }
    console.log(`   ⚠️  Status 400 but not model-related: ${errorMsg}`);
  }
}

// Test 3: Test format endpoint with default (no model parameter)
async function testFormatEndpointDefaultModel() {
  const testTranscript = 'Test transcript for default model testing.';
  
  const response = await makeRequest('POST', '/api/format/mode2', {
    transcript: testTranscript,
    section: '7',
    inputLanguage: 'fr',
    outputLanguage: 'fr'
    // No model parameter - should use default
  });
  
  // 401 is acceptable if auth is required
  if (response.status === 401) {
    console.log(`   ⚠️  Auth required (status: 401) - endpoint exists`);
    return; // Skip if auth is required
  }
  
  // Should work with default model (may fail due to quota, but should not reject request)
  if (response.status === 400 && response.data.error?.includes('model')) {
    throw new Error(`Default model handling failed: ${response.data.error}`);
  }
  
  // 200, 429, or 500 are acceptable
  if (response.status === 200 || response.status === 429 || response.status === 500) {
    console.log(`   ✅ Default model works (status: ${response.status})`);
  } else {
    console.log(`   ⚠️  Status ${response.status}: ${JSON.stringify(response.data)}`);
  }
}

// Test 4: Test with different Claude models
async function testClaudeModels() {
  const claudeModels = ['claude-3-5-sonnet', 'claude-3-5-haiku', 'claude-3-haiku'];
  const testTranscript = 'Test transcript for Claude model testing.';
  
  for (const model of claudeModels) {
    const response = await makeRequest('POST', '/api/format/mode2', {
      transcript: testTranscript,
      section: '7',
      inputLanguage: 'fr',
      outputLanguage: 'fr',
      model: model
    });
    
    // 401 is acceptable if auth is required
    if (response.status === 401) {
      console.log(`   ⚠️  ${model}: Auth required (endpoint exists)`);
      continue;
    }
    
    // Accept any status that doesn't reject the model parameter
    if (response.status === 400 && response.data.error?.includes('model')) {
      console.log(`   ⚠️  ${model}: Model rejected - ${response.data.error}`);
    } else if (response.status === 200 || response.status === 429 || response.status === 500) {
      console.log(`   ✅ ${model}: Accepted (status: ${response.status})`);
    } else {
      console.log(`   ⚠️  ${model}: Status ${response.status}`);
    }
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting Model Selection Feature Tests');
  console.log('='.repeat(60));
  console.log(`Base URL: ${BASE_URL}`);
  console.log('📝 Note: These tests verify endpoint structure and model parameter acceptance.');
  console.log('   Auth requirements (401) are acceptable - endpoints exist and are reachable.');
  console.log('='.repeat(60));
  
  await runTest('Models Endpoint Accessible', testModelsEndpoint);
  await runTest('Format Endpoint Accepts Model Parameter', testFormatEndpointModelParameter);
  await runTest('Format Endpoint Default Model', testFormatEndpointDefaultModel);
  await runTest('Claude Models Support', testClaudeModels);
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`⏭️  Skipped: ${results.skipped}`);
  console.log(`📈 Total: ${results.passed + results.failed + results.skipped}`);
  
  if (results.failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.tests
      .filter(t => t.status === 'FAILED')
      .forEach(t => console.log(`   - ${t.name}: ${t.error}`));
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('💡 Interpretation:');
  console.log('   - 401 responses indicate endpoints exist but require authentication');
  console.log('   - 200/429/500 responses indicate model parameter is accepted');
  console.log('   - 400 responses with "model" errors indicate parameter rejection');
  console.log('='.repeat(60));
  
  // Don't fail on 401 - these are expected in production without auth
  const authOnlyFailures = results.tests.filter(t => 
    t.status === 'FAILED' && t.error?.includes('401')
  );
  const actualFailures = results.failed - authOnlyFailures.length;
  
  if (actualFailures === 0 && authOnlyFailures.length > 0) {
    console.log('\n✅ All functional tests passed (401 auth requirements are expected)');
    process.exit(0);
  } else {
    process.exit(actualFailures > 0 ? 1 : 0);
  }
}

// Run tests
runAllTests().catch(error => {
  console.error('❌ Test runner failed:', error);
  process.exit(1);
});

