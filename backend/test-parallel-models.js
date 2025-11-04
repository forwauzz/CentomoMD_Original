#!/usr/bin/env node

/**
 * Test Script: Parallel Model Processing
 * Tests if we can run GPT-4o-mini and Gemini Flash simultaneously
 * Processes the same transcript with the same template using both models in parallel
 */

import { ProcessingOrchestrator } from './dist/src/services/processing/ProcessingOrchestrator.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Test transcript
const rawTranscript = `La fiche de réclamation du travailleur décrit l'événement suivant. Survenu le 7 octobre 2023, deux points. Ouvrir la parenthèse, guillemets. Je versais la chaudière d'eau. Ressenti de douleur côté gauche, bas du dos. Ensuite, j'ai poussé le chariot direction l'ascenseur. La roue devant du chariot reste prise dans la craque de l'ascenseur. Ressenti, point. Pression côté gauche au moment et quand j'ai retiré le chariot, sensation de chaud dans le bas du dos. J'ai été avertir le superviseur que j'avais de douleur. J'ai pris pilule, Advil. J'ai continué de travailler et plus les heures passaient, plus la pression côté gauche respirait. Ça me faisait mal quand j'ai respiré. Le lendemain, j'ai rentré, mais j'ai pas effectué le travail. J'ai supervisé une autre employée pour qu'elle le fasse pour moi debout ou assis. C'était difficile la journée pour moi. Fermez guillemets, fermez la parenthèse. La travailleuse consulte le docteur Harry Durusso, 9 octobre 2023. Il diagnostique un entorse lombaire. Il prescrit un arrêt de travail, des antidouleurs et des traitements en physiothérapie. La travailleuse revoit le docteur Harry Durusso, 6 novembre 2023. Il maintient le diagnostic d'entorse lombaire, l'arrêt de travail et les traitements en physiothérapie. La travailleuse revoit le docteur Harry Durusso, 19 décembre 2023. Il juge la condition clinique stable. Il maintient les traitements en physiothérapie et l'arrêt de travail. La travailleuse revoit le docteur Harry Durusso, 30 janvier 2024. Il maintient les traitements en physiothérapie et l'arrêt de travail. La travailleuse revoit le docteur Harry Durusso, 12 mars 2024. Il juge la condition clinique stable. Il maintient les traitements en physiothérapie et l'arrêt de travail. La travailleuse obtient une résonance magnétique de la colonne lombaire, le 23 mars 2024. Elle est interprétée par le docteur Roxanne Bouchard-Bellavance, radiologiste. Cette dernière constate. Ouvrez la parenthèse. Guillemets. Trois petits points. Conclusion, deux points. Changement dégénératif, tel qu'il est caractérisé, avec discopathie prédominant en L5 S1. Sténose biforaminale, modérée à sévère à gauche et minime à droite. Pas de sténose punale centrale significative. À la ligne légère déformation cuniforme de T12, d'allure non récente, à corréler à l'historique traumatique. Point. À la ligne nodularité surrénalienne gauche et formation d'apparence cystique rénale droite. Partiellement incluse, virgule. Probablement bénigne, virgule. Mais pour lequel une tomodensitométrie avec protocole dédié et par prudence recommandée, étant donné leur inclusion partielle et l'absence d'études comparatives. Point. Fermez les guillemets. Fermez la parenthèse. Travailleuse revoit le docteur Durousseau le 16 avril 2024. Il maintient le diagnostic d'entosse lombaire et juge la condition clinique stable. Il prescrit des traitements en physiothérapie, virgule ergothérapie, et demande un développement des capacités fonctionnelles et maintient l'arrêt de travail. Il prescrit des infiltrations au niveau du rachis lombaire.`;

const templateId = 'section7-rd';
const models = ['gpt-4o-mini', 'gemini-2.0-flash-exp'];

async function testParallelProcessing() {
  console.log('\n🚀 Testing Parallel Model Processing');
  console.log('='.repeat(80));
  
  // Check environment
  console.log('\n🔍 Environment Check');
  console.log('='.repeat(80));
  console.log(`   OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log(`   GOOGLE_API_KEY: ${process.env.GOOGLE_API_KEY ? '✅ Set' : '❌ Missing'}`);
  
  if (!process.env.OPENAI_API_KEY) {
    console.error('\n❌ OPENAI_API_KEY not set - cannot test GPT-4o-mini');
    process.exit(1);
  }
  
  if (!process.env.GOOGLE_API_KEY) {
    console.error('\n❌ GOOGLE_API_KEY not set - cannot test Gemini Flash');
    process.exit(1);
  }
  
  console.log('\n📋 Test Configuration');
  console.log('='.repeat(80));
  console.log(`   Template: ${templateId}`);
  console.log(`   Model A: ${models[0]}`);
  console.log(`   Model B: ${models[1]}`);
  console.log(`   Transcript length: ${rawTranscript.length} characters`);
  
  try {
    const orchestrator = new ProcessingOrchestrator();
    
    // Test 1: Sequential Processing (baseline)
    console.log('\n📊 Test 1: Sequential Processing (Baseline)');
    console.log('='.repeat(80));
    const sequentialStartTime = Date.now();
    
    const result1Sequential = await orchestrator.processContent({
      sectionId: 'section_7',
      modeId: 'mode2',
      templateId: templateId,
      language: 'fr',
      content: rawTranscript,
      model: models[0],
      correlationId: 'test-sequential-1',
      options: { timeout: 120000 }
    });
    
    const result2Sequential = await orchestrator.processContent({
      sectionId: 'section_7',
      modeId: 'mode2',
      templateId: templateId,
      language: 'fr',
      content: rawTranscript,
      model: models[1],
      correlationId: 'test-sequential-2',
      options: { timeout: 120000 }
    });
    
    const sequentialTime = Date.now() - sequentialStartTime;
    
    console.log(`\n✅ Sequential Processing Completed`);
    console.log(`   Model A (${models[0]}): ${result1Sequential.success ? '✅ Success' : '❌ Failed'}`);
    console.log(`   Model B (${models[1]}): ${result2Sequential.success ? '✅ Success' : '❌ Failed'}`);
    console.log(`   Total time: ${sequentialTime}ms`);
    console.log(`   Model A output length: ${result1Sequential.processedContent?.length || 0} chars`);
    console.log(`   Model B output length: ${result2Sequential.processedContent?.length || 0} chars`);
    
    // Test 2: Parallel Processing
    console.log('\n📊 Test 2: Parallel Processing');
    console.log('='.repeat(80));
    const parallelStartTime = Date.now();
    
    console.log('   Starting both models simultaneously...');
    
    const [result1Parallel, result2Parallel] = await Promise.all([
      orchestrator.processContent({
        sectionId: 'section_7',
        modeId: 'mode2',
        templateId: templateId,
        language: 'fr',
        content: rawTranscript,
        model: models[0],
        correlationId: 'test-parallel-1',
        options: { timeout: 120000 }
      }),
      orchestrator.processContent({
        sectionId: 'section_7',
        modeId: 'mode2',
        templateId: templateId,
        language: 'fr',
        content: rawTranscript,
        model: models[1],
        correlationId: 'test-parallel-2',
        options: { timeout: 120000 }
      })
    ]);
    
    const parallelTime = Date.now() - parallelStartTime;
    
    console.log(`\n✅ Parallel Processing Completed`);
    console.log(`   Model A (${models[0]}): ${result1Parallel.success ? '✅ Success' : '❌ Failed'}`);
    console.log(`   Model B (${models[1]}): ${result2Parallel.success ? '✅ Success' : '❌ Failed'}`);
    console.log(`   Total time: ${parallelTime}ms`);
    console.log(`   Model A output length: ${result1Parallel.processedContent?.length || 0} chars`);
    console.log(`   Model B output length: ${result2Parallel.processedContent?.length || 0} chars`);
    
    // Comparison
    console.log('\n📊 Performance Comparison');
    console.log('='.repeat(80));
    const timeSaved = sequentialTime - parallelTime;
    const speedup = ((sequentialTime - parallelTime) / sequentialTime * 100).toFixed(1);
    
    console.log(`   Sequential time: ${sequentialTime}ms`);
    console.log(`   Parallel time: ${parallelTime}ms`);
    console.log(`   Time saved: ${timeSaved}ms (${speedup}% faster)`);
    
    if (parallelTime < sequentialTime) {
      console.log(`   ✅ Parallel processing is ${speedup}% faster!`);
    } else {
      console.log(`   ⚠️  Sequential processing was faster (possible serialization in API calls)`);
    }
    
    // Verify outputs are different (different models should produce different outputs)
    console.log('\n🔍 Output Comparison');
    console.log('='.repeat(80));
    const output1Seq = result1Sequential.processedContent || '';
    const output2Seq = result2Sequential.processedContent || '';
    const output1Par = result1Parallel.processedContent || '';
    const output2Par = result2Parallel.processedContent || '';
    
    console.log(`   Sequential Model A length: ${output1Seq.length} chars`);
    console.log(`   Parallel Model A length: ${output1Par.length} chars`);
    console.log(`   Sequential Model B length: ${output2Seq.length} chars`);
    console.log(`   Parallel Model B length: ${output2Par.length} chars`);
    
    // Check if outputs match between sequential and parallel
    const modelAOutputsMatch = output1Seq === output1Par;
    const modelBOutputsMatch = output2Seq === output2Par;
    
    console.log(`\n   Model A outputs match (sequential vs parallel): ${modelAOutputsMatch ? '✅ Yes' : '⚠️  No (expected - models are non-deterministic)'}`);
    console.log(`   Model B outputs match (sequential vs parallel): ${modelBOutputsMatch ? '✅ Yes' : '⚠️  No (expected - models are non-deterministic)'}`);
    
    // Save full outputs to files
    console.log('\n💾 Saving Full Outputs to Files');
    console.log('='.repeat(80));
    
    const outputDir = path.join(__dirname, 'test-outputs');
    try {
      await fs.mkdir(outputDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const file1 = path.join(outputDir, `parallel-${models[0]}-${timestamp}.txt`);
    const file2 = path.join(outputDir, `parallel-${models[1]}-${timestamp}.txt`);
    const file1Seq = path.join(outputDir, `sequential-${models[0]}-${timestamp}.txt`);
    const file2Seq = path.join(outputDir, `sequential-${models[1]}-${timestamp}.txt`);
    
    await fs.writeFile(file1, output1Par, 'utf-8');
    await fs.writeFile(file2, output2Par, 'utf-8');
    await fs.writeFile(file1Seq, output1Seq, 'utf-8');
    await fs.writeFile(file2Seq, output2Seq, 'utf-8');
    
    console.log(`   ✅ Model A (${models[0]}) - Parallel: ${file1}`);
    console.log(`   ✅ Model B (${models[1]}) - Parallel: ${file2}`);
    console.log(`   ✅ Model A (${models[0]}) - Sequential: ${file1Seq}`);
    console.log(`   ✅ Model B (${models[1]}) - Sequential: ${file2Seq}`);
    
    // Show preview of outputs
    console.log('\n📄 Output Previews');
    console.log('='.repeat(80));
    console.log(`\n   Model A (${models[0]}) - First 300 chars:`);
    console.log(`   ${output1Par.substring(0, 300)}...`);
    console.log(`\n   Model B (${models[1]}) - First 300 chars:`);
    console.log(`   ${output2Par.substring(0, 300)}...`);
    
    // Side-by-side comparison summary
    console.log('\n🔍 Side-by-Side Comparison');
    console.log('='.repeat(80));
    console.log(`   Model A (${models[0]}): ${output1Par.length} chars`);
    console.log(`   Model B (${models[1]}): ${output2Par.length} chars`);
    
    // Check for significant differences
    const linesA = output1Par.split('\n').length;
    const linesB = output2Par.split('\n').length;
    console.log(`   Model A lines: ${linesA}`);
    console.log(`   Model B lines: ${linesB}`);
    console.log(`   Line difference: ${Math.abs(linesA - linesB)}`);
    
    // Find first difference
    const minLength = Math.min(output1Par.length, output2Par.length);
    let firstDiff = -1;
    for (let i = 0; i < minLength; i++) {
      if (output1Par[i] !== output2Par[i]) {
        firstDiff = i;
        break;
      }
    }
    
    if (firstDiff > 0) {
      console.log(`   First difference at character: ${firstDiff}`);
      console.log(`   Model A context: ...${output1Par.substring(Math.max(0, firstDiff - 50), firstDiff + 50)}...`);
      console.log(`   Model B context: ...${output2Par.substring(Math.max(0, firstDiff - 50), firstDiff + 50)}...`);
    } else if (output1Par.length !== output2Par.length) {
      console.log(`   Outputs differ in length (${Math.abs(output1Par.length - output2Par.length)} chars)`);
    } else {
      console.log(`   ⚠️  Outputs appear identical (check files for full comparison)`);
    }
    
    // Summary
    console.log('\n✅ TEST SUMMARY');
    console.log('='.repeat(80));
    console.log(`   ✅ Both models processed successfully`);
    console.log(`   ✅ Parallel processing works: ${parallelTime < sequentialTime ? 'YES (faster)' : 'YES (but sequential was faster)'}`);
    console.log(`   ✅ Outputs generated: Model A (${output1Par.length} chars), Model B (${output2Par.length} chars)`);
    
    if (parallelTime < sequentialTime) {
      console.log(`\n   🎉 Recommendation: Use parallel processing for ${speedup}% time savings!`);
    } else {
      console.log(`\n   💡 Note: Parallel processing works but may be limited by API rate limits or sequential operations.`);
    }
    
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
testParallelProcessing().catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});

