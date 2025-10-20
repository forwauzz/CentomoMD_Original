#!/usr/bin/env node

/**
 * Automated API Testing Script for Dictation Save Flow
 * Run with: node test-dictation-api.js
 */

const BASE_URL = 'http://localhost:3001';

// Test data
const testSession = {
  sectionId: 'section_7',
  transcript: 'Test transcript for automated testing',
  metadata: {
    mode: 'smart_dictation',
    template: 'section7-ai-formatter',
    language: 'fr-CA',
    timestamp: new Date().toISOString()
  }
};

const testCaseId = crypto.randomUUID();

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
    return { success: response.ok, status: response.status, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function testSessionCreation() {
  console.log('🧪 Testing Session Creation...');
  
  const result = await makeRequest(`${BASE_URL}/api/sessions`, {
    method: 'POST',
    body: JSON.stringify(testSession)
  });
  
  if (result.success) {
    console.log('✅ Session created successfully');
    console.log('   Session ID:', result.data.id);
    return result.data.id;
  } else {
    console.log('❌ Session creation failed');
    console.log('   Error:', result.error || result.data);
    return null;
  }
}

async function testSectionCommit(sessionId) {
  if (!sessionId) {
    console.log('⏭️  Skipping section commit test (no session ID)');
    return;
  }
  
  console.log('🧪 Testing Section Commit...');
  
  const commitData = {
    sessionId: sessionId,
    finalText: 'Test final text from automated testing'
  };
  
  const result = await makeRequest(`${BASE_URL}/api/cases/${testCaseId}/sections/section_7/commit`, {
    method: 'POST',
    body: JSON.stringify(commitData)
  });
  
  if (result.success) {
    console.log('✅ Section committed successfully');
    console.log('   Case ID:', testCaseId);
    console.log('   Section ID: section_7');
  } else {
    console.log('❌ Section commit failed');
    console.log('   Error:', result.error || result.data);
  }
}

async function testSection11Generation() {
  console.log('🧪 Testing Section 11 Generation...');
  
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
  } else {
    console.log('❌ Section 11 generation failed');
    console.log('   Error:', result.error || result.data);
  }
}

async function testBackendHealth() {
  console.log('🧪 Testing Backend Health...');
  
  const result = await makeRequest(`${BASE_URL}/healthz`);
  
  if (result.success) {
    console.log('✅ Backend is healthy');
  } else {
    console.log('❌ Backend health check failed');
    console.log('   Error:', result.error || result.data);
  }
}

async function runAllTests() {
  console.log('🚀 Starting Dictation Save Flow API Tests\n');
  console.log('Base URL:', BASE_URL);
  console.log('Test Case ID:', testCaseId);
  console.log('Test Session:', JSON.stringify(testSession, null, 2));
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 1: Backend Health
  await testBackendHealth();
  console.log('');
  
  // Test 2: Session Creation
  const sessionId = await testSessionCreation();
  console.log('');
  
  // Test 3: Section Commit
  await testSectionCommit(sessionId);
  console.log('');
  
  // Test 4: Section 11 Generation
  await testSection11Generation();
  console.log('');
  
  console.log('='.repeat(50));
  console.log('🏁 API Tests Complete');
  console.log('Check the results above and compare with manual testing');
}

// Check if fetch is available (Node.js 18+)
if (typeof fetch === 'undefined') {
  console.log('❌ This script requires Node.js 18+ or a fetch polyfill');
  console.log('   Install node-fetch: npm install node-fetch');
  process.exit(1);
}

// Run the tests
runAllTests().catch(console.error);
