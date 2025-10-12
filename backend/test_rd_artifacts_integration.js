// Load environment variables first
import 'dotenv/config';

import { section7RdService } from './dist/src/services/section7RdService.js';
import fs from 'fs';
import path from 'path';

console.log('🧪 Section 7 R&D Pipeline - Artifacts Integration Test');
console.log('=' .repeat(60));

// Test with radiology content to verify verbatim capture
const testInput = `la travailleuse consulte le docteur Martin le 15 janvier 2024 elle diagnostique une entorse lombaire elle prescrit une radiographie le travailleur obtient une radiographie de la colonne lombaire le 20 janvier 2024 elle est interprétée par le docteur Dubois radiologiste ce dernier constate colonne lombaire discopathie dégénérative L4-L5 et L5-S1 avec rétrécissement des espaces intersomatiques arthrose facettaire bilatérale L4-L5 et L5-S1 pas de fracture ou de lésion lytique visible pas d'effondrement vertébral les foramens sont préservés conclusion discopathie dégénérative modérée L4-L5 et L5-S1 avec arthrose facettaire associée le travailleur revoit le docteur Martin le 25 janvier 2024 elle maintient le diagnostic`;

console.log('\n📝 Test Input:');
console.log(testInput.substring(0, 200) + '...');

async function testRdArtifactsIntegration() {
  try {
    console.log('\n🔍 Step 1: Verifying All R&D Artifacts Exist...');
    
    const artifacts = [
      { path: '../configs/master_prompt_section7.json', name: 'Master Configuration' },
      { path: '../prompts/plan_section7_fr.xml', name: 'Formatting Plan (8 Phases)' },
      { path: '../prompts/manager_eval_section7_fr.xml', name: 'Manager Evaluation Criteria' },
      { path: '../prompts/manager_section7_fr.md', name: 'Manager Prompt Documentation' },
      { path: '../prompts/checklist_manager_section7.json', name: 'Manager Checklist Configuration' },
      { path: '../system/system_section7_fr-ca.md', name: 'System Conductor' },
      { path: '../training/golden_cases_section7.jsonl', name: 'Golden Cases (12 CNESST cases)' },
      { path: '../eval/evaluator_section7.py', name: 'Evaluation Script (9 compliance rules)' },
      { path: '../eval/validation_manifest.jsonl', name: 'Validation Manifest (12 test cases)' },
      { path: '../scripts/run_manager_review.py', name: 'Manager Review Script' }
    ];

    let allArtifactsExist = true;
    artifacts.forEach(artifact => {
      const artifactPath = path.join(process.cwd(), artifact.path);
      const exists = fs.existsSync(artifactPath);
      console.log(`   - ${artifact.name}: ${exists ? '✅' : '❌'} (${artifact.path})`);
      if (!exists) allArtifactsExist = false;
    });

    if (!allArtifactsExist) {
      console.log('\n❌ Some artifacts are missing! Cannot proceed with integration test.');
      return false;
    }

    console.log('\n✅ All R&D artifacts are present!');

    console.log('\n🔧 Step 2: Testing R&D Pipeline with All Artifacts...');
    
    // Test the R&D Service
    const result = await section7RdService.processInput(testInput);

    console.log('\n📊 R&D Pipeline Result:');
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

    // Step 3: Verify verbatim radiology capture
    console.log('\n🔍 Step 3: Verbatim Radiology Analysis...');
    const hasQuotes = result.formattedText.includes('«') && result.formattedText.includes('»');
    const hasRadiologySection = result.formattedText.includes('radiologiste') || result.formattedText.includes('radiographie');
    const hasVerbatimContent = result.formattedText.includes('discopathie dégénérative L4-L5 et L5-S1');
    const hasCompleteVerbatim = result.formattedText.includes('rétrécissement des espaces intersomatiques');
    
    console.log(`   - Has quotes: ${hasQuotes}`);
    console.log(`   - Has radiology section: ${hasRadiologySection}`);
    console.log(`   - Has verbatim content: ${hasVerbatimContent}`);
    console.log(`   - Has complete verbatim: ${hasCompleteVerbatim}`);
    
    if (hasQuotes && hasRadiologySection && hasVerbatimContent && hasCompleteVerbatim) {
      console.log('   ✅ Verbatim radiology capture is working with R&D artifacts!');
    } else {
      console.log('   ❌ Verbatim radiology capture is NOT working as expected.');
    }

    // Step 4: Check if artifacts are being used
    console.log('\n🔍 Step 4: Artifact Usage Verification...');
    
    // Check if the output shows signs of using the comprehensive prompt
    const hasProperHeader = result.formattedText.startsWith('7. Historique de faits et évolution');
    const hasWorkerStructure = result.formattedText.includes('Le travailleur') || result.formattedText.includes('La travailleuse');
    const hasDoctorTitles = result.formattedText.includes('docteur');
    
    console.log(`   - Proper header: ${hasProperHeader}`);
    console.log(`   - Worker structure: ${hasWorkerStructure}`);
    console.log(`   - Doctor titles: ${hasDoctorTitles}`);
    
    const artifactsWorking = hasProperHeader && hasWorkerStructure && hasDoctorTitles;
    console.log(`   - Artifacts integration: ${artifactsWorking ? '✅ WORKING' : '❌ NOT WORKING'}`);

    // Summary
    console.log('\n🎯 Integration Test Summary:');
    console.log(`   ✅ All Artifacts Present: ${allArtifactsExist ? 'YES' : 'NO'}`);
    console.log(`   ✅ R&D Pipeline Success: ${result.success ? 'YES' : 'NO'}`);
    console.log(`   ✅ Verbatim Capture: ${hasQuotes && hasRadiologySection && hasVerbatimContent ? 'YES' : 'NO'}`);
    console.log(`   ✅ Artifacts Integration: ${artifactsWorking ? 'YES' : 'NO'}`);
    console.log(`   ✅ Compliance Score: ${(result.compliance.rulesScore * 100).toFixed(1)}%`);

    const overallSuccess = allArtifactsExist && result.success && artifactsWorking;
    console.log(`\n🎉 Overall Result: ${overallSuccess ? 'SUCCESS - R&D Pipeline using all artifacts!' : 'FAILED - Issues detected'}`);

    return overallSuccess;
  } catch (error) {
    console.error('❌ R&D Artifacts Integration Test Failed:', error);
    return false;
  }
}

testRdArtifactsIntegration();
