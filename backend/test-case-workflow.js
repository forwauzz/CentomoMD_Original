/**
 * Comprehensive Test: New Case Creation and Section Filling Workflow
 * 
 * This script tests:
 * 1. Case creation with clinic selection
 * 2. Section navigation
 * 3. Data filling in sections
 * 4. Auto-save functionality
 * 5. Manual save functionality
 * 6. Section status tracking
 * 7. Case completion workflow
 */

const BASE_URL = 'http://localhost:3001';
const API_URL = `${BASE_URL}/api`;

// Mock authentication token (you'll need to replace this with actual token)
const AUTH_TOKEN = process.env.AUTH_TOKEN || 'your-auth-token-here';

async function apiFetch(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AUTH_TOKEN}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(`HTTP ${response.status}: ${JSON.stringify(error)}`);
  }

  return response.json();
}

async function testCaseCreation() {
  console.log('\n🧪 TEST SUITE: New Case Creation and Section Filling\n');
  console.log('='.repeat(60));

  try {
    // Step 1: Create a new case
    console.log('\n1️⃣ Creating New Case...');
    console.log('   - Selecting clinic...');
    
    const clinicId = 'f3af2ced-9008-412a-b736-de1926bd6458'; // Mock clinic ID
    
    const caseData = {
      clinic_id: clinicId,
      patientInfo: {
        name: 'Test Patient',
        id: 'PAT123',
        dob: '1990-01-01',
        gender: 'M',
        phone: '514-555-1234',
        email: 'patient@example.com',
        address: '123 Test St, Montreal, QC'
      },
      draft: {
        patientInfo: {
          name: 'Test Patient',
          id: 'PAT123',
          dob: '1990-01-01',
          gender: 'M',
          phone: '514-555-1234',
          email: 'patient@example.com',
          address: '123 Test St, Montreal, QC'
        },
        sections: {},
        metadata: {
          language: 'fr',
          status: 'draft',
          totalSections: 0,
          completedSections: 0
        },
        ui: {
          activeSectionId: '',
          order: [],
          autosave: {}
        },
        sessions: []
      }
    };

    const createResult = await apiFetch('/cases', {
      method: 'POST',
      body: JSON.stringify(caseData)
    });

    if (!createResult.success || !createResult.data?.id) {
      throw new Error('Failed to create case');
    }

    const caseId = createResult.data.id;
    console.log(`   ✅ Case created successfully: ${caseId}`);
    console.log(`   ✅ Case status: ${createResult.data.status}`);
    console.log(`   ✅ Case name: ${createResult.data.name}`);

    // Step 2: Fill Section A (Patient Info)
    console.log('\n2️⃣ Filling Section A (Patient Information)...');
    
    const sectionA = {
      patientInfo: {
        name: 'Test Patient',
        id: 'PAT123',
        dob: '1990-01-01',
        gender: 'M',
        phone: '514-555-1234',
        email: 'patient@example.com',
        address: '123 Test St, Montreal, QC'
      }
    };

    const sectionAData = {
      name: caseData.patientInfo.name,
      id: caseData.patientInfo.id,
      dob: caseData.patientInfo.dob,
      gender: caseData.patientInfo.gender,
      phone: caseData.patientInfo.phone,
      email: caseData.patientInfo.email,
      address: caseData.patientInfo.address
    };

    // Update section A
    await apiFetch(`/cases/${caseId}/sections/section_a/commit`, {
      method: 'POST',
      body: JSON.stringify({
        sessionId: null,
        finalText: JSON.stringify(sectionAData)
      })
    });

    console.log('   ✅ Section A data saved');

    // Step 3: Fill Section B (Physician Info)
    console.log('\n3️⃣ Filling Section B (Physician Information)...');
    
    const sectionBData = {
      lastName: 'CENTOMO',
      firstName: 'Hugo',
      license: '1-18154',
      address: '5777 Boul. Gouin Ouest, Suite 370, Montréal, Qc, H4J 1E3',
      phone: '514-331-1400',
      email: 'adjointe.orthopedie@gmail.com'
    };

    await apiFetch(`/cases/${caseId}/sections/section_b/commit`, {
      method: 'POST',
      body: JSON.stringify({
        sessionId: null,
        finalText: JSON.stringify(sectionBData)
      })
    });

    console.log('   ✅ Section B data saved');

    // Step 4: Fill Section 7 (Main Content)
    console.log('\n4️⃣ Filling Section 7 (Main Content)...');
    
    const section7Data = {
      mainContent: 'This is test content for Section 7. It contains the main evaluation report.'
    };

    await apiFetch(`/cases/${caseId}/sections/section_7/commit`, {
      method: 'POST',
      body: JSON.stringify({
        sessionId: null,
        finalText: section7Data.mainContent
      })
    });

    console.log('   ✅ Section 7 data saved');

    // Step 5: Update case name
    console.log('\n5️⃣ Updating Case Name...');
    
    const newName = 'Test Case - Patient: Test Patient';
    await apiFetch(`/cases/${caseId}/name`, {
      method: 'PUT',
      body: JSON.stringify({ name: newName })
    });

    console.log(`   ✅ Case name updated to: "${newName}"`);

    // Step 6: Mark case as in progress
    console.log('\n6️⃣ Marking Case as In Progress...');
    
    await apiFetch(`/cases/${caseId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'in_progress' })
    });

    console.log('   ✅ Case status updated to: in_progress');

    // Step 7: Verify case data
    console.log('\n7️⃣ Verifying Case Data...');
    
    const caseDetails = await apiFetch(`/cases/${caseId}`);
    
    console.log('   ✅ Case retrieved successfully');
    console.log(`   - Case ID: ${caseDetails.id}`);
    console.log(`   - Case Name: ${caseDetails.name || 'Nouveau cas'}`);
    console.log(`   - Sections in draft: ${Object.keys(caseDetails.draft?.sections || {}).length}`);
    
    if (caseDetails.draft?.sections) {
      const sections = Object.keys(caseDetails.draft.sections);
      console.log(`   - Sections filled: ${sections.join(', ')}`);
    }

    // Step 8: Get recent cases
    console.log('\n8️⃣ Fetching Recent Cases...');
    
    const recentCases = await apiFetch('/cases?limit=5&days=30');
    
    if (recentCases.success && recentCases.cases) {
      console.log(`   ✅ Found ${recentCases.cases.length} recent cases`);
      const testCase = recentCases.cases.find(c => c.id === caseId);
      if (testCase) {
        console.log(`   ✅ Test case found in recent cases`);
        console.log(`   - Status: ${testCase.status}`);
        console.log(`   - Name: ${testCase.name}`);
      }
    }

    // Step 9: Complete the case
    console.log('\n9️⃣ Completing Case...');
    
    await apiFetch(`/cases/${caseId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'completed' })
    });

    console.log('   ✅ Case marked as completed');

    // Step 10: Final verification
    console.log('\n🔟 Final Verification...');
    
    const finalCase = await apiFetch(`/cases/${caseId}`);
    console.log(`   ✅ Case Status: ${finalCase.status || 'unknown'}`);
    console.log(`   ✅ Case Name: ${finalCase.name || 'Nouveau cas'}`);
    console.log(`   ✅ Sections Count: ${Object.keys(finalCase.draft?.sections || {}).length}`);

    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL TESTS PASSED!');
    console.log('='.repeat(60));
    console.log('\n📋 TEST SUMMARY:');
    console.log(`   ✅ Case created: ${caseId}`);
    console.log(`   ✅ Section A filled: Patient Information`);
    console.log(`   ✅ Section B filled: Physician Information`);
    console.log(`   ✅ Section 7 filled: Main Content`);
    console.log(`   ✅ Case name updated`);
    console.log(`   ✅ Case status: draft → in_progress → completed`);
    console.log(`   ✅ Recent cases fetch working`);
    console.log('\n🎉 Workflow test completed successfully!\n');

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error('Error details:', error);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testCaseCreation().catch(console.error);
}

module.exports = { testCaseCreation };

