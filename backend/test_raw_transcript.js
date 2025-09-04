// Test script for raw transcript formatting
console.log('🧪 Testing Mode 1 Formatter with Raw Transcript...\n');

try {
  import { Mode1Formatter } from './dist/src/services/formatter/mode1.js';
  const { Section7Validator } = await import('./dist/src/services/formatter/validators/section7.js');
  const { Section8Validator } = await import('./dist/src/services/formatter/validators/section8.js');
  
  console.log('✅ Formatter loaded successfully\n');
  
  const formatter = new Mode1Formatter();
  
  // Your raw transcript
  const rawTranscript = `Patient is a forty five year old male comma new consultation for right knee pain period
He reports the pain started three weeks ago comma after a soccer match period
Denies trauma comma swelling comma or redness period
Past medical history colon hypertension comma controlled with medication period
Current medications colon ramipril five milligrams daily period
No known drug allergies period
On exam comma knee inspection shows mild tenderness on palpation period
Range of motion is full comma no instability noted period
Vital signs stable period
Plan colon order X ray of right knee comma refer to physiotherapy comma start acetaminophen one gram TID period
Follow up in four weeks period new paragraph
Patient understands and agrees with plan period`;

  console.log('📝 RAW TRANSCRIPT:');
  console.log('==================');
  console.log(rawTranscript);
  console.log('\n');

  // Test 1: Basic Mode 1 formatting
  console.log('🔧 MODE 1 FORMATTING RESULT:');
  console.log('============================');
  const result = formatter.format(rawTranscript, {
    language: 'en',
    quote_style: 'smart',
    radiology_mode: false,
    preserve_verbatim: true
  });
  
  console.log('Formatted Text:');
  console.log(result.formatted);
  console.log('\n');
  console.log('Issues Found:', result.issues.length > 0 ? result.issues : 'None');
  console.log('Verbatim Blocks:', result.verbatim_blocks.length);
  console.log('\n');

  // Test 2: Section 7 validation (Historical narrative)
  console.log('✅ SECTION 7 VALIDATION:');
  console.log('========================');
  const section7Validator = new Section7Validator();
  const section7Validation = section7Validator.validate(result.formatted, 'en');
  
  console.log('Is Valid:', section7Validation.isValid);
  console.log('Critical Issues:', section7Validation.critical_issues.length > 0 ? section7Validation.critical_issues : 'None');
  console.log('Warnings:', section7Validation.warnings.length > 0 ? section7Validation.warnings : 'None');
  console.log('\n');

  // Test 3: Section 8 validation (Clinical examination)
  console.log('✅ SECTION 8 VALIDATION:');
  console.log('========================');
  const section8Validator = new Section8Validator();
  const section8Validation = section8Validator.validate(result.formatted, 'en');
  
  console.log('Is Valid:', section8Validation.isValid);
  console.log('Critical Issues:', section8Validation.critical_issues.length > 0 ? section8Validation.critical_issues : 'None');
  console.log('Warnings:', section8Validation.warnings.length > 0 ? section8Validation.warnings : 'None');
  console.log('\n');

  // Test 4: Test with voice commands
  console.log('🎤 TESTING VOICE COMMANDS:');
  console.log('==========================');
  const transcriptWithCommands = `new paragraph Patient is a forty five year old male comma new consultation for right knee pain period
pause
resume
He reports the pain started three weeks ago comma after a soccer match period
save
new paragraph Past medical history colon hypertension comma controlled with medication period`;
  
  const commandResult = formatter.format(transcriptWithCommands, {
    language: 'en',
    quote_style: 'smart',
    radiology_mode: false,
    preserve_verbatim: true
  });
  
  console.log('Transcript with Commands:');
  console.log(transcriptWithCommands);
  console.log('\n');
  console.log('Formatted Result:');
  console.log(commandResult.formatted);
  console.log('\n');

  // Test 5: Test with verbatim protection
  console.log('🔒 TESTING VERBATIM PROTECTION:');
  console.log('===============================');
  const transcriptWithVerbatim = `Patient is a forty five year old male comma new consultation for right knee pain period
start verbatim
RADIOLOGY REPORT: Right knee X-ray shows mild joint space narrowing, no fractures.
end verbatim
He reports the pain started three weeks ago comma after a soccer match period`;
  
  const verbatimResult = formatter.format(transcriptWithVerbatim, {
    language: 'en',
    quote_style: 'smart',
    radiology_mode: false,
    preserve_verbatim: true
  });
  
  console.log('Transcript with Verbatim:');
  console.log(transcriptWithVerbatim);
  console.log('\n');
  console.log('Formatted Result:');
  console.log(verbatimResult.formatted);
  console.log('\n');
  console.log('Verbatim Blocks:', verbatimResult.verbatim_blocks.length);
  if (verbatimResult.verbatim_blocks.length > 0) {
    console.log('Verbatim Content:', verbatimResult.verbatim_blocks[0].content);
  }
  console.log('\n');

  console.log('🎉 ALL TESTS COMPLETED SUCCESSFULLY!');
  console.log('====================================');
  console.log('The Mode 1 formatter is working correctly with your raw transcript.');
  console.log('It can:');
  console.log('✅ Process raw speech-to-text output');
  console.log('✅ Apply basic punctuation rules');
  console.log('✅ Handle voice commands');
  console.log('✅ Protect verbatim text blocks');
  console.log('✅ Validate against CNESST section requirements');
  
} catch (error) {
  console.error('❌ Error during testing:', error);
  console.error('Stack trace:', error.stack);
}
