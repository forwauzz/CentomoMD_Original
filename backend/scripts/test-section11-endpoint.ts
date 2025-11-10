/**
 * Test Section 11 R&D Pipeline endpoint
 * 
 * Usage:
 *   npx tsx backend/scripts/test-section11-endpoint.ts
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

const BEARER_TOKEN = process.env.BEARER_TOKEN;

if (!BEARER_TOKEN) {
  console.error('❌ Error: BEARER_TOKEN environment variable is required');
  console.error('   Please set BEARER_TOKEN in your .env file or environment');
  process.exit(1);
}

const API_URL = process.env.API_URL || 'http://localhost:3001';
const ENDPOINT = `${API_URL}/api/format/merge/section11`;

// Sample Section 11 input data (from training example)
const sampleInputData = {
  meta: {
    age: 43,
    sex: 'M',
    dominance: 'Droitier',
    occupation: 'Ouvrier',
    employment_status: 'En emploi',
    visit_date_expertise: '2024-01-15',
  },
  S1_mandate_points: [
    'Évaluer l\'état actuel du travailleur',
    'Déterminer si consolidation',
    'Évaluer les limitations fonctionnelles',
  ],
  S2_diagnostics_acceptes: [
    'Bursite rotulienne au genou gauche',
  ],
  S5_antecedents_relevants: {
    medical: ['Hypertension'],
    surgical: ['Appendicectomie 1995'],
    at_site: [],
    accidents: [],
    habits: ['Non-fumeur'],
  },
  S7_historique: [
    {
      date: '2023-06-15',
      event: 'Accident au travail - chute sur genou gauche',
      source: 'Déclaration du travailleur',
    },
    {
      date: '2023-06-20',
      event: 'Consultation médicale - diagnostic de bursite',
      source: 'Dossier médical',
    },
  ],
  S8_subjectif: {
    main_complaints: [
      'Douleur au genou gauche lors de la flexion',
      'Difficulté à monter les escaliers',
    ],
    AVQ_AVD: 'Limitation modérée des activités quotidiennes',
  },
  S9_examen: {
    regions: {
      genou: {
        amplitude: 'Flexion: 0-120° (limitation de 20°)',
        pain: 'Douleur à la palpation de la bourse rotulienne',
      },
    },
    findings_summary: 'Bursite rotulienne confirmée, limitation modérée de la flexion',
  },
  S10_paraclinique: [
    'Échographie du genou gauche - épanchement de la bourse rotulienne',
  ],
  clinician_interpretations: {
    plateau_therapeutique: true,
    treatment_sufficiency: 'Traitement complet et suffisant',
    limitations_exist: true,
    limitations_description: 'Limitation modérée de la flexion du genou',
  },
  consolidation: true,
  AIPP_percent: 2,
  AIPP_details: {
    type: 'Atteinte permanente à l\'intégrité physique',
    description: 'Limitation fonctionnelle modérée du genou gauche',
  },
};

async function testSection11Endpoint() {
  console.log('🧪 Testing Section 11 R&D Pipeline Endpoint\n');
  console.log(`📍 Endpoint: ${ENDPOINT}`);
  console.log(`🔑 Using Bearer token: ${BEARER_TOKEN.substring(0, 50)}...\n`);

  const testCaseId = 'test-case-' + Date.now();

  const requestBody = {
    caseId: testCaseId,
    inputData: sampleInputData,
    model: 'gpt-4o', // Optional
    temperature: 0.7, // Optional
    seed: 42, // Optional
    templateVersion: '1.0.0', // Optional
  };

  console.log('📤 Request Body:');
  console.log(JSON.stringify(requestBody, null, 2));
  console.log('\n');

  try {
    const startTime = Date.now();

    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${BEARER_TOKEN}`,
      },
      body: JSON.stringify(requestBody),
    });

    const processingTime = Date.now() - startTime;

    console.log(`⏱️  Processing time: ${processingTime}ms`);
    console.log(`📊 Status: ${response.status} ${response.statusText}\n`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error Response:');
      console.error(errorText);
      return;
    }

    const result = await response.json();

    console.log('✅ Success Response:');
    console.log(JSON.stringify(result, null, 2));

    if (result.success) {
      console.log('\n📝 Generated Section 11 Text:');
      console.log('─'.repeat(80));
      console.log(result.autoSummary);
      console.log('─'.repeat(80));

      if (result.compliance) {
        console.log('\n📊 Compliance Score:');
        console.log(`   Rules Score: ${(result.compliance.rulesScore * 100).toFixed(1)}%`);
        console.log(`   Passed Rules: ${result.compliance.passedRules.length}`);
        console.log(`   Failed Rules: ${result.compliance.failedRules.length}`);
        
        if (result.compliance.failedRules.length > 0) {
          console.log('\n⚠️  Failed Rules:');
          result.compliance.failedRules.forEach((rule: string) => {
            console.log(`   - ${rule}`);
          });
        }
      }

      if (result.metadata) {
        console.log('\n📈 Metadata:');
        console.log(`   Version: ${result.metadata.version}`);
        console.log(`   Processing Time: ${result.metadata.processingTime}ms`);
        console.log(`   Timestamp: ${result.metadata.timestamp}`);
      }
    }

    console.log('\n✨ Test completed successfully!');
  } catch (error) {
    console.error('💥 Test failed:', error);
    if (error instanceof Error) {
      console.error('   Error message:', error.message);
      console.error('   Stack:', error.stack);
    }
    process.exit(1);
  }
}

// Run the test
testSection11Endpoint()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });

