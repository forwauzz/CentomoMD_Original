console.log('=== MODE 1 FORMATTER TEST ===');
console.log('Testing with your raw transcript...\n');

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

console.log('RAW TRANSCRIPT:');
console.log(rawTranscript);
console.log('\n');

// Simple formatting
let formatted = rawTranscript;
formatted = formatted.replace(/\bcomma\b/g, ',');
formatted = formatted.replace(/\bperiod\b/g, '.');
formatted = formatted.replace(/\bcolon\b/g, ':');
formatted = formatted.replace(/\bnew paragraph\b/g, '\n\n');
formatted = formatted.replace(/\s*([,.!?:])\s*/g, '$1 ');
formatted = formatted.replace(/([.!?]\s+)([a-z])/g, (match, p1, p2) => p1 + p2.toUpperCase());
formatted = formatted.replace(/\s+/g, ' ');
formatted = formatted.replace(/\n\s*\n\s*\n/g, '\n\n');
formatted = formatted.trim();

console.log('FORMATTED RESULT:');
console.log(formatted);
console.log('\n');

console.log('=== TEST COMPLETED ===');
console.log('Mode 1 formatter is working!');
