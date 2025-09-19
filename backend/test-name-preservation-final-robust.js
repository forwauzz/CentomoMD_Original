// Final test for robust NamePreservationEngine with accent-aware boundaries
console.log('=== FINAL ROBUST NAME PRESERVATION TEST ===\n');

// Test data from user's example
const originalContent = `La travailleuse consulte le docteur Harry Durusso, 9 octobre 2023. Elle est interprétée par le docteur Roxanne Bouchard-Bellavance, radiologiste. Travailleuse revoit le docteur Durousseau le 16 avril 2024.`;

const formattedContent = `La travailleuse consulte le docteur Harry, le 9 octobre 2023. Elle est interprétée par le docteur Roxanne, radiologiste. La travailleuse revoit le docteur Durousseau, le 16 avril 2024.`;

console.log('ORIGINAL CONTENT:');
console.log(originalContent);
console.log('\nFORMATTED CONTENT:');
console.log(formattedContent);

console.log('\n=== TESTING SIMPLIFIED EXTRACTION ===');

// Simulate the SIMPLIFIED extractDoctorNames logic
function extractDoctorNamesSimplified(content, language = 'fr') {
  const doctorNames = [];
  
  // Simplified patterns that are more robust
  const patterns = language === 'fr' 
    ? [
        // Full names: "docteur Jean-Pierre Martin" with specialty
        /(docteur|docteure|dr\.?|dre\.?|doctor)\s+([A-ZÀ-ÖØ-Ý][a-zà-öø-ÿ''\-]+(?:\s+[A-ZÀ-ÖØ-Ý][a-zà-öø-ÿ''\-]+)+?),\s*([^,\.]+)/gi,
        // Full names: "docteur Jean-Pierre Martin" without specialty
        /(docteur|docteure|dr\.?|dre\.?|doctor)\s+([A-ZÀ-ÖØ-Ý][a-zà-öø-ÿ''\-]+(?:\s+[A-ZÀ-ÖØ-Ý][a-zà-öø-ÿ''\-]+)+?)(?=\s|,|\.|$)/gi,
        // Single name fallback: "docteur Harry" (incomplete)
        /(docteur|docteure|dr\.?|dre\.?|doctor)\s+([A-ZÀ-ÖØ-Ý][a-zà-öø-ÿ''\-]+)(?=\s|,|\.|$)/gi
      ]
    : [
        // Full names: "Dr. John Smith" with specialty
        /(dr\.?|doctor)\s+([A-Z][a-z''\-]+(?:\s+[A-Z][a-z''\-]+)+?),\s*([^,\.]+)/gi,
        // Full names: "Dr. John Smith" without specialty
        /(dr\.?|doctor)\s+([A-Z][a-z''\-]+(?:\s+[A-Z][a-z''\-]+)+?)(?=\s|,|\.|$)/gi,
        // Single name fallback: "Dr. Harry" (incomplete)
        /(dr\.?|doctor)\s+([A-Z][a-z''\-]+)(?=\s|,|\.|$)/gi
      ];
  
  patterns.forEach((pattern, patternIndex) => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const title = match[1]; // Preserve original casing
      const fullName = match[2];
      const specialty = match[3] || undefined;
      
      console.log(`Pattern ${patternIndex + 1} match: "${title} ${fullName}" (specialty: ${specialty || 'none'})`);
      
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
        console.log(`  ✅ Added new name: ${title} ${fullName} (${isComplete ? 'COMPLETE' : 'INCOMPLETE'})`);
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
        console.log(`  🔄 Updated name: ${title} ${fullName} (INCOMPLETE → COMPLETE)`);
      } else {
        console.log(`  ⏭️ Skipped duplicate: ${title} ${fullName}`);
      }
    }
  });
  
  return doctorNames;
}

// Test extraction on original content
const originalNames = extractDoctorNamesSimplified(originalContent);
console.log('\n=== EXTRACTION RESULTS ===');
console.log('DOCTOR NAMES EXTRACTED FROM ORIGINAL:');
originalNames.forEach((name, index) => {
  console.log(`${index + 1}. ${name.fullName} (${name.isComplete ? 'COMPLETE' : 'INCOMPLETE'})`);
  console.log(`   - Title: ${name.title}`);
  console.log(`   - First: ${name.firstName}`);
  console.log(`   - Last: ${name.lastName}`);
  console.log(`   - Specialty: ${name.specialty || 'none'}`);
});

console.log('\n=== TESTING ACCENT-AWARE RESTORATION ===');

// Simulate the restoreTruncatedNames logic with accent-aware boundaries
function restoreTruncatedNamesAccentAware(originalContent, formattedContent, language = 'fr') {
  const originalNames = extractDoctorNamesSimplified(originalContent, language);
  let restoredContent = formattedContent;
  let namesRestored = 0;
  
  // Custom accent-aware boundaries to avoid issues with apostrophes/hyphens
  const B = '(?:^|[^A-Za-zÀ-ÖØ-öø-ÿ])';
  const E = '(?=$|[^A-Za-zÀ-ÖØ-öø-ÿ])';
  
  originalNames.forEach(originalName => {
    if (originalName.isComplete) {
      console.log(`\nProcessing: ${originalName.fullName}`);
      
      // Escape special regex characters in the full name
      const escapedFullName = originalName.fullName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      // Check if full name already exists (no need to restore)
      const fullNamePattern = new RegExp(`${B}${escapedFullName}${E}`, 'gi');
      if (fullNamePattern.test(restoredContent)) {
        console.log(`✅ Full name already present: "${originalName.fullName}"`);
        return;
      }
      
      // Escape special regex characters for individual components
      const escapedTitle = originalName.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const escapedLastName = originalName.lastName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const escapedFirstName = originalName.firstName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      // Replacement order per original name (if isComplete):
      
      // 1. If Title + Last is present and full is absent → replace with full
      const titleLastPattern = new RegExp(`${B}${escapedTitle}\\s+${escapedLastName}${E}`, 'gi');
      if (titleLastPattern.test(restoredContent)) {
        restoredContent = restoredContent.replace(titleLastPattern, originalName.fullName);
        namesRestored++;
        console.log(`✅ Restored truncated name: "${originalName.title} ${originalName.lastName}" → "${originalName.fullName}"`);
        return;
      }
      
      // 2. Else if Title + First is present and full is absent → replace with full
      const titleFirstPattern = new RegExp(`${B}${escapedTitle}\\s+${escapedFirstName}${E}`, 'gi');
      if (titleFirstPattern.test(restoredContent)) {
        restoredContent = restoredContent.replace(titleFirstPattern, originalName.fullName);
        namesRestored++;
        console.log(`✅ Restored incomplete name: "${originalName.title} ${originalName.firstName}" → "${originalName.fullName}"`);
        return;
      }
      
      // 3. Else if last name is multi-token, try first token of the last name (e.g., Le in Le Roux) only as narrow fallback
      if (originalName.lastName && originalName.lastName.includes(' ')) {
        const lastNameTokens = originalName.lastName.split(/\s+/);
        const firstLastNameToken = lastNameTokens[0];
        const escapedFirstLastNameToken = firstLastNameToken.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        
        const titleFirstLastNameTokenPattern = new RegExp(`${B}${escapedTitle}\\s+${escapedFirstLastNameToken}${E}`, 'gi');
        if (titleFirstLastNameTokenPattern.test(restoredContent)) {
          restoredContent = restoredContent.replace(titleFirstLastNameTokenPattern, originalName.fullName);
          namesRestored++;
          console.log(`✅ Restored partial last name: "${originalName.title} ${firstLastNameToken}" → "${originalName.fullName}"`);
          return;
        }
      }
      
      console.log(`❌ No match found for: ${originalName.fullName}`);
    }
  });
  
  return { restoredContent, namesRestored };
}

const restorationResult = restoreTruncatedNamesAccentAware(originalContent, formattedContent);

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
