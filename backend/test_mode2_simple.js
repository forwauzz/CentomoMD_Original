// Simple test for Mode 2 formatter
console.log('=== MODE 2 FORMATTER TEST ===');
console.log('Testing Section 7 Smart Dictation...\n');

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

async function testMode2Simple() {
  try {
    console.log('RAW TRANSCRIPT:');
    console.log(rawTranscript);
    console.log('\n');

    // Import the formatter
    const { Mode2Formatter } = await import('./dist/src/services/formatter/mode2.js');
    console.log('✅ Mode2Formatter imported successfully\n');

    // Create formatter instance
    const formatter = new Mode2Formatter();
    
    // Test Section 7 formatting (French)
    console.log('TESTING SECTION 7 (FRENCH):');
    console.log('============================');
    const resultFr = await formatter.format(rawTranscript, {
      language: 'fr',
      section: '7'
    });

    console.log('FORMATTED RESULT:');
    console.log(resultFr.formatted);
    console.log('\n');

    console.log('ISSUES:');
    if (resultFr.issues.length > 0) {
      resultFr.issues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue}`);
      });
    } else {
      console.log('✅ No issues found');
    }
    console.log('\n');

    console.log('CONFIDENCE SCORE:');
    console.log(`${(resultFr.confidence_score * 100).toFixed(1)}%`);
    console.log('\n');

    // Test Section 7 formatting (English)
    console.log('TESTING SECTION 7 (ENGLISH):');
    console.log('=============================');
    const resultEn = await formatter.format(rawTranscript, {
      language: 'en',
      section: '7'
    });

    console.log('FORMATTED RESULT:');
    console.log(resultEn.formatted);
    console.log('\n');

    console.log('ISSUES:');
    if (resultEn.issues.length > 0) {
      resultEn.issues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue}`);
      });
    } else {
      console.log('✅ No issues found');
    }
    console.log('\n');

    console.log('CONFIDENCE SCORE:');
    console.log(`${(resultEn.confidence_score * 100).toFixed(1)}%`);
    console.log('\n');

    console.log('=== TEST COMPLETED ===');
    console.log('Mode 2 formatter is working!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the test
testMode2Simple();
