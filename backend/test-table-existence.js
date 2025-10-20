// Simple test to check if tables exist by trying to query them
const testCaseId = `test-case-${Date.now()}`;

console.log('🔍 Testing if cases table exists by trying to query it...');

// Try to get a case that doesn't exist - this will tell us if the table exists
fetch(`http://localhost:3001/api/cases/${testCaseId}`)
  .then(response => response.json())
  .then(data => {
    console.log('✅ Cases API response:', data);
    
    if (data.error && data.error.includes('not found')) {
      console.log('✅ Cases table exists (got "not found" error as expected)');
    } else if (data.status === 'found (stub fallback)') {
      console.log('❌ Cases table does not exist (falling back to stub)');
    } else {
      console.log('✅ Cases table exists and returned data:', data);
    }
  })
  .catch(error => {
    console.error('❌ Error testing cases table:', error.message);
  });

console.log('🔍 Testing if sessions table exists by trying to create one...');

// Try to create a session - this will tell us if the table exists
fetch('http://localhost:3001/api/sessions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    sectionId: "section_7",
    transcript: "Test transcript for table existence check",
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
  console.log('✅ Sessions API response:', data);
  
  if (data.id && data.id.startsWith('session_')) {
    console.log('❌ Sessions table does not exist (falling back to stub with ID:', data.id, ')');
  } else if (data.id && data.id.includes('-')) {
    console.log('✅ Sessions table exists (got UUID:', data.id, ')');
  } else {
    console.log('✅ Sessions table exists and returned data:', data);
  }
})
.catch(error => {
  console.error('❌ Error testing sessions table:', error.message);
});
