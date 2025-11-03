#!/usr/bin/env node

/**
 * Test Script: Section 7 R&D Template with Gemini Model
 * Tests the section7-rd template processing with the Gemini API
 */

import { ProcessingOrchestrator } from './dist/src/services/processing/ProcessingOrchestrator.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Raw transcript provided by user
const rawTranscript = `La fiche de réclamation du travailleur décrit l'événement suivant. Survenu le 7 octobre 2023, deux points. Ouvrir la parenthèse, guillemets. Je versais la chaudière d'eau. Ressenti de douleur côté gauche, bas du dos. Ensuite, j'ai poussé le chariot direction l'ascenseur. La roue devant du chariot reste prise dans la craque de l'ascenseur. Ressenti, point. Pression côté gauche au moment et quand j'ai retiré le chariot, sensation de chaud dans le bas du dos. J'ai été avertir le superviseur que j'avais de douleur. J'ai pris pilule, Advil. J'ai continué de travailler et plus les heures passaient, plus la pression côté gauche respirait. Ça me faisait mal quand j'ai respiré. Le lendemain, j'ai rentré, mais j'ai pas effectué le travail. J'ai supervisé une autre employée pour qu'elle le fasse pour moi debout ou assis. C'était difficile la journée pour moi. Fermez guillemets, fermez la parenthèse. La travailleuse consulte le docteur Harry Durusso, 9 octobre 2023. Il diagnostique un entorse lombaire. Il prescrit un arrêt de travail, des antidouleurs et des traitements en physiothérapie. La travailleuse revoit le docteur Harry Durusso, 6 novembre 2023. Il maintient le diagnostic d'entorse lombaire, l'arrêt de travail et les traitements en physiothérapie. La travailleuse revoit le docteur Harry Durusso, 19 décembre 2023. Il juge la condition clinique stable. Il maintient les traitements en physiothérapie et l'arrêt de travail. La travailleuse revoit le docteur Harry Durusso, 30 janvier 2024. Il maintient les traitements en physiothérapie et l'arrêt de travail. La travailleuse revoit le docteur Harry Durusso, 12 mars 2024. Il juge la condition clinique stable. Il maintient les traitements en physiothérapie et l'arrêt de travail. La travailleuse obtient une résonance magnétique de la colonne lombaire, le 23 mars 2024. Elle est interprétée par le docteur Roxanne Bouchard-Bellavance, radiologiste. Cette dernière constate. Ouvrez la parenthèse. Guillemets. Trois petits points. Conclusion, deux points. Changement dégénératif, tel qu'il est caractérisé, avec discopathie prédominant en L5 S1. Sténose biforaminale, modérée à sévère à gauche et minime à droite. Pas de sténose punale centrale significative. À la ligne légère déformation cuniforme de T12, d'allure non récente, à corréler à l'historique traumatique. Point. À la ligne nodularité surrénalienne gauche et formation d'apparence cystique rénale droite. Partiellement incluse, virgule. Probablement bénigne, virgule. Mais pour lequel une tomodensitométrie avec protocole dédié et par prudence recommandée, étant donné leur inclusion partielle et l'absence d'études comparatives. Point. Fermez les guillemets. Fermez la parenthèse. Travailleuse revoit le docteur Durousseau le 16 avril 2024. Il maintient le diagnostic d'entosse lombaire et juge la condition clinique stable. Il prescrit des traitements en physiothérapie, virgule ergothérapie, et demande un développement des capacités fonctionnelles et maintient l'arrêt de travail. Il prescrit des infiltrations au niveau du rachis lombaire.`;

async function testSection7RdWithGemini() {
  console.log('\n🚀 Testing Section 7 R&D Template with Gemini Model');
  console.log('='.repeat(80));
  
  // Check environment
  if (!process.env.GOOGLE_API_KEY) {
    console.error('❌ GOOGLE_API_KEY not set');
    process.exit(1);
  }
  
  console.log('✅ Environment check passed');
  console.log(`📝 Template: section7-rd (Section 7 - R&D Pipeline)`);
  console.log(`🤖 Model: gemini-2.0-flash-exp`);
  console.log(`📊 Transcript length: ${rawTranscript.length} characters\n`);
  
  try {
    // Create orchestrator
    const orchestrator = new ProcessingOrchestrator();
    
    console.log('🔄 Processing request...\n');
    const startTime = Date.now();
    
    // Process with Section 7 R&D template and Gemini model
    const result = await orchestrator.processContent({
      sectionId: 'section_7',
      modeId: 'mode2', // Smart dictation mode (AI formatting enabled)
      templateId: 'section7-rd',
      language: 'fr',
      content: rawTranscript,
      model: 'gemini-2.0-flash-exp', // Use Gemini model
      correlationId: 'test-section7-rd-gemini',
      options: {
        timeout: 120000, // 2 minutes timeout
        retryAttempts: 2
      }
    });
    
    const processingTime = Date.now() - startTime;
    
    if (!result.success) {
      console.error('❌ Processing failed!');
      console.error('Errors:', result.metadata.errors);
      console.error('Warnings:', result.metadata.warnings);
      process.exit(1);
    }
    
    console.log('✅ Processing completed successfully!\n');
    console.log('='.repeat(80));
    console.log('📊 PROCESSING METADATA');
    console.log('='.repeat(80));
    console.log(`⏱️  Processing time: ${processingTime}ms`);
    console.log(`📝 Section: ${result.metadata.sectionId}`);
    console.log(`🔄 Mode: ${result.metadata.modeId}`);
    console.log(`📋 Template: ${result.metadata.templateId}`);
    console.log(`🌐 Language: ${result.metadata.language}`);
    
    if (result.operational) {
      console.log(`\n💰 Operational Metrics:`);
      console.log(`   Model: ${result.operational.model || 'N/A'}`);
      console.log(`   Tokens in: ${result.operational.tokensIn || 'N/A'}`);
      console.log(`   Tokens out: ${result.operational.tokensOut || 'N/A'}`);
      console.log(`   Cost: $${result.operational.costUsd?.toFixed(6) || 'N/A'}`);
      console.log(`   Latency: ${result.operational.latencyMs || 'N/A'}ms`);
    }
    
    if (result.metadata.warnings.length > 0) {
      console.log(`\n⚠️  Warnings (${result.metadata.warnings.length}):`);
      result.metadata.warnings.forEach(w => console.log(`   - ${w}`));
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('📄 FORMATTED OUTPUT');
    console.log('='.repeat(80));
    console.log(result.processedContent);
    console.log('\n' + '='.repeat(80));
    
    // Basic quality checks
    console.log('✅ QUALITY CHECKS');
    console.log('='.repeat(80));
    
    const output = result.processedContent;
    const checks = {
      hasHeader: output.includes('Historique') || output.includes('HISTORIQUE'),
      hasWorkerPrefix: output.includes('La travailleuse') || output.includes('Le travailleur'),
      hasDates: /\d{1,2}\s+(octobre|novembre|décembre|janvier|mars|avril)\s+\d{4}/i.test(output),
      hasMedicalTerms: output.includes('physiothérapie') || output.includes('ergothérapie'),
      hasDoctorName: output.includes('Durusso') || output.includes('Durusso'),
      hasProperFormatting: output.includes('\n\n') || output.includes('\n'),
      lengthReasonable: output.length > rawTranscript.length * 0.5 && output.length < rawTranscript.length * 3
    };
    
    const passedChecks = Object.values(checks).filter(v => v).length;
    const totalChecks = Object.keys(checks).length;
    
    Object.entries(checks).forEach(([check, passed]) => {
      console.log(`   ${passed ? '✅' : '❌'} ${check.replace(/([A-Z])/g, ' $1').trim()}`);
    });
    
    console.log(`\n📊 Quality score: ${passedChecks}/${totalChecks} checks passed`);
    
    if (passedChecks === totalChecks) {
      console.log('\n🎉 All quality checks passed!');
    } else {
      console.log('\n⚠️  Some quality checks failed. Review the output above.');
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ TEST COMPLETE');
    console.log('='.repeat(80));
    
  } catch (error) {
    console.error('\n❌ Test failed with error:');
    console.error(error);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run test
testSection7RdWithGemini().catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});

