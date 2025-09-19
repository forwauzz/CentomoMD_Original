// Test for NamePreservationEngine with improved regex patterns
console.log('=== IMPROVED NAME PRESERVATION TEST ===\n');

// Test data from user's example
const originalContent = `La travailleuse consulte le docteur Harry Durusso, 9 octobre 2023. Elle est interprétée par le docteur Roxanne Bouchard-Bellavance, radiologiste. Travailleuse revoit le docteur Durousseau le 16 avril 2024.`;

const formattedContent = `La travailleuse consulte le docteur Harry, le 9 octobre 2023. Elle est interprétée par le docteur Roxanne, radiologiste. La travailleuse revoit le docteur Durousseau, le 16 avril 2024.`;

console.log('ORIGINAL CONTENT:');
console.log(originalContent);
console.log('\nFORMATTED CONTENT:');
console.log(formattedContent);
console.log('\n=== TESTING IMPROVED EXTRACTION ===');

// Simulate the IMPROVED extractDoctorNames logic with better regex
function extractDoctorNamesImproved(content, language = 'fr') {
  const doctorNames = [];
  
  const patterns = language === 'fr' 
    ? [
        // Full names: "docteur Jean-Pierre Martin" - improved pattern (stops at common words)
        /(docteur|dr\.?)\s+([A-ZÀ-ÿ][a-zà-ÿ-]+(?:\s+[A-ZÀ-ÿ][a-zà-ÿ-]+)+?)(?=\s+(?:le|la|les|du|de|des|en|sur|pour|avec|dans|par|au|aux|à|et|ou|,|\.|$))/gi,
        // With specialty: "docteur Jean-Pierre Martin, chirurgien orthopédiste"
        /(docteur|dr\.?)\s+([A-ZÀ-ÿ][a-zà-ÿ-]+(?:\s+[A-ZÀ-ÿ][a-zà-ÿ-]+)+?),\s*([^,]+)/gi,
        // Single name fallback: "docteur Harry" (incomplete)
        /(docteur|dr\.?)\s+([A-ZÀ-ÿ][a-zà-ÿ-]+)(?=\s+(?:le|la|les|du|de|des|en|sur|pour|avec|dans|par|au|aux|à|et|ou|,|\.|$))/gi
      ]
    : [
        // Full names: "Dr. John Smith" - improved pattern (stops at common words)
        /(dr\.?|doctor)\s+([A-Z][a-z-]+(?:\s+[A-Z][a-z-]+)+?)(?=\s+(?:the|a|an|in|on|at|to|for|with|by|of|and|or|,|\.|$))/gi,
        // With specialty: "Dr. John Smith, orthopedic surgeon"
        /(dr\.?|doctor)\s+([A-Z][a-z-]+(?:\s+[A-Z][a-z-]+)+?),\s*([^,]+)/gi,
        // Single name fallback: "Dr. Harry" (incomplete)
        /(dr\.?|doctor)\s+([A-Z][a-z-]+)(?=\s+(?:the|a|an|in|on|at|to|for|with|by|of|and|or|,|\.|$))/gi
      ];

  patterns.forEach((pattern, patternIndex) => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const title = match[1].toLowerCase();
      const fullName = match[2];
      const specialty = match[3] || undefined;
      
      const nameParts = fullName.trim().split(/\s+/);
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      // Check if this is a complete name (has first and last name)
      const isComplete = nameParts.length >= 2;
      
      // Only add if we don't already have this name or if this is a more complete version
      const existingIndex = doctorNames.findIndex(existing => 
        existing.firstName === firstName && existing.lastName === lastName
      );
      
      if (existingIndex === -1) {
        // New name, add it
        doctorNames.push({
          fullName: `${title} ${fullName}`,
          title,
          firstName,
          lastName,
          specialty,
          isComplete
        });
      } else if (isComplete && !doctorNames[existingIndex].isComplete) {
        // Replace incomplete name with complete version
        doctorNames[existingIndex] = {
          fullName: `${title} ${fullName}`,
          title,
          firstName,
          lastName,
          specialty,
          isComplete
        };
      }
    }
  });
  
  return doctorNames;
}

// Test extraction on original content
const originalNames = extractDoctorNamesImproved(originalContent);
console.log('DOCTOR NAMES EXTRACTED FROM ORIGINAL (IMPROVED):');
originalNames.forEach((name, index) => {
  console.log(`${index + 1}. ${name.fullName} (${name.isComplete ? 'COMPLETE' : 'INCOMPLETE'})`);
  console.log(`   - Title: ${name.title}`);
  console.log(`   - First: ${name.firstName}`);
  console.log(`   - Last: ${name.lastName}`);
  console.log(`   - Specialty: ${name.specialty || 'none'}`);
});

console.log('\n=== TESTING IMPROVED RESTORATION ===');

// Simulate the restoreTruncatedNames logic
function restoreTruncatedNamesImproved(originalContent, formattedContent, language = 'fr') {
  const originalNames = extractDoctorNamesImproved(originalContent, language);
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

const restorationResult = restoreTruncatedNamesImproved(originalContent, formattedContent);

console.log('\n=== RESTORATION RESULTS ===');
console.log(`Names restored: ${restorationResult.namesRestored}`);
console.log('\nRESTORED CONTENT:');
console.log(restorationResult.restoredContent);

console.log('\n=== COMPARISON ===');
console.log('BEFORE:');
console.log(formattedContent);
console.log('\nAFTER:');
console.log(restorationResult.restoredContent);

// Check if restoration was successful
console.log('\n=== VALIDATION ===');
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

// Check if we correctly avoided the "Durousseau le" issue
if (restorationResult.restoredContent.includes('docteur Durousseau le')) {
  console.log('❌ Durousseau le issue: STILL PRESENT (should be just "Durousseau")');
} else if (restorationResult.restoredContent.includes('docteur Durousseau')) {
  console.log('✅ Durousseau le issue: FIXED (now correctly "Durousseau")');
} else {
  console.log('⚠️ Durousseau: NOT FOUND');
}

if (restorationResult.namesRestored === 2) {
  console.log('✅ Total restorations: SUCCESS (2/2)');
} else {
  console.log(`❌ Total restorations: FAILED (${restorationResult.namesRestored}/2)`);
}
