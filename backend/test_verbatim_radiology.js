// Load environment variables first
import 'dotenv/config';

// Test with explicit radiologist report to verify verbatim capture
const rawTranscriptWithRadiology = `la travailleuse consulte le docteur Martin le 15 janvier 2024 elle diagnostique une entorse lombaire elle prescrit une radiographie le travailleur obtient une radiographie de la colonne lombaire le 20 janvier 2024 elle est interprétée par le docteur Dubois radiologiste ce dernier constate colonne lombaire discopathie dégénérative L4-L5 et L5-S1 avec rétrécissement des espaces intersomatiques arthrose facettaire bilatérale L4-L5 et L5-S1 pas de fracture ou de lésion lytique visible pas d'effondrement vertébral les foramens sont préservés conclusion discopathie dégénérative modérée L4-L5 et L5-S1 avec arthrose facettaire associée le travailleur revoit le docteur Martin le 25 janvier 2024 elle maintient le diagnostic`;

console.log('🧪 Test: Verbatim Radiology Capture');
console.log('=' .repeat(50));

console.log('\n📝 Raw Transcript with Radiology:');
console.log(rawTranscriptWithRadiology);

console.log('\n🔧 Testing Section 7 R&D Service with Radiology...');

// Test the Section 7 R&D service directly
async function testVerbatimRadiology() {
  try {
    const { section7RdService } = await import('./dist/src/services/section7RdService.js');
    
    console.log('\n✅ Section 7 R&D Service imported successfully');
    
    // Test the service
    console.log('\n🚀 Processing transcript with radiology...');
    const result = await section7RdService.processInput(rawTranscriptWithRadiology);

    console.log('\n📊 Processing Result:');
    console.log(`   - Success: ${result.success}`);
    console.log(`   - Processing Time: ${result.metadata.processingTime}ms`);
    console.log(`   - Version: ${result.metadata.version}`);

    console.log('\n📋 Compliance Results:');
    console.log(`   - Rules Score: ${(result.compliance.rulesScore * 100).toFixed(1)}%`);
    console.log(`   - Passed Rules: ${result.compliance.passedRules.length}`);
    console.log(`   - Failed Rules: ${result.compliance.failedRules.length}`);

    console.log('\n⚠️ Compliance Issues:');
    result.compliance.issues.forEach(issue => {
      console.log(`   - ${issue.rule}: ${issue.ok ? 'PASS' : 'FAIL'}${issue.message ? ` - ${issue.message}` : ''}`);
    });

    console.log('\n🎯 Quality Assurance:');
    console.log(`   - Line Similarity: ${(result.quality.lineSimilarity * 100).toFixed(1)}%`);
    console.log(`   - Manager Verdict: ${result.quality.managerVerdict}`);
    console.log(`   - Feedback: ${result.quality.feedback}`);

    console.log('\n📄 Formatted Output:');
    console.log('=' .repeat(50));
    console.log(result.formattedText);
    console.log('=' .repeat(50));

    // Check if radiology is captured verbatim
    const hasRadiologyQuotes = result.formattedText.includes('«') && result.formattedText.includes('»');
    const hasRadiologySection = result.formattedText.toLowerCase().includes('radiologiste');
    
    console.log('\n🔍 Radiology Analysis:');
    console.log(`   - Has quotes: ${hasRadiologyQuotes}`);
    console.log(`   - Has radiology section: ${hasRadiologySection}`);
    
    if (hasRadiologyQuotes && hasRadiologySection) {
      console.log('   ✅ Verbatim radiology capture appears to be working!');
    } else {
      console.log('   ❌ Verbatim radiology capture may not be working properly');
    }

    return result.success;
  } catch (error) {
    console.error('❌ Section 7 R&D Service Test Failed:', error);
    return false;
  }
}

testVerbatimRadiology();
