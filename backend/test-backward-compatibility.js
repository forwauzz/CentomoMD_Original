// Test to verify Mode 2 backward compatibility
const { Mode2Formatter } = require('./dist/src/services/formatter/mode2.js');

async function testBackwardCompatibility() {
  console.log('🧪 Testing Mode 2 Backward Compatibility...\n');

  try {
    const formatter = new Mode2Formatter();
    
    const testTranscript = "La travailleuse est une créatrice de contenu. Elle a été victime d'un accident de travail le 8 février 2024.";
    
    // Test 1: Original Mode 2 pipeline (no templateCombo)
    console.log('1. Testing original Mode 2 pipeline (no templateCombo)...');
    const originalResult = await formatter.format(testTranscript, {
      language: 'fr',
      section: '7'
      // No templateCombo - should use original pipeline
    });
    
    console.log(`   ✅ Original pipeline works`);
    console.log(`   Formatted length: ${originalResult.formatted.length}`);
    console.log(`   Issues: ${originalResult.issues.length}`);
    console.log(`   Confidence: ${originalResult.confidence_score}`);
    
    // Test 2: Template-only combination (should be same as original)
    console.log('\n2. Testing template-only combination...');
    const templateOnlyResult = await formatter.format(testTranscript, {
      language: 'fr',
      section: '7',
      templateCombo: 'template-only'
    });
    
    console.log(`   ✅ Template-only works`);
    console.log(`   Formatted length: ${templateOnlyResult.formatted.length}`);
    console.log(`   Issues: ${templateOnlyResult.issues.length}`);
    console.log(`   Confidence: ${templateOnlyResult.confidence_score}`);
    
    // Test 3: Compare results
    console.log('\n3. Comparing results...');
    const resultsMatch = originalResult.formatted === templateOnlyResult.formatted;
    console.log(`   Results match: ${resultsMatch ? '✅' : '❌'}`);
    
    if (!resultsMatch) {
      console.log('   Original:', originalResult.formatted.substring(0, 100) + '...');
      console.log('   Template-only:', templateOnlyResult.formatted.substring(0, 100) + '...');
    }
    
    console.log('\n✅ Backward compatibility test completed!');
    
  } catch (error) {
    console.error('❌ Backward compatibility test failed:', error);
  }
}

// Run the test
testBackwardCompatibility();
