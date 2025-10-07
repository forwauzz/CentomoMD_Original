#!/usr/bin/env node

/**
 * Doctor Name Truncation Test
 * Tests the specific real-world example where doctor names are being truncated
 */

const path = require('path');

// The exact real-world example from the user
const realWorldTest = {
  name: "Real-World Doctor Name Truncation Test",
  rawInput: `La fiche de réclamation du travailleur décrit l'événement suivant. Survenu le 7 octobre 2023, deux points. Ouvrir la parenthèse, guillemets. Je versais la chaudière d'eau. Ressenti de douleur côté gauche, bas du dos. Ensuite, j'ai poussé le chariot direction l'ascenseur. La roue devant du chariot reste prise dans la craque de l'ascenseur. Ressenti, point. Pression côté gauche au moment et quand j'ai retiré le chariot, sensation de chaud dans le bas du dos. J'ai été avertir le superviseur que j'avais de douleur. J'ai pris pilule, Advil. J'ai continué de travailler et plus les heures passaient, plus la pression côté gauche respirait. Ça me faisait mal quand j'ai respiré. Le lendemain, j'ai rentré, mais j'ai pas effectué le travail. J'ai supervisé une autre employée pour qu'elle le fasse pour moi debout ou assis. C'était difficile la journée pour moi. Fermez guillemets, fermez la parenthèse. La travailleuse consulte le docteur Harry Durusso, 9 octobre 2023. Il diagnostique un entorse lombaire. Il prescrit un arrêt de travail, des antidouleurs et des traitements en physiothérapie. La travailleuse revoit le docteur Harry Durusso, 6 novembre 2023. Il maintient le diagnostic d'entorse lombaire, l'arrêt de travail et les traitements en physiothérapie. La travailleuse revoit le docteur Harry Durusso, 19 décembre 2023. Il juge la condition clinique stable. Il maintient les traitements en physiothérapie et l'arrêt de travail. La travailleuse revoit le docteur Harry Durusso, 30 janvier 2024. Il maintient les traitements en physiothérapie et l'arrêt de travail. La travailleuse revoit le docteur Harry Durusso, 12 mars 2024. Il juge la condition clinique stable. Il maintient les traitements en physiothérapie et l'arrêt de travail. La travailleuse obtient une résonance magnétique de la colonne lombaire, le 23 mars 2024. Elle est interprétée par le docteur Roxanne Bouchard-Bellavance, radiologiste. Cette dernière constate. Ouvrez la parenthèse. Guillemets. Trois petits points. Conclusion, deux points. Changement dégénératif, tel qu'il est caractérisé, avec discopathie prédominant en L5 S1. Sténose biforaminale, modérée à sévère à gauche et minime à droite. Pas de sténose punale centrale significative. À la ligne légère déformation cuniforme de T12, d'allure non récente, à corrélé à l'historique traumatique. Point. À la ligne nodularité surrénalienne gauche et formation d'apparence cystique rénale droite. Partiellement incluse, virgule. Probablement bénigne, virgule. Mais pour lequel une tomodensitométrie avec protocole dédié et par prudence recommandée, étant donné leur inclusion partielle et l'absence d'études comparatives. Point. Fermez les guillemets. Fermez la parenthèse. Travailleuse revoit le docteur Durousseau le 16 avril 2024. Il maintient le diagnostic d'entosse lombaire et juge la condition clinique stable. Il prescrit des traitements en physiothérapie, virgule ergothérapie, et demande un développement des capacités fonctionnelles et maintient l'arrêt de travail. Il prescrit des infiltrations au niveau du rachis lombaire.`,
  
  expectedDoctorNames: [
    "docteur Harry Durusso",  // Should appear 5 times
    "docteur Roxanne Bouchard-Bellavance",  // Should appear 1 time
    "docteur Durousseau"  // Should appear 1 time (only last name provided)
  ],
  
  actualFormattedOutput: `7. Historique de faits et évolution

La fiche de réclamation du travailleur décrit l'événement suivant, survenu le 7 octobre 2023 : « Je versais la chaudière d'eau. Ressenti de douleur côté gauche, bas du dos. Ensuite, j'ai poussé le chariot direction l'ascenseur. La roue devant du chariot reste prise dans la craque de l'ascenseur. Ressenti. Pression côté gauche au moment et quand j'ai retiré le chariot, sensation de chaud dans le bas du dos. J'ai été avertir le superviseur que j'avais de douleur. J'ai pris pilule, Advil. J'ai continué de travailler et plus les heures passaient, plus la pression côté gauche respirait. Ça me faisait mal quand j'ai respiré. Le lendemain, j'ai rentré, mais j'ai pas effectué le travail. J'ai supervisé une autre employée pour qu'elle le fasse pour moi debout ou assis. C'était difficile la journée pour moi. »

La travailleuse consulte le docteur Durusso, le 9 octobre 2023. Il diagnostique une entorse lombaire. Il prescrit un arrêt de travail, des antidouleurs et des traitements en physiothérapie. 

La travailleuse revoit le docteur Durusso, le 6 novembre 2023. Il maintient le diagnostic d'entorse lombaire, l'arrêt de travail et les traitements en physiothérapie. 

La travailleuse revoit le docteur Durusso, le 19 décembre 2023. Il juge la condition clinique stable. Il maintient les traitements en physiothérapie et l'arrêt de travail. 

La travailleuse revoit le docteur Durusso, le 30 janvier 2024. Il maintient les traitements en physiothérapie et l'arrêt de travail. 

La travailleuse revoit le docteur Durusso, le 12 mars 2024. Il juge la condition clinique stable. Il maintient les traitements en physiothérapie et l'arrêt de travail. 

La travailleuse obtient une résonance magnétique de la colonne lombaire, le 23 mars 2024. Elle est interprétée par le docteur Bouchard-Bellavance, radiologiste, qui conclut : « ... Conclusion : Changement dégénératif, tel qu'il est caractérisé, avec discopathie prédominant en L5-S1. Sténose biforaminale, modérée à sévère à gauche et minime à droite. Pas de sténose punale centrale significative. Légère déformation cuniforme de T12, d'allure non récente, à corrélé à l'historique traumatique. Nodularité surrénalienne gauche et formation d'apparence cystique rénale droite. Partiellement incluse, probablement bénigne, mais pour lequel une tomodensitométrie avec protocole dédié et par prudence recommandée, étant donné leur inclusion partielle et l'absence d'études comparatives. »

La travailleuse revoit le docteur Durousseau, le 16 avril 2024. Il maintient le diagnostic d'entorse lombaire et juge la condition clinique stable. Il prescrit des traitements en physiothérapie, ergothérapie, et demande un développement des capacités fonctionnelles tout en maintenant l'arrêt de travail. Il prescrit des infiltrations au niveau du rachis lombaire.`
};

// Test function to analyze the truncation issue
function analyzeDoctorNameTruncation() {
  console.log("🔍 Doctor Name Truncation Analysis");
  console.log("=" .repeat(60));
  
  console.log(`\n📋 Test: ${realWorldTest.name}`);
  
  // Analyze each expected doctor name
  realWorldTest.expectedDoctorNames.forEach((expectedName, index) => {
    console.log(`\n👨‍⚕️ Doctor ${index + 1}: ${expectedName}`);
    
    // Count occurrences in raw input
    const rawOccurrences = (realWorldTest.rawInput.match(new RegExp(expectedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')) || []).length;
    console.log(`📥 Raw input occurrences: ${rawOccurrences}`);
    
    // Count occurrences in formatted output
    const formattedOccurrences = (realWorldTest.actualFormattedOutput.match(new RegExp(expectedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')) || []).length;
    console.log(`📤 Formatted output occurrences: ${formattedOccurrences}`);
    
    // Check for truncated versions
    const nameParts = expectedName.split(' ');
    if (nameParts.length > 2) { // Has first name + last name
      const lastName = nameParts[nameParts.length - 1];
      const truncatedVersion = `docteur ${lastName}`;
      const truncatedOccurrences = (realWorldTest.actualFormattedOutput.match(new RegExp(truncatedVersion.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')) || []).length;
      
      console.log(`✂️  Truncated version "${truncatedVersion}" occurrences: ${truncatedOccurrences}`);
      
      if (truncatedOccurrences > 0 && formattedOccurrences === 0) {
        console.log(`❌ ISSUE: Full name "${expectedName}" was truncated to "${truncatedVersion}"`);
      } else if (formattedOccurrences > 0) {
        console.log(`✅ SUCCESS: Full name "${expectedName}" preserved correctly`);
      }
    } else {
      // Only last name provided
      if (formattedOccurrences > 0) {
        console.log(`✅ SUCCESS: Last name "${expectedName}" preserved correctly`);
      } else {
        console.log(`❌ ISSUE: Last name "${expectedName}" missing from output`);
      }
    }
  });
  
  // Summary analysis
  console.log(`\n📊 Summary Analysis:`);
  console.log(`📥 Raw input length: ${realWorldTest.rawInput.length} characters`);
  console.log(`📤 Formatted output length: ${realWorldTest.actualFormattedOutput.length} characters`);
  
  // Check for specific truncation patterns
  const truncationIssues = [];
  
  // Check Harry Durusso truncation
  if (realWorldTest.actualFormattedOutput.includes('docteur Durusso') && 
      !realWorldTest.actualFormattedOutput.includes('docteur Harry Durusso')) {
    truncationIssues.push('Dr. Harry Durusso → Dr. Durusso (first name removed)');
  }
  
  // Check Roxanne Bouchard-Bellavance truncation
  if (realWorldTest.actualFormattedOutput.includes('docteur Bouchard-Bellavance') && 
      !realWorldTest.actualFormattedOutput.includes('docteur Roxanne Bouchard-Bellavance')) {
    truncationIssues.push('Dr. Roxanne Bouchard-Bellavance → Dr. Bouchard-Bellavance (first name removed)');
  }
  
  if (truncationIssues.length > 0) {
    console.log(`\n🚨 TRUNCATION ISSUES FOUND:`);
    truncationIssues.forEach(issue => {
      console.log(`❌ ${issue}`);
    });
  } else {
    console.log(`\n✅ No truncation issues found`);
  }
  
  return {
    truncationIssues,
    totalIssues: truncationIssues.length
  };
}

// Test with actual AI formatter (if available)
async function testWithActualAIFormatter() {
  console.log(`\n🤖 Testing with Actual AI Formatter`);
  console.log("=" .repeat(50));
  
  try {
    // Import the actual Section7AIFormatter
    const { Section7AIFormatter } = await import('./src/services/formatter/section7AI.js');
    console.log("✅ Successfully imported Section7AIFormatter");
    
    console.log("📥 Running real-world test case...");
    const startTime = Date.now();
    
    const result = await Section7AIFormatter.formatSection7Content(
      realWorldTest.rawInput,
      'fr'
    );
    
    const processingTime = Date.now() - startTime;
    console.log(`⏱️  Processing time: ${processingTime}ms`);
    
    // Analyze the AI formatter result
    console.log(`\n🔍 AI Formatter Result Analysis:`);
    
    const aiTruncationIssues = [];
    
    // Check Harry Durusso
    if (result.formatted.includes('docteur Durusso') && 
        !result.formatted.includes('docteur Harry Durusso')) {
      aiTruncationIssues.push('AI: Dr. Harry Durusso → Dr. Durusso (first name removed)');
    }
    
    // Check Roxanne Bouchard-Bellavance
    if (result.formatted.includes('docteur Bouchard-Bellavance') && 
        !result.formatted.includes('docteur Roxanne Bouchard-Bellavance')) {
      aiTruncationIssues.push('AI: Dr. Roxanne Bouchard-Bellavance → Dr. Bouchard-Bellavance (first name removed)');
    }
    
    if (aiTruncationIssues.length > 0) {
      console.log(`\n🚨 AI FORMATTER TRUNCATION ISSUES:`);
      aiTruncationIssues.forEach(issue => {
        console.log(`❌ ${issue}`);
      });
    } else {
      console.log(`\n✅ AI Formatter preserved all doctor names correctly`);
    }
    
    // Show output preview
    console.log(`\n📤 AI Formatter Output Preview:`);
    console.log(result.formatted.substring(0, 500) + "...");
    
    if (result.issues && result.issues.length > 0) {
      console.log(`\n⚠️  AI Formatter Issues:`, result.issues);
    }
    
    if (result.suggestions && result.suggestions.length > 0) {
      console.log(`\n💡 AI Formatter Suggestions:`, result.suggestions);
    }
    
    return {
      success: aiTruncationIssues.length === 0,
      truncationIssues: aiTruncationIssues,
      processingTime,
      outputLength: result.formatted.length
    };
    
  } catch (error) {
    console.log(`💥 Failed to test with AI formatter: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

// Main test runner
async function main() {
  console.log("🚀 Doctor Name Truncation Test Suite");
  console.log("=" .repeat(70));
  
  // Analyze the known issue
  const analysis = analyzeDoctorNameTruncation();
  
  // Test with actual AI formatter
  const aiTest = await testWithActualAIFormatter();
  
  // Final summary
  console.log(`\n📊 Final Test Results:`);
  console.log(`🔍 Known Issue Analysis: ${analysis.totalIssues} truncation issues found`);
  console.log(`🤖 AI Formatter Test: ${aiTest.success ? 'PASSED' : 'FAILED'}`);
  
  if (aiTest.truncationIssues && aiTest.truncationIssues.length > 0) {
    console.log(`❌ AI Formatter has ${aiTest.truncationIssues.length} truncation issues`);
  }
  
  console.log(`\n✨ Test completed!`);
}

// Run the test
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  analyzeDoctorNameTruncation,
  testWithActualAIFormatter,
  realWorldTest
};
