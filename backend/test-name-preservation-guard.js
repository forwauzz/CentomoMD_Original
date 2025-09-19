// Test for updated Section7Guards.namePreservationGuard
console.log('=== NAME PRESERVATION GUARD TEST ===\n');

// Test data
const originalContent = `La travailleuse consulte le docteur Harry Durusso, 9 octobre 2023. Elle est interprétée par le docteur Roxanne Bouchard-Bellavance, radiologiste. Travailleuse revoit le docteur Durousseau le 16 avril 2024.`;

const formattedContent = `La travailleuse consulte le docteur Harry, le 9 octobre 2023. Elle est interprétée par le docteur Roxanne, radiologiste. La travailleuse revoit le docteur Durousseau, le 16 avril 2024.`;

console.log('ORIGINAL CONTENT:');
console.log(originalContent);
console.log('\nFORMATTED CONTENT:');
console.log(formattedContent);

console.log('\n=== TESTING UPDATED NAME PRESERVATION GUARD ===');

// Simulate the updated namePreservationGuard logic
function namePreservationGuard(
  text, 
  originalContent, 
  language = 'fr'
) {
  const violations = [];
  const metadata = { 
    name_restorations: [],
    suggestions: []
  };
  let processedText = text;
  
  // Simulate NamePreservationEngine extraction
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
    },
    {
      fullName: 'docteur Durousseau le',
      title: 'docteur',
      firstName: 'Durousseau',
      lastName: 'le',
      isComplete: true
    }
  ];
  
  // Custom accent-aware boundaries
  const B = '(?:^|\\s)';
  const E = '(?=\\s|,|\\.|$)';
  
  // Check for name truncation and restore both Title + Last and Title + First
  originalNames.forEach((originalName) => {
    if (originalName.isComplete) {
      console.log(`\nProcessing: ${originalName.fullName}`);
      
      // Escape special regex characters
      const escapedTitle = originalName.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const escapedLastName = originalName.lastName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const escapedFirstName = originalName.firstName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const escapedFullName = originalName.fullName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      // Check if full name already exists (no need to restore)
      const fullNamePattern = new RegExp(`${B}${escapedFullName}${E}`, 'gi');
      if (fullNamePattern.test(processedText)) {
        console.log(`✅ Full name already present: "${originalName.fullName}"`);
        return; // Full name already present
      }
      
      // 1. Check for Title + Last name truncation
      const titleLastPattern = new RegExp(`${B}${escapedTitle}\\s+${escapedLastName}${E}`, 'gi');
      if (titleLastPattern.test(processedText)) {
        processedText = processedText.replace(titleLastPattern, originalName.fullName);
        metadata.name_restorations.push({
          from: `${originalName.title} ${originalName.lastName}`,
          to: originalName.fullName,
          reason: 'title_last_truncation_detected',
          type: 'auto_fix'
        });
        console.log(`✅ Auto-fixed Title + Last: "${originalName.title} ${originalName.lastName}" → "${originalName.fullName}"`);
        return;
      }
      
      // 2. Check for Title + First name truncation (with article preservation)
      const titleFirstPattern = new RegExp(`(le\\s+)?${escapedTitle}\\s+${escapedFirstName}${E}`, 'gi');
      if (titleFirstPattern.test(processedText)) {
        processedText = processedText.replace(titleFirstPattern, (match) => {
          const hasLe = match.toLowerCase().startsWith('le ');
          return (hasLe ? 'le ' : '') + originalName.fullName;
        });
        metadata.name_restorations.push({
          from: `${originalName.title} ${originalName.firstName}`,
          to: originalName.fullName,
          reason: 'title_first_truncation_detected',
          type: 'auto_fix'
        });
        console.log(`✅ Auto-fixed Title + First: "${originalName.title} ${originalName.firstName}" → "${originalName.fullName}"`);
        return;
      }
      
      console.log(`❌ No truncation found for: ${originalName.fullName}`);
    }
  });
  
  // Check for name inconsistencies in original content (suggestions only)
  const nameVariants = new Map();
  originalNames.forEach((name) => {
    if (name.isComplete && name.firstName) {
      const key = name.firstName.toLowerCase();
      if (!nameVariants.has(key)) {
        nameVariants.set(key, []);
      }
      nameVariants.get(key).push(name.lastName);
    }
  });
  
  // Add suggestions for name inconsistencies
  nameVariants.forEach((lastNames, firstName) => {
    if (lastNames.length > 1) {
      const uniqueLastNames = [...new Set(lastNames)];
      if (uniqueLastNames.length > 1) {
        metadata.suggestions.push({
          type: 'name_inconsistency',
          message: `Multiple last name variants found for "${firstName}": ${uniqueLastNames.join(', ')}. Please verify spelling.`,
          firstName,
          variants: uniqueLastNames
        });
        console.log(`💡 Suggestion: Multiple variants for "${firstName}": ${uniqueLastNames.join(', ')}`);
      }
    }
  });
  
  return { text: processedText, violations, metadata };
}

const guardResult = namePreservationGuard(formattedContent, originalContent);

console.log('\n=== GUARD RESULTS ===');
console.log(`Violations: ${guardResult.violations.length}`);
console.log(`Auto-fixes: ${guardResult.metadata.name_restorations.length}`);
console.log(`Suggestions: ${guardResult.metadata.suggestions.length}`);

console.log('\n=== AUTO-FIXES ===');
guardResult.metadata.name_restorations.forEach((fix, index) => {
  console.log(`${index + 1}. ${fix.from} → ${fix.to} (${fix.reason})`);
});

console.log('\n=== SUGGESTIONS ===');
guardResult.metadata.suggestions.forEach((suggestion, index) => {
  console.log(`${index + 1}. ${suggestion.message}`);
});

console.log('\n=== PROCESSED TEXT ===');
console.log(guardResult.text);

console.log('\n=== COMPARISON ===');
console.log('BEFORE:');
console.log(formattedContent);
console.log('\nAFTER:');
console.log(guardResult.text);

// Validation
console.log('\n=== VALIDATION ===');
if (guardResult.text.includes('le docteur Harry Durusso')) {
  console.log('✅ Harry Durusso auto-fix: SUCCESS');
} else {
  console.log('❌ Harry Durusso auto-fix: FAILED');
}

if (guardResult.text.includes('le docteur Roxanne Bouchard-Bellavance')) {
  console.log('✅ Roxanne Bouchard-Bellavance auto-fix: SUCCESS');
} else {
  console.log('❌ Roxanne Bouchard-Bellavance auto-fix: FAILED');
}

if (guardResult.metadata.name_restorations.length === 2) {
  console.log('✅ Total auto-fixes: SUCCESS (2/2)');
} else {
  console.log(`❌ Total auto-fixes: FAILED (${guardResult.metadata.name_restorations.length}/2)`);
}

if (guardResult.violations.length === 0) {
  console.log('✅ No critical violations: SUCCESS');
} else {
  console.log(`❌ Critical violations: ${guardResult.violations.length}`);
}
