// Final test for spacing preservation in name restoration
console.log('=== FINAL SPACING PRESERVATION TEST ===\n');

// Test data from user's example
const originalContent = `La travailleuse consulte le docteur Harry Durusso, 9 octobre 2023. Elle est interprétée par le docteur Roxanne Bouchard-Bellavance, radiologiste. Travailleuse revoit le docteur Durousseau le 16 avril 2024.`;

const formattedContent = `La travailleuse consulte le docteur Harry, le 9 octobre 2023. Elle est interprétée par le docteur Roxanne, radiologiste. La travailleuse revoit le docteur Durousseau, le 16 avril 2024.`;

console.log('ORIGINAL CONTENT:');
console.log(originalContent);
console.log('\nFORMATTED CONTENT:');
console.log(formattedContent);

console.log('\n=== TESTING FINAL SPACING-PRESERVING RESTORATION ===');

// Simulate the restoreTruncatedNames logic with improved spacing
function restoreTruncatedNamesFinalSpacing(originalContent, formattedContent, language = 'fr') {
  // Simulate extraction results
  const originalNames = [
    {
      fullName: 'docteur Harry Durusso',
      title: 'docteur',
      firstName: 'Harry',
      lastName: 'Durusso',
      isComplete: true
    },
    {
      fullName: 'docteur Roxanne Bouchard-Bellavance',
      title: 'docteur',
      firstName: 'Roxanne',
      lastName: 'Bouchard-Bellavance',
      isComplete: true
    }
  ];
  
  let restoredContent = formattedContent;
  let namesRestored = 0;
  
  // Custom accent-aware boundaries to avoid issues with apostrophes/hyphens
  const B = '(?:^|\\s)';
  const E = '(?=\\s|,|\\.|$)';
  
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
      const titleFirstPattern = new RegExp(`(le\\s+)?${escapedTitle}\\s+${escapedFirstName}${E}`, 'gi');
      if (titleFirstPattern.test(restoredContent)) {
        restoredContent = restoredContent.replace(titleFirstPattern, (match) => {
          // Check if the match includes "le " at the beginning
          const hasLe = match.toLowerCase().startsWith('le ');
          return (hasLe ? 'le ' : '') + originalName.fullName;
        });
        namesRestored++;
        console.log(`✅ Restored incomplete name: "${originalName.title} ${originalName.firstName}" → "${originalName.fullName}"`);
        return;
      }
      
      console.log(`❌ No match found for: ${originalName.fullName}`);
    }
  });
  
  return { restoredContent, namesRestored };
}

const restorationResult = restoreTruncatedNamesFinalSpacing(originalContent, formattedContent);

console.log('\n=== RESTORATION RESULTS ===');
console.log(`Names restored: ${restorationResult.namesRestored}`);
console.log('\nRESTORED CONTENT:');
console.log(restorationResult.restoredContent);

console.log('\n=== COMPARISON ===');
console.log('BEFORE:');
console.log(formattedContent);
console.log('\nAFTER:');
console.log(restorationResult.restoredContent);

// Check if restoration was successful and spacing is preserved
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

// Check spacing
if (restorationResult.restoredContent.includes('le docteur Harry Durusso')) {
  console.log('✅ Spacing preserved: SUCCESS');
} else {
  console.log('❌ Spacing preserved: FAILED');
}

if (restorationResult.namesRestored === 2) {
  console.log('✅ Total restorations: SUCCESS (2/2)');
} else {
  console.log(`❌ Total restorations: FAILED (${restorationResult.namesRestored}/2)`);
}
