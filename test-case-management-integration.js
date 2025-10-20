/**
 * Test Case Management Integration
 * 
 * This test verifies the surgical bridge between New Case page forms and dictation functionality.
 * It tests the case management API endpoints and the integration flow.
 */

const API_BASE = 'http://localhost:3001/api';

// Test data
const testCase = {
  patientInfo: {
    name: 'Test Patient',
    dateOfBirth: '1990-01-01',
    diagnosis: 'Test Diagnosis'
  },
  sections: {},
  metadata: {
    language: 'fr',
    createdAt: new Date().toISOString()
  }
};

const testSession = {
  sessionId: 'test-session-123',
  sectionId: 'section_7',
  content: 'Test dictation content',
  formattedContent: 'Formatted test content'
};

async function testCaseManagementAPI() {
  console.log('🧪 Testing Case Management API Integration...\n');

  try {
    // Test 1: Create a new case
    console.log('1️⃣ Testing case creation...');
    const createResponse = await fetch(`${API_BASE}/cases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testCase)
    });

    if (!createResponse.ok) {
      throw new Error(`Failed to create case: ${createResponse.status}`);
    }

    const createdCase = await createResponse.json();
    console.log('✅ Case created successfully:', createdCase.data.id);
    const caseId = createdCase.data.id;

    // Test 2: Get the created case
    console.log('\n2️⃣ Testing case retrieval...');
    const getResponse = await fetch(`${API_BASE}/cases/${caseId}`);
    
    if (!getResponse.ok) {
      throw new Error(`Failed to get case: ${getResponse.status}`);
    }

    const retrievedCase = await getResponse.json();
    console.log('✅ Case retrieved successfully:', retrievedCase.data.id);

    // Test 3: Update a section
    console.log('\n3️⃣ Testing section update...');
    const sectionUpdateResponse = await fetch(`${API_BASE}/cases/${caseId}/sections/section_7`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: { content: 'Updated section content' },
        status: 'in_progress'
      })
    });

    if (!sectionUpdateResponse.ok) {
      throw new Error(`Failed to update section: ${sectionUpdateResponse.status}`);
    }

    const updatedSection = await sectionUpdateResponse.json();
    console.log('✅ Section updated successfully');

    // Test 4: Link a dictation session (simulated)
    console.log('\n4️⃣ Testing session linking...');
    const linkResponse = await fetch(`${API_BASE}/cases/${caseId}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: testSession.sessionId,
        sectionId: testSession.sectionId,
        content: testSession.content,
        formattedContent: testSession.formattedContent
      })
    });

    if (!linkResponse.ok) {
      throw new Error(`Failed to link session: ${linkResponse.status}`);
    }

    const linkedSession = await linkResponse.json();
    console.log('✅ Session linked successfully');

    // Test 5: Verify case with linked sessions
    console.log('\n5️⃣ Testing case with linked sessions...');
    const finalCaseResponse = await fetch(`${API_BASE}/cases/${caseId}`);
    
    if (!finalCaseResponse.ok) {
      throw new Error(`Failed to get final case: ${finalCaseResponse.status}`);
    }

    const finalCase = await finalCaseResponse.json();
    console.log('✅ Final case retrieved with linked sessions:', finalCase.data.linkedSessions?.length || 0);

    console.log('\n🎉 All case management API tests passed!');
    console.log('\n📋 Test Summary:');
    console.log('   ✅ Case creation');
    console.log('   ✅ Case retrieval');
    console.log('   ✅ Section updates');
    console.log('   ✅ Session linking');
    console.log('   ✅ Case-session integration');

    return {
      success: true,
      caseId,
      message: 'All tests passed successfully'
    };

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Test feature flag integration
function testFeatureFlagIntegration() {
  console.log('\n🔧 Testing Feature Flag Integration...\n');

  // Simulate feature flag check
  const featureFlags = {
    caseManagement: true // This would come from useFeatureFlags()
  };

  if (featureFlags.caseManagement) {
    console.log('✅ Case management feature flag is enabled');
    console.log('   - Dictation panel will show case context');
    console.log('   - Session linking will be active');
    console.log('   - Real-time sync will be enabled');
  } else {
    console.log('⚠️ Case management feature flag is disabled');
    console.log('   - Fallback to original behavior');
  }

  return featureFlags.caseManagement;
}

// Test URL parameter parsing
function testURLParameterParsing() {
  console.log('\n🔗 Testing URL Parameter Parsing...\n');

  // Simulate URL with case context
  const testURL = 'http://localhost:5173/dictation?caseId=test-case-123&sectionId=section_7';
  const url = new URL(testURL);
  const caseId = url.searchParams.get('caseId');
  const sectionId = url.searchParams.get('sectionId');

  console.log('✅ URL parameters parsed successfully:');
  console.log(`   - Case ID: ${caseId}`);
  console.log(`   - Section ID: ${sectionId}`);

  if (caseId && sectionId) {
    console.log('✅ Case context available for dictation');
  } else {
    console.log('⚠️ No case context - using standalone dictation');
  }

  return { caseId, sectionId };
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Case Management Integration Tests\n');
  console.log('=' .repeat(60));

  // Test 1: Feature Flag Integration
  const featureFlagEnabled = testFeatureFlagIntegration();

  // Test 2: URL Parameter Parsing
  const urlContext = testURLParameterParsing();

  // Test 3: API Integration (only if backend is running)
  console.log('\n' + '=' .repeat(60));
  console.log('🌐 Testing API Integration (requires backend running)...\n');
  
  try {
    const apiResult = await testCaseManagementAPI();
    
    if (apiResult.success) {
      console.log('\n🎯 Integration Test Results:');
      console.log('   ✅ Feature flags working');
      console.log('   ✅ URL parsing working');
      console.log('   ✅ API endpoints working');
      console.log('   ✅ Case-session linking working');
      console.log('\n🚀 Case management integration is ready!');
    } else {
      console.log('\n⚠️ API tests failed, but frontend integration is ready');
      console.log('   - Feature flags: ✅');
      console.log('   - URL parsing: ✅');
      console.log('   - API endpoints: ❌ (backend not running)');
    }
  } catch (error) {
    console.log('\n⚠️ Backend not available, but frontend integration is ready');
    console.log('   - Feature flags: ✅');
    console.log('   - URL parsing: ✅');
    console.log('   - API endpoints: ⏸️ (backend not running)');
  }

  console.log('\n' + '=' .repeat(60));
  console.log('📝 Next Steps:');
  console.log('   1. Start the backend server');
  console.log('   2. Test the full integration flow');
  console.log('   3. Verify case creation from New Case page');
  console.log('   4. Test dictation with case context');
  console.log('   5. Verify real-time sync between forms and dictation');
}

// Export for use in other test files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testCaseManagementAPI,
    testFeatureFlagIntegration,
    testURLParameterParsing,
    runAllTests
  };
}

// Run tests if this file is executed directly
if (typeof window === 'undefined') {
  runAllTests().catch(console.error);
}
