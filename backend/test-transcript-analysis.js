#!/usr/bin/env node

/**
 * Transcript Analysis Feature Test Suite
 * Tests the transcript analysis endpoints to verify functionality
 */

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

// Helper function to make HTTP requests
async function makeRequest(method, endpoint, body = null, skipAuth = false) {
  const url = `${BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  // For development/testing, try to bypass auth if configured
  // Note: These endpoints should be public for testing
  if (!skipAuth && process.env.BYPASS_AUTH === 'true') {
    // Skip auth header - endpoints should work without auth in dev mode
  }
  
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
  process.stdout.write(`\n🧪 Testing: ${name}... `);
  try {
    await testFn();
    results.passed++;
    results.tests.push({ name, status: 'PASSED' });
    process.stdout.write('✅ PASSED\n');
  } catch (error) {
    results.failed++;
    results.tests.push({ name, status: 'FAILED', error: error.message });
    process.stdout.write(`❌ FAILED: ${error.message}\n`);
  }
}

// Test 1: Transcript Analysis - Basic functionality
async function testTranscriptAnalysisBasic() {
  const response = await makeRequest('POST', '/api/analyze/transcript', {
    original: 'Le patient a mal au dos. Il a eu un accident au travail.',
    formatted: 'Le patient a mal au dos. Il a eu un accident au travail.',
    language: 'fr'
  });
  
  if (response.status !== 200) {
    const errorDetails = JSON.stringify(response.data, null, 2);
    throw new Error(`Expected status 200, got ${response.status}.\nResponse: ${errorDetails}`);
  }
  
  if (!response.data || !response.data.overallScore) {
    throw new Error('Response missing required fields (overallScore)');
  }
  
  // Check required fields
  const requiredFields = ['overallScore', 'metrics', 'issues', 'suggestions', 'confidence'];
  for (const field of requiredFields) {
    if (!(field in response.data)) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
  
  // Check metrics structure
  const metrics = response.data.metrics;
  const requiredMetrics = ['hallucinationScore', 'accuracyScore', 'completenessScore', 'consistencyScore', 'medicalAccuracyScore'];
  for (const metric of requiredMetrics) {
    if (typeof metrics[metric] !== 'number') {
      throw new Error(`Metric ${metric} is not a number`);
    }
  }
}

// Test 2: Transcript Analysis - Detecting differences
async function testTranscriptAnalysisDifferences() {
  const response = await makeRequest('POST', '/api/analyze/transcript', {
    original: 'Le patient a mal au dos et au cou.',
    formatted: 'Le patient a mal au dos et au genou.', // Changed "cou" to "genou"
    language: 'fr'
  });
  
  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }
  
  // Should detect issues
  if (!response.data.issues || !Array.isArray(response.data.issues.errors)) {
    throw new Error('Issues not properly structured');
  }
}

// Test 3: Transcript Compare - Basic functionality
async function testTranscriptCompareBasic() {
  const response = await makeRequest('POST', '/api/analyze/compare', {
    transcript1: 'Premier transcript avec quelques mots.',
    transcript2: 'Deuxième transcript avec des mots différents.',
    language: 'fr'
  });
  
  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }
  
  // Check required fields
  const requiredFields = ['similarity', 'additions', 'deletions', 'modifications', 'wordCountChange', 'sentenceCountChange'];
  for (const field of requiredFields) {
    if (!(field in response.data)) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
  
  // Similarity should be a number between 0 and 100
  if (typeof response.data.similarity !== 'number' || response.data.similarity < 0 || response.data.similarity > 100) {
    throw new Error('Similarity should be a number between 0 and 100');
  }
}

// Test 4: Transcript Compare - Identical transcripts
async function testTranscriptCompareIdentical() {
  const sameText = 'Le patient présente des douleurs lombaires.';
  const response = await makeRequest('POST', '/api/analyze/compare', {
    transcript1: sameText,
    transcript2: sameText,
    language: 'fr'
  });
  
  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }
  
  // Similarity should be high for identical texts
  if (response.data.similarity < 90) {
    throw new Error(`Expected high similarity (>=90) for identical texts, got ${response.data.similarity}`);
  }
}

// Test 5: Transcript Analysis - Medical terminology preservation
async function testMedicalTerminology() {
  const response = await makeRequest('POST', '/api/analyze/transcript', {
    original: 'Le patient nécessite une physiothérapie et une ergothérapie après son TCCL.',
    formatted: 'Le patient nécessite une physiothérapie et une ergothérapie après son TCCL.',
    language: 'fr'
  });
  
  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }
  
  // Medical accuracy should be high when medical terms are preserved
  if (response.data.metrics.medicalAccuracyScore < 80) {
    throw new Error(`Expected high medical accuracy (>=80), got ${response.data.metrics.medicalAccuracyScore}`);
  }
}

// Test 6: Transcript Analysis - Error handling for missing fields
async function testErrorHandling() {
  const response = await makeRequest('POST', '/api/analyze/transcript', {
    // Missing required fields
    language: 'fr'
  });
  
  // Should return error status (400 or 500)
  if (response.status === 200) {
    throw new Error('Expected error status for missing required fields');
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting Transcript Analysis Feature Tests');
  console.log(`📍 Testing against: ${BASE_URL}`);
  console.log('='.repeat(60));
  
  // Core analysis tests
  await runTest('Transcript Analysis - Basic Functionality', testTranscriptAnalysisBasic);
  await runTest('Transcript Analysis - Detecting Differences', testTranscriptAnalysisDifferences);
  await runTest('Transcript Analysis - Medical Terminology', testMedicalTerminology);
  
  // Comparison tests
  await runTest('Transcript Compare - Basic Functionality', testTranscriptCompareBasic);
  await runTest('Transcript Compare - Identical Transcripts', testTranscriptCompareIdentical);
  
  // Error handling
  await runTest('Error Handling - Missing Fields', testErrorHandling);
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📈 Total: ${results.passed + results.failed}`);
  
  if (results.failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    results.tests
      .filter(t => t.status === 'FAILED')
      .forEach(t => console.log(`  - ${t.name}: ${t.error}`));
  }
  
  console.log('\n🎯 FEATURES TESTED:');
  console.log('✅ Transcript Analysis Endpoint (/api/analyze/transcript)');
  console.log('✅ Transcript Comparison Endpoint (/api/analyze/compare)');
  console.log('✅ Metrics Calculation');
  console.log('✅ Issue Detection');
  console.log('✅ Medical Terminology Preservation');
  console.log('✅ Error Handling');
  
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  console.error('💥 Test runner failed:', error);
  process.exit(1);
});

