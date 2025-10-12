// Load environment variables first
import 'dotenv/config';

import { section7RdService } from './dist/src/services/section7RdService.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

console.log('🧪 Complete Section 7 R&D Pipeline Test');
console.log('=' .repeat(60));

// Test with the same input that showed verbatim capture working
const testInput = `la travailleuse consulte le docteur Martin le 15 janvier 2024 elle diagnostique une entorse lombaire elle prescrit une radiographie le travailleur obtient une radiographie de la colonne lombaire le 20 janvier 2024 elle est interprétée par le docteur Dubois radiologiste ce dernier constate colonne lombaire discopathie dégénérative L4-L5 et L5-S1 avec rétrécissement des espaces intersomatiques arthrose facettaire bilatérale L4-L5 et L5-S1 pas de fracture ou de lésion lytique visible pas d'effondrement vertébral les foramens sont préservés conclusion discopathie dégénérative modérée L4-L5 et L5-S1 avec arthrose facettaire associée le travailleur revoit le docteur Martin le 25 janvier 2024 elle maintient le diagnostic`;

console.log('\n📝 Test Input:');
console.log(testInput.substring(0, 200) + '...');

async function testCompletePipeline() {
  try {
    console.log('\n🔧 Testing Complete Section 7 R&D Pipeline...');
    
    // Step 1: Test the R&D Service
    console.log('\n📊 Step 1: R&D Service Processing...');
    const result = await section7RdService.processInput(testInput);

    console.log('\n📊 R&D Service Result:');
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

    // Step 2: Test individual artifacts
    console.log('\n🔍 Step 2: Testing Individual Artifacts...');
    
    // Test evaluation script directly
    console.log('\n📊 Testing Evaluation Script...');
    try {
      const evaluatorPath = path.join(process.cwd(), 'eval', 'evaluator_section7.py');
      const { stdout: evalOutput } = await execAsync(`python "${evaluatorPath}"`, {
        cwd: process.cwd(),
        timeout: 30000
      });
      console.log('✅ Evaluation script runs successfully');
      console.log(`   - Output length: ${evalOutput.length} chars`);
    } catch (evalError) {
      console.log('❌ Evaluation script failed:', evalError.message);
    }

    // Test manager review script
    console.log('\n📊 Testing Manager Review Script...');
    try {
      const managerPath = path.join(process.cwd(), 'scripts', 'run_manager_review.py');
      if (fs.existsSync(managerPath)) {
        const { stdout: managerOutput } = await execAsync(`python "${managerPath}"`, {
          cwd: process.cwd(),
          timeout: 30000
        });
        console.log('✅ Manager review script runs successfully');
        console.log(`   - Output length: ${managerOutput.length} chars`);
      } else {
        console.log('⚠️ Manager review script not found');
      }
    } catch (managerError) {
      console.log('❌ Manager review script failed:', managerError.message);
    }

    // Step 3: Verify all artifacts exist
    console.log('\n🔍 Step 3: Verifying All Artifacts...');
    
    const artifacts = [
      'configs/master_prompt_section7.json',
      'prompts/plan_section7_fr.xml',
      'prompts/manager_eval_section7_fr.xml',
      'prompts/manager_section7_fr.md',
      'prompts/checklist_manager_section7.json',
      'system/system_section7_fr-ca.md',
      'training/golden_cases_section7.jsonl',
      'eval/validation_manifest.jsonl',
      'eval/evaluator_section7.py'
    ];

    let allArtifactsExist = true;
    artifacts.forEach(artifact => {
      const artifactPath = path.join(process.cwd(), artifact);
      const exists = fs.existsSync(artifactPath);
      console.log(`   - ${artifact}: ${exists ? '✅' : '❌'}`);
      if (!exists) allArtifactsExist = false;
    });

    // Step 4: Check verbatim radiology capture
    console.log('\n🔍 Step 4: Verbatim Radiology Analysis...');
    const hasQuotes = result.formattedText.includes('«') && result.formattedText.includes('»');
    const hasRadiologySection = result.formattedText.includes('radiologiste') || result.formattedText.includes('radiographie');
    const hasVerbatimContent = result.formattedText.includes('discopathie dégénérative L4-L5 et L5-S1');
    
    console.log(`   - Has quotes: ${hasQuotes}`);
    console.log(`   - Has radiology section: ${hasRadiologySection}`);
    console.log(`   - Has verbatim content: ${hasVerbatimContent}`);
    
    if (hasQuotes && hasRadiologySection && hasVerbatimContent) {
      console.log('   ✅ Verbatim radiology capture is working!');
    } else {
      console.log('   ❌ Verbatim radiology capture is NOT working as expected.');
    }

    // Summary
    console.log('\n🎯 Test Summary:');
    console.log(`   ✅ R&D Service: ${result.success ? 'WORKING' : 'FAILED'}`);
    console.log(`   ✅ All Artifacts: ${allArtifactsExist ? 'PRESENT' : 'MISSING'}`);
    console.log(`   ✅ Verbatim Capture: ${hasQuotes && hasRadiologySection && hasVerbatimContent ? 'WORKING' : 'FAILED'}`);
    console.log(`   ✅ Compliance Score: ${(result.compliance.rulesScore * 100).toFixed(1)}%`);

    return result.success && allArtifactsExist;
  } catch (error) {
    console.error('❌ Complete Pipeline Test Failed:', error);
    return false;
  }
}

testCompletePipeline();
