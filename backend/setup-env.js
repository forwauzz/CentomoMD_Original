#!/usr/bin/env node

/**
 * Environment Setup Script
 * Helps set up the .env file for the Section 7 AI Formatter
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

console.log('🔧 ENVIRONMENT SETUP FOR SECTION 7 AI FORMATTER');
console.log('================================================');
console.log('');

const envPath = join(process.cwd(), '.env');
const envExamplePath = join(process.cwd(), '..', 'env.example');

console.log('📋 Checking environment configuration...');

// Check if .env file exists
if (existsSync(envPath)) {
  console.log('✅ .env file already exists');
  
  // Check if OPENAI_API_KEY is set
  const envContent = readFileSync(envPath, 'utf8');
  if (envContent.includes('OPENAI_API_KEY=') && !envContent.includes('OPENAI_API_KEY=your_openai_api_key_here')) {
    console.log('✅ OPENAI_API_KEY appears to be configured');
  } else {
    console.log('⚠️  OPENAI_API_KEY needs to be configured');
    console.log('   Please add your OpenAI API key to the .env file:');
    console.log('   OPENAI_API_KEY=sk-your-actual-api-key-here');
  }
} else {
  console.log('❌ .env file not found');
  
  if (existsSync(envExamplePath)) {
    console.log('📋 Creating .env file from env.example...');
    
    try {
      const envExampleContent = readFileSync(envExamplePath, 'utf8');
      writeFileSync(envPath, envExampleContent);
      console.log('✅ .env file created from env.example');
      console.log('⚠️  Please update the following values in .env:');
      console.log('   - OPENAI_API_KEY=your_openai_api_key_here');
      console.log('   - Other required environment variables');
    } catch (error) {
      console.log('❌ Failed to create .env file:', error.message);
    }
  } else {
    console.log('❌ env.example file not found');
    console.log('   Please create a .env file manually with the following content:');
    console.log('');
    console.log('   # OpenAI Configuration');
    console.log('   OPENAI_API_KEY=your_openai_api_key_here');
    console.log('   OPENAI_MODEL=gpt-4o-mini');
    console.log('   OPENAI_TEMPERATURE=0.2');
    console.log('   OPENAI_MAX_TOKENS=4000');
    console.log('');
  }
}

console.log('');
console.log('📋 Environment Variables Required for Section 7 AI Formatter:');
console.log('=============================================================');
console.log('OPENAI_API_KEY=sk-your-actual-api-key-here');
console.log('OPENAI_MODEL=gpt-4o-mini');
console.log('OPENAI_TEMPERATURE=0.2');
console.log('OPENAI_MAX_TOKENS=4000');
console.log('');
console.log('💡 To get an OpenAI API key:');
console.log('   1. Go to https://platform.openai.com/api-keys');
console.log('   2. Sign in to your OpenAI account');
console.log('   3. Click "Create new secret key"');
console.log('   4. Copy the key and add it to your .env file');
console.log('');
console.log('🔍 After setting up the environment, run:');
console.log('   node test_section7_openai_integration.js');
console.log('   to verify OpenAI integration is working');
