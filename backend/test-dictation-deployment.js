#!/usr/bin/env node

/**
 * Deployment Testing Script for Dictation Save Flow
 * 
 * This script is designed to run on EC2 or production environments
 * to test the dictation save flow API endpoints.
 * 
 * Usage:
 *   node test-dictation-deployment.js [BASE_URL]
 * 
 * Examples:
 *   node test-dictation-deployment.js
 *   node test-dictation-deployment.js http://localhost:3001
 *   node test-dictation-deployment.js https://your-ec2-instance.com
 */

// Get BASE_URL from command line argument or use default
const BASE_URL = process.argv[2] || 'http://localhost:3001';

console.log('🚀 Dictation Save Flow - Deployment Test');
console.log('Base URL:', BASE_URL);
console.log('Timestamp:', new Date().toISOString());
console.log('='.repeat(60));

// Test data
const testSession = {
  sectionId: 'section_7',
  transcript: 'Test transcript for deployment testing',
  metadata: {
    mode: 'smart_dictation',
    template: 'section7-ai-formatter',
    language: 'fr-CA',
    timestamp: new Date().toISOString(),
    environment: 'deployment'
  }
};

const testCaseId = 'deployment-test-case-' + Date.now();

async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    const data = await response.json();
    return { 
      success: response.ok, 
      status: response.status, 
      data,
      url: url
    };
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      url: url
    };
  }
}

async function testHealthCheck() {
  console.log('\n🏥 Testing Health Check...');
  
  const result = await makeRequest(`${BASE_URL}/healthz`);
  
  if (result.success) {
    console.log('✅ Backend is healthy');
    return true;
  } else {
    console.log('❌ Backend health check failed');
    console.log('   Error:', result.error || result.data);
    console.log('   URL:', result.url);
    return false;
  }
}

async function testSessionCreation() {
  console.log('\n📝 Testing Session Creation...');
  
  const result = await makeRequest(`${BASE_URL}/api/sessions`, {
    method: 'POST',
    body: JSON.stringify(testSession)
  });
  
  if (result.success) {
    console.log('✅ Session created successfully');
    console.log('   Session ID:', result.data.id);
    console.log('   Section ID:', result.data.sectionId);
    return result.data.id;
  } else {
    console.log('❌ Session creation failed');
    console.log('   Error:', result.error || result.data);
    console.log('   URL:', result.url);
    return null;
  }
}

async function testSectionCommit(sessionId) {
  if (!sessionId) {
    console.log('⏭️  Skipping section commit test (no session ID)');
    return false;
  }
  
  console.log('\n💾 Testing Section Commit...');
  
  const commitData = {
    sessionId: sessionId,
    finalText: 'Test final text from deployment testing'
  };
  
  const result = await makeRequest(`${BASE_URL}/api/cases/${testCaseId}/sections/section_7/commit`, {
    method: 'POST',
    body: JSON.stringify(commitData)
  });
  
  if (result.success) {
    console.log('✅ Section committed successfully');
    console.log('   Case ID:', testCaseId);
    console.log('   Section ID: section_7');
    return true;
  } else {
    console.log('❌ Section commit failed');
    console.log('   Error:', result.error || result.data);
    console.log('   URL:', result.url);
    return false;
  }
}

async function testSection11Generation() {
  console.log('\n🤖 Testing Section 11 Generation...');
  
  const generationData = {
    caseId: testCaseId,
    sourceSections: ['section_7', 'section_8', 'section_9']
  };
  
  const result = await makeRequest(`${BASE_URL}/api/format/merge/section11`, {
    method: 'POST',
    body: JSON.stringify(generationData)
  });
  
  if (result.success) {
    console.log('✅ Section 11 generated successfully');
    console.log('   Auto Summary Length:', result.data.autoSummary?.length || 0);
    return true;
  } else {
    console.log('❌ Section 11 generation failed');
    console.log('   Error:', result.error || result.data);
    console.log('   URL:', result.url);
    return false;
  }
}

async function testConfigEndpoint() {
  console.log('\n⚙️  Testing Config Endpoint...');
  
  const result = await makeRequest(`${BASE_URL}/api/config`);
  
  if (result.success) {
    console.log('✅ Config endpoint accessible');
    console.log('   Environment:', result.data.environment || 'unknown');
    return true;
  } else {
    console.log('❌ Config endpoint failed');
    console.log('   Error:', result.error || result.data);
    console.log('   URL:', result.url);
    return false;
  }
}

async function runDeploymentTests() {
  console.log('🧪 Starting Deployment Tests\n');
  
  const results = {
    healthCheck: false,
    configEndpoint: false,
    sessionCreation: false,
    sectionCommit: false,
    section11Generation: false
  };
  
  // Test 1: Health Check
  results.healthCheck = await testHealthCheck();
  
  // Test 2: Config Endpoint
  results.configEndpoint = await testConfigEndpoint();
  
  // Test 3: Session Creation
  const sessionId = await testSessionCreation();
  results.sessionCreation = sessionId !== null;
  
  // Test 4: Section Commit
  results.sectionCommit = await testSectionCommit(sessionId);
  
  // Test 5: Section 11 Generation
  results.section11Generation = await testSection11Generation();
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 DEPLOYMENT TEST SUMMARY');
  console.log('='.repeat(60));
  
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`Tests Passed: ${passedTests}/${totalTests}`);
  console.log('');
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${test}`);
  });
  
  console.log('');
  if (passedTests === totalTests) {
    console.log('🎉 ALL TESTS PASSED - Deployment is ready!');
    process.exit(0);
  } else {
    console.log('⚠️  SOME TESTS FAILED - Check the logs above');
    process.exit(1);
  }
}

// Check if fetch is available (Node.js 18+)
if (typeof fetch === 'undefined') {
  console.log('❌ This script requires Node.js 18+ or a fetch polyfill');
  console.log('   Install node-fetch: npm install node-fetch');
  process.exit(1);
}

// Run the tests
runDeploymentTests().catch((error) => {
  console.error('💥 Test execution failed:', error);
  process.exit(1);
});
