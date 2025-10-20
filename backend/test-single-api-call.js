// Simple test to trigger a single API call and see backend logs
const testCaseId = `test-case-${Date.now()}`;
const testSession = {
  sectionId: "section_7",
  transcript: "Test transcript for debugging",
  metadata: {
    mode: "smart_dictation",
    template: "section7-ai-formatter",
    language: "fr-CA",
    timestamp: new Date().toISOString()
  }
};

console.log('🧪 Testing single session creation...');
console.log('Test Case ID:', testCaseId);
console.log('Test Session:', JSON.stringify(testSession, null, 2));

fetch('http://localhost:3001/api/sessions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(testSession)
})
.then(response => response.json())
.then(data => {
  console.log('✅ Session creation response:', data);
  
  if (data.id) {
    console.log('\n🧪 Testing section commit...');
    return fetch(`http://localhost:3001/api/cases/${testCaseId}/sections/section_7/commit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId: data.id,
        finalText: testSession.transcript
      })
    });
  } else {
    throw new Error('No session ID returned');
  }
})
.then(response => response.json())
.then(data => {
  console.log('✅ Section commit response:', data);
})
.catch(error => {
  console.error('❌ Test failed:', error.message);
});
