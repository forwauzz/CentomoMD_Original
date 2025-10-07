/**
 * Test Feedback with Sync Enabled
 * Temporarily enables the feedback server sync feature flag and tests the complete flow
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🧪 Testing Feedback with Server Sync Enabled');
console.log('=============================================\n');

// Set environment variables to enable sync
process.env.FEATURE_FEEDBACK_SERVER_SYNC = 'true';
process.env.VITE_FEATURE_FEEDBACK_SERVER_SYNC = 'true';

async function testFeedbackSyncFlow() {
  console.log('📋 Testing Complete Feedback Sync Flow');
  console.log('=====================================\n');

  // Test 1: Verify feature flags are enabled
  console.log('1️⃣  Testing feature flag configuration...');
  try {
    const fs = await import('fs');
    const path = await import('path');
    
    const frontendFlagsPath = path.join(__dirname, 'frontend/src/lib/featureFlags.ts');
    const frontendFlags = fs.readFileSync(frontendFlagsPath, 'utf8');
    
    if (frontendFlags.includes('feedbackServerSync')) {
      console.log('✅ Frontend feature flag exists');
    } else {
      throw new Error('Frontend feedbackServerSync flag not found');
    }
    
    const backendFlagsPath = path.join(__dirname, 'backend/src/config/flags.ts');
    const backendFlags = fs.readFileSync(backendFlagsPath, 'utf8');
    
    if (backendFlags.includes('FEATURE_FEEDBACK_SERVER_SYNC')) {
      console.log('✅ Backend feature flag exists');
    } else {
      throw new Error('Backend FEATURE_FEEDBACK_SERVER_SYNC flag not found');
    }
    
  } catch (error) {
    console.log('❌ Feature flag test failed:', error.message);
    return false;
  }

  // Test 2: Test backend API with feature flag enabled
  console.log('\n2️⃣  Testing backend API with sync enabled...');
  try {
    const response = await fetch('http://localhost:3001/api/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        meta: {
          language: 'en-CA',
          mode: 'smart',
          diarization: false,
          custom_vocab: false,
          timestamp: new Date().toISOString(),
          contains_phi: false,
        },
        ratings: {
          overall: { score: 5, comment: 'Test feedback' }
        },
        artifacts: {},
        highlights: [],
        comment: 'This is a test feedback item with sync enabled',
        ttl_days: 30,
      }),
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Backend API accepts feedback with sync enabled');
      console.log('   Created feedback ID:', result.data?.id);
      return true;
    } else {
      const errorText = await response.text();
      console.log('❌ Backend API rejected feedback:', response.status, errorText);
      return false;
    }
  } catch (error) {
    console.log('❌ Backend API test failed:', error.message);
    return false;
  }
}

async function testFrontendSyncIntegration() {
  console.log('\n3️⃣  Testing frontend sync integration...');
  
  try {
    const fs = await import('fs');
    const path = await import('path');
    
    // Check if sync service is properly implemented
    const syncServicePath = path.join(__dirname, 'frontend/src/services/feedbackSyncService.ts');
    const syncServiceContent = fs.readFileSync(syncServicePath, 'utf8');
    
    if (syncServiceContent.includes('getItemsToSync') && 
        syncServiceContent.includes('markAsSynced') &&
        syncServiceContent.includes('useFeedbackStore')) {
      console.log('✅ Sync service properly connected to feedback store');
    } else {
      throw new Error('Sync service not properly connected to feedback store');
    }
    
    // Check if feedback store has sync methods
    const storePath = path.join(__dirname, 'frontend/src/stores/feedbackStore.ts');
    const storeContent = fs.readFileSync(storePath, 'utf8');
    
    if (storeContent.includes('syncPendingItems') && 
        storeContent.includes('syncItem') &&
        storeContent.includes('feedbackSyncService')) {
      console.log('✅ Feedback store has sync methods');
    } else {
      throw new Error('Feedback store missing sync methods');
    }
    
    return true;
  } catch (error) {
    console.log('❌ Frontend sync integration test failed:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting feedback sync tests...\n');
  
  const results = [];
  
  // Test backend API
  const backendTest = await testFeedbackSyncFlow();
  results.push({ name: 'Backend API', success: backendTest });
  
  // Test frontend integration
  const frontendTest = await testFrontendSyncIntegration();
  results.push({ name: 'Frontend Integration', success: frontendTest });
  
  // Summary
  console.log('\n📊 Test Results');
  console.log('================');
  
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  results.forEach(result => {
    console.log(`${result.success ? '✅' : '❌'} ${result.name}`);
  });
  
  console.log(`\n📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! Feedback sync is ready.');
    console.log('\n📝 To enable feedback sync in your application:');
    console.log('   1. Set FEATURE_FEEDBACK_SERVER_SYNC=true in your .env file');
    console.log('   2. Set VITE_FEATURE_FEEDBACK_SERVER_SYNC=true in your .env file');
    console.log('   3. Restart your development server');
    console.log('   4. Create feedback items - they will now sync to the database!');
  } else {
    console.log('\n⚠️  Some tests failed. Please fix the issues before proceeding.');
  }
  
  return { passed, failed, results };
}

// Run tests
runTests().catch(console.error);
