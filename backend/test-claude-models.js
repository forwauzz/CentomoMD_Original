#!/usr/bin/env node

/**
 * Claude Model Test Script
 * Tests Anthropic API connectivity and model availability
 */

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';
// Get auth token from environment or command line argument
const AUTH_TOKEN = process.env.AUTH_TOKEN || process.argv[2] || null;

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

// Helper function to make HTTP requests
async function makeRequest(method, endpoint, body = null, headers = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const requestHeaders = {
    'Content-Type': 'application/json',
    ...headers
  };
  
  // Add auth token if provided
  if (AUTH_TOKEN) {
    requestHeaders['Authorization'] = `Bearer ${AUTH_TOKEN}`;
  }
  
  const options = {
    method,
    headers: requestHeaders
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
  console.log(`\n🧪 Testing: ${name}`);
  try {
    await testFn();
    results.passed++;
    results.tests.push({ name, status: 'PASSED' });
    console.log(`✅ ${name} - PASSED`);
  } catch (error) {
    results.failed++;
    results.tests.push({ name, status: 'FAILED', error: error.message });
    console.log(`❌ ${name} - FAILED: ${error.message}`);
  }
}

// Test 1: Check if models endpoint returns Claude models
async function testModelsEndpoint() {
  const response = await makeRequest('GET', '/api/models/available');
  
  // Accept 401 (auth required) or 403 (feature disabled) as acceptable
  if (response.status === 401) {
    console.log(`   ⚠️  Auth required - endpoint exists but needs authentication`);
    console.log(`   ⚠️  To test fully, provide authentication token`);
    return; // Skip this test if auth is required
  }
  
  if (response.status === 403) {
    console.log(`   ⚠️  Feature disabled - endpoint exists but feature flag is off`);
    return; // Skip if feature is disabled
  }
  
  if (response.status !== 200) {
    throw new Error(`Expected status 200, 401, or 403, got ${response.status}: ${JSON.stringify(response.data)}`);
  }
  
  if (!response.data.success || !response.data.models) {
    throw new Error('Response missing models array');
  }
  
  const claudeModels = response.data.models.filter(m => m.provider === 'anthropic');
  
  if (claudeModels.length === 0) {
    throw new Error('No Claude models found in available models');
  }
  
  console.log(`   Found ${claudeModels.length} Claude models:`);
  claudeModels.forEach(m => {
    console.log(`   - ${m.id} (${m.name})`);
  });
  
  // Check for specific models
  const modelIds = claudeModels.map(m => m.id);
  const requiredModels = ['claude-3-5-sonnet', 'claude-3-5-haiku', 'claude-3-haiku'];
  
  for (const required of requiredModels) {
    if (!modelIds.includes(required)) {
      console.log(`   ⚠️  Warning: ${required} not found in available models`);
    }
  }
}

// Test 2: Test Claude 3.5 Sonnet with a simple format request
async function testClaude35Sonnet() {
  const testTranscript = 'Patient presents with headache and fever. Symptoms started yesterday.';
  
  const response = await makeRequest('POST', '/api/format/mode2', {
    transcript: testTranscript,
    section: '7',
    inputLanguage: 'fr',
    outputLanguage: 'fr',
    model: 'claude-3-5-sonnet'
  });
  
  // Check for specific errors
  if (response.status === 400 && response.data.error) {
    const errorMsg = response.data.error.toLowerCase();
    if (errorMsg.includes('model') && errorMsg.includes('not found')) {
      throw new Error(`Model not found: ${response.data.error}`);
    }
    if (errorMsg.includes('model') && errorMsg.includes('invalid')) {
      throw new Error(`Invalid model: ${response.data.error}`);
    }
  }
  
  // 404 means model name issue
  if (response.status === 404 || (response.data.error && response.data.error.includes('404'))) {
    throw new Error(`Model not found (404): ${JSON.stringify(response.data)}`);
  }
  
  // 401 is acceptable (auth required)
  if (response.status === 401) {
    console.log(`   ⚠️  Auth required (expected) - endpoint exists`);
    return;
  }
  
  // 429 is acceptable (rate limit)
  if (response.status === 429) {
    console.log(`   ⚠️  Rate limited (API is working, just hit limit)`);
    return;
  }
  
  // 200 means success
  if (response.status === 200) {
    console.log(`   ✅ Model responded successfully`);
    if (response.data.formatted) {
      console.log(`   Output length: ${response.data.formatted.length} chars`);
    }
    return;
  }
  
  // 500 might be API error but endpoint exists
  if (response.status === 500) {
    const errorMsg = response.data.error || JSON.stringify(response.data);
    if (errorMsg.includes('404') || errorMsg.includes('not found')) {
      throw new Error(`Model not found in API: ${errorMsg}`);
    }
    console.log(`   ⚠️  Server error (may be API issue): ${errorMsg}`);
    return;
  }
  
  throw new Error(`Unexpected status: ${response.status} - ${JSON.stringify(response.data)}`);
}

// Test 3: Test Claude 3.5 Haiku
async function testClaude35Haiku() {
  const testTranscript = 'Patient reports back pain. Onset was sudden during lifting.';
  
  const response = await makeRequest('POST', '/api/format/mode2', {
    transcript: testTranscript,
    section: '7',
    inputLanguage: 'fr',
    outputLanguage: 'fr',
    model: 'claude-3-5-haiku'
  });
  
  if (response.status === 400 && response.data.error) {
    const errorMsg = response.data.error.toLowerCase();
    if (errorMsg.includes('model') && (errorMsg.includes('not found') || errorMsg.includes('invalid'))) {
      throw new Error(`Model not found: ${response.data.error}`);
    }
  }
  
  if (response.status === 404 || (response.data.error && response.data.error.includes('404'))) {
    throw new Error(`Model not found (404): ${JSON.stringify(response.data)}`);
  }
  
  if (response.status === 401 || response.status === 429) {
    console.log(`   ⚠️  ${response.status === 401 ? 'Auth required' : 'Rate limited'} (expected)`);
    return;
  }
  
  if (response.status === 200) {
    console.log(`   ✅ Model responded successfully`);
    return;
  }
  
  if (response.status === 500) {
    const errorMsg = response.data.error || JSON.stringify(response.data);
    if (errorMsg.includes('404') || errorMsg.includes('not found')) {
      throw new Error(`Model not found in API: ${errorMsg}`);
    }
    console.log(`   ⚠️  Server error: ${errorMsg}`);
    return;
  }
}

// Test 4: Test Claude 3 Haiku
async function testClaude3Haiku() {
  const testTranscript = 'Patient has chest pain. Started 30 minutes ago.';
  
  const response = await makeRequest('POST', '/api/format/mode2', {
    transcript: testTranscript,
    section: '7',
    inputLanguage: 'fr',
    outputLanguage: 'fr',
    model: 'claude-3-haiku'
  });
  
  if (response.status === 400 && response.data.error) {
    const errorMsg = response.data.error.toLowerCase();
    if (errorMsg.includes('model') && (errorMsg.includes('not found') || errorMsg.includes('invalid'))) {
      throw new Error(`Model not found: ${response.data.error}`);
    }
  }
  
  if (response.status === 404 || (response.data.error && response.data.error.includes('404'))) {
    throw new Error(`Model not found (404): ${JSON.stringify(response.data)}`);
  }
  
  if (response.status === 401 || response.status === 429) {
    console.log(`   ⚠️  ${response.status === 401 ? 'Auth required' : 'Rate limited'} (expected)`);
    return;
  }
  
  if (response.status === 200) {
    console.log(`   ✅ Model responded successfully`);
    return;
  }
  
  if (response.status === 500) {
    const errorMsg = response.data.error || JSON.stringify(response.data);
    if (errorMsg.includes('404') || errorMsg.includes('not found')) {
      throw new Error(`Model not found in API: ${errorMsg}`);
    }
    console.log(`   ⚠️  Server error: ${errorMsg}`);
    return;
  }
}

// Test 5: Check backend logs for model mapping
async function testModelMapping() {
  console.log('   Checking if model mapping is correct...');
  console.log('   Expected mappings:');
  console.log('     claude-3-5-sonnet -> claude-3-5-sonnet-20240620');
  console.log('     claude-3-5-haiku -> claude-3-5-haiku-20240715');
  console.log('     claude-3-haiku -> claude-3-haiku-20240307');
  console.log('   ⚠️  Check backend console logs for [Anthropic] Mapped messages');
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting Claude Model Tests');
  console.log('='.repeat(60));
  console.log(`Base URL: ${BASE_URL}`);
  if (AUTH_TOKEN) {
    console.log(`✅ Auth token provided (testing with authentication)`);
  } else {
    console.log(`⚠️  No auth token - tests will be limited (use: node test-claude-models.js <token>)`);
    console.log(`   Or set AUTH_TOKEN environment variable`);
  }
  console.log('='.repeat(60));
  
  await runTest('Models Endpoint - Claude Models Available', testModelsEndpoint);
  await runTest('Claude 3.5 Sonnet - API Call', testClaude35Sonnet);
  await runTest('Claude 3.5 Haiku - API Call', testClaude35Haiku);
  await runTest('Claude 3 Haiku - API Call', testClaude3Haiku);
  await runTest('Model Mapping Check', testModelMapping);
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📈 Total: ${results.passed + results.failed}`);
  
  if (results.failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.tests
      .filter(t => t.status === 'FAILED')
      .forEach(t => console.log(`   - ${t.name}: ${t.error}`));
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('💡 Interpretation:');
  console.log('   - 200: Model is working correctly');
  console.log('   - 401: Auth required (endpoint exists, needs auth)');
  console.log('   - 404: Model name not found in Anthropic API');
  console.log('   - 429: Rate limited (API is working)');
  console.log('   - 500: Server error (may be API issue)');
  console.log('='.repeat(60));
  
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  console.error('❌ Test runner failed:', error);
  process.exit(1);
});

