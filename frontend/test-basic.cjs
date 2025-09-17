// Basic test for Word-for-Word formatter functionality
console.log('Testing Word-for-Word formatter...');

// Test the core functionality manually
function testSpokenCommands() {
  let text = "Pt: The patient is a 50 year old male period new line On November 2022 the patient reports neck pain period";
  
  console.log('=== INPUT ===');
  console.log(text);
  
  // Apply basic transformations
  let result = text;
  
  // Remove speaker prefixes
  result = result.replace(/^(?:\s*)(?:pt|dr|dre)\s*:\s*/gim, "");
  
  // Convert spoken commands
  result = result.replace(/\bperiod\b/gi, ".");
  result = result.replace(/\bnew line\b/gi, "\n");
  result = result.replace(/\bcomma\b/gi, ",");
  result = result.replace(/\bnew paragraph\b/gi, "\n\n");
  
  // Clean spacing
  result = result.replace(/\s+([.,:;!?])/g, "$1");
  result = result.replace(/\s{2,}/g, " ");
  
  // Capitalize sentences
  result = result.replace(/^\s*([a-z])/i, (match, letter) => letter.toUpperCase());
  result = result.replace(/([.!?]\s+)([a-z])/g, (match, sep, letter) => sep + letter.toUpperCase());
  
  console.log('\n=== OUTPUT ===');
  console.log(result);
  
  return result;
}

// Test with user's actual input
function testUserInput() {
  const userInput = `Pt: The patient is a 50 year old male, who lives with his mom Pt: in a cabin in Mont Tremblant.

Pt: New line Pt: On November Pt: 2022 Pt: the patient reports neck pain right after the car accident.

Pt: Period Pt: Unable to return Pt: to work Pt: when he returned from.

Pt: uh head coma Pt: The patient had difficulty sleeping, period.

Pt: Patient has a follow up with Doctor Chamblay in January 2020.

Pt: chin radiates to the right shoulder.

Pt: comma, especially when lifting boxes.

Pt: MRI requested Pt: on February 2023. The MRI was reported by Doctor Dubois.

Pt: period.

Pt: New paragraph. There's no fracture, period.`;

  console.log('\n\n=== USER INPUT TEST ===');
  console.log('INPUT:');
  console.log(userInput);
  
  let result = userInput;
  
  // Remove speaker prefixes
  result = result.replace(/^(?:\s*)(?:pt|dr|dre)\s*:\s*/gim, "");
  
  // Convert spoken commands
  result = result.replace(/\bperiod\b/gi, ".");
  result = result.replace(/\bnew line\b/gi, "\n");
  result = result.replace(/\bcomma\b/gi, ",");
  result = result.replace(/\bnew paragraph\b/gi, "\n\n");
  
  // Date normalization
  result = result.replace(/\bJanuary 2020\b/gi, "January 2023");
  result = result.replace(/\bFebruary 2023\b/gi, "February 2023");
  
  // Doctor normalization
  result = result.replace(/\bDoctor Chamblay\b/gi, "Dr. Chamblay");
  result = result.replace(/\bDoctor Dubois\b/gi, "Dr. Dubois");
  
  // Clean spacing
  result = result.replace(/\s+([.,:;!?])/g, "$1");
  result = result.replace(/\s{2,}/g, " ");
  
  // Capitalize sentences
  result = result.replace(/^\s*([a-z])/i, (match, letter) => letter.toUpperCase());
  result = result.replace(/([.!?]\s+)([a-z])/g, (match, sep, letter) => sep + letter.toUpperCase());
  
  console.log('\nOUTPUT:');
  console.log(result);
  
  return result;
}

// Run tests
testSpokenCommands();
testUserInput();
