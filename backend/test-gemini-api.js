#!/usr/bin/env node

/**
 * Gemini API Test Suite
 * Tests the Google Gemini API integration through the AI Provider system
 * 
 * Usage: tsx test-gemini-api.js  OR  node test-gemini-api.js (after build)
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Import getAIProvider - use compiled dist folder
// Note: This requires the project to be built first (npm run build)
// Or use tsx to run directly: tsx test-gemini-api.js
import { getAIProvider } from './dist/src/lib/aiProvider.js';

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  skipped: 0,
  tests: []
};

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

// Check environment
function checkEnvironment() {
  console.log('\n🔍 Environment Check');
  console.log('='.repeat(60));
  
  const hasApiKey = !!process.env.GOOGLE_API_KEY;
  console.log(`   GOOGLE_API_KEY: ${hasApiKey ? '✅ Set' : '❌ Missing'}`);
  
  if (!hasApiKey) {
    console.log('\n⚠️  Warning: GOOGLE_API_KEY not found in environment');
    console.log('   Set it in your .env file or environment variables');
    console.log('   Example: GOOGLE_API_KEY=your_api_key_here');
  }
  
  return hasApiKey;
}

// Find a working model name
let WORKING_MODEL = null;

async function findWorkingModel() {
  // Try common model names in order of preference (newer models first per latest docs)
  const modelsToTry = [
    'gemini-2.5-flash',      // Latest recommended model (per official docs)
    'gemini-2.0-flash-exp',  // Latest experimental
    'gemini-1.5-flash',      // Stable fast model
    'gemini-1.5-pro',        // Stable pro model
    'gemini-pro',            // Older stable model (fallback)
  ];
  
  for (const modelName of modelsToTry) {
    try {
      const provider = getAIProvider(modelName);
      const testResponse = await provider.createCompletion({
        model: modelName,
        messages: [{ role: 'user', content: 'Say "OK"' }],
        temperature: 0.1,
        max_tokens: 10,
      });
      
      if (testResponse.content) {
        console.log(`   ✅ Found working model: ${modelName}`);
        return modelName;
      }
    } catch (error) {
      // Try next model
      continue;
    }
  }
  
  throw new Error('Could not find any working Gemini model. Check your API key and model availability.');
}

// Test 1: Provider Instantiation
async function testProviderInstantiation() {
  const modelName = WORKING_MODEL || 'gemini-pro'; // Default fallback
  const provider = getAIProvider(modelName);
  
  if (!provider) {
    throw new Error('Provider is null or undefined');
  }
  
  if (provider.name !== 'google') {
    throw new Error(`Expected provider name 'google', got '${provider.name}'`);
  }
  
  console.log(`   Provider: ${provider.name}`);
  console.log(`   Model: ${modelName}`);
}

// Test 2: Simple Completion
async function testSimpleCompletion() {
  const provider = getAIProvider(WORKING_MODEL);
  
  const response = await provider.createCompletion({
    model: WORKING_MODEL,
    messages: [
      { role: 'user', content: 'Say "Hello from Gemini!" in one sentence.' }
    ],
    temperature: 0.1,
    max_tokens: 50,
  });
  
  if (!response.content) {
    throw new Error('Response content is empty');
  }
  
  if (!response.content.toLowerCase().includes('hello')) {
    throw new Error(`Response doesn't contain expected greeting: ${response.content}`);
  }
  
  console.log(`   Response: ${response.content.substring(0, 60)}...`);
  console.log(`   Tokens: ${response.usage?.total_tokens || 'N/A'}`);
  console.log(`   Cost: $${response.cost_usd?.toFixed(6) || 'N/A'}`);
}

// Test 3: System and User Messages
async function testSystemUserMessages() {
  const provider = getAIProvider(WORKING_MODEL);
  
  const response = await provider.createCompletion({
    model: WORKING_MODEL,
    messages: [
      { role: 'system', content: 'You are a helpful assistant. Always respond in French.' },
      { role: 'user', content: 'Say "Bonjour" and nothing else.' }
    ],
    temperature: 0.1,
    max_tokens: 20,
  });
  
  if (!response.content.toLowerCase().includes('bonjour')) {
    throw new Error(`Response doesn't contain expected French greeting: ${response.content}`);
  }
  
  console.log(`   Response: ${response.content}`);
}

// Test 4: Medical Terminology (Real-world use case)
async function testMedicalTerminology() {
  const provider = getAIProvider(WORKING_MODEL);
  
  const response = await provider.createCompletion({
    model: WORKING_MODEL,
    messages: [
      { 
        role: 'system', 
        content: 'You are a medical transcription assistant. Preserve all medical terminology exactly as provided.' 
      },
      { 
        role: 'user', 
        content: 'Format this transcript: "Le patient présente des douleurs lombaires. Il nécessite une physiothérapie et une ergothérapie après son TCCL." Keep all medical terms intact.' 
      }
    ],
    temperature: 0.2,
    max_tokens: 100,
  });
  
  // Check that medical terms are preserved
  const medicalTerms = ['physiothérapie', 'ergothérapie', 'TCCL'];
  const responseLower = response.content.toLowerCase();
  
  for (const term of medicalTerms) {
    if (!responseLower.includes(term.toLowerCase())) {
      throw new Error(`Medical term '${term}' not preserved in response: ${response.content}`);
    }
  }
  
  console.log(`   Medical terms preserved: ${medicalTerms.join(', ')}`);
  console.log(`   Response length: ${response.content.length} chars`);
}

// Test 5: Longer Context Window
async function testLongerContext() {
  const provider = getAIProvider(WORKING_MODEL);
  
  const longPrompt = 'Repeat this sentence 10 times: "Medical transcription requires accuracy." Then summarize what you did.';
  
  const response = await provider.createCompletion({
    model: WORKING_MODEL,
    messages: [
      { role: 'user', content: longPrompt }
    ],
    temperature: 0.1,
    max_tokens: 200,
  });
  
  if (!response.content) {
    throw new Error('Response is empty');
  }
  
  // Should contain the sentence multiple times or a summary
  if (!response.content.toLowerCase().includes('medical transcription')) {
    throw new Error('Response doesn\'t contain expected content about medical transcription');
  }
  
  console.log(`   Response length: ${response.content.length} chars`);
  console.log(`   Tokens used: ${response.usage?.total_tokens || 'N/A'}`);
}

// Test 6: Temperature and Determinism
async function testTemperatureScaling() {
  const provider = getAIProvider(WORKING_MODEL);
  
  // Test low temperature (should be more deterministic)
  const response1 = await provider.createCompletion({
    model: WORKING_MODEL,
    messages: [
      { role: 'user', content: 'Say exactly: "Test response one."' }
    ],
    temperature: 0.1,
    max_tokens: 20,
  });
  
  // Test higher temperature
  const response2 = await provider.createCompletion({
    model: WORKING_MODEL,
    messages: [
      { role: 'user', content: 'Say exactly: "Test response one."' }
    ],
    temperature: 0.8,
    max_tokens: 20,
  });
  
  if (!response1.content || !response2.content) {
    throw new Error('One or both responses are empty');
  }
  
  console.log(`   Low temp (0.1): ${response1.content.substring(0, 40)}...`);
  console.log(`   High temp (0.8): ${response2.content.substring(0, 40)}...`);
}

// Test 7: Different Gemini Models
async function testDifferentModels() {
  const modelsToTest = [
    'gemini-2.5-flash',
    'gemini-2.0-flash-exp',
    'gemini-1.5-flash',
    'gemini-1.5-pro',
    'gemini-pro',
  ];
  const workingModels = [];
  
  for (const modelName of modelsToTest) {
    try {
      const provider = getAIProvider(modelName);
      const response = await provider.createCompletion({
        model: modelName,
        messages: [
          { role: 'user', content: 'Say "OK" if you can hear me.' }
        ],
        temperature: 0.1,
        max_tokens: 10,
      });
      
      if (response.content) {
        workingModels.push(modelName);
        console.log(`   ✅ ${modelName}: Working`);
      }
    } catch (error) {
      const errorMsg = error.message || String(error);
      console.log(`   ❌ ${modelName}: ${errorMsg.substring(0, 60)}...`);
    }
  }
  
  if (workingModels.length === 0) {
    throw new Error('None of the tested Gemini models are working');
  }
  
  console.log(`   Working models: ${workingModels.join(', ')}`);
  console.log(`   Primary model: ${WORKING_MODEL}`);
}

// Test 8: Error Handling
async function testErrorHandling() {
  const provider = getAIProvider(WORKING_MODEL);
  
  // Test with invalid max_tokens (too high)
  try {
    await provider.createCompletion({
      model: WORKING_MODEL,
      messages: [
        { role: 'user', content: 'Test' }
      ],
      temperature: 0.1,
      max_tokens: 999999, // Unrealistically high
    });
    
    // If it succeeds, that's fine - just log it
    console.log(`   Note: Very high max_tokens was accepted`);
  } catch (error) {
    // Expected to fail - check error is reasonable
    if (!error.message) {
      throw new Error('Error object missing message');
    }
    console.log(`   Error handling: ${error.message.substring(0, 60)}...`);
  }
}

// Main test runner
async function runAllTests() {
  console.log('\n🚀 Starting Gemini API Tests');
  console.log('='.repeat(60));
  
  // Check environment
  const hasApiKey = checkEnvironment();
  
  if (!hasApiKey) {
    console.log('\n⚠️  Skipping tests - GOOGLE_API_KEY not configured');
    console.log('   Set GOOGLE_API_KEY in your .env file to run tests');
    process.exit(1);
  }
  
  // Find a working model first
  console.log('\n🔍 Discovering available models...');
  try {
    WORKING_MODEL = await findWorkingModel();
    console.log(`   Using model: ${WORKING_MODEL}\n`);
  } catch (error) {
    console.error(`\n❌ ${error.message}`);
    console.log('\n💡 Suggestions:');
    console.log('   1. Verify your GOOGLE_API_KEY is correct');
    console.log('   2. Check if your API key has access to Gemini models');
    console.log('   3. Try running: node test-google-models.js to see available models');
    process.exit(1);
  }
  
  console.log('\n📋 Test Plan');
  console.log('='.repeat(60));
  console.log('   1. Provider Instantiation');
  console.log('   2. Simple Completion');
  console.log('   3. System and User Messages');
  console.log('   4. Medical Terminology (Real-world use case)');
  console.log('   5. Longer Context Window');
  console.log('   6. Temperature and Determinism');
  console.log('   7. Different Gemini Models');
  console.log('   8. Error Handling');
  
  // Run tests
  await runTest('Provider Instantiation', testProviderInstantiation);
  await runTest('Simple Completion', testSimpleCompletion);
  await runTest('System and User Messages', testSystemUserMessages);
  await runTest('Medical Terminology', testMedicalTerminology);
  await runTest('Longer Context Window', testLongerContext);
  await runTest('Temperature and Determinism', testTemperatureScaling);
  await runTest('Different Gemini Models', testDifferentModels);
  await runTest('Error Handling', testErrorHandling);
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`⏭️  Skipped: ${results.skipped}`);
  console.log(`📈 Total: ${results.passed + results.failed + results.skipped}`);
  
  if (results.failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    results.tests
      .filter(t => t.status === 'FAILED')
      .forEach(t => console.log(`   - ${t.name}: ${t.error}`));
  }
  
  console.log('\n🎯 FEATURES TESTED:');
  console.log('✅ Provider Instantiation');
  console.log('✅ Basic API Calls');
  console.log('✅ System/User Message Handling');
  console.log('✅ Medical Terminology Preservation');
  console.log('✅ Context Window Handling');
  console.log('✅ Temperature Scaling');
  console.log('✅ Multiple Model Support');
  console.log('✅ Error Handling');
  
  console.log('\n💡 USAGE:');
  console.log(`   - Use getAIProvider("${WORKING_MODEL}") to get the provider`);
  console.log('   - Call provider.createCompletion() with your request');
  console.log(`   - Working model: ${WORKING_MODEL}`);
  console.log('   - Try other models: gemini-pro, gemini-1.5-flash, gemini-1.5-pro');
  
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  console.error('\n💥 Test runner failed:', error);
  process.exit(1);
});

