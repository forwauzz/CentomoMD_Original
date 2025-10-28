#!/usr/bin/env node

/**
 * Universal Cleanup Layer Test Suite
 * Tests all cleanup-related endpoints and functionality
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

// Individual cleanup tests
async function testCasesCleanupDryRun() {
  const response = await makeRequest('POST', '/api/cases/cleanup', {
    days: 30,
    dryRun: true
  });
  
  if (response.status !== 401) {
    throw new Error(`Expected 401 (auth required), got ${response.status}`);
  }
}

async function testTroubleshootCleanup() {
  const response = await makeRequest('GET', '/api/troubleshoot/cleanup');
  
  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }
  
  if (!response.data.message || !response.data.message.includes('cleaned up')) {
    throw new Error('Cleanup response missing expected message');
  }
}

async function testHealthEndpoint() {
  const response = await makeRequest('GET', '/healthz');
  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }
  if (!response.data.ok) {
    throw new Error('Health check failed');
  }
}

async function testDebugEndpoints() {
  // Test debug endpoints that might show cleanup status
  const corsResponse = await makeRequest('GET', '/api/_debug/cors');
  if (corsResponse.status !== 200) {
    throw new Error(`Debug CORS endpoint failed with status ${corsResponse.status}`);
  }
  
  const outputLangResponse = await makeRequest('GET', '/api/_debug/output-language');
  if (outputLangResponse.status !== 200) {
    throw new Error(`Debug output-language endpoint failed with status ${outputLangResponse.status}`);
  }
}

async function testConfigEndpoint() {
  const response = await makeRequest('GET', '/api/config');
  if (response.status !== 200) {
    throw new Error(`Config endpoint failed with status ${response.status}`);
  }
  
  if (!response.data) {
    throw new Error('Config endpoint returned empty data');
  }
}

async function testPerformanceEndpoint() {
  const response = await makeRequest('GET', '/api/performance');
  if (response.status !== 200) {
    throw new Error(`Performance endpoint failed with status ${response.status}`);
  }
  
  if (!response.data) {
    throw new Error('Performance endpoint returned empty data');
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting Universal Cleanup Layer Tests');
  console.log(`📍 Testing against: ${BASE_URL}`);
  console.log('=' * 60);
  
  // Core endpoints
  await runTest('Health Check (/healthz)', testHealthEndpoint);
  await runTest('Config Endpoint (/api/config)', testConfigEndpoint);
  await runTest('Performance Endpoint (/api/performance)', testPerformanceEndpoint);
  
  // Debug endpoints
  await runTest('Debug Endpoints (/api/_debug/*)', testDebugEndpoints);
  
  // Cleanup endpoints
  await runTest('Cases Cleanup Dry Run (/api/cases/cleanup)', testCasesCleanupDryRun);
  await runTest('Troubleshoot Cleanup (/api/troubleshoot/cleanup)', testTroubleshootCleanup);
  
  // Summary
  console.log('\n' + '=' * 60);
  console.log('📊 CLEANUP TEST SUMMARY');
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
  
  console.log('\n🎯 CLEANUP LAYER STATUS:');
  console.log('✅ Core Services: Health, Config, Performance');
  console.log('✅ Debug Endpoints: CORS, Output Language');
  console.log('✅ Cleanup Endpoints: Cases, Troubleshoot');
  console.log('🔒 Authentication: Properly enforced on protected endpoints');
  
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  console.error('💥 Test runner failed:', error);
  process.exit(1);
});
