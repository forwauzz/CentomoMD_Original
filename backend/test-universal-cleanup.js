// Test Universal Cleanup with French medical transcript
const testTranscript = `Le 11 juillet 2024, avec des séquelles et des limitations. On va regarder ça ensemble, on va réviser votre dossier et après ça je vais vous examiner les deux jambes pour comparer, pour voir justement s'il y a des séquelles, des cicatrices, ces affaires. Pour commencer, vous, est-ce que vous avez des allergies à des médicaments plus gros? Non. Vous êtes droitier ou gaucher? Droitier. Droitier. Est-ce que vous consommez de l'alcool? Oui. Occasionnellement ou régulièrement? Régulièrement. Puis est-ce que vous consommez du cannabis? Non. Non. Puis est-ce que vous fumez? Non, j'ai quitté de fumer pendant mon accident, mon arrivée. Depuis 2023, vous avez arrêté de fumer. Félicitations.`;

const testData = {
  transcript: testTranscript,
  language: "fr",
  section: "7",
  useUniversal: true
};

console.log('🧪 Testing Universal Cleanup with French medical transcript...');
console.log('📝 Transcript length:', testTranscript.length, 'characters');
console.log('🌍 Language:', testData.language);
console.log('📋 Section:', testData.section);
console.log('🔧 Universal Cleanup:', testData.useUniversal);

// Make the API call
fetch('http://localhost:3001/api/format/mode2', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(testData)
})
.then(response => response.json())
.then(data => {
  console.log('\n✅ Universal Cleanup Response:');
  console.log('📊 Formatted text length:', data.formatted?.length || 0);
  console.log('🏥 Clinical entities:', data.clinical_entities ? Object.keys(data.clinical_entities) : 'None');
  console.log('⚠️ Issues:', data.issues || []);
  console.log('📈 Confidence score:', data.confidence_score);
  console.log('🔍 Shadow comparison:', data.shadowComparison ? 'Available' : 'Not available');
  
  if (data.shadowComparison) {
    console.log('\n🔍 Shadow Comparison Results:');
    console.log('📊 Legacy vs Universal checksums match:', data.shadowComparison.checksumsMatch);
    console.log('🏥 Clinical entities comparison:', data.shadowComparison.clinicalEntitiesComparison);
  }
  
  console.log('\n📝 Formatted text preview:');
  console.log(data.formatted?.substring(0, 200) + '...');
})
.catch(error => {
  console.error('❌ Error testing Universal Cleanup:', error.message);
});