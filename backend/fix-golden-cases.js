#!/usr/bin/env node

/**
 * Fix Golden Cases JSON Parsing Issues
 * Cleans up control characters and validates JSON structure
 */

import fs from 'fs';
import path from 'path';

async function fixGoldenCases() {
  console.log('🔧 Fixing Golden Cases JSON parsing issues...\n');

  try {
    // Read the file
    const filePath = path.join(process.cwd(), 'training', 'golden_cases_section7.jsonl');
    const content = await fs.promises.readFile(filePath, 'utf8');
    
    console.log(`📄 Original file size: ${content.length} characters`);
    
    // Split into lines and process each one
    const lines = content.trim().split('\n');
    console.log(`📊 Total lines: ${lines.length}`);
    
    const fixedLines = [];
    let errorCount = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      try {
        // Try to parse the JSON
        const parsed = JSON.parse(line);
        
        // Re-stringify to clean up any control characters
        const cleaned = JSON.stringify(parsed);
        fixedLines.push(cleaned);
        
      } catch (error) {
        console.log(`❌ Error in line ${i + 1}: ${error.message}`);
        errorCount++;
        
        // Try to fix common issues
        let fixedLine = line;
        
        // Remove control characters except \n, \r, \t
        fixedLine = fixedLine.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
        
        // Try parsing again
        try {
          const parsed = JSON.parse(fixedLine);
          const cleaned = JSON.stringify(parsed);
          fixedLines.push(cleaned);
          console.log(`✅ Fixed line ${i + 1}`);
        } catch (secondError) {
          console.log(`❌ Could not fix line ${i + 1}: ${secondError.message}`);
          // Skip this line
        }
      }
    }
    
    console.log(`\n📊 Results:`);
    console.log(`   Total lines: ${lines.length}`);
    console.log(`   Errors found: ${errorCount}`);
    console.log(`   Fixed lines: ${fixedLines.length}`);
    
    if (fixedLines.length > 0) {
      // Write the fixed content back
      const fixedContent = fixedLines.join('\n');
      await fs.promises.writeFile(filePath, fixedContent, 'utf8');
      console.log(`✅ Fixed file written successfully`);
      
      // Validate the fixed file
      console.log(`\n🧪 Validating fixed file...`);
      const validationContent = await fs.promises.readFile(filePath, 'utf8');
      const validationLines = validationContent.trim().split('\n');
      
      let validationErrors = 0;
      for (let i = 0; i < validationLines.length; i++) {
        try {
          JSON.parse(validationLines[i]);
        } catch (error) {
          console.log(`❌ Validation error in line ${i + 1}: ${error.message}`);
          validationErrors++;
        }
      }
      
      if (validationErrors === 0) {
        console.log(`✅ All ${validationLines.length} lines validated successfully!`);
      } else {
        console.log(`❌ ${validationErrors} validation errors remain`);
      }
    }
    
  } catch (error) {
    console.log('❌ Failed to fix golden cases:', error.message);
  }
}

// Run the fix
fixGoldenCases().catch(console.error);
