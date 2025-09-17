#!/usr/bin/env node

/**
 * Test the doctor name preservation fix in the original formatter
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

import { Section7AIFormatter } from './dist/src/services/formatter/section7AI.js';

console.log('🧪 Doctor Name Preservation Fix Test');
console.log('=' .repeat(45));

// Check if API key is loaded
const apiKey = process.env.OPENAI_API_KEY;
console.log('🔑 API Key Status:', apiKey ? '✅ Loaded' : '❌ Missing');
if (apiKey) {
  console.log('🔑 API Key Preview:', apiKey.substring(0, 8) + '...');
}

// Test with the exact input that was causing issues
const testInput = `La fiche de réclamation du travailleur décrit l'événement suivant. Survenu le 7 octobre 2023, deux points. Ouvrir la parenthèse, guillemets. Je versais la chaudière d'eau. Ressenti de douleur côté gauche, bas du dos. Ensuite, j'ai poussé le chariot direction l'ascenseur. La roue devant du chariot reste prise dans la craque de l'ascenseur. Ressenti, point. Pression côté gauche au moment et quand j'ai retiré le chariot, sensation de chaud dans le bas du dos. J'ai été avertir le superviseur que j'avais de douleur. J'ai pris pilule, Advil. J'ai continué de travailler et plus les heures passaient, plus la pression côté gauche respirait. Ça me faisait mal quand j'ai respiré. Le lendemain, j'ai rentré, mais j'ai pas effectué le travail. J'ai supervisé une autre employée pour qu'elle le fasse pour moi debout ou assis. C'était difficile la journée pour moi. Fermez guillemets, fermez la parenthèse. La travailleuse consulte le docteur Harry Durusso, 9 octobre 2023. Il diagnostique un entorse lombaire. Il prescrit un arrêt de travail, des antidouleurs et des traitements en physiothérapie. La travailleuse revoit le docteur Harry Durusso, 6 novembre 2023. Il maintient le diagnostic d'entorse lombaire, l'arrêt de travail et les traitements en physiothérapie. La travailleuse revoit le docteur Harry Durusso, 19 décembre 2023. Il juge la condition clinique stable. Il maintient les traitements en physiothérapie et l'arrêt de travail. La travailleuse revoit le docteur Harry Durusso, 30 janvier 2024. Il maintient les traitements en physiothérapie et l'arrêt de travail. La travailleuse revoit le docteur Harry Durusso, 12 mars 2024. Il juge la condition clinique stable. Il maintient les traitements en physiothérapie et l'arrêt de travail. La travailleuse obtient une résonance magnétique de la colonne lombaire, le 23 mars 2024. Elle est interprétée par le docteur Roxanne Bouchard-Bellavance, radiologiste. Cette dernière constate. Ouvrez la parenthèse. Guillemets. Trois petits points. Conclusion, deux points. Changement dégénératif, tel qu'il est caractérisé, avec discopathie prédominant en L5 S1. Sténose biforaminale, modérée à sévère à gauche et minime à droite. Pas de sténose punale centrale significative. À la ligne légère déformation cuniforme de T12, d'allure non récente, à corrélé à l'historique traumatique. Point. À la ligne nodularité surrénalienne gauche et formation d'apparence cystique rénale droite. Partiellement incluse, virgule. Probablement bénigne, virgule. Mais pour lequel une tomodensitométrie avec protocole dédié et par prudence recommandée, étant donné leur inclusion partielle et l'absence d'études comparatives. Point. Fermez les guillemets. Fermez la parenthèse. Travailleuse revoit le docteur Durousseau le 16 avril 2024. Il maintient le diagnostic d'entosse lombaire et juge la condition clinique stable. Il prescrit des traitements en physiothérapie, virgule ergothérapie, et demande un développement des capacités fonctionnelles et maintient l'arrêt de travail. Il prescrit des infiltrations au niveau du rachis lombaire.`;

console.log('📥 Input (truncated for display):');
console.log(testInput.substring(0, 200) + '...');

console.log('\n🔍 Expected Doctor Names in Input:');
const doctorNames = testInput.match(/(docteur|dr\.?)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z-]+)*)/gi) || [];
doctorNames.forEach((name, index) => {
  console.log(`${index + 1}. ${name}`);
});

console.log('\n🔄 Processing with Section 7 AI Formatter...');

try {
  const result = await Section7AIFormatter.formatSection7Content(testInput, 'fr');
  
  console.log('\n📤 Output:');
  console.log(result.formatted);
  
  console.log('\n🔍 Doctor Names in Output:');
  const outputDoctorNames = result.formatted.match(/(docteur|dr\.?)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z-]+)*)/gi) || [];
  outputDoctorNames.forEach((name, index) => {
    console.log(`${index + 1}. ${name}`);
  });
  
  console.log('\n📊 Name Preservation Analysis:');
  
  // Check for specific names
  const hasHarryDurusso = result.formatted.includes('docteur Harry Durusso');
  const hasRoxanneBouchard = result.formatted.includes('docteur Roxanne Bouchard-Bellavance');
  const hasDurousseau = result.formatted.includes('docteur Durousseau');
  
  console.log('✅ Harry Durusso preserved:', hasHarryDurusso);
  console.log('✅ Roxanne Bouchard-Bellavance preserved:', hasRoxanneBouchard);
  console.log('✅ Durousseau preserved:', hasDurousseau);
  
  // Check for truncated versions
  const hasTruncatedHarry = result.formatted.includes('docteur Harry') && !hasHarryDurusso;
  const hasTruncatedRoxanne = result.formatted.includes('docteur Roxanne') && !hasRoxanneBouchard;
  
  console.log('❌ Truncated Harry found:', hasTruncatedHarry);
  console.log('❌ Truncated Roxanne found:', hasTruncatedRoxanne);
  
  if (hasHarryDurusso && hasRoxanneBouchard && hasDurousseau && !hasTruncatedHarry && !hasTruncatedRoxanne) {
    console.log('\n🎉 SUCCESS: All doctor names are fully preserved!');
  } else {
    console.log('\n❌ FAILURE: Some doctor names are still truncated!');
  }
  
  console.log('\n📋 Additional Info:');
  console.log('Issues:', result.issues || []);
  console.log('Suggestions:', result.suggestions || []);
  
} catch (error) {
  console.log('❌ Test failed:', error.message);
}

console.log('\n✨ Test completed!');
