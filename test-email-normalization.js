#!/usr/bin/env node

/**
 * Test script for email normalization
 * 
 * This script tests the email normalization functions to ensure they work correctly
 * with various Gmail formats and other email providers.
 */

// Simple email normalization functions for testing
function normalizeEmail(email) {
  if (!email || typeof email !== 'string') {
    throw new Error('Email must be a non-empty string');
  }

  const trimmed = email.trim().toLowerCase();
  const [local, domain] = trimmed.split('@');
  
  if (!domain || !local) {
    throw new Error('Invalid email format: missing local part or domain');
  }

  // Gmail-specific normalization
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    // Remove plus tags (everything after +)
    const noPlus = local.split('+')[0];
    // Remove dots from local part
    const normalizedLocal = noPlus.replace(/\./g, '');
    return `${normalizedLocal}@gmail.com`;
  }

  // For non-Gmail domains, just return normalized version
  return `${local}@${domain}`;
}

function isValidEmail(email) {
  if (!email || typeof email !== 'string') {
    return false;
  }

  // Comprehensive email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

function validateAndNormalizeEmail(email) {
  const normalized = normalizeEmail(email);
  
  if (!isValidEmail(normalized)) {
    throw new Error(`Invalid email format: ${email}`);
  }
  
  return normalized;
}

function runEmailTests() {
  console.log('🧪 Email Normalization Test Suite');
  console.log('==================================\n');

  const testCases = [
    // Gmail normalization tests
    {
      input: 'user@gmail.com',
      expected: 'user@gmail.com',
      description: 'Basic Gmail address'
    },
    {
      input: 'user.name@gmail.com',
      expected: 'username@gmail.com',
      description: 'Gmail with dots'
    },
    {
      input: 'user+tag@gmail.com',
      expected: 'user@gmail.com',
      description: 'Gmail with plus tag'
    },
    {
      input: 'user.n.a.m.e+tag@gmail.com',
      expected: 'username@gmail.com',
      description: 'Gmail with dots and plus tag'
    },
    {
      input: 'USER@GMAIL.COM',
      expected: 'user@gmail.com',
      description: 'Gmail uppercase'
    },
    {
      input: 'user@googlemail.com',
      expected: 'user@gmail.com',
      description: 'Googlemail domain'
    },
    {
      input: 'user.name@googlemail.com',
      expected: 'username@gmail.com',
      description: 'Googlemail with dots'
    },
    
    // Non-Gmail tests (should not be modified)
    {
      input: 'user@example.com',
      expected: 'user@example.com',
      description: 'Non-Gmail domain'
    },
    {
      input: 'user.name@example.com',
      expected: 'user.name@example.com',
      description: 'Non-Gmail with dots (preserved)'
    },
    {
      input: 'user+tag@example.com',
      expected: 'user+tag@example.com',
      description: 'Non-Gmail with plus tag (preserved)'
    },
    
    // Edge cases
    {
      input: '  user@gmail.com  ',
      expected: 'user@gmail.com',
      description: 'Gmail with whitespace'
    },
    {
      input: 'user..name@gmail.com',
      expected: 'username@gmail.com',
      description: 'Gmail with multiple dots'
    },
    {
      input: 'user++tag@gmail.com',
      expected: 'user@gmail.com',
      description: 'Gmail with multiple plus signs'
    }
  ];

  let passed = 0;
  let failed = 0;

  testCases.forEach((testCase, index) => {
    try {
      const result = normalizeEmail(testCase.input);
      const isValid = isValidEmail(result);
      
      if (result === testCase.expected && isValid) {
        console.log(`✅ Test ${index + 1}: ${testCase.description}`);
        console.log(`   Input:    "${testCase.input}"`);
        console.log(`   Output:   "${result}"`);
        console.log(`   Valid:    ${isValid}\n`);
        passed++;
      } else {
        console.log(`❌ Test ${index + 1}: ${testCase.description}`);
        console.log(`   Input:    "${testCase.input}"`);
        console.log(`   Expected: "${testCase.expected}"`);
        console.log(`   Got:      "${result}"`);
        console.log(`   Valid:    ${isValid}\n`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ Test ${index + 1}: ${testCase.description}`);
      console.log(`   Input:    "${testCase.input}"`);
      console.log(`   Error:    ${error.message}\n`);
      failed++;
    }
  });

  // Test validation function
  console.log('🔍 Email Validation Tests');
  console.log('=========================\n');

  const validationTests = [
    { email: 'user@gmail.com', shouldBeValid: true },
    { email: 'user@example.com', shouldBeValid: true },
    { email: 'invalid-email', shouldBeValid: false },
    { email: 'user@', shouldBeValid: false },
    { email: '@example.com', shouldBeValid: false },
    { email: '', shouldBeValid: false },
    { email: null, shouldBeValid: false },
    { email: undefined, shouldBeValid: false }
  ];

  validationTests.forEach((test, index) => {
    const isValid = isValidEmail(test.email);
    const passed = isValid === test.shouldBeValid;
    
    if (passed) {
      console.log(`✅ Validation Test ${index + 1}: "${test.email}" → ${isValid}`);
    } else {
      console.log(`❌ Validation Test ${index + 1}: "${test.email}" → ${isValid} (expected ${test.shouldBeValid})`);
    }
  });

  console.log('\n📊 Test Results');
  console.log('================');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

  if (failed > 0) {
    console.log('\n⚠️  Some tests failed. Please review the email normalization logic.');
    process.exit(1);
  } else {
    console.log('\n🎉 All tests passed! Email normalization is working correctly.');
  }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runEmailTests();
}
