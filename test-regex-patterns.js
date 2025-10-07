// Test the regex patterns directly
const testText = "New line. He states New paragraph. Doctor";

console.log("=== TESTING REGEX PATTERNS ===");
console.log("Original:", testText);

// Test New line pattern
const newLinePattern = /\b(?:new\s*line|newline|line\s*break)\b/gi;
const newLineResult = testText.replace(newLinePattern, "\n");
console.log("After New line pattern:", JSON.stringify(newLineResult));

// Test New paragraph pattern  
const newParagraphPattern = /\b(?:new\s*paragraph|paragraph\s*break|new\s*para)\b/gi;
const newParagraphResult = testText.replace(newParagraphPattern, "\n\n");
console.log("After New paragraph pattern:", JSON.stringify(newParagraphResult));

// Test both patterns
let result = testText;
result = result.replace(newParagraphPattern, "\n\n");
result = result.replace(newLinePattern, "\n");
console.log("After both patterns:", JSON.stringify(result));
