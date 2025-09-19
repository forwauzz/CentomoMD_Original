// Test for robust NamePreservationEngine with all QC titles and name variations
console.log('=== ROBUST NAME PRESERVATION TEST ===\n');

// Test data with various name formats
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

console.log('TEST CASES:');
testCases.forEach((testCase, index) => {
  console.log(`${index + 1}. "${testCase}"`);
});

console.log('\n=== TESTING ROBUST EXTRACTION ===');

// Simulate the ROBUST extractDoctorNames logic
function extractDoctorNamesRobust(content, language = 'fr') {
  const doctorNames = [];
  
  // Split content into sentences to avoid cross-sentence interference
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  sentences.forEach(sentence => {
    console.log(`\nProcessing sentence: "${sentence.trim()}"`);
    
    // Enhanced patterns for different name formats with robust support for QC titles and name variations
    const patterns = language === 'fr' 
      ? [
          // Full names: "docteur Jean-Pierre Martin" with specialty
          /(docteur|docteure|dr\.?|dre\.?|doctor)\s+([A-ZÀ-ÖØ-Ý][a-zà-öø-ÿ''\-]+(?:\s+[A-ZÀ-ÖØ-Ý][a-zà-öø-ÿ''\-]+)+?),\s*([^,\.]+?)(?=\s+(?:le|la|les|du|de|des|en|sur|pour|avec|dans|par|au|aux|à|et|ou|,|\.|$))/gi,
          // Full names: "docteur Jean-Pierre Martin" without specialty
          /(docteur|docteure|dr\.?|dre\.?|doctor)\s+([A-ZÀ-ÖØ-Ý][a-zà-öø-ÿ''\-]+(?:\s+[A-ZÀ-ÖØ-Ý][a-zà-öø-ÿ''\-]+)+?)(?=\s+(?:le|la|les|du|de|des|en|sur|pour|avec|dans|par|au|aux|à|et|ou|,|\.|$))/gi,
          // Single name fallback: "docteur Harry" (incomplete)
          /(docteur|docteure|dr\.?|dre\.?|doctor)\s+([A-ZÀ-ÖØ-Ý][a-zà-öø-ÿ''\-]+)(?=\s+(?:le|la|les|du|de|des|en|sur|pour|avec|dans|par|au|aux|à|et|ou|,|\.|$))/gi
        ]
      : [
          // Full names: "Dr. John Smith" with specialty
          /(dr\.?|doctor)\s+([A-Z][a-z''\-]+(?:\s+[A-Z][a-z''\-]+)+?),\s*([^,\.]+?)(?=\s+(?:the|a|an|in|on|at|to|for|with|by|of|and|or|,|\.|$))/gi,
          // Full names: "Dr. John Smith" without specialty
          /(dr\.?|doctor)\s+([A-Z][a-z''\-]+(?:\s+[A-Z][a-z''\-]+)+?)(?=\s+(?:the|a|an|in|on|at|to|for|with|by|of|and|or|,|\.|$))/gi,
          // Single name fallback: "Dr. Harry" (incomplete)
          /(dr\.?|doctor)\s+([A-Z][a-z''\-]+)(?=\s+(?:the|a|an|in|on|at|to|for|with|by|of|and|or|,|\.|$))/gi
        ];
    
    patterns.forEach((pattern, patternIndex) => {
      let match;
      while ((match = pattern.exec(sentence)) !== null) {
        const title = match[1]; // Preserve original casing
        const fullName = match[2];
        const specialty = match[3] || undefined;
        
        console.log(`  Pattern ${patternIndex + 1} match: "${title} ${fullName}" (specialty: ${specialty || 'none'})`);
        
        const nameParts = fullName.trim().split(/\s+/);
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        // Check if this is a complete name (has first and last name)
        const isComplete = nameParts.length >= 2;
        
        // Normalize for comparison (deburr + lowercase)
        const normalizeForComparison = (str) => 
          str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        
        const normalizedFirstName = normalizeForComparison(firstName);
        const normalizedLastName = normalizeForComparison(lastName);
        
        // Only add if we don't already have this name or if this is a more complete version
        const existingIndex = doctorNames.findIndex(existing => 
          normalizeForComparison(existing.firstName) === normalizedFirstName && 
          normalizeForComparison(existing.lastName) === normalizedLastName
        );
        
        if (existingIndex === -1) {
          // New name, add it
          doctorNames.push({
            fullName: `${title} ${fullName}`,
            title: title.toLowerCase(), // Store lowercase for consistency
            firstName,
            lastName,
            specialty,
            isComplete
          });
          console.log(`    ✅ Added new name: ${title} ${fullName} (${isComplete ? 'COMPLETE' : 'INCOMPLETE'})`);
        } else if (isComplete && !doctorNames[existingIndex].isComplete) {
          // Replace incomplete name with complete version
          doctorNames[existingIndex] = {
            fullName: `${title} ${fullName}`,
            title: title.toLowerCase(), // Store lowercase for consistency
            firstName,
            lastName,
            specialty,
            isComplete
          };
          console.log(`    🔄 Updated name: ${title} ${fullName} (INCOMPLETE → COMPLETE)`);
        } else {
          console.log(`    ⏭️ Skipped duplicate: ${title} ${fullName}`);
        }
      }
    });
  });
  
  return doctorNames;
}

// Test each case individually
console.log('\n=== INDIVIDUAL TEST RESULTS ===');
testCases.forEach((testCase, index) => {
  console.log(`\n${index + 1}. Testing: "${testCase}"`);
  const result = extractDoctorNamesRobust(testCase);
  if (result.length > 0) {
    const name = result[0];
    console.log(`   Result: ${name.fullName}`);
    console.log(`   - Title: ${name.title}`);
    console.log(`   - First: ${name.firstName}`);
    console.log(`   - Last: ${name.lastName}`);
    console.log(`   - Complete: ${name.isComplete}`);
    console.log(`   - Specialty: ${name.specialty || 'none'}`);
  } else {
    console.log(`   ❌ No match found`);
  }
});

// Test with the original user example
console.log('\n=== TESTING ORIGINAL USER EXAMPLE ===');
const originalContent = `La travailleuse consulte le docteur Harry Durusso, 9 octobre 2023. Elle est interprétée par le docteur Roxanne Bouchard-Bellavance, radiologiste. Travailleuse revoit le docteur Durousseau le 16 avril 2024.`;

const formattedContent = `La travailleuse consulte le docteur Harry, le 9 octobre 2023. Elle est interprétée par le docteur Roxanne, radiologiste. La travailleuse revoit le docteur Durousseau, le 16 avril 2024.`;

console.log('ORIGINAL CONTENT:');
console.log(originalContent);
console.log('\nFORMATTED CONTENT:');
console.log(formattedContent);

const originalNames = extractDoctorNamesRobust(originalContent);
console.log('\n=== EXTRACTION RESULTS ===');
console.log('DOCTOR NAMES EXTRACTED FROM ORIGINAL:');
originalNames.forEach((name, index) => {
  console.log(`${index + 1}. ${name.fullName} (${name.isComplete ? 'COMPLETE' : 'INCOMPLETE'})`);
  console.log(`   - Title: ${name.title}`);
  console.log(`   - First: ${name.firstName}`);
  console.log(`   - Last: ${name.lastName}`);
  console.log(`   - Specialty: ${name.specialty || 'none'}`);
});

// Test restoration
console.log('\n=== TESTING RESTORATION ===');
function restoreTruncatedNamesRobust(originalContent, formattedContent, language = 'fr') {
  const originalNames = extractDoctorNamesRobust(originalContent, language);
  let restoredContent = formattedContent;
  let namesRestored = 0;
  
  originalNames.forEach(originalName => {
    if (originalName.isComplete) {
      console.log(`\nProcessing: ${originalName.fullName}`);
      
      // Escape special regex characters in the full name
      const escapedFullName = originalName.fullName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      // Pattern 1: Check if full name already exists (no need to restore)
      const fullNamePattern = new RegExp(`\\b${escapedFullName}\\b`, 'gi');
      if (fullNamePattern.test(restoredContent)) {
        console.log(`✅ Full name already present: "${originalName.fullName}"`);
        return;
      }
      
      // Pattern 2: Check for truncated version (only last name)
      const truncatedPattern = new RegExp(`\\b${originalName.title}\\s+${originalName.lastName}\\b`, 'gi');
      if (truncatedPattern.test(restoredContent)) {
        console.log(`🔧 Found truncated name: "${originalName.title} ${originalName.lastName}"`);
        restoredContent = restoredContent.replace(truncatedPattern, originalName.fullName);
        namesRestored++;
        console.log(`✅ Restored truncated name: "${originalName.title} ${originalName.lastName}" → "${originalName.fullName}"`);
        return;
      }
      
      // Pattern 3: Check for incomplete version (only first name)
      const incompletePattern = new RegExp(`\\b${originalName.title}\\s+${originalName.firstName}\\b`, 'gi');
      if (incompletePattern.test(restoredContent)) {
        console.log(`🔧 Found incomplete name: "${originalName.title} ${originalName.firstName}"`);
        restoredContent = restoredContent.replace(incompletePattern, originalName.fullName);
        namesRestored++;
        console.log(`✅ Restored incomplete name: "${originalName.title} ${originalName.firstName}" → "${originalName.fullName}"`);
        return;
      }
      
      console.log(`❌ No match found for: ${originalName.fullName}`);
    }
  });
  
  return { restoredContent, namesRestored };
}

const restorationResult = restoreTruncatedNamesRobust(originalContent, formattedContent);

console.log('\n=== RESTORATION RESULTS ===');
console.log(`Names restored: ${restorationResult.namesRestored}`);
console.log('\nRESTORED CONTENT:');
console.log(restorationResult.restoredContent);

console.log('\n=== FINAL VALIDATION ===');
if (restorationResult.restoredContent.includes('docteur Harry Durusso')) {
  console.log('✅ Harry Durusso restoration: SUCCESS');
} else {
  console.log('❌ Harry Durusso restoration: FAILED');
}

if (restorationResult.restoredContent.includes('docteur Roxanne Bouchard-Bellavance')) {
  console.log('✅ Roxanne Bouchard-Bellavance restoration: SUCCESS');
} else {
  console.log('❌ Roxanne Bouchard-Bellavance restoration: FAILED');
}

if (restorationResult.namesRestored === 2) {
  console.log('✅ Total restorations: SUCCESS (2/2)');
} else {
  console.log(`❌ Total restorations: FAILED (${restorationResult.namesRestored}/2)`);
}
