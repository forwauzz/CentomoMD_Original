#!/usr/bin/env node

/**
 * Debug test to check imports step by step
 */

console.log('🔍 Debug Import Test');
console.log('=' .repeat(30));

async function testImports() {
  try {
    console.log('1. Testing basic imports...');
    const path = await import('path');
    console.log('✅ path import works');
    
    console.log('2. Testing file system...');
    const fs = await import('fs');
    console.log('✅ fs import works');
    
    console.log('3. Checking hardened formatter file...');
    const hardenedPath = path.join(process.cwd(), 'src', 'services', 'formatter', 'section7AI-hardened.ts');
    console.log('Hardened file path:', hardenedPath);
    
    const exists = fs.existsSync(hardenedPath);
    console.log('File exists:', exists);
    
    if (exists) {
      console.log('4. Testing TypeScript file import...');
      try {
        const { Section7AIFormatter } = await import('./dist/src/services/formatter/section7AI-hardened.js');
        console.log('✅ Section7AIFormatter import works');
        console.log('Type:', typeof Section7AIFormatter);
      } catch (importError) {
        console.log('❌ Import failed:', importError.message);
        console.log('Error details:', importError);
      }
    }
    
    console.log('5. Testing guard imports...');
    try {
      const { Section7Guards } = await import('./dist/src/services/formatter/section7AI-hardened.js');
      console.log('✅ Section7Guards import works');
      console.log('Type:', typeof Section7Guards);
    } catch (importError) {
      console.log('❌ Guards import failed:', importError.message);
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
    console.log('Stack:', error.stack);
  }
}

testImports().then(() => {
  console.log('\n🎉 Debug test completed!');
}).catch(console.error);
