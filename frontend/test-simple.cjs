// Simple test for Word-for-Word formatter
const fs = require('fs');
const path = require('path');

// Read the formatter file
const formatterPath = path.join(__dirname, 'src/utils/wordForWordFormatter.ts');
const formatterContent = fs.readFileSync(formatterPath, 'utf8');

// Extract just the function we need
const functionMatch = formatterContent.match(/export function formatWordForWordText\([^}]+\}/s);
if (!functionMatch) {
  console.error('Could not find formatWordForWordText function');
  process.exit(1);
}

// Convert TypeScript to JavaScript
let jsFunction = functionMatch[0]
  .replace(/export\s+/, '')
  .replace(/:\s*WordForWordConfig/g, '')
  .replace(/:\s*string/g, '')
  .replace(/:\s*boolean/g, '')
  .replace(/:\s*Array<\[RegExp,\s*string\]>/g, '')
  .replace(/as\s+const/g, '')
  .replace(/\?\s*:/g, ':');

// Add the DEFAULT_CONFIG
const configMatch = formatterContent.match(/export const DEFAULT_CONFIG[^}]+}/s);
if (configMatch) {
  const jsConfig = configMatch[0]
    .replace(/export\s+/, '')
    .replace(/:\s*WordForWordConfig/g, '')
    .replace(/:\s*boolean/g, '')
    .replace(/:\s*string/g, '');
  jsFunction = jsConfig + '\n' + jsFunction;
}

// Evaluate the function
eval(jsFunction);

// Test data from user
const rawTranscript = `Pt: The patient is a 50 year old male, who lives with his mom Pt: in a cabin in Mont Tremblant.

Pt: New line Pt: On November Pt: 2022 Pt: the patient reports neck pain right after the car accident.

Pt: Period Pt: Unable to return Pt: to work Pt: when he returned from.

Pt: uh head coma Pt: The patient had difficulty sleeping, period.

Pt: Patient has a follow up with Doctor Chamblay in January 2020.

Pt: chin radiates to the right shoulder.

Pt: comma, especially when lifting boxes.

Pt: MRI requested Pt: on February 2023. The MRI was reported by Doctor Dubois.

Pt: period.

Pt: New paragraph. There's no fracture, period.`;

console.log('=== RAW TRANSCRIPT ===');
console.log(rawTranscript);
console.log('\n=== FORMATTED OUTPUT ===');
const result = formatWordForWordText(rawTranscript);
console.log(result);
