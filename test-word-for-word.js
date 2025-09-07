// Test script for Word-for-Word formatter
const fs = require('fs');
const path = require('path');

// Read the TypeScript file and extract the function
const formatterPath = path.join(__dirname, 'frontend/src/utils/wordForWordFormatter.ts');
const formatterContent = fs.readFileSync(formatterPath, 'utf8');

// Simple TypeScript to JavaScript conversion for testing
const jsContent = formatterContent
  .replace(/export\s+/g, '')
  .replace(/interface\s+\w+\s*{[^}]*}/g, '')
  .replace(/\?\s*:/g, ':')
  .replace(/:\s*string/g, '')
  .replace(/:\s*boolean/g, '')
  .replace(/:\s*Array<\[RegExp,\s*string\]>/g, '')
  .replace(/as\s+const/g, '');

// Evaluate the JavaScript content
eval(jsContent);

// Test data
const rawTranscript = `Pt: Initial consultation November two thousand twenty two period
Pt: The worker reports neck pain right after the car accident comma difficulty sleeping comma and headaches period
Pt: New line he describes that he is unable to turn the head new line
Pt: Follow up with Doctor Tremblay in January two thousand twenty three period
Pt: New paragraph
Pt: The pain radiates to the right shoulder comma especially when lifting heavy boxes comma and worsens at night period
Pt: MRI was requested new line
Pt: February two thousand twenty three MRI report by Doctor Dubois colon
Pt: No fracture comma mild disc bulge at C five C six semicolon no significant compression period
Pt: New paragraph
Pt: April two thousand twenty three the worker states that after ten physiotherapy sessions comma sleep remains poor and headaches continue period
Pt: Consultation with physiatrist Doctor Leclerc period
Pt: Recommendation colon cortisone injection period
Pt: New line the worker reports that the injection helped for about two weeks period
Pt: Pain returned at the same intensity comma interfering with work duties period
Pt: New paragraph
Pt: July two thousand twenty three follow up with physiatrist colon
Pt: The patient mentions persistent symptoms comma limited range of motion comma and continued functional restrictions period
Pt: Plan colon continue conservative treatment and reassess after six weeks period`;

const expectedOutput = `Initial consultation November 2022.
The worker reports neck pain right after the car accident, difficulty sleeping, and headaches.
He describes that he is unable to turn the head
Follow up with Dr. Tremblay in January 2023.

The pain radiates to the right shoulder, especially when lifting heavy boxes, and worsens at night.
MRI was requested
February 2023 MRI report by Dr. Dubois:
No fracture, mild disc bulge at C5-C6; no significant compression.

April 2023 the worker states that after ten physiotherapy sessions, sleep remains poor and headaches continue.
Consultation with physiatrist Dr. Leclerc.
Recommendation: cortisone injection.
The worker reports that the injection helped for about two weeks.
Pain returned at the same intensity, interfering with work duties.

July 2023 follow up with physiatrist:
The patient mentions persistent symptoms, limited range of motion, and continued functional restrictions.
Plan: continue conservative treatment and reassess after six weeks.`;

console.log('=== RAW TRANSCRIPT ===');
console.log(rawTranscript);
console.log('\n=== FORMATTED OUTPUT ===');
const result = formatWordForWordText(rawTranscript);
console.log(result);
console.log('\n=== EXPECTED OUTPUT ===');
console.log(expectedOutput);
console.log('\n=== COMPARISON ===');
console.log('Match:', result.trim() === expectedOutput.trim() ? '✅ PASS' : '❌ FAIL');
