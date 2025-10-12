// Load environment variables first
import 'dotenv/config';

import { Section7AIFormatter } from './dist/src/services/formatter/section7AI.js';

console.log('🧪 Debug Test: Verbatim Radiology Capture');
console.log('=' .repeat(50));

// Test with explicit radiology content
const testInput = `la travailleuse consulte le docteur Martin le 15 janvier 2024 elle diagnostique une entorse lombaire elle prescrit une radiographie le travailleur obtient une radiographie de la colonne lombaire le 20 janvier 2024 elle est interprétée par le docteur Dubois radiologiste ce dernier constate colonne lombaire discopathie dégénérative L4-L5 et L5-S1 avec rétrécissement des espaces intersomatiques arthrose facettaire bilatérale L4-L5 et L5-S1 pas de fracture ou de lésion lytique visible pas d'effondrement vertébral les foramens sont préservés conclusion discopathie dégénérative modérée L4-L5 et L5-S1 avec arthrose facettaire associée le travailleur revoit le docteur Martin le 25 janvier 2024 elle maintient le diagnostic`;

console.log('\n📝 Test Input:');
console.log(testInput);

console.log('\n🔧 Testing Section 7 AI Formatter directly...');

async function testVerbatimCapture() {
  try {
    console.log('\n✅ Section 7 AI Formatter imported successfully');
    
    console.log('\n🚀 Processing with explicit radiology content...');
    const result = await Section7AIFormatter.formatSection7Content(testInput, 'fr');

    console.log('\n📊 Processing Result:');
    console.log(`   - Success: ${!!result.formatted}`);
    console.log(`   - Processing Time: ${result.metadata?.processingTime}ms`);
    console.log(`   - Model: ${result.metadata?.model}`);
    console.log(`   - Files Loaded: ${result.metadata?.filesLoaded?.join(', ')}`);

    console.log('\n📄 Formatted Output:');
    console.log('=' .repeat(50));
    console.log(result.formatted);
    console.log('=' .repeat(50));

    // Check for verbatim radiology
    const hasQuotes = result.formatted.includes('«') && result.formatted.includes('»');
    const hasRadiologySection = result.formatted.includes('radiologiste') || result.formatted.includes('radiographie');
    const hasVerbatimContent = result.formatted.includes('discopathie dégénérative L4-L5 et L5-S1');
    
    console.log('\n🔍 Verbatim Analysis:');
    console.log(`   - Has quotes: ${hasQuotes}`);
    console.log(`   - Has radiology section: ${hasRadiologySection}`);
    console.log(`   - Has verbatim content: ${hasVerbatimContent}`);
    
    if (hasQuotes && hasRadiologySection && hasVerbatimContent) {
      console.log('   ✅ Verbatim radiology capture is working!');
    } else {
      console.log('   ❌ Verbatim radiology capture is NOT working as expected.');
      console.log('   🔍 Let me check the prompt file...');
      
      // Check if the prompt file exists and has the right content
      const fs = await import('fs');
      const path = await import('path');
      
      const promptPath = path.join(process.cwd(), 'backend', 'prompts', 'section7_master.md');
      if (fs.existsSync(promptPath)) {
        const promptContent = fs.readFileSync(promptPath, 'utf-8');
        const hasVerbatimRule = promptContent.includes('CITATIONS RADIOLOGIE: TOUJOURS capturer VERBATIM');
        console.log(`   - Prompt file exists: ${fs.existsSync(promptPath)}`);
        console.log(`   - Has verbatim rule: ${hasVerbatimRule}`);
        
        if (!hasVerbatimRule) {
          console.log('   ❌ The prompt file does not contain the verbatim radiology rule!');
        }
      } else {
        console.log('   ❌ Prompt file not found!');
      }
    }

    return !!result.formatted;
  } catch (error) {
    console.error('❌ Verbatim Debug Test Failed:', error);
    return false;
  }
}

testVerbatimCapture();
