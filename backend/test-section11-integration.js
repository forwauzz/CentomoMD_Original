/**
 * Test Section 11 Template Integration with Bearer Token
 * Tests the /api/format/merge/section11 endpoint
 */

const BEARER_TOKEN = 'eyJhbGciOiJIUzI1NiIsImtpZCI6InM2K1dlVjFjUE9mMTFXcUQiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2tianVscHhnanF6Z2Jrc2hxc21lLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiI2MmYyMGU4YS1kZjk1LTRiMDctYjY5My0zNzBjYThjNTYwZTciLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzYyNjMzNTUyLCJpYXQiOjE3NjI2Mjk5NTIsImVtYWlsIjoidXp6aWVsdEB0ZWNoZWhlYWx0aHNlcnZpY2VzLmNvbSIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZW1haWwiLCJwcm92aWRlcnMiOlsiZW1haWwiLCJnb29nbGUiXX0sInVzZXJfbWV0YWRhdGEiOnsiY3VzdG9tX2NsYWltcyI6eyJoZCI6InRlY2hlaGVhbHRoc2VydmljZXMuY29tIn0sImVtYWlsIjoidXp6aWVsdEB0ZWNoZWhlYWx0aHNlcnZpY2VzLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJmdWxsX25hbWUiOiJ1enppZWwgVGFtb24iLCJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJuYW1lIjoidXp6aWVsIFRhbW9uIiwicGhvbmVfdmVyaWZpZWQiOmZhbHNlLCJwcm92aWRlcl9pZCI6IjEwOTg3MDY4MjU1OTgzMDE0Njc2OSIsInN1YiI6IjEwOTg3MDY4MjU1OTgzMDE0Njc2OSJ9LCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImFhbCI6ImFhbDEiLCJhbXIiOlt7Im1ldGhvZCI6Im9hdXRoIiwidGltZXN0YW1wIjoxNzYyNjE1ODgwfV0sInNlc3Npb25faWQiOiJlZDcxZjk0OS03ZjU5LTQ4MjItYjAxZS1hNDU2ZDFmNTYwYWMiLCJpc19hbm9ueW1vdXMiOmZhbHNlfQ.muCMLl65eKWuO84LkqfEEh_Jl86HoDSf1nkyWLvVp2E';

// Default API URL - adjust if needed (check your .env or backend/src/config/env.ts)
// Default port is 3001 according to backend/src/config/env.ts
const API_URL = process.env.API_URL || 'http://localhost:3001';

const ENDPOINT = `${API_URL}/api/format/merge/section11`;

// Sample Section 11 input data (from training example - cheville)
const sampleInputData = {
  meta: {
    age: 40,
    sex: 'M',
    dominance: 'droitier',
    occupation: 'travailleur',
    employment_status: 'non retour travail prélésionnel',
    visit_date_expertise: '2024-07-23'
  },
  S1_mandate_points: [
    "Existence de l'atteinte permanente",
    "Pourcentage de l'atteinte permanente",
    "Existence de limitations fonctionnelles",
    "Évaluation des limitations fonctionnelles"
  ],
  S2_diagnostics_acceptes: [
    "Entorse cheville droite"
  ],
  S5_antecedents_relevants: {
    medical: [],
    surgical: [],
    at_site: [],
    accidents: ["Fracture tibia et fibula gauche (mai 2023)"],
    habits: []
  },
  S7_historique: [
    {date: "2021-03-03", event: "Événement d'origine: entorse cheville droite", source: "fiche réclamation"},
    {date: "2021-03-15", event: "Investigation IRM et radiographies: atteintes ligamentaires partielles", source: "radiologie"},
    {date: "2021-04-01", event: "Consultation Dr Blouin: traitement conservateur", source: "dossier médical"},
    {date: "2021-05-01", event: "Physiothérapie et ergothérapie: évolution peu favorable", source: "dossier médical"},
    {date: "2023-05-15", event: "Fracture tibia et fibula gauche (chute accidentelle)", source: "dossier médical"},
    {date: "2024-07-23", event: "Consolidation entorse cheville droite", source: "expertise"}
  ],
  S8_subjectif: {
    main_complaints: [
      "Douleurs externe pied droit irradiant plantaire",
      "Signes instabilité cheville droite",
      "Difficultés terrains instables/glissants",
      "Difficulté monter escaliers",
      "Éveils nocturnes",
      "Raideurs matinales"
    ],
    AVQ_AVD: "Envisage réorientation carrière"
  },
  S9_examen: {
    regions: {
      cheville: {
        amplitude: "diminuée",
        pain: "douleur palpation malléole interne et externe"
      }
    },
    findings_summary: "Utilisation béquilles (lésion membre inférieur gauche). Déformation tibia gauche. Diminution amplitude articulaire cheville droite. Aucun signe clinique instabilité cheville droite. Genou et hanche normaux."
  },
  S10_paraclinique: [
    "IRM cheville droite: atteintes ligamentaires partielles",
    "Radiographies: atteintes ligamentaires partielles"
  ],
  clinician_interpretations: {
    plateau_therapeutique: true,
    treatment_sufficiency: "suffisants",
    limitations_exist: true,
    limitations_description: "Marche prolongée, terrains instables, escaliers, positions statiques"
  },
  consolidation: true,
  AIPP_percent: 0,
  AIPP_details: null
};

async function testSection11Endpoint() {
  console.log('🧪 Testing Section 11 Template Integration\n');
  console.log(`📍 Endpoint: ${ENDPOINT}`);
  console.log(`🔑 Using Bearer token: ${BEARER_TOKEN.substring(0, 50)}...\n`);

  const testCaseId = 'test-case-' + Date.now();

  const requestBody = {
    caseId: testCaseId,
    inputData: sampleInputData,
    model: 'gpt-4o', // Optional
    temperature: 0.7, // Optional
    seed: 42, // Optional
    templateVersion: 'current', // Optional - uses manifest default
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
      
      console.log('\n📊 Compliance Results:');
      console.log(`  Rules Score: ${result.compliance.rulesScore}`);
      console.log(`  Passed Rules: ${result.compliance.passedRules.length}`);
      console.log(`  Failed Rules: ${result.compliance.failedRules.length}`);
      
      if (result.compliance.failedRules.length > 0) {
        console.log('\n⚠️  Failed Rules:');
        result.compliance.failedRules.forEach(rule => {
          console.log(`  - ${rule}`);
        });
      }
      
      console.log('\n📈 Quality Results:');
      console.log(`  Manager Verdict: ${result.quality.managerVerdict || 'N/A'}`);
      console.log(`  Feedback: ${result.quality.feedback || 'N/A'}`);
      
      console.log('\n📦 Metadata:');
      console.log(`  Version: ${result.metadata.version}`);
      console.log(`  Processing Time: ${result.metadata.processingTime}ms`);
      console.log(`  Timestamp: ${result.metadata.timestamp}`);
    }

    console.log('\n✅ Test completed successfully!');
  } catch (error) {
    console.error('\n❌ Test failed with error:');
    console.error(error);
    if (error.message) {
      console.error(`Error message: ${error.message}`);
    }
  }
}

// Run the test
testSection11Endpoint().catch(console.error);

