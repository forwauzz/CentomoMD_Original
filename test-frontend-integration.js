/**
 * Frontend Integration Test
 * Tests the complete frontend-backend integration for feedback sync
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🧪 Frontend Integration Test');
console.log('============================\n');

// Test configuration
const tests = [
  {
    name: 'Feature Flag Configuration',
    description: 'Verify feature flags are properly configured',
    test: () => testFeatureFlags(),
  },
  {
    name: 'Frontend Build',
    description: 'Verify frontend builds without errors',
    test: () => testFrontendBuild(),
  },
  {
    name: 'TypeScript Compilation',
    description: 'Verify TypeScript compilation passes',
    test: () => testTypeScriptCompilation(),
  },
  {
    name: 'Component Integration',
    description: 'Verify all components integrate properly',
    test: () => testComponentIntegration(),
  },
];

async function testFeatureFlags() {
  console.log('🔧 Testing feature flag configuration...');
  
  try {
    // Check if feature flag files exist and have correct structure
    const fs = await import('fs');
    const path = await import('path');
    
    const frontendFlagsPath = path.join(__dirname, 'frontend/src/lib/featureFlags.ts');
    const backendFlagsPath = path.join(__dirname, 'backend/src/config/flags.ts');
    const envExamplePath = path.join(__dirname, 'env.example');
    
    // Check frontend flags
    if (!fs.existsSync(frontendFlagsPath)) {
      throw new Error('Frontend feature flags file not found');
    }
    
    const frontendFlags = fs.readFileSync(frontendFlagsPath, 'utf8');
    if (!frontendFlags.includes('feedbackServerSync')) {
      throw new Error('Frontend feedbackServerSync flag not found');
    }
    
    // Check backend flags
    if (!fs.existsSync(backendFlagsPath)) {
      throw new Error('Backend feature flags file not found');
    }
    
    const backendFlags = fs.readFileSync(backendFlagsPath, 'utf8');
    if (!backendFlags.includes('FEATURE_FEEDBACK_SERVER_SYNC')) {
      throw new Error('Backend FEATURE_FEEDBACK_SERVER_SYNC flag not found');
    }
    
    // Check env.example
    if (!fs.existsSync(envExamplePath)) {
      throw new Error('env.example file not found');
    }
    
    const envExample = fs.readFileSync(envExamplePath, 'utf8');
    if (!envExample.includes('FEATURE_FEEDBACK_SERVER_SYNC') || !envExample.includes('VITE_FEATURE_FEEDBACK_SERVER_SYNC')) {
      throw new Error('Feature flag environment variables not documented in env.example');
    }
    
    console.log('✅ Feature flags properly configured');
    return { success: true, details: 'All feature flag files exist and contain required flags' };
    
  } catch (error) {
    console.log('❌ Feature flag configuration failed:', error.message);
    return { success: false, error: error.message };
  }
}

async function testFrontendBuild() {
  console.log('🏗️  Testing frontend build...');
  
  return new Promise((resolve) => {
    const build = spawn('npm', ['run', 'build'], {
      cwd: join(__dirname, 'frontend'),
      stdio: 'pipe',
      shell: true,
    });
    
    let output = '';
    let errorOutput = '';
    
    build.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    build.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    build.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Frontend build successful');
        resolve({ success: true, details: 'Frontend builds without errors' });
      } else {
        console.log('❌ Frontend build failed');
        console.log('Build output:', output);
        console.log('Build errors:', errorOutput);
        resolve({ success: false, error: `Build failed with code ${code}` });
      }
    });
    
    build.on('error', (error) => {
      console.log('❌ Frontend build error:', error.message);
      resolve({ success: false, error: error.message });
    });
  });
}

async function testTypeScriptCompilation() {
  console.log('📝 Testing TypeScript compilation...');
  
  return new Promise((resolve) => {
    const tsc = spawn('npx', ['tsc', '--noEmit'], {
      cwd: join(__dirname, 'frontend'),
      stdio: 'pipe',
      shell: true,
    });
    
    let output = '';
    let errorOutput = '';
    
    tsc.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    tsc.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    tsc.on('close', (code) => {
      if (code === 0) {
        console.log('✅ TypeScript compilation successful');
        resolve({ success: true, details: 'No TypeScript errors found' });
      } else {
        console.log('❌ TypeScript compilation failed');
        console.log('TypeScript output:', output);
        console.log('TypeScript errors:', errorOutput);
        resolve({ success: false, error: `TypeScript compilation failed with code ${code}` });
      }
    });
    
    tsc.on('error', (error) => {
      console.log('❌ TypeScript compilation error:', error.message);
      resolve({ success: false, error: error.message });
    });
  });
}

async function testComponentIntegration() {
  console.log('🧩 Testing component integration...');
  
  try {
    const fs = await import('fs');
    const path = await import('path');
    
    // Check if all required components exist
    const components = [
      'frontend/src/services/feedbackSyncService.ts',
      'frontend/src/components/feedback/SyncStatusIndicator.tsx',
      'frontend/src/stores/feedbackStore.ts',
      'frontend/src/types/feedback.ts',
    ];
    
    const missingComponents = [];
    const existingComponents = [];
    
    for (const component of components) {
      const componentPath = path.join(__dirname, component);
      if (fs.existsSync(componentPath)) {
        existingComponents.push(component);
      } else {
        missingComponents.push(component);
      }
    }
    
    if (missingComponents.length > 0) {
      throw new Error(`Missing components: ${missingComponents.join(', ')}`);
    }
    
    // Check if components have proper imports and exports
    const syncServicePath = path.join(__dirname, 'frontend/src/services/feedbackSyncService.ts');
    const syncServiceContent = fs.readFileSync(syncServicePath, 'utf8');
    
    if (!syncServiceContent.includes('export const feedbackSyncService')) {
      throw new Error('FeedbackSyncService not properly exported');
    }
    
    const storePath = path.join(__dirname, 'frontend/src/stores/feedbackStore.ts');
    const storeContent = fs.readFileSync(storePath, 'utf8');
    
    if (!storeContent.includes('feedbackSyncService')) {
      throw new Error('FeedbackStore not importing FeedbackSyncService');
    }
    
    if (!storeContent.includes('syncPendingItems') || !storeContent.includes('syncItem')) {
      throw new Error('FeedbackStore missing sync methods');
    }
    
    console.log('✅ Component integration successful');
    return { 
      success: true, 
      details: `All ${existingComponents.length} components exist and integrate properly` 
    };
    
  } catch (error) {
    console.log('❌ Component integration failed:', error.message);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  const results = [];
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    console.log(`\n📋 ${test.name}`);
    console.log(`   ${test.description}`);
    
    try {
      const result = await test.test();
      results.push({ ...test, result });
      
      if (result.success) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.log('❌ Test execution failed:', error.message);
      results.push({ ...test, result: { success: false, error: error.message } });
      failed++;
    }
  }
  
  // Summary
  console.log('\n📊 Test Summary');
  console.log('================');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
  
  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    results
      .filter(r => !r.result.success)
      .forEach(r => {
        console.log(`   • ${r.name}: ${r.result.error}`);
      });
  }
  
  console.log('\n🎯 Integration Status:');
  if (failed === 0) {
    console.log('✅ All tests passed! Frontend integration is ready.');
  } else {
    console.log('⚠️  Some tests failed. Please fix the issues before proceeding.');
  }
  
  return { passed, failed, results };
}

// Run tests
runTests().catch(console.error);
