#!/usr/bin/env node

/**
 * Section 7 AI Formatter - Doctor Name Preservation Test
 * 
 * This script tests the Section 7 AI Formatter to ensure it properly preserves
 * full doctor names (first name + last name) in the final transcript.
 */

const fs = require('fs');
const path = require('path');

// Test cases with various doctor name scenarios
const testCases = [
  {
    name: "Full Name Provided",
    input: `The worker consults Dr. Jonathan-Jared Cooperman, on May 21, 2019. He diagnoses an abrasion of the left knee.`,
    expectedPattern: /Dr\.\s+Jonathan-Jared\s+Cooperman/,
    description: "Should preserve complete hyphenated first name and last name"
  },
  {
    name: "Multiple Full Names",
    input: `The worker consults Dr. Pierre Deslandes, on June 14, 2019. He diagnoses a contusion. The worker meets Dr. Ziad Mehio, orthopedic surgeon, on January 8, 2020.`,
    expectedPattern: /Dr\.\s+Pierre\s+Deslandes.*Dr\.\s+Ziad\s+Mehio/,
    description: "Should preserve multiple complete doctor names"
  },
  {
    name: "Compound Last Names",
    input: `The worker undergoes an MRI interpreted by Dr. Roxanne Bouchard-Bellavance, radiologist, who concludes degenerative changes.`,
    expectedPattern: /Dr\.\s+Roxanne\s+Bouchard-Bellavance/,
    description: "Should preserve hyphenated compound last names"
  },
  {
    name: "Long Full Names",
    input: `The worker consults Dr. Thomas Minh Huan Ong, radiologist, on November 27, 2019.`,
    expectedPattern: /Dr\.\s+Thomas\s+Minh\s+Huan\s+Ong/,
    description: "Should preserve multiple middle names and compound last names"
  },
  {
    name: "French Names with Accents",
    input: `The worker consults Dr. Kevin Bélliveau, radiologist, on December 17, 2019.`,
    expectedPattern: /Dr\.\s+Kevin\s+Bélliveau/,
    description: "Should preserve French names with accented characters"
  },
  {
    name: "Mixed Language Names",
    input: `The worker meets Dr. Vanessa Pinard St-Pierre, on January 16, 2024. She diagnoses a cervical sprain.`,
    expectedPattern: /Dr\.\s+Vanessa\s+Pinard\s+St-Pierre/,
    description: "Should preserve mixed language compound names"
  },
  {
    name: "Only First Name (Should Flag)",
    input: `The worker consults Dr. Harry, on October 9, 2023. He diagnoses a lumbar sprain.`,
    expectedPattern: /Dr\.\s+Harry\s+\(last\s+name\s+not\s+specified\)/,
    description: "Should flag incomplete names when only first name is provided"
  },
  {
    name: "Only Last Name (Should Flag)",
    input: `The worker consults Dr. Durusso, on December 19, 2023. He considers the condition stable.`,
    expectedPattern: /Dr\.\s+Durusso\s+\(first\s+name\s+not\s+specified\)/,
    description: "Should flag incomplete names when only last name is provided"
  },
  {
    name: "Multiple Consultations Same Doctor",
    input: `The worker consults Dr. Pierre Deslandes, on June 14, 2019. He diagnoses a contusion. The worker reviews with Dr. Pierre Deslandes, on July 2, 2019. He maintains the diagnoses.`,
    expectedPattern: /Dr\.\s+Pierre\s+Deslandes.*Dr\.\s+Pierre\s+Deslandes/,
    description: "Should maintain consistent full name format across multiple references"
  },
  {
    name: "Complex Medical Scenario",
    input: `The worker consults Dr. Jonathan-Jared Cooperman, on May 21, 2019. He diagnoses an abrasion. The worker undergoes X-rays interpreted by Dr. Thomas Minh Huan Ong, radiologist. The worker meets Dr. Ziad Mehio, orthopedic surgeon, on January 8, 2020.`,
    expectedPattern: /Dr\.\s+Jonathan-Jared\s+Cooperman.*Dr\.\s+Thomas\s+Minh\s+Huan\s+Ong.*Dr\.\s+Ziad\s+Mehio/,
    description: "Should preserve all full names in complex multi-doctor scenarios"
  }
];

// Mock AI Formatter function (replace with actual implementation)
async function mockSection7Formatter(inputText) {
  // This is a mock implementation - replace with actual AI formatter call
  // For testing purposes, we'll simulate the expected behavior
  
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Mock the formatter logic based on the template rules
  let output = inputText;
  
  // Apply basic formatting rules
  output = output.replace(/^/, "7. History of Facts and Clinical Evolution\n\n");
  
  // Simulate name preservation logic
  // In real implementation, this would be handled by the AI model
  // following the Section 7 template instructions
  
  return output;
}

// Test runner function
async function runTests() {
  console.log("🧪 Section 7 AI Formatter - Doctor Name Preservation Tests\n");
  console.log("=" .repeat(60));
  
  let passedTests = 0;
  let totalTests = testCases.length;
  
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`\n📋 Test ${i + 1}: ${testCase.name}`);
    console.log(`📝 Description: ${testCase.description}`);
    console.log(`📥 Input: ${testCase.input.substring(0, 80)}${testCase.input.length > 80 ? '...' : ''}`);
    
    try {
      // Run the formatter
      const output = await mockSection7Formatter(testCase.input);
      
      // Check if the expected pattern is found
      const patternFound = testCase.expectedPattern.test(output);
      
      if (patternFound) {
        console.log(`✅ PASS - Doctor name preserved correctly`);
        passedTests++;
      } else {
        console.log(`❌ FAIL - Expected pattern not found`);
        console.log(`🔍 Expected: ${testCase.expectedPattern}`);
        console.log(`📤 Output: ${output.substring(0, 200)}${output.length > 200 ? '...' : ''}`);
      }
      
    } catch (error) {
      console.log(`💥 ERROR - Test failed with exception: ${error.message}`);
    }
    
    console.log("-".repeat(40));
  }
  
  // Summary
  console.log(`\n📊 Test Results Summary:`);
  console.log(`✅ Passed: ${passedTests}/${totalTests}`);
  console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);
  console.log(`📈 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  if (passedTests === totalTests) {
    console.log(`\n🎉 All tests passed! Doctor name preservation is working correctly.`);
  } else {
    console.log(`\n⚠️  Some tests failed. Review the Section 7 template configuration.`);
  }
}

// Integration test with actual AI formatter (if available)
async function runIntegrationTest() {
  console.log("\n🔗 Integration Test with Actual AI Formatter");
  console.log("=" .repeat(50));
  
  // Check if the actual formatter is available
  const formatterPath = path.join(__dirname, 'backend', 'src', 'section7-formatter.js');
  
  if (fs.existsSync(formatterPath)) {
    try {
      const { formatSection7 } = require(formatterPath);
      
      const testInput = `The worker consults Dr. Jonathan-Jared Cooperman, on May 21, 2019. He diagnoses an abrasion of the left knee. The worker meets Dr. Ziad Mehio, orthopedic surgeon, on January 8, 2020.`;
      
      console.log("📥 Running integration test with actual formatter...");
      const result = await formatSection7(testInput);
      
      // Check for name preservation
      const hasFullNames = /Dr\.\s+Jonathan-Jared\s+Cooperman.*Dr\.\s+Ziad\s+Mehio/.test(result);
      
      if (hasFullNames) {
        console.log("✅ Integration test PASSED - Full names preserved");
      } else {
        console.log("❌ Integration test FAILED - Names not preserved correctly");
        console.log("📤 Result:", result.substring(0, 300) + "...");
      }
      
    } catch (error) {
      console.log(`💥 Integration test failed: ${error.message}`);
    }
  } else {
    console.log("ℹ️  Actual formatter not found - running mock tests only");
  }
}

// Main execution
async function main() {
  console.log("🚀 Starting Section 7 Doctor Name Preservation Tests\n");
  
  await runTests();
  await runIntegrationTest();
  
  console.log("\n✨ Test execution completed!");
}

// Run the tests
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  runTests,
  runIntegrationTest,
  testCases
};
