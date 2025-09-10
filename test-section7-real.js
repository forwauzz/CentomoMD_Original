#!/usr/bin/env node

/**
 * Real Section 7 AI Formatter Test
 * Tests the actual Section7AIFormatter implementation
 */

const path = require('path');

// Test cases for doctor name preservation
const testCases = [
  {
    name: "Full Name Preservation",
    input: "The worker consults Dr. Jonathan-Jared Cooperman, on May 21, 2019. He diagnoses an abrasion of the left knee.",
    expectedNames: ["Dr. Jonathan-Jared Cooperman"],
    description: "Should preserve complete hyphenated first name and last name"
  },
  {
    name: "Multiple Full Names",
    input: "The worker consults Dr. Pierre Deslandes, on June 14, 2019. He diagnoses a contusion. The worker meets Dr. Ziad Mehio, orthopedic surgeon, on January 8, 2020.",
    expectedNames: ["Dr. Pierre Deslandes", "Dr. Ziad Mehio"],
    description: "Should preserve multiple complete doctor names"
  },
  {
    name: "Compound Last Names",
    input: "The worker undergoes an MRI interpreted by Dr. Roxanne Bouchard-Bellavance, radiologist, who concludes degenerative changes.",
    expectedNames: ["Dr. Roxanne Bouchard-Bellavance"],
    description: "Should preserve hyphenated compound last names"
  },
  {
    name: "Long Full Names",
    input: "The worker consults Dr. Thomas Minh Huan Ong, radiologist, on November 27, 2019.",
    expectedNames: ["Dr. Thomas Minh Huan Ong"],
    description: "Should preserve multiple middle names and compound last names"
  },
  {
    name: "French Names with Accents",
    input: "The worker consults Dr. Kevin Bélliveau, radiologist, on December 17, 2019.",
    expectedNames: ["Dr. Kevin Bélliveau"],
    description: "Should preserve French names with accented characters"
  },
  {
    name: "Incomplete First Name Only",
    input: "The worker consults Dr. Harry, on October 9, 2023. He diagnoses a lumbar sprain.",
    expectedNames: ["Dr. Harry (last name not specified)"],
    description: "Should flag incomplete names when only first name is provided"
  },
  {
    name: "Incomplete Last Name Only",
    input: "The worker consults Dr. Durusso, on December 19, 2023. He considers the condition stable.",
    expectedNames: ["Dr. Durusso (first name not specified)"],
    description: "Should flag incomplete names when only last name is provided"
  },
  {
    name: "Complex Multi-Doctor Scenario",
    input: `The worker consults Dr. Jonathan-Jared Cooperman, on May 21, 2019. He diagnoses an abrasion. 
The worker undergoes X-rays interpreted by Dr. Thomas Minh Huan Ong, radiologist. 
The worker meets Dr. Ziad Mehio, orthopedic surgeon, on January 8, 2020.`,
    expectedNames: ["Dr. Jonathan-Jared Cooperman", "Dr. Thomas Minh Huan Ong", "Dr. Ziad Mehio"],
    description: "Should preserve all full names in complex multi-doctor scenarios"
  }
];

// Test runner function
async function runTest(testCase, formatter) {
  console.log(`\n🧪 Testing: ${testCase.name}`);
  console.log(`📝 Description: ${testCase.description}`);
  console.log(`📥 Input: ${testCase.input.substring(0, 100)}${testCase.input.length > 100 ? '...' : ''}`);
  
  try {
    const startTime = Date.now();
    const result = await formatter.formatSection7Content(testCase.input, 'en');
    const processingTime = Date.now() - startTime;
    
    console.log(`⏱️  Processing time: ${processingTime}ms`);
    console.log(`📊 Result metadata:`, {
      hasIssues: result.issues && result.issues.length > 0,
      hasSuggestions: result.suggestions && result.suggestions.length > 0,
      outputLength: result.formatted.length
    });
    
    if (result.issues && result.issues.length > 0) {
      console.log(`⚠️  Issues found:`, result.issues);
    }
    
    if (result.suggestions && result.suggestions.length > 0) {
      console.log(`💡 Suggestions:`, result.suggestions);
    }
    
    // Check if expected names are preserved
    let allNamesFound = true;
    testCase.expectedNames.forEach(expectedName => {
      if (result.formatted.includes(expectedName)) {
        console.log(`✅ Found: ${expectedName}`);
      } else {
        console.log(`❌ Missing: ${expectedName}`);
        allNamesFound = false;
      }
    });
    
    console.log(`📤 Output preview: ${result.formatted.substring(0, 200)}${result.formatted.length > 200 ? '...' : ''}`);
    console.log(`Result: ${allNamesFound ? 'PASS' : 'FAIL'}`);
    
    return {
      testCase: testCase.name,
      passed: allNamesFound,
      processingTime,
      outputLength: result.formatted.length,
      issues: result.issues || [],
      suggestions: result.suggestions || []
    };
    
  } catch (error) {
    console.log(`💥 ERROR: ${error.message}`);
    return {
      testCase: testCase.name,
      passed: false,
      error: error.message
    };
  }
}

// Main test runner
async function runAllTests() {
  console.log("🚀 Section 7 AI Formatter - Doctor Name Preservation Tests");
  console.log("=" .repeat(70));
  
  try {
    // Import the actual Section7AIFormatter
    const { Section7AIFormatter } = await import('./backend/src/services/formatter/section7AI.js');
    console.log("✅ Successfully imported Section7AIFormatter");
    
    const results = [];
    let passedTests = 0;
    
    for (const testCase of testCases) {
      const result = await runTest(testCase, Section7AIFormatter);
      results.push(result);
      
      if (result.passed) {
        passedTests++;
      }
      
      console.log("-".repeat(50));
    }
    
    // Summary
    console.log(`\n📊 Test Results Summary:`);
    console.log(`✅ Passed: ${passedTests}/${testCases.length}`);
    console.log(`❌ Failed: ${testCases.length - passedTests}/${testCases.length}`);
    console.log(`📈 Success Rate: ${((passedTests / testCases.length) * 100).toFixed(1)}%`);
    
    // Detailed results
    console.log(`\n📋 Detailed Results:`);
    results.forEach(result => {
      const status = result.passed ? '✅' : '❌';
      const time = result.processingTime ? `${result.processingTime}ms` : 'N/A';
      console.log(`${status} ${result.testCase} (${time})`);
      
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
      
      if (result.issues && result.issues.length > 0) {
        console.log(`   Issues: ${result.issues.length}`);
      }
    });
    
    if (passedTests === testCases.length) {
      console.log(`\n🎉 All tests passed! Doctor name preservation is working correctly.`);
    } else {
      console.log(`\n⚠️  Some tests failed. Review the Section 7 template configuration.`);
    }
    
  } catch (error) {
    console.error(`💥 Failed to import Section7AIFormatter: ${error.message}`);
    console.log(`\n🔧 Make sure you're running this from the project root directory.`);
    console.log(`📁 Expected path: ./backend/src/services/formatter/section7AI.js`);
  }
}

// Environment check
function checkEnvironment() {
  console.log("🔍 Environment Check:");
  console.log(`📁 Current directory: ${process.cwd()}`);
  console.log(`🔑 OpenAI API Key: ${process.env.OPENAI_API_KEY ? 'Set' : 'Not set'}`);
  
  if (!process.env.OPENAI_API_KEY) {
    console.log(`⚠️  Warning: OPENAI_API_KEY not set. Tests may fail.`);
    console.log(`💡 Set it with: export OPENAI_API_KEY=your_key_here`);
  }
  
  console.log("-".repeat(30));
}

// Run the tests
async function main() {
  checkEnvironment();
  await runAllTests();
}

// Execute if run directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  runAllTests,
  testCases
};
