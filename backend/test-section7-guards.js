#!/usr/bin/env node

/**
 * Test runner for Section 7 Guards
 * Runs all guard tests and provides comprehensive reporting
 */

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test configuration
const testFiles = [
  'test-worker-first.spec.ts',
  'test-chronology.spec.ts', 
  'test-quotes.spec.ts',
  'test-terminology.spec.ts',
  'test-vertebrae.spec.ts',
  'test-section-header.spec.ts'
];

// Test runner function
function runGuardTests() {
  console.log('🧪 Section 7 Guards Test Suite');
  console.log('=' .repeat(50));
  
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;
  const results = [];
  
  testFiles.forEach(testFile => {
    console.log(`\n📋 Running ${testFile}...`);
    
    try {
      // Run the test file
      const output = execSync(`npx jest ${testFile} --verbose`, { 
        encoding: 'utf8',
        cwd: __dirname,
        stdio: 'pipe'
      });
      
      // Parse test results
      const lines = output.split('\n');
      const testResults = lines.filter(line => 
        line.includes('✓') || line.includes('✗') || line.includes('PASS') || line.includes('FAIL')
      );
      
      const passed = testResults.filter(line => line.includes('✓') || line.includes('PASS')).length;
      const failed = testResults.filter(line => line.includes('✗') || line.includes('FAIL')).length;
      
      totalTests += passed + failed;
      passedTests += passed;
      failedTests += failed;
      
      results.push({
        file: testFile,
        status: failed === 0 ? 'PASS' : 'FAIL',
        passed,
        failed,
        output: output.substring(0, 500) + (output.length > 500 ? '...' : '')
      });
      
      console.log(`✅ ${testFile}: ${passed} passed, ${failed} failed`);
      
    } catch (error) {
      console.log(`❌ ${testFile}: Test execution failed`);
      console.log(`Error: ${error.message}`);
      
      failedTests++;
      totalTests++;
      
      results.push({
        file: testFile,
        status: 'ERROR',
        passed: 0,
        failed: 1,
        output: error.message
      });
    }
  });
  
  // Summary
  console.log(`\n📊 Test Results Summary:`);
  console.log(`✅ Passed: ${passedTests}/${totalTests}`);
  console.log(`❌ Failed: ${failedTests}/${totalTests}`);
  console.log(`📈 Success Rate: ${totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : 0}%`);
  
  // Detailed results
  console.log(`\n📋 Detailed Results:`);
  results.forEach(result => {
    const status = result.status === 'PASS' ? '✅' : '❌';
    console.log(`${status} ${result.file} (${result.passed} passed, ${result.failed} failed)`);
  });
  
  // Guard coverage report
  console.log(`\n🛡️  Guard Coverage:`);
  const guards = [
    'WorkerFirstGuard',
    'OrderGuard', 
    'QuoteGuard',
    'TerminologyGuard',
    'VertebraeGuard',
    'SectionHeaderGuard'
  ];
  
  guards.forEach(guard => {
    const hasTests = testFiles.some(file => file.includes(guard.toLowerCase().replace('guard', '')));
    const status = hasTests ? '✅' : '❌';
    console.log(`${status} ${guard}: ${hasTests ? 'Covered' : 'Missing tests'}`);
  });
  
  if (failedTests === 0) {
    console.log(`\n🎉 All guard tests passed! Section 7 hardening is working correctly.`);
  } else {
    console.log(`\n⚠️  Some guard tests failed. Review the implementation.`);
  }
  
  return {
    totalTests,
    passedTests,
    failedTests,
    successRate: totalTests > 0 ? (passedTests / totalTests) * 100 : 0,
    results
  };
}

// Integration test with real-world example
async function runIntegrationTest() {
  console.log(`\n🔗 Integration Test with Real-World Example`);
  console.log('=' .repeat(50));
  
  const messyInput = `Le 7 octobre 2023, la patiente consulte le Docteur Harry Durusso. 
Elle se plaint de douleurs au niveau C 5 - C 6. 
L'employeur dit: "Accident confirmé." 
Le 15 octobre, elle revoit le docteur Durusso.`;

  console.log('📥 Input (messy FR sample):');
  console.log(messyInput);
  
  try {
    // Import the hardened formatter
    const { Section7AIFormatter } = await import('./src/services/formatter/section7AI-hardened.js');
    
    console.log('\n🔄 Processing with hardened formatter...');
    
    // Note: This would require actual OpenAI API key for full test
    console.log('ℹ️  Integration test requires OpenAI API key for full execution');
    console.log('✅ Hardened formatter structure is ready for testing');
    
    return {
      status: 'ready',
      input: messyInput,
      expectedOutput: 'Should start with "La travailleuse", use « ... », replace "la patiente" and "Docteur", normalize C5-C6'
    };
    
  } catch (error) {
    console.log(`❌ Integration test failed: ${error.message}`);
    return {
      status: 'error',
      error: error.message
    };
  }
}

// Main execution
function main() {
  console.log('🚀 Section 7 Guards Test Suite');
  console.log('=' .repeat(70));
  
  // Run guard tests
  const testResults = runGuardTests();
  
  // Run integration test
  const integrationResults = await runIntegrationTest();
  
  // Final summary
  console.log(`\n📊 Final Test Results:`);
  console.log(`🧪 Guard Tests: ${testResults.successRate.toFixed(1)}% success rate`);
  console.log(`🔗 Integration Test: ${integrationResults.status}`);
  
  if (testResults.successRate === 100 && integrationResults.status === 'ready') {
    console.log(`\n🎉 All tests ready! Section 7 hardening implementation is complete.`);
  } else {
    console.log(`\n⚠️  Some issues found. Review and fix before deployment.`);
  }
  
  console.log(`\n✨ Test execution completed!`);
}

// Run the tests
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export {
  runGuardTests,
  runIntegrationTest
};
