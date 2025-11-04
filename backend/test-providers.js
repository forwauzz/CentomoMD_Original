/**
 * Test script for Anthropic and Google AI providers
 * Verifies that providers can be instantiated and make API calls
 */

import { getAIProvider } from './src/lib/aiProvider.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testProvider(providerName, modelId) {
  console.log(`\n🧪 Testing ${providerName} with model: ${modelId}`);
  console.log('─'.repeat(60));
  
  try {
    // Get provider
    const provider = getAIProvider(modelId);
    console.log(`✅ Provider instantiated: ${provider.name}`);
    
    // Test with a simple prompt
    const testPrompt = `You are a helpful assistant. Please respond with exactly: "Hello from ${providerName}!"`;
    
    console.log(`📤 Sending test request...`);
    const startTime = Date.now();
    
    const response = await provider.createCompletion({
      model: modelId,
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: testPrompt }
      ],
      temperature: 0.1,
      max_tokens: 100,
    });
    
    const duration = Date.now() - startTime;
    
    console.log(`✅ Response received in ${duration}ms`);
    console.log(`📝 Content: ${response.content.substring(0, 100)}${response.content.length > 100 ? '...' : ''}`);
    
    if (response.usage) {
      console.log(`📊 Tokens: ${response.usage.prompt_tokens} prompt + ${response.usage.completion_tokens} completion = ${response.usage.total_tokens} total`);
    }
    
    if (response.cost_usd !== undefined) {
      console.log(`💰 Cost: $${response.cost_usd.toFixed(6)}`);
    }
    
    console.log(`✅ ${providerName} test PASSED\n`);
    return true;
    
  } catch (error) {
    console.error(`❌ ${providerName} test FAILED`);
    console.error(`   Error: ${error.message}`);
    if (error.originalError) {
      console.error(`   Original error:`, error.originalError);
    }
    console.log(`\n`);
    return false;
  }
}

async function runTests() {
  console.log('\n🚀 Starting AI Provider Tests');
  console.log('='.repeat(60));
  
  // Check environment variables
  console.log('\n📋 Environment Check:');
  console.log(`   OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log(`   ANTHROPIC_API_KEY: ${process.env.ANTHROPIC_API_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log(`   GOOGLE_API_KEY: ${process.env.GOOGLE_API_KEY ? '✅ Set' : '❌ Missing'}`);
  
  const results = {
    openai: false,
    anthropic: false,
    google: false,
  };
  
  // Test OpenAI (baseline)
  if (process.env.OPENAI_API_KEY) {
    results.openai = await testProvider('OpenAI', 'gpt-4o-mini');
  } else {
    console.log('\n⚠️  Skipping OpenAI test (API key not set)');
  }
  
  // Test Anthropic
  if (process.env.ANTHROPIC_API_KEY) {
    results.anthropic = await testProvider('Anthropic Claude', 'claude-3-5-haiku');
  } else {
    console.log('\n⚠️  Skipping Anthropic test (API key not set)');
  }
  
  // Test Google (try multiple model names)
  if (process.env.GOOGLE_API_KEY) {
    // Try gemini-1.5-pro first (most common)
    results.google = await testProvider('Google Gemini', 'gemini-1.5-pro');
    
    // If that fails, try gemini-pro
    if (!results.google) {
      console.log('\n⚠️  gemini-1.5-pro failed, trying gemini-pro...');
      results.google = await testProvider('Google Gemini', 'gemini-pro');
    }
  } else {
    console.log('\n⚠️  Skipping Google test (API key not set)');
  }
  
  // Summary
  console.log('\n📊 Test Results Summary');
  console.log('='.repeat(60));
  console.log(`   OpenAI: ${results.openai ? '✅ PASSED' : '❌ FAILED/SKIPPED'}`);
  console.log(`   Anthropic: ${results.anthropic ? '✅ PASSED' : '❌ FAILED/SKIPPED'}`);
  console.log(`   Google: ${results.google ? '✅ PASSED' : '❌ FAILED/SKIPPED'}`);
  
  const passedCount = Object.values(results).filter(r => r).length;
  const totalCount = Object.values(results).filter(r => r !== undefined).length;
  
  console.log(`\n✅ ${passedCount}/${totalCount} providers working`);
  
  if (passedCount === totalCount && totalCount > 0) {
    console.log('\n🎉 All configured providers are working correctly!');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some providers need attention. Check errors above.');
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});

