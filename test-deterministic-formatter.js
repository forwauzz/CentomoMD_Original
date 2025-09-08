// Test the deterministic formatter independently
import { formatWordForWordText } from './backend/dist/src/utils/wordForWordFormatter.js';

const testTranscript = `Pt: The worker reports neck pain following a rare and collision on February 14, 2024, difficulty sleeping, comma, and intermittent headaches. New line. He states Pt: quote Pt: The pain shoots to the right shoulder.

Pt: close quote Pt: especially when lifting boxes.

Pt: New line Pt: C 5 Pt: C6 mar stiffness reported, period.

Pt: He states, open parenthesis.

Pt: The paint shoots to the right shoulder.

Pt: com Pt: New paragraph. Doctor Pt: Giron Pt: follow up on March.

Pt: 3, 2024.

Pt: Colon.

Pt: Patient completed 10 physiotherapy sessions.

Pt: semicolon Pt: Reports short term relief.

Pt: only.

Pt: period`;

console.log('=== ORIGINAL TRANSCRIPT ===');
console.log(testTranscript);
console.log('\n=== FORMATTED TRANSCRIPT ===');

try {
  const formatted = formatWordForWordText(testTranscript);
  console.log(formatted);
} catch (error) {
  console.error('Error:', error);
}
