// Simple test to debug the name preservation issue
console.log('=== TESTING NAME PRESERVATION PATTERNS ===\n');

// Test content from the user
const originalContent = `La travailleuse consulte le docteur Harry Durusso, 9 octobre 2023. Elle est interprétée par le docteur Roxanne Bouchard-Bellavance, radiologiste. Travailleuse revoit le docteur Durousseau le 16 avril 2024.`;

const formattedContent = `La travailleuse consulte le docteur Harry, le 9 octobre 2023. Elle est interprétée par le docteur Roxanne, radiologiste. La travailleuse revoit le docteur Durousseau, le 16 avril 2024.`;

console.log('ORIGINAL CONTENT:');
console.log(originalContent);
console.log('\nFORMATTED CONTENT:');
console.log(formattedContent);
console.log('\n=== TESTING REGEX PATTERNS ===\n');

// Test the regex patterns
const patterns = [
  // Full names: "docteur Jean-Pierre Martin" - improved pattern
  /(docteur|dr\.?)\s+([A-ZÀ-ÿ][a-zà-ÿ-]+(?:\s+[A-ZÀ-ÿ][a-zà-ÿ-]+)+)/gi,
  // With specialty: "docteur Jean-Pierre Martin, chirurgien orthopédiste"
  /(docteur|dr\.?)\s+([A-ZÀ-ÿ][a-zà-ÿ-]+(?:\s+[A-ZÀ-ÿ][a-zà-ÿ-]+)+),\s*([^,]+)/gi,
  // Single name fallback: "docteur Harry" (incomplete)
  /(docteur|dr\.?)\s+([A-ZÀ-ÿ][a-zà-ÿ-]+)(?=\s|,|\.|$)/gi
];

console.log('1. TESTING PATTERNS ON ORIGINAL CONTENT:');
patterns.forEach((pattern, index) => {
  console.log(`\nPattern ${index + 1}: ${pattern}`);
  let match;
  const matches = [];
  while ((match = pattern.exec(originalContent)) !== null) {
    matches.push({
      full: match[0],
      title: match[1],
      name: match[2],
      specialty: match[3] || 'none'
    });
  }
  console.log('Matches:', matches);
});

console.log('\n2. TESTING PATTERNS ON FORMATTED CONTENT:');
patterns.forEach((pattern, index) => {
  console.log(`\nPattern ${index + 1}: ${pattern}`);
  let match;
  const matches = [];
  while ((match = pattern.exec(formattedContent)) !== null) {
    matches.push({
      full: match[0],
      title: match[1],
      name: match[2],
      specialty: match[3] || 'none'
    });
  }
  console.log('Matches:', matches);
});

console.log('\n=== MANUAL RESTORATION TEST ===\n');

// Manual restoration test
let restoredContent = formattedContent;

// Test restoring "docteur Harry" to "docteur Harry Durusso"
const harryPattern = /\bdocteur\s+Harry\b/gi;
const harryFullPattern = /\bdocteur\s+Harry\s+Durusso\b/gi;

if (harryPattern.test(restoredContent) && !harryFullPattern.test(restoredContent)) {
  restoredContent = restoredContent.replace(harryPattern, 'docteur Harry Durusso');
  console.log('✅ Restored "docteur Harry" → "docteur Harry Durusso"');
} else {
  console.log('❌ Could not restore "docteur Harry"');
}

// Test restoring "docteur Roxanne" to "docteur Roxanne Bouchard-Bellavance"
const roxannePattern = /\bdocteur\s+Roxanne\b/gi;
const roxanneFullPattern = /\bdocteur\s+Roxanne\s+Bouchard-Bellavance\b/gi;

if (roxannePattern.test(restoredContent) && !roxanneFullPattern.test(restoredContent)) {
  restoredContent = restoredContent.replace(roxannePattern, 'docteur Roxanne Bouchard-Bellavance');
  console.log('✅ Restored "docteur Roxanne" → "docteur Roxanne Bouchard-Bellavance"');
} else {
  console.log('❌ Could not restore "docteur Roxanne"');
}

console.log('\nRESTORED CONTENT:');
console.log(restoredContent);
