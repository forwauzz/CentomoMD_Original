/**
 * Browser Console Testing Script for Dictation Save Flow
 * 
 * Instructions:
 * 1. Open browser console (F12)
 * 2. Copy and paste this entire script
 * 3. Press Enter to run
 * 4. Check results in console
 */

console.log('🧪 Starting Browser Console Tests for Dictation Save Flow');

// Test 1: Check if we're on the right page
function testCurrentPage() {
  console.log('\n📄 Testing Current Page...');
  
  const currentUrl = window.location.href;
  console.log('Current URL:', currentUrl);
  
  if (currentUrl.includes('/case/new')) {
    console.log('✅ On New Case page - should see dictation panel with "Go to Dictation" button only');
  } else if (currentUrl.includes('/dictation')) {
    console.log('✅ On Dictation page - should see enhanced save functionality');
  } else {
    console.log('⚠️  Not on expected page. Navigate to /case/new or /dictation');
  }
}

// Test 2: Check feature flag
function testFeatureFlag() {
  console.log('\n🚩 Testing Feature Flag...');
  
  const featureFlag = import.meta.env.VITE_ENABLE_SCHEMA_DRIVEN_FORMS;
  console.log('Feature Flag Value:', featureFlag);
  
  if (featureFlag === 'true') {
    console.log('✅ Feature flag is enabled');
  } else {
    console.log('❌ Feature flag is disabled or not set');
  }
}

// Test 3: Check if schema is loaded
function testSchemaLoading() {
  console.log('\n📋 Testing Schema Loading...');
  
  // Try to access the schema through the formSchema utility
  try {
    // This will only work if the schema is loaded
    console.log('Schema loading test - check if formSchema is available');
    console.log('Note: This test requires the schema to be loaded in the current page context');
  } catch (error) {
    console.log('⚠️  Schema test requires page context');
  }
}

// Test 4: Check for Save to Section elements
function testSaveToSectionElements() {
  console.log('\n💾 Testing Save to Section Elements...');
  
  // Look for save buttons
  const saveButtons = document.querySelectorAll('button');
  const saveButtonsText = Array.from(saveButtons).map(btn => btn.textContent?.trim()).filter(text => 
    text && (text.includes('Save') || text.includes('Sauvegarder'))
  );
  
  console.log('Found save buttons:', saveButtonsText);
  
  if (saveButtonsText.length > 0) {
    console.log('✅ Save buttons found');
  } else {
    console.log('❌ No save buttons found');
  }
  
  // Look for dictation panel
  const dictationPanel = document.querySelector('[class*="dictation"], [class*="Dictation"]');
  if (dictationPanel) {
    console.log('✅ Dictation panel found');
  } else {
    console.log('❌ Dictation panel not found');
  }
}

// Test 5: Check for template elements
function testTemplateElements() {
  console.log('\n📝 Testing Template Elements...');
  
  const templateElements = document.querySelectorAll('[class*="template"], [class*="Template"]');
  console.log('Template elements found:', templateElements.length);
  
  if (templateElements.length > 0) {
    console.log('✅ Template elements found');
  } else {
    console.log('⚠️  No template elements found (may be normal depending on page)');
  }
}

// Test 6: Check for section navigation
function testSectionNavigation() {
  console.log('\n🧭 Testing Section Navigation...');
  
  const sectionElements = document.querySelectorAll('[class*="section"], [class*="Section"]');
  console.log('Section elements found:', sectionElements.length);
  
  if (sectionElements.length > 0) {
    console.log('✅ Section elements found');
  } else {
    console.log('❌ No section elements found');
  }
}

// Test 7: Check for errors in console
function testConsoleErrors() {
  console.log('\n🚨 Testing Console Errors...');
  
  // This is a basic check - in a real scenario, you'd want to check for actual errors
  console.log('Console error check - look for any red error messages above');
  console.log('If you see any errors, they should be addressed before testing');
}

// Test 8: Check network requests
function testNetworkRequests() {
  console.log('\n🌐 Testing Network Requests...');
  
  console.log('Network test - check Network tab in DevTools for:');
  console.log('- POST requests to /api/sessions');
  console.log('- POST requests to /api/cases/*/sections/*/commit');
  console.log('- POST requests to /api/format/merge/section11');
  console.log('- GET requests to /cnesst_204.schema.json');
}

// Run all tests
function runAllBrowserTests() {
  console.log('🚀 Starting Browser Console Tests\n');
  
  testCurrentPage();
  testFeatureFlag();
  testSchemaLoading();
  testSaveToSectionElements();
  testTemplateElements();
  testSectionNavigation();
  testConsoleErrors();
  testNetworkRequests();
  
  console.log('\n' + '='.repeat(50));
  console.log('🏁 Browser Console Tests Complete');
  console.log('\nNext Steps:');
  console.log('1. Navigate to /case/new and test dictation panel');
  console.log('2. Navigate to /dictation and test save functionality');
  console.log('3. Check backend terminal for API logs');
  console.log('4. Use the manual testing script for detailed testing');
}

// Auto-run the tests
runAllBrowserTests();
