#!/usr/bin/env node

/**
 * Test Doctor Name Fix
 * Tests the fixed Section 7 AI Formatter to verify doctor name preservation
 */

const path = require('path');

// Test the fixed implementation
async function testFixedImplementation() {
  console.log("🧪 Testing Fixed Section 7 AI Formatter");
  console.log("=" .repeat(60));
  
  try {
    // Import the fixed formatter
    const { Section7AIFormatter } = await import('./section7AI-fixed.js');
    console.log("✅ Successfully imported FIXED Section7AIFormatter");
    
    // Test with the real-world example
    const testInput = `La fiche de réclamation du travailleur décrit l'événement suivant. Survenu le 7 octobre 2023, deux points. Ouvrir la parenthèse, guillemets. Je versais la chaudière d'eau. Ressenti de douleur côté gauche, bas du dos. Ensuite, j'ai poussé le chariot direction l'ascenseur. La roue devant du chariot reste prise dans la craque de l'ascenseur. Ressenti, point. Pression côté gauche au moment et quand j'ai retiré le chariot, sensation de chaud dans le bas du dos. J'ai été avertir le superviseur que j'avais de douleur. J'ai pris pilule, Advil. J'ai continué de travailler et plus les heures passaient, plus la pression côté gauche respirait. Ça me faisait mal quand j'ai respiré. Le lendemain, j'ai rentré, mais j'ai pas effectué le travail. J'ai supervisé une autre employée pour qu'elle le fasse pour moi debout ou assis. C'était difficile la journée pour moi. Fermez guillemets, fermez la parenthèse. La travailleuse consulte le docteur Harry Durusso, 9 octobre 2023. Il diagnostique un entorse lombaire. Il prescrit un arrêt de travail, des antidouleurs et des traitements en physiothérapie. La travailleuse revoit le docteur Harry Durusso, 6 novembre 2023. Il maintient le diagnostic d'entorse lombaire, l'arrêt de travail et les traitements en physiothérapie. La travailleuse revoit le docteur Harry Durusso, 19 décembre 2023. Il juge la condition clinique stable. Il maintient les traitements en physiothérapie et l'arrêt de travail. La travailleuse revoit le docteur Harry Durusso, 30 janvier 2024. Il maintient les traitements en physiothérapie et l'arrêt de travail. La travailleuse revoit le docteur Harry Durusso, 12 mars 2024. Il juge la condition clinique stable. Il maintient les traitements en physiothérapie et l'arrêt de travail. La travailleuse obtient une résonance magnétique de la colonne lombaire, le 23 mars 2024. Elle est interprétée par le docteur Roxanne Bouchard-Bellavance, radiologiste. Cette dernière constate. Ouvrez la parenthèse. Guillemets. Trois petits points. Conclusion, deux points. Changement dégénératif, tel qu'il est caractérisé, avec discopathie prédominant en L5 S1. Sténose biforaminale, modérée à sévère à gauche et minime à droite. Pas de sténose punale centrale significative. À la ligne légère déformation cuniforme de T12, d'allure non récente, à corrélé à l'historique traumatique. Point. À la ligne nodularité surrénalienne gauche et formation d'apparence cystique rénale droite. Partiellement incluse, virgule. Probablement bénigne, virgule. Mais pour lequel une tomodensitométrie avec protocole dédié et par prudence recommandée, étant donné leur inclusion partielle et l'absence d'études comparatives. Point. Fermez les guillemets. Fermez la parenthèse. Travailleuse revoit le docteur Durousseau le 16 avril 2024. Il maintient le diagnostic d'entosse lombaire et juge la condition clinique stable. Il prescrit des traitements en physiothérapie, virgule ergothérapie, et demande un développement des capacités fonctionnelles et maintient l'arrêt de travail. Il prescrit des infiltrations au niveau du rachis lombaire.`;
    
    console.log("📥 Running test with real-world example...");
    const startTime = Date.now();
    
    const result = await Section7AIFormatter.formatSection7Content(testInput, 'fr');
    
    const processingTime = Date.now() - startTime;
    console.log(`⏱️  Processing time: ${processingTime}ms`);
    
    // Analyze the result
    console.log(`\n🔍 Fixed Implementation Analysis:`);
    
    // Check for doctor name preservation
    const hasHarryDurusso = result.formatted.includes('docteur Harry Durusso');
    const hasRoxanneBouchard = result.formatted.includes('docteur Roxanne Bouchard-Bellavance');
    const hasDurousseau = result.formatted.includes('docteur Durousseau');
    
    console.log(`✅ Dr. Harry Durusso preserved: ${hasHarryDurusso ? 'YES' : 'NO'}`);
    console.log(`✅ Dr. Roxanne Bouchard-Bellavance preserved: ${hasRoxanneBouchard ? 'YES' : 'NO'}`);
    console.log(`✅ Dr. Durousseau preserved: ${hasDurousseau ? 'YES' : 'NO'}`);
    
    // Check for truncation issues
    const hasTruncatedDurusso = result.formatted.includes('docteur Durusso') && !hasHarryDurusso;
    const hasTruncatedBouchard = result.formatted.includes('docteur Bouchard-Bellavance') && !hasRoxanneBouchard;
    
    console.log(`❌ Dr. Durusso truncated (missing Harry): ${hasTruncatedDurusso ? 'YES' : 'NO'}`);
    console.log(`❌ Dr. Bouchard-Bellavance truncated (missing Roxanne): ${hasTruncatedBouchard ? 'YES' : 'NO'}`);
    
    // Count occurrences
    const harryCount = (result.formatted.match(/docteur Harry Durusso/g) || []).length;
    const roxanneCount = (result.formatted.match(/docteur Roxanne Bouchard-Bellavance/g) || []).length;
    
    console.log(`📊 Dr. Harry Durusso occurrences: ${harryCount}`);
    console.log(`📊 Dr. Roxanne Bouchard-Bellavance occurrences: ${roxanneCount}`);
    
    // Check for validation issues
    if (result.issues && result.issues.length > 0) {
      console.log(`\n⚠️  Validation Issues:`);
      result.issues.forEach(issue => {
        console.log(`   - ${issue}`);
      });
    }
    
    if (result.suggestions && result.suggestions.length > 0) {
      console.log(`\n💡 Suggestions:`);
      result.suggestions.forEach(suggestion => {
        console.log(`   - ${suggestion}`);
      });
    }
    
    // Show output preview
    console.log(`\n📤 Fixed Implementation Output Preview:`);
    console.log(result.formatted.substring(0, 800) + "...");
    
    // Final assessment
    const allNamesPreserved = hasHarryDurusso && hasRoxanneBouchard && hasDurousseau;
    const noTruncation = !hasTruncatedDurusso && !hasTruncatedBouchard;
    
    console.log(`\n📊 Final Assessment:`);
    console.log(`✅ All doctor names preserved: ${allNamesPreserved ? 'YES' : 'NO'}`);
    console.log(`✅ No truncation issues: ${noTruncation ? 'YES' : 'NO'}`);
    console.log(`🎯 Fix successful: ${allNamesPreserved && noTruncation ? 'YES' : 'NO'}`);
    
    return {
      success: allNamesPreserved && noTruncation,
      allNamesPreserved,
      noTruncation,
      processingTime,
      outputLength: result.formatted.length,
      issues: result.issues || [],
      suggestions: result.suggestions || []
    };
    
  } catch (error) {
    console.log(`💥 Failed to test fixed implementation: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

// Compare with original implementation
async function compareImplementations() {
  console.log(`\n🔄 Comparing Original vs Fixed Implementation`);
  console.log("=" .repeat(60));
  
  try {
    // Test original implementation
    console.log("📥 Testing original implementation...");
    const { Section7AIFormatter: OriginalFormatter } = await import('./src/services/formatter/section7AI.js');
    
    const testInput = `La travailleuse consulte le docteur Harry Durusso, 9 octobre 2023. Il diagnostique un entorse lombaire. Elle est interprétée par le docteur Roxanne Bouchard-Bellavance, radiologiste.`;
    
    const originalResult = await OriginalFormatter.formatSection7Content(testInput, 'fr');
    
    // Test fixed implementation
    console.log("📥 Testing fixed implementation...");
    const { Section7AIFormatter: FixedFormatter } = await import('./section7AI-fixed.js');
    
    const fixedResult = await FixedFormatter.formatSection7Content(testInput, 'fr');
    
    // Compare results
    console.log(`\n📊 Comparison Results:`);
    
    const originalHasHarry = originalResult.formatted.includes('docteur Harry Durusso');
    const fixedHasHarry = fixedResult.formatted.includes('docteur Harry Durusso');
    
    const originalHasRoxanne = originalResult.formatted.includes('docteur Roxanne Bouchard-Bellavance');
    const fixedHasRoxanne = fixedResult.formatted.includes('docteur Roxanne Bouchard-Bellavance');
    
    console.log(`👨‍⚕️ Dr. Harry Durusso:`);
    console.log(`   Original: ${originalHasHarry ? '✅ Preserved' : '❌ Truncated'}`);
    console.log(`   Fixed: ${fixedHasHarry ? '✅ Preserved' : '❌ Truncated'}`);
    
    console.log(`👩‍⚕️ Dr. Roxanne Bouchard-Bellavance:`);
    console.log(`   Original: ${originalHasRoxanne ? '✅ Preserved' : '❌ Truncated'}`);
    console.log(`   Fixed: ${fixedHasRoxanne ? '✅ Preserved' : '❌ Truncated'}`);
    
    const improvement = (fixedHasHarry && fixedHasRoxanne) && !(originalHasHarry && originalHasRoxanne);
    console.log(`\n🎯 Improvement: ${improvement ? '✅ YES - Fix successful!' : '❌ NO - No improvement'}`);
    
    return {
      original: { hasHarry: originalHasHarry, hasRoxanne: originalHasRoxanne },
      fixed: { hasHarry: fixedHasHarry, hasRoxanne: fixedHasRoxanne },
      improvement
    };
    
  } catch (error) {
    console.log(`💥 Failed to compare implementations: ${error.message}`);
    return { error: error.message };
  }
}

// Main test runner
async function main() {
  console.log("🚀 Doctor Name Fix Test Suite");
  console.log("=" .repeat(70));
  
  // Test the fixed implementation
  const fixTest = await testFixedImplementation();
  
  // Compare with original
  const comparison = await compareImplementations();
  
  // Final summary
  console.log(`\n📊 Final Test Results:`);
  console.log(`🔧 Fixed Implementation: ${fixTest.success ? 'PASSED' : 'FAILED'}`);
  if (comparison.improvement) {
    console.log(`🔄 Comparison: IMPROVEMENT DETECTED`);
  } else if (comparison.error) {
    console.log(`🔄 Comparison: ERROR - ${comparison.error}`);
  } else {
    console.log(`🔄 Comparison: NO IMPROVEMENT`);
  }
  
  console.log(`\n✨ Test completed!`);
}

// Run the test
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testFixedImplementation,
  compareImplementations
};
