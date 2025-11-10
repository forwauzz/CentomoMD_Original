/**
 * Test Section 11 dictation page flow
 * 
 * This test simulates the flow from the dictation page:
 * 1. User selects Section 11 template
 * 2. User provides raw transcript input
 * 3. Frontend sends request to /api/format endpoint
 * 4. Backend processes with Section 11 template
 * 5. Returns formatted output
 * 
 * Usage:
 *   node backend/test-section11-dictation-flow.js
 * 
 * Environment variables:
 *   BEARER_TOKEN (optional, for authenticated requests)
 */

const API_URL = process.env.API_URL || 'http://localhost:3001';
const BEARER_TOKEN = process.env.BEARER_TOKEN;

if (!BEARER_TOKEN) {
  console.error('❌ Error: BEARER_TOKEN environment variable is required');
  console.error('   Please set BEARER_TOKEN in your .env file or environment');
  process.exit(1);
}

// Sample raw transcript for Section 11 (Conclusion)
const sampleTranscript = `
Le travailleur est un homme de 40 ans, droitier. Il a subi une entorse de la cheville droite le 3 mars 2021 lors d'un accident de travail.
Le travailleur a consulté le docteur Blouin, chirurgien orthopédiste, qui a suggéré un traitement conservateur.
Le travailleur a bénéficié de traitements en physiothérapie et ergothérapie avec une évolution peu favorable.
Sur le plan subjectif, le travailleur rapporte des douleurs en externe de son pied droit qui irradie au niveau plantaire.
Il note des signes d'instabilité au niveau de sa cheville droite.
Il rapporte des difficultés sur des terrains instables ou glissant et a de la difficulté à monter les escaliers.
Il rapporte des éveils nocturnes secondaires à la douleur ainsi que des raideurs matinales.
Sur le plan objectif, on note une diminution de l'amplitude articulaire de la cheville droite.
On note une douleur à la palpation au pourtour de la malléole interne et externe.
On ne rapporte aucun signe clinique d'instabilité au niveau de la cheville droite.
L'examen du genou droit ainsi que de la hanche droite est dans les limites de la normale.
À mon avis, il y a une atteinte du plateau thérapeutique et stabilisation de la condition.
Je consolide la lésion en date d'aujourd'hui soit le 23 juillet 2024.
J'attribue des limitations fonctionnelles résultant de la lésion professionnelle.
Le travailleur doit éviter la marche prolongée, marcher en terrain accidenté ou glissant.
Il doit éviter de monter descendre des escaliers à plusieurs reprises.
Il doit éviter la position debout statique de plus de 30 minutes.
`;

async function testSection11DictationFlow() {
  console.log('🧪 Testing Section 11 Dictation Page Flow\n');
  console.log('📍 Endpoint:', `${API_URL}/api/format/mode2`);
  console.log('📝 Template: section11-rd');
  console.log('📄 Input: Raw transcript (dictation mode)\n');

  const requestBody = {
    transcript: sampleTranscript.trim(),
    section: '11', // Section 11
    language: 'fr',
    inputLanguage: 'fr',
    outputLanguage: 'fr',
    templateRef: 'section11-rd', // Section 11 R&D template
    templateVersion: '1.0.0', // Use version 1.0.0
    verbatimSupport: false,
    voiceCommandsSupport: false
  };

  console.log('📤 Request Body:');
  console.log(JSON.stringify({
    ...requestBody,
    transcript: `${requestBody.transcript.substring(0, 100)}... (${requestBody.transcript.length} chars)`
  }, null, 2));
  console.log('\n');

  const headers = {
    'Content-Type': 'application/json',
  };

  if (BEARER_TOKEN) {
    headers['Authorization'] = `Bearer ${BEARER_TOKEN}`;
    console.log('🔑 Using Bearer token authentication\n');
  }

  const startTime = Date.now();

  try {
    const response = await fetch(`${API_URL}/api/format/mode2`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    const processingTime = Date.now() - startTime;
    const status = response.status;

    console.log(`⏱️  Processing time: ${processingTime}ms`);
    console.log(`📊 Status: ${status} ${response.statusText}\n`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error Response:');
      console.error(errorText);
      return;
    }

    const result = await response.json();

    console.log('✅ Success Response:');
    console.log(JSON.stringify({
      success: result.success,
      formatted: result.formatted ? `${result.formatted.substring(0, 200)}...` : 'N/A',
      formattedLength: result.formatted?.length || 0,
      issues: result.issues || [],
      confidence_score: result.confidence_score,
      metadata: result.metadata || {}
    }, null, 2));

    console.log('\n📝 Formatted Section 11 Output:');
    console.log('────────────────────────────────────────────────────────────────────────────────');
    if (result.formatted) {
      console.log(result.formatted);
    } else {
      console.log('(No formatted output returned)');
    }
    console.log('────────────────────────────────────────────────────────────────────────────────\n');

    // Validation checks
    console.log('🔍 Validation Checks:');
    
    if (result.formatted && result.formatted.length > 0) {
      console.log('   ✅ Formatted output received');
      
      // Check for Section 11 structure
      const hasHeader = result.formatted.includes('11. Conclusion') || result.formatted.includes('Conclusion');
      const hasResume = result.formatted.includes('Résumé') || result.formatted.toLowerCase().includes('résumé');
      const hasDiagnostic = result.formatted.includes('Diagnostic') || result.formatted.toLowerCase().includes('diagnostic');
      
      console.log(`   ${hasHeader ? '✅' : '⚠️ '} Contains Section 11 header: ${hasHeader}`);
      console.log(`   ${hasResume ? '✅' : '⚠️ '} Contains Résumé section: ${hasResume}`);
      console.log(`   ${hasDiagnostic ? '✅' : '⚠️ '} Contains Diagnostic section: ${hasDiagnostic}`);
      
      if (result.confidence_score !== undefined) {
        console.log(`   📊 Confidence score: ${result.confidence_score}`);
      }
      
      if (result.issues && result.issues.length > 0) {
        console.log(`   ⚠️  Issues found: ${result.issues.length}`);
        result.issues.forEach((issue, i) => {
          console.log(`      ${i + 1}. ${issue}`);
        });
      } else {
        console.log('   ✅ No issues reported');
      }
    } else {
      console.log('   ❌ No formatted output received');
    }

    console.log('\n✅ Test completed successfully!\n');

  } catch (error) {
    console.error('💥 Test failed:', error);
    if (error.cause) {
      console.error('   Cause:', error.cause);
    }
    process.exit(1);
  }
}

// Run the test
testSection11DictationFlow()
  .then(() => {
    console.log('✨ All tests completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test execution failed:', error);
    process.exit(1);
  });

