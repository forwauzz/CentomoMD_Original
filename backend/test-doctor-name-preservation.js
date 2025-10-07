#!/usr/bin/env node

/**
 * Test to verify doctor name preservation in hardened formatter
 */

import { Section7Guards } from './dist/src/services/formatter/section7AI-hardened.js';

console.log('🧪 Doctor Name Preservation Test');
console.log('=' .repeat(40));

// Test the specific issue from the user's example
const testInput = `La travailleuse consulte le docteur Harry Durusso, 9 octobre 2023. 
Elle est interprétée par le docteur Roxanne Bouchard-Bellavance, radiologiste.`;

console.log('📥 Input:');
console.log(testInput);

console.log('\n🛡️ Testing Guards...');

// Test TerminologyGuard (should preserve full names)
const terminologyResult = Section7Guards.terminologyGuard(testInput, 'fr');
console.log('\n✅ TerminologyGuard Result:');
console.log('Text:', terminologyResult.text);
console.log('Violations:', terminologyResult.violations);
console.log('Changes:', terminologyResult.metadata?.terminology_changes);

// Test if full names are preserved
const hasHarryDurusso = terminologyResult.text.includes('Harry Durusso');
const hasRoxanneBouchard = terminologyResult.text.includes('Roxanne Bouchard-Bellavance');

console.log('\n📊 Name Preservation Check:');
console.log('✅ Harry Durusso preserved:', hasHarryDurusso);
console.log('✅ Roxanne Bouchard-Bellavance preserved:', hasRoxanneBouchard);

if (hasHarryDurusso && hasRoxanneBouchard) {
  console.log('\n🎉 SUCCESS: All doctor names are preserved!');
} else {
  console.log('\n❌ FAILURE: Some doctor names were truncated!');
}

console.log('\n✨ Test completed!');
