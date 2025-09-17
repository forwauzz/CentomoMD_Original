#!/usr/bin/env node

/**
 * Simple Section 7 Doctor Name Test
 * Quick test to verify doctor name preservation
 */

// Test data with various doctor name scenarios
const testData = [
  {
    name: "Full Name Test",
    input: "The worker consults Dr. Jonathan-Jared Cooperman, on May 21, 2019. He diagnoses an abrasion.",
    shouldContain: ["Dr. Jonathan-Jared Cooperman"]
  },
  {
    name: "Multiple Doctors Test", 
    input: "The worker consults Dr. Pierre Deslandes, on June 14, 2019. He meets Dr. Ziad Mehio, orthopedic surgeon, on January 8, 2020.",
    shouldContain: ["Dr. Pierre Deslandes", "Dr. Ziad Mehio"]
  },
  {
    name: "Compound Names Test",
    input: "The worker undergoes MRI interpreted by Dr. Roxanne Bouchard-Bellavance, radiologist.",
    shouldContain: ["Dr. Roxanne Bouchard-Bellavance"]
  },
  {
    name: "Long Names Test",
    input: "The worker consults Dr. Thomas Minh Huan Ong, radiologist, on November 27, 2019.",
    shouldContain: ["Dr. Thomas Minh Huan Ong"]
  },
  {
    name: "Incomplete Name Test",
    input: "The worker consults Dr. Harry, on October 9, 2023. He diagnoses a lumbar sprain.",
    shouldContain: ["Dr. Harry (last name not specified)"]
  }
];

// Mock formatter function (replace with your actual AI formatter)
function mockFormatter(input) {
  // Simulate the Section 7 formatting
  let output = "7. History of Facts and Clinical Evolution\n\n";
  output += input;
  
  // Simulate name preservation logic
  // In real implementation, this would be handled by the AI model
  // following the Section 7 template instructions
  
  return output;
}

// Test function
function runTest(testCase) {
  console.log(`\n🧪 Testing: ${testCase.name}`);
  console.log(`📥 Input: ${testCase.input}`);
  
  const output = mockFormatter(testCase.input);
  
  let allFound = true;
  testCase.shouldContain.forEach(expected => {
    if (output.includes(expected)) {
      console.log(`✅ Found: ${expected}`);
    } else {
      console.log(`❌ Missing: ${expected}`);
      allFound = false;
    }
  });
  
  console.log(`📤 Output: ${output.substring(0, 100)}...`);
  console.log(`Result: ${allFound ? 'PASS' : 'FAIL'}`);
  
  return allFound;
}

// Main test runner
function main() {
  console.log("🚀 Section 7 Doctor Name Preservation Test");
  console.log("=" .repeat(50));
  
  let passed = 0;
  let total = testData.length;
  
  testData.forEach(testCase => {
    if (runTest(testCase)) {
      passed++;
    }
  });
  
  console.log(`\n📊 Results: ${passed}/${total} tests passed`);
  console.log(`Success Rate: ${((passed/total) * 100).toFixed(1)}%`);
  
  if (passed === total) {
    console.log("🎉 All tests passed! Doctor names are preserved correctly.");
  } else {
    console.log("⚠️  Some tests failed. Check the formatter implementation.");
  }
}

// Run the tests
main();
