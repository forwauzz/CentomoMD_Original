/**
 * Test script to list available Google Gemini models
 * This helps identify which model names are actually available
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function listGoogleModels() {
  console.log('\n🔍 Listing Available Google Gemini Models');
  console.log('='.repeat(60));
  
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    console.error('❌ GOOGLE_API_KEY not set');
    process.exit(1);
  }
  
  console.log('✅ API Key found');
  console.log('📡 Connecting to Google Generative AI API...\n');
  
  const genAI = new GoogleGenerativeAI(apiKey);
  
  // Try common model names (newer models first per latest docs)
  const modelNamesToTry = [
    'gemini-2.5-flash',      // Latest recommended model
    'gemini-2.0-flash-exp',  // Latest experimental
    'gemini-1.5-flash',      // Stable fast model
    'gemini-1.5-pro',        // Stable pro model
    'gemini-pro',            // Older stable model
    'gemini-1.5-pro-latest',
    'gemini-pro-vision',
    'models/gemini-2.5-flash',
    'models/gemini-1.5-flash',
    'models/gemini-pro',
  ];
  
  for (const modelName of modelNamesToTry) {
    try {
      console.log(`🧪 Testing model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: 'Say "hello" in one word.' }] }],
      });
      
      const response = result.response;
      const text = response.text();
      
      console.log(`   ✅ SUCCESS - Model works!`);
      console.log(`   📝 Response: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`);
      console.log(`   ✅ Use this model name: "${modelName}"\n`);
      
      return modelName; // Return first working model
      
    } catch (error) {
      console.log(`   ❌ FAILED - ${error.message.substring(0, 100)}...\n`);
    }
  }
  
  console.log('\n⚠️  None of the tested model names worked.');
  console.log('💡 This might indicate:');
  console.log('   1. API key doesn\'t have access to Gemini models');
  console.log('   2. Account needs to be enabled for Gemini API');
  console.log('   3. Model names have changed in the API');
  console.log('\n📖 Check: https://ai.google.dev/gemini-api/docs/models\n');
  
  return null;
}

// Run
listGoogleModels().then(modelName => {
  if (modelName) {
    console.log(`\n✅ Recommended model name: ${modelName}`);
    process.exit(0);
  } else {
    console.log('\n❌ Could not find working model name');
    process.exit(1);
  }
}).catch(error => {
  console.error('\n💥 Error:', error);
  process.exit(1);
});

