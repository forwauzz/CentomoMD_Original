#!/usr/bin/env node

/**
 * Benchmark Comparison Test: GPT-4o-mini vs Gemini Flash
 * Compares both models against MD final version (gold standard)
 * Uses the /api/benchmark endpoint for quantitative metrics
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Original raw transcript (from test-parallel-models.js)
const rawTranscript = `La fiche de réclamation du travailleur décrit l'événement suivant. Survenu le 7 octobre 2023, deux points. Ouvrir la parenthèse, guillemets. Je versais la chaudière d'eau. Ressenti de douleur côté gauche, bas du dos. Ensuite, j'ai poussé le chariot direction l'ascenseur. La roue devant du chariot reste prise dans la craque de l'ascenseur. Ressenti, point. Pression côté gauche au moment et quand j'ai retiré le chariot, sensation de chaud dans le bas du dos. J'ai été avertir le superviseur que j'avais de douleur. J'ai pris pilule, Advil. J'ai continué de travailler et plus les heures passaient, plus la pression côté gauche respirait. Ça me faisait mal quand j'ai respiré. Le lendemain, j'ai rentré, mais j'ai pas effectué le travail. J'ai supervisé une autre employée pour qu'elle le fasse pour moi debout ou assis. C'était difficile la journée pour moi. Fermez guillemets, fermez la parenthèse. La travailleuse consulte le docteur Harry Durusso, 9 octobre 2023. Il diagnostique un entorse lombaire. Il prescrit un arrêt de travail, des antidouleurs et des traitements en physiothérapie. La travailleuse revoit le docteur Harry Durusso, 6 novembre 2023. Il maintient le diagnostic d'entorse lombaire, l'arrêt de travail et les traitements en physiothérapie. La travailleuse revoit le docteur Harry Durusso, 19 décembre 2023. Il juge la condition clinique stable. Il maintient les traitements en physiothérapie et l'arrêt de travail. La travailleuse revoit le docteur Harry Durusso, 30 janvier 2024. Il maintient les traitements en physiothérapie et l'arrêt de travail. La travailleuse revoit le docteur Harry Durusso, 12 mars 2024. Il juge la condition clinique stable. Il maintient les traitements en physiothérapie et l'arrêt de travail. La travailleuse obtient une résonance magnétique de la colonne lombaire, le 23 mars 2024. Elle est interprétée par le docteur Roxanne Bouchard-Bellavance, radiologiste. Cette dernière constate. Ouvrez la parenthèse. Guillemets. Trois petits points. Conclusion, deux points. Changement dégénératif, tel qu'il est caractérisé, avec discopathie prédominant en L5 S1. Sténose biforaminale, modérée à sévère à gauche et minime à droite. Pas de sténose punale centrale significative. À la ligne légère déformation cuniforme de T12, d'allure non récente, à corréler à l'historique traumatique. Point. À la ligne nodularité surrénalienne gauche et formation d'apparence cystique rénale droite. Partiellement incluse, virgule. Probablement bénigne, virgule. Mais pour lequel une tomodensitométrie avec protocole dédié et par prudence recommandée, étant donné leur inclusion partielle et l'absence d'études comparatives. Point. Fermez les guillemets. Fermez la parenthèse. Travailleuse revoit le docteur Durousseau le 16 avril 2024. Il maintient le diagnostic d'entosse lombaire et juge la condition clinique stable. Il prescrit des traitements en physiothérapie, virgule ergothérapie, et demande un développement des capacités fonctionnelles et maintient l'arrêt de travail. Il prescrit des infiltrations au niveau du rachis lombaire.`;

// MD Final Version (Gold Standard/Reference)
const mdFinalVersion = `La fiche de réclamation de la travailleuse décrit l'événement suivant survenu le 7 octobre 2023 :

« Je versais la chaudière eau resenti douleur côté gauche bas du dos. en suite j'ai pouse le chariot direrection ascenseur la roue devant du chariot reste prit dans la crack de l'ascenseur ressenti. Pression côté gauche au moment et quand j'ai retirer le chariot, sensation de chaud dans le bas du dos j'ai été avertir le superviseur que j'avais douleur j'ai pris pullule adevil j'ai continuer de travaillée et plus les heure pasais plus la pression côté gauche respirais ça me fesais mal quand j respirai le lendemain j'ai rentrer mais j'ai pas effectuer le travaille j'ai superviser une autre employée pour quel le fasse pour moi debout ou assis s'était difficile la journée pour moi. »

La travailleuse consulte le docteur Harry Duroseau, le 9 octobre 2023. Il diagnostique une entorse lombaire. Il prescrit un arrêt de travail, des antidouleurs et des traitements en physiothérapie.

La travailleuse revoit le docteur Harry Duroseau, le 6 novembre 2023. Il maintient le diagnostic d'entorse lombaire, l'arrêt de travail et les traitements en physiothérapie.

La travailleuse revoit le docteur Harry Duroseau, le 19 décembre 2023. Il juge la condition clinique stable. Il maintient les traitements en physiothérapie et l'arrêt de travail.

La travailleuse revoit le docteur Harry Duroseau, le 30 janvier 2024. Il maintient les traitements en physiothérapie et l'arrêt de travail.

La travailleuse revoit le docteur Harry Duroseau, le 12 mars 2024. Il juge la condition clinique stable. Il maintient les traitements en physiothérapie et l'arrêt de travail.

La travailleuse obtient une résonance magnétique de la colonne lombaire, le 23 mars 2024. Elle est interprétée par le docteur Roxanne Bouchard-Bellavance, radiologiste. Cette dernière constate :

« ... 

Conclusion : 

Changement dégénératif, tels que caractérisés, avec discopathie prédominant en L5-S1. Sténoses bi-foraminales, modérée à sévère à gauche et minime à droite. Pas de sténose spinale centrale significative. 

Légère déformation cunéiforme de T12, d'allure non récente, à corrélé à l'historique traumatique. 

Nodularité surrénalienne gauche et formation d'apparence kystique rénale droite partiellement incluses, probablement bénignes, mais pour lesquelles une tomodensitométrie avec protocole dédié est par prudence recommandé étant donné leur inclusion partielle et l'absence d'étude comparative. »

La travailleuse revoit le docteur Duroseau, le 16 avril 2024. Il maintient le diagnostic d'entorse lombaire et juge la condition clinique stable. Il prescrit des traitements en physiothérapie, ergothérapie et demande une évaluation et développement des capacités fonctionnelles. Il maintient l'arrêt de travail. Il prescrit des infiltrations au niveau du rachis lombaire.`;

const templateId = 'section7-rd';
const models = ['gpt-4o-mini', 'gemini-2.0-flash-exp'];
const baseUrl = process.env.API_BASE_URL || process.env.API_URL || 'http://localhost:3001';

async function runBenchmarkComparison() {
  console.log('\n🏆 Benchmark Comparison: GPT-4o-mini vs Gemini Flash');
  console.log('='.repeat(80));
  
  // Check environment
  console.log('\n🔍 Environment Check');
  console.log('='.repeat(80));
  console.log(`   API URL: ${baseUrl}`);
  console.log(`   Template: ${templateId}`);
  console.log(`   Model A: ${models[0]}`);
  console.log(`   Model B: ${models[1]}`);
  console.log(`   Raw transcript length: ${rawTranscript.length} chars`);
  console.log(`   Reference (MD Final) length: ${mdFinalVersion.length} chars`);
  
  try {
    // Prepare combinations (2 models, same template)
    const combinations = [
      {
        name: `${models[0]} + ${templateId}`,
        model: models[0],
        templateId: templateId,
        templateRef: templateId,
      },
      {
        name: `${models[1]} + ${templateId}`,
        model: models[1],
        templateId: templateId,
        templateRef: templateId,
      },
    ];
    
    console.log('\n📊 Sending Benchmark Request');
    console.log('='.repeat(80));
    console.log('   Processing both models in parallel...');
    
    const startTime = Date.now();
    
    // Call benchmark endpoint
    // Note: The endpoint checks for x-user-email header for allowlist
    // For testing, we can pass a test email or the endpoint should handle optional auth
    const response = await fetch(`${baseUrl}/api/benchmark`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-email': process.env.TEST_USER_EMAIL || 'test@example.com',
      },
      body: JSON.stringify({
        original: rawTranscript.trim(),
        reference: mdFinalVersion.trim(),
        combinations: combinations,
        autoGenerate: true, // Auto-generate outputs
        config: {
          section: 'section_7',
          language: 'fr',
          evaluationModel: 'gpt-4o-mini', // Model for evaluation report
        },
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const result = await response.json();
    const processingTime = Date.now() - startTime;
    
    if (!result.success) {
      throw new Error(result.error || 'Benchmark comparison failed');
    }
    
    console.log(`\n✅ Benchmark Comparison Completed (${processingTime}ms)`);
    console.log('='.repeat(80));
    
    // Display results
    if (result.results && result.results.length >= 2) {
      const [result1, result2] = result.results;
      
      console.log('\n📊 Quantitative Comparison');
      console.log('='.repeat(80));
      
      // Model A (GPT-4o-mini)
      console.log(`\n🤖 Model A: ${models[0]}`);
      console.log('-'.repeat(80));
      if (result1.metrics) {
        console.log(`   Overall Score:        ${result1.metrics.overallScore?.toFixed(1) || 'N/A'}%`);
        console.log(`   Similarity:           ${result1.metrics.similarity?.toFixed(1) || 'N/A'}%`);
        console.log(`   Content Preservation:  ${result1.metrics.contentPreservation?.toFixed(1) || 'N/A'}%`);
        console.log(`   Formatting Accuracy:  ${result1.metrics.formattingAccuracy?.toFixed(1) || 'N/A'}%`);
        console.log(`   Word Count Diff:      ${result1.metrics.wordCountDiff || 'N/A'}`);
        console.log(`   Sentence Count Diff:  ${result1.metrics.sentenceCountDiff || 'N/A'}`);
      }
      if (result1.missingPhrases && result1.missingPhrases.length > 0) {
        console.log(`   Missing Phrases:      ${result1.missingPhrases.length}`);
        console.log(`   Top Missing Phrases:`);
        result1.missingPhrases.slice(0, 3).forEach((phrase, i) => {
          console.log(`     ${i + 1}. ${phrase.substring(0, 80)}${phrase.length > 80 ? '...' : ''}`);
        });
      }
      
      // Model B (Gemini Flash)
      console.log(`\n🤖 Model B: ${models[1]}`);
      console.log('-'.repeat(80));
      if (result2.metrics) {
        console.log(`   Overall Score:        ${result2.metrics.overallScore?.toFixed(1) || 'N/A'}%`);
        console.log(`   Similarity:           ${result2.metrics.similarity?.toFixed(1) || 'N/A'}%`);
        console.log(`   Content Preservation:  ${result2.metrics.contentPreservation?.toFixed(1) || 'N/A'}%`);
        console.log(`   Formatting Accuracy:  ${result2.metrics.formattingAccuracy?.toFixed(1) || 'N/A'}%`);
        console.log(`   Word Count Diff:      ${result2.metrics.wordCountDiff || 'N/A'}`);
        console.log(`   Sentence Count Diff:  ${result2.metrics.sentenceCountDiff || 'N/A'}`);
      }
      if (result2.missingPhrases && result2.missingPhrases.length > 0) {
        console.log(`   Missing Phrases:      ${result2.missingPhrases.length}`);
        console.log(`   Top Missing Phrases:`);
        result2.missingPhrases.slice(0, 3).forEach((phrase, i) => {
          console.log(`     ${i + 1}. ${phrase.substring(0, 80)}${phrase.length > 80 ? '...' : ''}`);
        });
      }
      
      // Winner determination
      console.log('\n🏆 Winner Analysis');
      console.log('='.repeat(80));
      
      const score1 = result1.metrics?.overallScore || 0;
      const score2 = result2.metrics?.overallScore || 0;
      
      if (score1 > score2) {
        console.log(`   🥇 Winner: ${models[0]} (${score1.toFixed(1)}% vs ${score2.toFixed(1)}%)`);
        console.log(`   🥈 Runner-up: ${models[1]} (${score2.toFixed(1)}%)`);
        console.log(`   📊 Difference: +${(score1 - score2).toFixed(1)}%`);
      } else if (score2 > score1) {
        console.log(`   🥇 Winner: ${models[1]} (${score2.toFixed(1)}% vs ${score1.toFixed(1)}%)`);
        console.log(`   🥈 Runner-up: ${models[0]} (${score1.toFixed(1)}%)`);
        console.log(`   📊 Difference: +${(score2 - score1).toFixed(1)}%`);
      } else {
        console.log(`   🤝 TIE: Both models scored ${score1.toFixed(1)}%`);
      }
      
      // Detailed comparison
      console.log('\n📋 Detailed Metrics Comparison');
      console.log('='.repeat(80));
      console.log(`   Metric                | ${models[0].padEnd(25)} | ${models[1].padEnd(25)} | Winner`);
      console.log('   ' + '-'.repeat(78));
      
      const metrics = [
        { name: 'Overall Score', key: 'overallScore' },
        { name: 'Similarity', key: 'similarity' },
        { name: 'Content Preservation', key: 'contentPreservation' },
        { name: 'Formatting Accuracy', key: 'formattingAccuracy' },
      ];
      
      metrics.forEach(metric => {
        const val1 = result1.metrics?.[metric.key] || 0;
        const val2 = result2.metrics?.[metric.key] || 0;
        const winner = val1 > val2 ? models[0] : val2 > val1 ? models[1] : 'TIE';
        const val1Str = val1.toFixed(1).padStart(6);
        const val2Str = val2.toFixed(1).padStart(6);
        console.log(`   ${metric.name.padEnd(22)} | ${val1Str.padEnd(25)} | ${val2Str.padEnd(25)} | ${winner}`);
      });
      
      // Save results to file
      console.log('\n💾 Saving Results');
      console.log('='.repeat(80));
      
      const outputDir = path.join(__dirname, 'test-outputs');
      try {
        await fs.mkdir(outputDir, { recursive: true });
      } catch (error) {
        // Directory might already exist
      }
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const summaryFile = path.join(outputDir, `benchmark-comparison-${timestamp}.json`);
      const summary = {
        timestamp: new Date().toISOString(),
        template: templateId,
        models: {
          modelA: { name: models[0], result: result1 },
          modelB: { name: models[1], result: result2 },
        },
        winner: score1 > score2 ? models[0] : score2 > score1 ? models[1] : 'TIE',
        processingTime,
        rawTranscriptLength: rawTranscript.length,
        referenceLength: mdFinalVersion.length,
      };
      
      await fs.writeFile(summaryFile, JSON.stringify(summary, null, 2), 'utf-8');
      console.log(`   ✅ Results saved to: ${summaryFile}`);
      
      // Evaluation report if available
      if (result.evaluationReport) {
        console.log('\n📝 AI Evaluation Report');
        console.log('='.repeat(80));
        console.log(result.evaluationReport);
        
        const reportFile = path.join(outputDir, `evaluation-report-${timestamp}.txt`);
        await fs.writeFile(reportFile, result.evaluationReport, 'utf-8');
        console.log(`   ✅ Report saved to: ${reportFile}`);
      }
      
      // Save individual outputs
      if (result1.outputPreview || result2.outputPreview) {
        const output1File = path.join(outputDir, `benchmark-${models[0]}-${timestamp}.txt`);
        const output2File = path.join(outputDir, `benchmark-${models[1]}-${timestamp}.txt`);
        
        // Try to get full output from results
        const output1 = result1.output || result1.outputPreview || '';
        const output2 = result2.output || result2.outputPreview || '';
        
        await fs.writeFile(output1File, output1, 'utf-8');
        await fs.writeFile(output2File, output2, 'utf-8');
        
        console.log(`   ✅ Model A output: ${output1File}`);
        console.log(`   ✅ Model B output: ${output2File}`);
      }
      
    } else {
      console.error('\n❌ Invalid results format');
      console.log('Response:', JSON.stringify(result, null, 2));
    }
    
  } catch (error) {
    console.error('\n❌ Benchmark comparison failed:');
    console.error(error);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run test
runBenchmarkComparison().catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});

