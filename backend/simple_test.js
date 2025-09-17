console.log('Testing Mode 1 Formatter...');

try {
  const { Mode1Formatter } = require('./dist/src/services/formatter/mode1.js');
  console.log('Mode1Formatter loaded successfully');
  
  const formatter = new Mode1Formatter();
  console.log('Formatter instance created');
  
  const result = formatter.format('hello world', {
    language: 'fr',
    quote_style: 'smart',
    radiology_mode: false,
    preserve_verbatim: true
  });
  
  console.log('Result:', result);
  console.log('✅ Test completed successfully!');
  
} catch (error) {
  console.error('❌ Error:', error);
}
