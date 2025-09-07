// Simple test to verify the layer system works correctly
const { LayerManager } = require('./dist/src/services/layers/LayerManager.js');

async function testLayerSystem() {
  console.log('🧪 Testing Layer System...\n');

  try {
    const layerManager = new LayerManager();
    
    // Test 1: Get default combination
    console.log('1. Default combination:', layerManager.getDefaultCombination());
    
    // Test 2: Validate template combinations
    const combinations = ['template-only', 'template-verbatim', 'template-full'];
    
    for (const combo of combinations) {
      console.log(`\n2. Testing combination: ${combo}`);
      const validation = layerManager.validateCombination(combo);
      console.log(`   Valid: ${validation.valid}`);
      if (!validation.valid) {
        console.log(`   Errors: ${validation.errors.join(', ')}`);
      }
      
      const enabledLayers = layerManager.getEnabledLayers(combo);
      console.log(`   Enabled layers: ${enabledLayers.map(l => l.name).join(', ') || 'none'}`);
    }
    
    // Test 3: Test fallback chain
    console.log('\n3. Testing fallback chain:');
    console.log(`   template-full → ${layerManager.getFallbackCombination('template-full')}`);
    console.log(`   template-verbatim → ${layerManager.getFallbackCombination('template-verbatim')}`);
    console.log(`   template-only → ${layerManager.getFallbackCombination('template-only')}`);
    
    console.log('\n✅ Layer system test completed successfully!');
    
  } catch (error) {
    console.error('❌ Layer system test failed:', error);
  }
}

// Run the test
testLayerSystem();
