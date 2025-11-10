/**
 * Test Section 11 Implementation
 * 
 * Tests:
 * 1. Template appears in template_combinations API
 * 2. Section 11 generation endpoint works
 * 3. Artifacts are accessible
 * 
 * Usage:
 *   npx tsx backend/scripts/test-section11-implementation.ts
 */

import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';
const BEARER_TOKEN = process.env.BEARER_TOKEN;

if (!BEARER_TOKEN) {
  console.error('❌ Error: BEARER_TOKEN environment variable is required');
  console.error('   Please set BEARER_TOKEN in your .env file or environment');
  process.exit(1);
}

const headers = {
  'Authorization': `Bearer ${BEARER_TOKEN}`,
  'Content-Type': 'application/json',
};

interface TestResult {
  test: string;
  passed: boolean;
  message: string;
  data?: any;
}

const results: TestResult[] = [];

async function testTemplateInDatabase(): Promise<void> {
  console.log('\n🧪 Test 1: Check if Section 11 template is in database...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/template-combinations`, {
      method: 'GET',
      headers,
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    const section11Template = data.data?.find((t: any) => t.id === 'section11-rd');
    
    if (section11Template) {
      results.push({
        test: 'Template in database',
        passed: true,
        message: `Section 11 template found: ${section11Template.name}`,
        data: section11Template,
      });
      console.log('✅ PASS: Section 11 template found in database');
      console.log(`   ID: ${section11Template.id}`);
      console.log(`   Name: ${section11Template.name}`);
      console.log(`   Active: ${section11Template.is_active}`);
    } else {
      results.push({
        test: 'Template in database',
        passed: false,
        message: 'Section 11 template not found in database',
      });
      console.log('❌ FAIL: Section 11 template not found in database');
    }
  } catch (error) {
    results.push({
      test: 'Template in database',
      passed: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
    console.log(`❌ FAIL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function testSection11Generation(): Promise<void> {
  console.log('\n🧪 Test 2: Test Section 11 generation endpoint...');
  
  // Sample input data matching section11_schema.json
  const testInput = {
    meta: {
      age: 43,
      sex: 'M',
      dominance: 'Droitier',
      occupation: 'Ouvrier',
      employment_status: 'Actif',
      visit_date_expertise: '2024-01-15',
    },
    S1_mandate_points: [
      'Évaluer la consolidation',
      'Statuer sur l\'atteinte permanente',
    ],
    S2_diagnostics_acceptes: [
      'Bursite rotulienne au genou gauche',
    ],
    S5_antecedents_relevants: {
      medical: [],
      surgical: [],
      at_site: [],
      accidents: [],
      habits: [],
    },
    S7_historique: [
      {
        date: '2023-06-15',
        event: 'Accident au travail - chute sur le genou gauche',
        source: 'Travailleur',
      },
    ],
    S8_subjectif: {
      main_complaints: [
        'Douleur au genou gauche',
        'Difficulté à monter les escaliers',
      ],
      AVQ_AVD: 'Limitations dans les activités quotidiennes',
    },
    S9_examen: {
      regions: {
        genou: {
          amplitude: 'Flexion limitée à 90°',
          pain: 'Douleur à la palpation de la rotule',
        },
      },
      findings_summary: 'Genou gauche avec limitation de flexion et douleur rotulienne',
    },
    S10_paraclinique: [
      'Radiographie genou gauche: normal',
    ],
    clinician_interpretations: {
      plateau_therapeutique: true,
      treatment_sufficiency: 'Suffisant',
      limitations_exist: true,
      limitations_description: 'Limitation de flexion et douleur persistante',
    },
    consolidation: true,
    AIPP_percent: 5,
  };
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/format/merge/section11`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        caseId: 'test-case-123',
        inputData: testInput,
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    
    if (data.success && data.autoSummary) {
      results.push({
        test: 'Section 11 generation',
        passed: true,
        message: 'Section 11 generated successfully',
        data: {
          length: data.autoSummary.length,
          hasCompliance: !!data.compliance,
          rulesScore: data.compliance?.rulesScore,
        },
      });
      console.log('✅ PASS: Section 11 generated successfully');
      console.log(`   Generated text length: ${data.autoSummary.length} characters`);
      console.log(`   Compliance score: ${data.compliance?.rulesScore || 'N/A'}`);
      console.log(`   Passed rules: ${data.compliance?.passedRules?.length || 0}`);
    } else {
      results.push({
        test: 'Section 11 generation',
        passed: false,
        message: 'Section 11 generation failed - no output',
        data,
      });
      console.log('❌ FAIL: Section 11 generation failed - no output');
    }
  } catch (error) {
    results.push({
      test: 'Section 11 generation',
      passed: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
    console.log(`❌ FAIL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function testArtifactsAccessible(): Promise<void> {
  console.log('\n🧪 Test 3: Check if artifacts are accessible...');
  
  // This would require checking Supabase Storage or the artifact resolver
  // For now, we'll check if the files exist locally
  const { existsSync } = await import('fs');
  const { join } = await import('path');
  
  const basePath = join(__dirname, '..', '..');
  const artifacts = [
    'prompts/section11_schema.json',
    'prompts/section11_logicmap.yaml',
    'prompts/section11_master.fr.md',
    'training/section11_examples.jsonl',
    'backend/configs/master_prompt_section11.json',
  ];
  
  let allExist = true;
  const missing: string[] = [];
  
  for (const artifact of artifacts) {
    const fullPath = join(basePath, artifact);
    if (!existsSync(fullPath)) {
      allExist = false;
      missing.push(artifact);
    }
  }
  
  if (allExist) {
    results.push({
      test: 'Artifacts accessible',
      passed: true,
      message: 'All Section 11 artifacts found locally',
      data: { count: artifacts.length },
    });
    console.log('✅ PASS: All Section 11 artifacts found locally');
    console.log(`   Found ${artifacts.length} artifacts`);
  } else {
    results.push({
      test: 'Artifacts accessible',
      passed: false,
      message: `Missing artifacts: ${missing.join(', ')}`,
    });
    console.log('❌ FAIL: Some artifacts missing');
    console.log(`   Missing: ${missing.join(', ')}`);
  }
}

async function runAllTests(): Promise<void> {
  console.log('🚀 Testing Section 11 Implementation\n');
  console.log(`API Base URL: ${API_BASE_URL}\n`);
  
  await testTemplateInDatabase();
  await testArtifactsAccessible();
  await testSection11Generation();
  
  // Summary
  console.log('\n📊 Test Summary:');
  console.log('='.repeat(50));
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  results.forEach(result => {
    const icon = result.passed ? '✅' : '❌';
    console.log(`${icon} ${result.test}: ${result.message}`);
  });
  
  console.log('='.repeat(50));
  console.log(`\nResults: ${passed}/${total} tests passed\n`);
  
  if (passed === total) {
    console.log('✨ All tests passed! Section 11 implementation is working correctly.\n');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed. Please review the errors above.\n');
    process.exit(1);
  }
}

// Run tests
runAllTests().catch((error) => {
  console.error('💥 Test execution failed:', error);
  process.exit(1);
});

