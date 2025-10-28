#!/usr/bin/env node

/**
 * Comprehensive API Endpoint Test Suite
 * Tests all available endpoints in the CentomoMD backend
 */

// Using built-in fetch API (Node.js 18+)

// Configuration
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';
const TEST_USER_ID = 'test-user-12345';

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
      'x-user-id': TEST_USER_ID,
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

// Individual endpoint tests
async function testHealthEndpoint() {
  const response = await makeRequest('GET', '/healthz');
  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }
  if (!response.data.ok) {
    throw new Error('Health check failed');
  }
}

async function testDatabasePing() {
  const response = await makeRequest('GET', '/api/db/ping');
  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }
  if (typeof response.data.ok !== 'number') {
    throw new Error('Database ping response missing ok field');
  }
}

async function testClinicsEndpoints() {
  // Test GET /api/clinics
  const listResponse = await makeRequest('GET', '/api/clinics');
  if (listResponse.status !== 200) {
    throw new Error(`GET /api/clinics failed with status ${listResponse.status}`);
  }
  if (!Array.isArray(listResponse.data.data)) {
    throw new Error('Clinics list should return array');
  }
  
  // Test GET /api/clinics/:id (if clinics exist)
  if (listResponse.data.data.length > 0) {
    const clinicId = listResponse.data.data[0].id;
    const detailResponse = await makeRequest('GET', `/api/clinics/${clinicId}`);
    if (detailResponse.status !== 200) {
      throw new Error(`GET /api/clinics/${clinicId} failed with status ${detailResponse.status}`);
    }
  }
}

async function testFeedbackEndpoints() {
  // Test GET /api/feedback (should return empty list or error due to feature flag)
  const listResponse = await makeRequest('GET', '/api/feedback');
  if (listResponse.status !== 200 && listResponse.status !== 503) {
    throw new Error(`GET /api/feedback failed with unexpected status ${listResponse.status}`);
  }
  
  // Test POST /api/feedback (should fail due to feature flag or validation)
  const createResponse = await makeRequest('POST', '/api/feedback', {
    meta: { test: true },
    ratings: { overall: 5 }
  });
  if (createResponse.status !== 201 && createResponse.status !== 503 && createResponse.status !== 400) {
    throw new Error(`POST /api/feedback failed with unexpected status ${createResponse.status}`);
  }
}

async function testProfileEndpoints() {
  // Test GET /api/profile (should require auth)
  const getResponse = await makeRequest('GET', '/api/profile');
  if (getResponse.status !== 401) {
    throw new Error(`GET /api/profile should require auth, got status ${getResponse.status}`);
  }
  
  // Test POST /api/profile (should require auth)
  const postResponse = await makeRequest('POST', '/api/profile', {
    display_name: 'Test User'
  });
  if (postResponse.status !== 401) {
    throw new Error(`POST /api/profile should require auth, got status ${postResponse.status}`);
  }
}

async function testSessionsEndpoints() {
  // Test POST /api/sessions (should require auth)
  const createResponse = await makeRequest('POST', '/api/sessions', {
    sectionId: 'section_7',
    transcript: 'Test transcript',
    metadata: { mode: 'smart_dictation' }
  });
  if (createResponse.status !== 401) {
    throw new Error(`POST /api/sessions should require auth, got status ${createResponse.status}`);
  }
  
  // Test GET /api/sessions/:id (should require auth)
  const getResponse = await makeRequest('GET', '/api/sessions/test-session-id');
  if (getResponse.status !== 401) {
    throw new Error(`GET /api/sessions/:id should require auth, got status ${getResponse.status}`);
  }
}

async function testFormatEndpoints() {
  // Test POST /api/format/merge/section11
  const response = await makeRequest('POST', '/api/format/merge/section11', {
    caseId: 'test-case-123',
    sourceSections: ['section_7', 'section_8']
  });
  if (response.status !== 200) {
    throw new Error(`POST /api/format/merge/section11 failed with status ${response.status}`);
  }
  if (!response.data.success) {
    throw new Error('Format merge endpoint should return success: true');
  }
}

async function testAnalyzeEndpoints() {
  // Test POST /api/analyze/transcript
  const analyzeResponse = await makeRequest('POST', '/api/analyze/transcript', {
    original: 'Original transcript text',
    formatted: 'Formatted transcript text',
    language: 'fr'
  });
  if (analyzeResponse.status !== 200) {
    throw new Error(`POST /api/analyze/transcript failed with status ${analyzeResponse.status}`);
  }
  
  // Test POST /api/analyze/compare
  const compareResponse = await makeRequest('POST', '/api/analyze/compare', {
    transcript1: 'First transcript',
    transcript2: 'Second transcript',
    language: 'fr'
  });
  if (compareResponse.status !== 200) {
    throw new Error(`POST /api/analyze/compare failed with status ${compareResponse.status}`);
  }
}

async function testDebugEndpoints() {
  // Test GET /api/debug/supabase-structure
  const response = await makeRequest('GET', '/api/debug/supabase-structure');
  if (response.status !== 200) {
    throw new Error(`GET /api/debug/supabase-structure failed with status ${response.status}`);
  }
  if (!response.data.success) {
    throw new Error('Debug endpoint should return success: true');
  }
}

async function testAuthEndpoints() {
  // Test POST /api/auth/ws-token (should require auth)
  const response = await makeRequest('POST', '/api/auth/ws-token');
  if (response.status !== 401) {
    throw new Error(`POST /api/auth/ws-token should require auth, got status ${response.status}`);
  }
}

async function testCasesEndpoints() {
  // Test GET /api/cases (should require auth)
  const listResponse = await makeRequest('GET', '/api/cases');
  if (listResponse.status !== 401) {
    throw new Error(`GET /api/cases should require auth, got status ${listResponse.status}`);
  }
  
  // Test POST /api/cases (should require auth)
  const createResponse = await makeRequest('POST', '/api/cases', {
    patient_name: 'Test Patient',
    clinic_id: 'test-clinic'
  });
  if (createResponse.status !== 401) {
    throw new Error(`POST /api/cases should require auth, got status ${createResponse.status}`);
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting Comprehensive API Endpoint Tests');
  console.log(`📍 Testing against: ${BASE_URL}`);
  console.log('=' * 60);
  
  // Core endpoints
  await runTest('Health Check (/healthz)', testHealthEndpoint);
  await runTest('Database Ping (/api/db/ping)', testDatabasePing);
  
  // Public endpoints
  await runTest('Clinics List (/api/clinics)', testClinicsEndpoints);
  await runTest('Format Merge (/api/format/merge/section11)', testFormatEndpoints);
  await runTest('Analyze Endpoints (/api/analyze/*)', testAnalyzeEndpoints);
  await runTest('Debug Endpoints (/api/debug/*)', testDebugEndpoints);
  
  // Feature-flagged endpoints
  await runTest('Feedback Endpoints (/api/feedback/*)', testFeedbackEndpoints);
  
  // Protected endpoints (should require auth)
  await runTest('Profile Endpoints (/api/profile/*)', testProfileEndpoints);
  await runTest('Sessions Endpoints (/api/sessions/*)', testSessionsEndpoints);
  await runTest('Auth Endpoints (/api/auth/*)', testAuthEndpoints);
  await runTest('Cases Endpoints (/api/cases/*)', testCasesEndpoints);
  
  // Summary
  console.log('\n' + '=' * 60);
  console.log('📊 TEST SUMMARY');
  console.log('=' * 60);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`⏭️  Skipped: ${results.skipped}`);
  console.log(`📈 Total: ${results.passed + results.failed + results.skipped}`);
  
  if (results.failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    results.tests
      .filter(t => t.status === 'FAILED')
      .forEach(t => console.log(`  - ${t.name}: ${t.error}`));
  }
  
  console.log('\n🎯 ENDPOINT COVERAGE:');
  console.log('✅ Core: Health, Database');
  console.log('✅ Public: Clinics, Format, Analyze, Debug');
  console.log('✅ Feature-flagged: Feedback');
  console.log('✅ Protected: Profile, Sessions, Auth, Cases');
  
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  console.error('💥 Test runner failed:', error);
  process.exit(1);
});
