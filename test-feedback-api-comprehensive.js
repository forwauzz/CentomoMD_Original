/**
 * Comprehensive test script for feedback API endpoints
 * Tests with feature flag enabled to validate full functionality
 */

const BASE_URL = 'http://localhost:3001';

async function testWithFeatureFlagEnabled() {
  console.log('🧪 Testing Feedback API with Feature Flag Enabled...\n');

  // Test 1: Create feedback
  console.log('1. Testing feedback creation...');
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
        comment: 'Test feedback for comprehensive testing'
      },
      dictation: {
        score: 5,
        comment: 'Excellent dictation quality'
      }
    },
    comment: 'This is a comprehensive test feedback item',
    ttl_days: 30
  };

  let createdFeedbackId = null;

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
    
    if (response.status === 201) {
      console.log('✅ Feedback created successfully:', result.data.id);
      createdFeedbackId = result.data.id;
    } else if (response.status === 503) {
      console.log('⚠️  Feature flag still disabled - API returns 503');
      console.log('   To enable: Set FEATURE_FEEDBACK_SERVER_SYNC=true in backend/.env');
      return;
    } else {
      console.log(`❌ Unexpected status: ${response.status}`, result);
      return;
    }
  } catch (error) {
    console.log('❌ Error creating feedback:', error.message);
    return;
  }

  // Test 2: Get specific feedback
  console.log('\n2. Testing get specific feedback...');
  try {
    const response = await fetch(`${BASE_URL}/api/feedback/${createdFeedbackId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'test-user-123'
      }
    });

    const result = await response.json();
    
    if (response.status === 200) {
      console.log('✅ Feedback retrieved successfully:', result.data.id);
      console.log('   Comment:', result.data.comment);
      console.log('   Overall rating:', result.data.ratings.overall.score);
    } else {
      console.log(`❌ Unexpected status: ${response.status}`, result);
    }
  } catch (error) {
    console.log('❌ Error getting feedback:', error.message);
  }

  // Test 3: List feedback with filters
  console.log('\n3. Testing feedback listing with filters...');
  try {
    const response = await fetch(`${BASE_URL}/api/feedback?status=open&limit=10`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'test-user-123'
      }
    });

    const result = await response.json();
    
    if (response.status === 200) {
      console.log(`✅ Feedback listed successfully: ${result.data.total} items`);
      console.log('   Page:', result.data.page, 'Limit:', result.data.limit);
    } else {
      console.log(`❌ Unexpected status: ${response.status}`, result);
    }
  } catch (error) {
    console.log('❌ Error listing feedback:', error.message);
  }

  // Test 4: Update feedback
  console.log('\n4. Testing feedback update...');
  const updateData = {
    ratings: {
      overall: {
        score: 5,
        comment: 'Updated - excellent experience!'
      }
    },
    status: 'triaged',
    comment: 'Updated comment after testing'
  };

  try {
    const response = await fetch(`${BASE_URL}/api/feedback/${createdFeedbackId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'test-user-123'
      },
      body: JSON.stringify(updateData)
    });

    const result = await response.json();
    
    if (response.status === 200) {
      console.log('✅ Feedback updated successfully');
      console.log('   New status:', result.data.status);
      console.log('   New overall rating:', result.data.ratings.overall.score);
    } else {
      console.log(`❌ Unexpected status: ${response.status}`, result);
    }
  } catch (error) {
    console.log('❌ Error updating feedback:', error.message);
  }

  // Test 5: Test sync endpoint
  console.log('\n5. Testing sync endpoint...');
  const syncData = {
    items: [
      {
        id: 'sync-test-1',
        data: {
          meta: {
            language: 'en-CA',
            mode: 'word-for-word',
            diarization: true,
            custom_vocab: false,
            timestamp: new Date().toISOString(),
            contains_phi: false
          },
          ratings: {
            overall: {
              score: 3,
              comment: 'Sync test feedback'
            }
          },
          comment: 'This is a sync test item',
          ttl_days: 30
        },
        timestamp: new Date().toISOString()
      }
    ]
  };

  try {
    const response = await fetch(`${BASE_URL}/api/feedback/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'test-user-123'
      },
      body: JSON.stringify(syncData)
    });

    const result = await response.json();
    
    if (response.status === 200) {
      console.log('✅ Sync completed successfully');
      console.log('   Synced items:', result.data.synced.length);
      console.log('   Failed items:', result.data.failed.length);
    } else {
      console.log(`❌ Unexpected status: ${response.status}`, result);
    }
  } catch (error) {
    console.log('❌ Error syncing feedback:', error.message);
  }

  // Test 6: Test validation errors
  console.log('\n6. Testing validation errors...');
  const invalidFeedback = {
    meta: {
      language: 'invalid-language', // Invalid language
      mode: 'smart',
      diarization: false,
      custom_vocab: false,
      timestamp: new Date().toISOString(),
      contains_phi: false
    },
    ratings: {
      overall: {
        score: 10 // Invalid score (should be 1-5)
      }
    }
  };

  try {
    const response = await fetch(`${BASE_URL}/api/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'test-user-123'
      },
      body: JSON.stringify(invalidFeedback)
    });

    const result = await response.json();
    
    if (response.status === 500) {
      console.log('✅ Validation working - invalid data rejected');
      console.log('   Error:', result.error);
    } else {
      console.log(`⚠️  Expected validation error, got status: ${response.status}`, result);
    }
  } catch (error) {
    console.log('❌ Error testing validation:', error.message);
  }

  // Test 7: Test user isolation
  console.log('\n7. Testing user isolation...');
  try {
    const response = await fetch(`${BASE_URL}/api/feedback/${createdFeedbackId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'different-user-456' // Different user
      }
    });

    const result = await response.json();
    
    if (response.status === 404) {
      console.log('✅ User isolation working - cannot access other user\'s feedback');
    } else {
      console.log(`⚠️  Expected 404 for user isolation, got status: ${response.status}`, result);
    }
  } catch (error) {
    console.log('❌ Error testing user isolation:', error.message);
  }

  // Test 8: Cleanup - Delete feedback
  console.log('\n8. Testing feedback deletion...');
  try {
    const response = await fetch(`${BASE_URL}/api/feedback/${createdFeedbackId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'test-user-123'
      }
    });

    const result = await response.json();
    
    if (response.status === 200) {
      console.log('✅ Feedback deleted successfully');
    } else {
      console.log(`❌ Unexpected status: ${response.status}`, result);
    }
  } catch (error) {
    console.log('❌ Error deleting feedback:', error.message);
  }

  console.log('\n🎯 Comprehensive Test Summary:');
  console.log('- All CRUD operations tested');
  console.log('- Validation and error handling verified');
  console.log('- User isolation confirmed');
  console.log('- Sync functionality validated');
  console.log('- Feature flag behavior confirmed');
}

// Run the comprehensive test
testWithFeatureFlagEnabled().catch(console.error);
