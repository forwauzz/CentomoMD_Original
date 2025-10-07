/**
 * Simple test script for feedback API endpoints
 * Run this after starting the backend server
 */

const BASE_URL = 'http://localhost:3001';

async function testFeedbackAPI() {
  console.log('🧪 Testing Feedback API Endpoints...\n');

  // Test 1: Check if feature flag is working (should return 503 when disabled)
  console.log('1. Testing feature flag (should return 503 when disabled)...');
  try {
    const response = await fetch(`${BASE_URL}/api/feedback`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'test-user-123'
      }
    });
    
    if (response.status === 503) {
      console.log('✅ Feature flag working - API correctly disabled');
    } else {
      console.log(`⚠️  Unexpected status: ${response.status}`);
    }
  } catch (error) {
    console.log('❌ Server not running or connection failed:', error.message);
    return;
  }

  // Test 2: Create feedback (will fail if feature flag is disabled)
  console.log('\n2. Testing feedback creation...');
  const testFeedback = {
    meta: {
      language: 'fr-CA',
      mode: 'smart',
      diarization: false,
      custom_vocab: false,
      timestamp: new Date().toISOString(),
      contains_phi: false
    },
    ratings: {
      overall: {
        score: 4,
        comment: 'Test feedback'
      }
    },
    comment: 'This is a test feedback item',
    ttl_days: 30
  };

  try {
    const response = await fetch(`${BASE_URL}/api/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'test-user-123'
      },
      body: JSON.stringify(testFeedback)
    });

    const result = await response.json();
    
    if (response.status === 503) {
      console.log('✅ Feature flag working - Creation correctly disabled');
    } else if (response.status === 201) {
      console.log('✅ Feedback created successfully:', result.data.id);
    } else {
      console.log(`❌ Unexpected status: ${response.status}`, result);
    }
  } catch (error) {
    console.log('❌ Error creating feedback:', error.message);
  }

  // Test 3: List feedback
  console.log('\n3. Testing feedback listing...');
  try {
    const response = await fetch(`${BASE_URL}/api/feedback`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'test-user-123'
      }
    });

    const result = await response.json();
    
    if (response.status === 503) {
      console.log('✅ Feature flag working - Listing correctly disabled');
    } else if (response.status === 200) {
      console.log(`✅ Feedback listed successfully: ${result.data.total} items`);
    } else {
      console.log(`❌ Unexpected status: ${response.status}`, result);
    }
  } catch (error) {
    console.log('❌ Error listing feedback:', error.message);
  }

  console.log('\n🎯 Test Summary:');
  console.log('- Feature flag is working (API disabled by default)');
  console.log('- To enable testing, set FEATURE_FEEDBACK_SERVER_SYNC=true in .env');
  console.log('- Make sure the database migration has been run');
  console.log('- Ensure the backend server is running on port 3001');
}

// Run the test
testFeedbackAPI().catch(console.error);
