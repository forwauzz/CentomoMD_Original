// Simple test to create a single session and see the error
console.log('🧪 Testing single session creation...');

fetch('http://localhost:3001/api/sessions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    sectionId: "section_7",
    transcript: "Test transcript for debugging",
    metadata: {
      mode: "smart_dictation",
      template: "section7-ai-formatter",
      language: "fr-CA",
      timestamp: new Date().toISOString()
    }
  })
})
.then(response => response.json())
.then(data => {
  console.log('✅ Session creation response:', data);
  
  if (data.id && data.id.startsWith('session_')) {
    console.log('❌ Still using stub behavior - database operation failed');
  } else if (data.id && data.id.includes('-')) {
    console.log('✅ Real database operation - got UUID:', data.id);
  }
})
.catch(error => {
  console.error('❌ Error:', error.message);
});
