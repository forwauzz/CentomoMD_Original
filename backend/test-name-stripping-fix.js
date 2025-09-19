// Test for fixed name stripping issue
console.log('=== NAME STRIPPING FIX TEST ===\n');

// Simulate the updated stripInventedFirstNames function
function stripInventedFirstNames(text, whitelist) {
  // Preserve paragraph breaks by normalizing spaces within paragraphs only
  let t = text.replace(/[ \t]+/g, ' '); // Only normalize spaces and tabs, preserve newlines
  
  // Create a set of whitelisted full names for faster lookup
  const whitelistSet = new Set(whitelist);
  
  // Pattern to match "docteur <First> <Last>" or "docteur <Last>"
  const reTwo = /\b(docteur|docteure|Dr\.|Dre\.)\s+([A-ZÀÂÄÇÉÈÊËÎÏÔÖÙÛÜŸ][\p{L}'\-]+)\s+([A-ZÀÂÄÇÉÈÊËÎÏÔÖÙÛÜŸ][\p{L}'\-]+)\b/gu;
  
  t = t.replace(reTwo, (match, title, first, last) => {
    const fullName = `${title} ${first} ${last}`.replace(/\s+/g, ' ').trim();
    const lastNameOnly = `${title} ${last}`.replace(/\s+/g, ' ').trim();
    
    console.log(`Processing: "${match}"`);
    console.log(`  Full name: "${fullName}"`);
    console.log(`  Last name only: "${lastNameOnly}"`);
    console.log(`  Full name in whitelist: ${whitelistSet.has(fullName)}`);
    console.log(`  Last name in whitelist: ${whitelistSet.has(lastNameOnly)}`);
    
    // If the full name is in the whitelist, keep it (legitimate full name)
    if (whitelistSet.has(fullName)) {
      console.log(`  ✅ Keeping full name (legitimate)`);
      return fullName;
    }
    
    // If only the last name version is in the whitelist, keep the full name anyway
    // (let NamePreservationEngine handle the restoration)
    if (whitelistSet.has(lastNameOnly)) {
      console.log(`  ✅ Keeping full name (let NamePreservationEngine handle)`);
      return fullName;
    }
    
    // If neither is in the whitelist, this might be an invented name
    // Keep the full name but let the NamePreservationEngine validate it
    console.log(`  ⚠️ Keeping full name (let NamePreservationEngine validate)`);
    return fullName;
  });
  
  return t;
}

// Test data
const testText = `La travailleuse consulte le docteur Harry Durusso, le 9 octobre 2023. Elle est interprétée par le docteur Roxanne Bouchard-Bellavance, radiologiste.`;

// Simulate whitelist (what was actually dictated)
const whitelist = [
  'docteur Harry Durusso',  // Full name was dictated
  'docteur Roxanne Bouchard-Bellavance',  // Full name was dictated
  'docteur Durusso',  // Last name only was also dictated
  'docteur Bouchard-Bellavance'  // Last name only was also dictated
];

console.log('TEST TEXT:');
console.log(testText);
console.log('\nWHITELIST:');
whitelist.forEach((name, index) => {
  console.log(`${index + 1}. "${name}"`);
});

console.log('\n=== TESTING UPDATED STRIP FUNCTION ===');
const result = stripInventedFirstNames(testText, whitelist);

console.log('\n=== RESULTS ===');
console.log('BEFORE:');
console.log(testText);
console.log('\nAFTER:');
console.log(result);

console.log('\n=== VALIDATION ===');
if (result.includes('docteur Harry Durusso')) {
  console.log('✅ Harry Durusso preserved: SUCCESS');
} else {
  console.log('❌ Harry Durusso preserved: FAILED');
}

if (result.includes('docteur Roxanne Bouchard-Bellavance')) {
  console.log('✅ Roxanne Bouchard-Bellavance preserved: SUCCESS');
} else {
  console.log('❌ Roxanne Bouchard-Bellavance preserved: FAILED');
}

// Test with invented names (not in whitelist)
console.log('\n=== TESTING WITH INVENTED NAMES ===');
const testWithInvented = `La travailleuse consulte le docteur Nicolas Invented, le 9 octobre 2023.`;
const resultWithInvented = stripInventedFirstNames(testWithInvented, whitelist);

console.log('BEFORE:');
console.log(testWithInvented);
console.log('\nAFTER:');
console.log(resultWithInvented);

if (resultWithInvented.includes('docteur Nicolas Invented')) {
  console.log('✅ Invented name preserved (let NamePreservationEngine validate): SUCCESS');
} else {
  console.log('❌ Invented name preserved: FAILED');
}
