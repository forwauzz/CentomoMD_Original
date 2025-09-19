// Simple test for robust NamePreservationEngine patterns
console.log('=== SIMPLE ROBUST NAME PRESERVATION TEST ===\n');

// Test individual patterns
const testCases = [
  'docteur Harry Durusso',
  'docteure Marie-Ève D\'Angelo',
  'Dre. Anik St-Pierre',
  'Dr. Jean-Pierre Le Roux',
  'docteur Roxanne Bouchard-Bellavance',
  'doctor John O\'Connor',
  'Dr. Mary-Jane Smith',
  'docteur Pierre',
  'Dre. Marie'
];

console.log('TESTING INDIVIDUAL PATTERNS:\n');

testCases.forEach((testCase, index) => {
  console.log(`${index + 1}. Testing: "${testCase}"`);
  
  // Test French patterns
  const frenchPatterns = [
    // Full names: "docteur Jean-Pierre Martin" with specialty
    /(docteur|docteure|dr\.?|dre\.?|doctor)\s+([A-ZÀ-ÖØ-Ý][a-zà-öø-ÿ''\-]+(?:\s+[A-ZÀ-ÖØ-Ý][a-zà-öø-ÿ''\-]+)+?),\s*([^,\.]+?)(?=\s+(?:le|la|les|du|de|des|en|sur|pour|avec|dans|par|au|aux|à|et|ou|,|\.|$))/gi,
    // Full names: "docteur Jean-Pierre Martin" without specialty
    /(docteur|docteure|dr\.?|dre\.?|doctor)\s+([A-ZÀ-ÖØ-Ý][a-zà-öø-ÿ''\-]+(?:\s+[A-ZÀ-ÖØ-Ý][a-zà-öø-ÿ''\-]+)+?)(?=\s+(?:le|la|les|du|de|des|en|sur|pour|avec|dans|par|au|aux|à|et|ou|,|\.|$))/gi,
    // Single name fallback: "docteur Harry" (incomplete)
    /(docteur|docteure|dr\.?|dre\.?|doctor)\s+([A-ZÀ-ÖØ-Ý][a-zà-öø-ÿ''\-]+)(?=\s+(?:le|la|les|du|de|des|en|sur|pour|avec|dans|par|au|aux|à|et|ou|,|\.|$))/gi
  ];
  
  let found = false;
  frenchPatterns.forEach((pattern, patternIndex) => {
    const match = pattern.exec(testCase);
    if (match) {
      const title = match[1];
      const fullName = match[2];
      const specialty = match[3] || undefined;
      
      const nameParts = fullName.trim().split(/\s+/);
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      const isComplete = nameParts.length >= 2;
      
      console.log(`   ✅ Pattern ${patternIndex + 1} match: "${title} ${fullName}"`);
      console.log(`      - Title: ${title}`);
      console.log(`      - First: ${firstName}`);
      console.log(`      - Last: ${lastName}`);
      console.log(`      - Complete: ${isComplete}`);
      console.log(`      - Specialty: ${specialty || 'none'}`);
      found = true;
    }
  });
  
  if (!found) {
    console.log(`   ❌ No match found`);
  }
  console.log('');
});

// Test with the original user example
console.log('=== TESTING ORIGINAL USER EXAMPLE ===');
const originalContent = `La travailleuse consulte le docteur Harry Durusso, 9 octobre 2023. Elle est interprétée par le docteur Roxanne Bouchard-Bellavance, radiologiste. Travailleuse revoit le docteur Durousseau le 16 avril 2024.`;

console.log('ORIGINAL CONTENT:');
console.log(originalContent);

// Test French patterns on the full content
const frenchPatterns = [
  // Full names: "docteur Jean-Pierre Martin" with specialty
  /(docteur|docteure|dr\.?|dre\.?|doctor)\s+([A-ZÀ-ÖØ-Ý][a-zà-öø-ÿ''\-]+(?:\s+[A-ZÀ-ÖØ-Ý][a-zà-öø-ÿ''\-]+)+?),\s*([^,\.]+?)(?=\s+(?:le|la|les|du|de|des|en|sur|pour|avec|dans|par|au|aux|à|et|ou|,|\.|$))/gi,
  // Full names: "docteur Jean-Pierre Martin" without specialty
  /(docteur|docteure|dr\.?|dre\.?|doctor)\s+([A-ZÀ-ÖØ-Ý][a-zà-öø-ÿ''\-]+(?:\s+[A-ZÀ-ÖØ-Ý][a-zà-öø-ÿ''\-]+)+?)(?=\s+(?:le|la|les|du|de|des|en|sur|pour|avec|dans|par|au|aux|à|et|ou|,|\.|$))/gi,
  // Single name fallback: "docteur Harry" (incomplete)
  /(docteur|docteure|dr\.?|dre\.?|doctor)\s+([A-ZÀ-ÖØ-Ý][a-zà-öø-ÿ''\-]+)(?=\s+(?:le|la|les|du|de|des|en|sur|pour|avec|dans|par|au|aux|à|et|ou|,|\.|$))/gi
];

console.log('\nEXTRACTION RESULTS:');
frenchPatterns.forEach((pattern, patternIndex) => {
  console.log(`\nPattern ${patternIndex + 1}:`);
  let match;
  while ((match = pattern.exec(originalContent)) !== null) {
    const title = match[1];
    const fullName = match[2];
    const specialty = match[3] || undefined;
    
    const nameParts = fullName.trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    const isComplete = nameParts.length >= 2;
    
    console.log(`  Match: "${title} ${fullName}"`);
    console.log(`    - Title: ${title}`);
    console.log(`    - First: ${firstName}`);
    console.log(`    - Last: ${lastName}`);
    console.log(`    - Complete: ${isComplete}`);
    console.log(`    - Specialty: ${specialty || 'none'}`);
  }
});
