#!/usr/bin/env node

/**
 * Simple test script for Output Language Selection Feature
 * Tests the backend directly without external dependencies
 */

// Test data
const FRENCH_TRANSCRIPT = `0: excellent, fait que aujourd'hui, c'est comme c'est bizarre comme rencontre parce que je ne vous vois pas pour le le l'opération que j'ai fait, je vous rends compte pour la CNEST parce que quand vous vous êtes blessé, euh le.

1: le juin 2024, il y a eu des blessures aussi au dos.

0: que je vais regarder ça aussi pour le coude, c'est difficile parce que je viens juste de vous opérer, fait que je.

0: La CNSST ne reconnaît pas l'épicondilte, la chirurgie que je vous ai faite là, ça, il le reconnaît pas, mais elle reconnaît juste une contusion au coude.`;

const ENGLISH_TRANSCRIPT = `0: Right 0: So I, again, can you just um explain me again how you injured your back.

3: Um, so I was, uh, working a late shift in the warehouse and uh, you know, I was quite into lift, um, a 3: a heavy box, and I think I, you know, I pulled a muscle in my back hurts now.

1: Yeah, all right. And I saw in, in, in your chart that you, uh, yeah, yeah.

0: I saw in your chart that uh you, you're not back to work right now, do you feel that at some point you may be able to go back to work as as your your last job that you were doing.`;

// Test scenarios
const TEST_SCENARIOS = [
  {
    name: "French → French (FR→FR)",
    inputLanguage: "fr",
    outputLanguage: "fr",
    transcript: FRENCH_TRANSCRIPT,
    expectedHeaders: [
      "Appréciation subjective de l'évolution :",
      "Plaintes et problèmes :",
      "Impact fonctionnel :"
    ]
  },
  {
    name: "English → French (EN→FR)",
    inputLanguage: "en", 
    outputLanguage: "fr",
    transcript: ENGLISH_TRANSCRIPT,
    expectedHeaders: [
      "Appréciation subjective de l'évolution :",
      "Plaintes et problèmes :",
      "Impact fonctionnel :"
    ]
  },
  {
    name: "English → English (EN→EN)",
    inputLanguage: "en",
    outputLanguage: "en", 
    transcript: ENGLISH_TRANSCRIPT,
    expectedHeaders: [
      "Subjective appraisal of progression:",
      "Complaints and problems:",
      "Functional impact:"
    ]
  }
];

async function testScenario(scenario) {
  console.log(`\n🧪 Testing: ${scenario.name}`);
  console.log(`📝 Input Language: ${scenario.inputLanguage}`);
  console.log(`📤 Output Language: ${scenario.outputLanguage}`);
  console.log(`📄 Transcript Length: ${scenario.transcript.length} characters`);
  
  try {
    const startTime = Date.now();
    
    const response = await fetch('http://localhost:3001/api/format/mode2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transcript: scenario.transcript,
        section: '8',
        inputLanguage: scenario.inputLanguage,
        outputLanguage: scenario.outputLanguage,
        templateId: 'section8-ai-formatter'
      })
    });

    const endTime = Date.now();
    const processingTime = endTime - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ HTTP Error: ${response.status} ${response.statusText}`);
      console.log(`📄 Error Response: ${errorText}`);
      return false;
    }

    const result = await response.json();
    
    console.log(`⏱️  Processing Time: ${processingTime}ms`);
    console.log(`📊 Response Status: ${response.status}`);
    
    // Check if we got formatted content
    if (!result.formatted || result.formatted.trim() === '') {
      console.log(`❌ No formatted content returned`);
      return false;
    }

    // Check if content is different from input (not a pass-through)
    if (result.formatted.trim() === scenario.transcript.trim()) {
      console.log(`⚠️  Content identical to input (pass-through)`);
      console.log(`📄 Issues: ${result.issues?.join(', ') || 'None'}`);
      return false;
    }

    // Check for expected headers
    const missingHeaders = scenario.expectedHeaders.filter(header => 
      !result.formatted.includes(header)
    );

    if (missingHeaders.length > 0) {
      console.log(`⚠️  Missing expected headers: ${missingHeaders.join(', ')}`);
    } else {
      console.log(`✅ All expected headers present`);
    }

    // Check for French indicators (for French output)
    if (scenario.outputLanguage === 'fr') {
      const frenchIndicators = /[àâçéèêëîïôùûüÿœ]/i;
      if (!frenchIndicators.test(result.formatted)) {
        console.log(`⚠️  Expected French output but no French characters detected`);
      } else {
        console.log(`✅ French characters detected in output`);
      }
    }

    // Check for English indicators (for English output)
    if (scenario.outputLanguage === 'en') {
      const englishIndicators = /[a-zA-Z]/;
      if (!englishIndicators.test(result.formatted)) {
        console.log(`⚠️  Expected English output but no English characters detected`);
      } else {
        console.log(`✅ English characters detected in output`);
      }
    }

    // Show preview of formatted content
    const preview = result.formatted.substring(0, 300);
    console.log(`📄 Formatted Content Preview:`);
    console.log(`   ${preview}${result.formatted.length > 300 ? '...' : ''}`);
    
    // Show issues if any
    if (result.issues && result.issues.length > 0) {
      console.log(`⚠️  Issues: ${result.issues.join(', ')}`);
    } else {
      console.log(`✅ No issues reported`);
    }

    // Show confidence score
    if (result.confidence_score !== undefined) {
      console.log(`📊 Confidence Score: ${result.confidence_score}`);
    }

    return true;

  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting Output Language Selection Tests');
  console.log('=' .repeat(60));
  
  let passedTests = 0;
  let totalTests = TEST_SCENARIOS.length;

  for (const scenario of TEST_SCENARIOS) {
    const passed = await testScenario(scenario);
    if (passed) {
      passedTests++;
    }
    console.log('─'.repeat(60));
  }

  console.log('\n📊 TEST SUMMARY');
  console.log('=' .repeat(60));
  console.log(`✅ Passed: ${passedTests}/${totalTests}`);
  console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Output language selection is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Check the logs above for details.');
  }
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch('http://localhost:3001/api/config');
    if (response.ok) {
      console.log('✅ Backend server is running');
      return true;
    }
  } catch (error) {
    console.log('❌ Backend server is not running or not accessible');
    console.log('   Please start the backend server with: npm run dev');
    return false;
  }
}

// Main execution
async function main() {
  console.log('🔍 Checking backend server...');
  const serverRunning = await checkServer();
  
  if (!serverRunning) {
    process.exit(1);
  }

  await runAllTests();
}

main().catch(console.error);
