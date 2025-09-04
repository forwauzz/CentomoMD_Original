// Simple test script for Mode 1 formatter
const { Mode1Formatter } = require('./dist/src/services/formatter/mode1.js');
const { Section7Validator } = require('./dist/src/services/formatter/validators/section7.js');

async function testMode1Formatter() {
  console.log('🧪 Testing Mode 1 Formatter...');
  
  try {
    console.log('Loading formatter...');
    const formatter = new Mode1Formatter();
    
    // Test 1: Basic formatting
    console.log('\n📝 Test 1: Basic formatting');
    const transcript1 = 'le travailleur consulte le docteur pour une douleur au genou';
    const result1 = formatter.format(transcript1, {
      language: 'fr',
      quote_style: 'smart',
      radiology_mode: false,
      preserve_verbatim: true
    });
    
    console.log('Input:', transcript1);
    console.log('Output:', result1.formatted);
    console.log('Issues:', result1.issues);
    console.log('Verbatim blocks:', result1.verbatim_blocks.length);
    
    // Test 2: Voice commands
    console.log('\n🎤 Test 2: Voice commands');
    const transcript2 = 'le travailleur nouveau paragraphe consulte le docteur pause reprendre';
    const result2 = formatter.format(transcript2, {
      language: 'fr',
      quote_style: 'smart',
      radiology_mode: false,
      preserve_verbatim: true
    });
    
    console.log('Input:', transcript2);
    console.log('Output:', result2.formatted);
    
    // Test 3: Verbatim protection
    console.log('\n🔒 Test 3: Verbatim protection');
    const transcript3 = 'début verbatim rapport radiologique genou normal fin verbatim le patient se porte bien';
    const result3 = formatter.format(transcript3, {
      language: 'fr',
      quote_style: 'smart',
      radiology_mode: false,
      preserve_verbatim: true
    });
    
    console.log('Input:', transcript3);
    console.log('Output:', result3.formatted);
    console.log('Verbatim blocks:', result3.verbatim_blocks.length);
    
    // Test 4: Section 7 validation
    console.log('\n✅ Test 4: Section 7 validation');
    const validator = new Section7Validator();
    const validationResult = validator.validate(result1.formatted, 'fr');
    
    console.log('Content:', result1.formatted);
    console.log('Is valid:', validationResult.isValid);
    console.log('Issues:', validationResult.issues);
    console.log('Critical issues:', validationResult.critical_issues);
    
    console.log('\n✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

console.log('Starting test...');
testMode1Formatter().catch(console.error);
console.log('Test function called...');
