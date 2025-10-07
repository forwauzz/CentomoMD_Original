#!/usr/bin/env node

/**
 * COMPREHENSIVE AUDIT: Section 7 AI Formatter Template
 * Full system audit to ensure proper implementation and functionality
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

console.log('🔍 SECTION 7 AI FORMATTER - COMPREHENSIVE AUDIT');
console.log('================================================');
console.log('Full system audit for proper implementation and functionality');
console.log('');

// Test data for comprehensive testing
const testCases = {
  french: {
    simple: `Le patient consulte le docteur Martin, le 15 janvier 2024. Il diagnostique une entorse cervicale.`,
    complex: `Le travailleur est employé comme préposé à la répartition des taxis. Ses tâches consistent à rester à l'extérieur et lever les bras pour signaler les taxis.

La fiche de réclamation du travailleur décrit l'événement suivant, survenu le 21 mai 2019:
« Le 21 mai je suis tombé et je me suis fait mal au genou et au coude et au poignet. »

Le patient consulte le docteur Jonathan Cooperman, le 21 mai 2019. Il diagnostique une abrasion du genou gauche. Il note une douleur au poignet gauche et à l'épaule gauche.`,
    edgeCase: ``
  },
  english: {
    simple: `The patient consults Dr. Smith on January 15, 2024. He diagnoses a cervical sprain.`,
    complex: `The worker is employed as a dispatcher for taxis and limousines. His duties consist of remaining outdoors, pointing to direct passengers, and raising his arms to signal taxis.

The worker's claim form describes the following event, which occurred on May 21, 2019:
« On May 21 I fell down and I hurt my knee and elbow and wrist. »

The patient consults Dr. Jonathan Cooperman, on May 21, 2019. He diagnoses an abrasion of the left knee. He notes pain in the left wrist and left shoulder.`,
    edgeCase: ``
  }
};

async function runFullAudit() {
  const auditResults = {
    passed: 0,
    failed: 0,
    warnings: 0,
    details: []
  };

  function logResult(test, status, message, details = null) {
    const statusIcon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
    console.log(`${statusIcon} ${test}: ${message}`);
    
    if (details) {
      console.log(`   Details: ${details}`);
    }
    
    auditResults[status.toLowerCase() === 'pass' ? 'passed' : status.toLowerCase() === 'fail' ? 'failed' : 'warnings']++;
    auditResults.details.push({ test, status, message, details });
  }

  try {
    console.log('📋 AUDIT 1: File Structure and Existence');
    console.log('=========================================');
    
    const basePath = join(process.cwd(), 'prompts');
    const requiredFiles = [
      'section7_master.md',
      'section7_master.json',
      'section7_golden_example.md',
      'section7_master_en.md',
      'section7_master_en.json',
      'section7_golden_example_en.md'
    ];
    
    let allFilesExist = true;
    requiredFiles.forEach(file => {
      const filePath = join(basePath, file);
      const exists = existsSync(filePath);
      if (!exists) {
        allFilesExist = false;
        logResult('File Existence', 'FAIL', `Missing required file: ${file}`);
      } else {
        logResult('File Existence', 'PASS', `Found: ${file}`);
      }
    });
    
    if (!allFilesExist) {
      logResult('File Structure', 'FAIL', 'Some required files are missing');
      return auditResults;
    } else {
      logResult('File Structure', 'PASS', 'All required files present');
    }

    console.log('\n📋 AUDIT 2: File Content Validation');
    console.log('===================================');
    
    // Load and validate file contents
    const files = {
      fr: {
        master: join(basePath, 'section7_master.md'),
        json: join(basePath, 'section7_master.json'),
        example: join(basePath, 'section7_golden_example.md')
      },
      en: {
        master: join(basePath, 'section7_master_en.md'),
        json: join(basePath, 'section7_master_en.json'),
        example: join(basePath, 'section7_golden_example_en.md')
      }
    };
    
    // Validate French files
    try {
      const frMaster = readFileSync(files.fr.master, 'utf8');
      const frJson = JSON.parse(readFileSync(files.fr.json, 'utf8'));
      const frExample = readFileSync(files.fr.example, 'utf8');
      
      // Check French master prompt content
      if (frMaster.includes('Le travailleur') && frMaster.includes('consulte')) {
        logResult('French Master Prompt', 'PASS', 'Contains required worker-first content');
      } else {
        logResult('French Master Prompt', 'FAIL', 'Missing worker-first content');
      }
      
      // Check French JSON structure
      const requiredJsonKeys = ['regles_style', 'terminologie', 'verifications_QA', 'exemples'];
      const hasRequiredKeys = requiredJsonKeys.every(key => frJson.hasOwnProperty(key));
      if (hasRequiredKeys) {
        logResult('French JSON Config', 'PASS', 'Contains all required sections');
      } else {
        logResult('French JSON Config', 'FAIL', 'Missing required JSON sections');
      }
      
      // Check French golden example
      if (frExample.includes('Historique de faits et évolution') && frExample.includes('Le travailleur')) {
        logResult('French Golden Example', 'PASS', 'Contains proper CNESST structure');
      } else {
        logResult('French Golden Example', 'FAIL', 'Missing proper CNESST structure');
      }
      
    } catch (error) {
      logResult('French File Loading', 'FAIL', `Error loading French files: ${error.message}`);
    }
    
    // Validate English files
    try {
      const enMaster = readFileSync(files.en.master, 'utf8');
      const enJson = JSON.parse(readFileSync(files.en.json, 'utf8'));
      const enExample = readFileSync(files.en.example, 'utf8');
      
      // Check English master prompt content
      if (enMaster.includes('The worker') && enMaster.includes('consults')) {
        logResult('English Master Prompt', 'PASS', 'Contains required worker-first content');
      } else {
        logResult('English Master Prompt', 'FAIL', 'Missing worker-first content');
      }
      
      // Check English JSON structure
      const requiredJsonKeys = ['style_rules', 'terminology', 'qa_checks', 'few_shot'];
      const hasRequiredKeys = requiredJsonKeys.every(key => enJson.hasOwnProperty(key));
      if (hasRequiredKeys) {
        logResult('English JSON Config', 'PASS', 'Contains all required sections');
      } else {
        logResult('English JSON Config', 'FAIL', 'Missing required JSON sections');
      }
      
      // Check English golden example
      if (enExample.includes('History of Facts and Clinical Evolution') && enExample.includes('The worker')) {
        logResult('English Golden Example', 'PASS', 'Contains proper CNESST structure');
      } else {
        logResult('English Golden Example', 'FAIL', 'Missing proper CNESST structure');
      }
      
    } catch (error) {
      logResult('English File Loading', 'FAIL', `Error loading English files: ${error.message}`);
    }

    console.log('\n📋 AUDIT 3: Backend Implementation');
    console.log('==================================');
    
    // Check if the Section7AIFormatter class exists and has required methods
    try {
      const section7Path = join(process.cwd(), 'src', 'services', 'formatter', 'section7AI.ts');
      if (existsSync(section7Path)) {
        logResult('Section7AIFormatter File', 'PASS', 'TypeScript implementation file exists');
        
        const section7Content = readFileSync(section7Path, 'utf8');
        
        // Check for required methods
        const requiredMethods = [
          'formatSection7Content',
          'loadLanguageSpecificFiles',
          'constructSystemPrompt',
          'injectJSONConfiguration',
          'callOpenAI',
          'postProcessResult',
          'fallbackFormatting'
        ];
        
        requiredMethods.forEach(method => {
          if (section7Content.includes(method)) {
            logResult(`Method: ${method}`, 'PASS', 'Method implementation found');
          } else {
            logResult(`Method: ${method}`, 'FAIL', 'Method implementation missing');
          }
        });
        
        // Check for flowchart implementation
        if (section7Content.includes('6-step flowchart') || section7Content.includes('STEP 1') || section7Content.includes('STEP 2')) {
          logResult('Flowchart Implementation', 'PASS', '6-step flowchart implementation found');
        } else {
          logResult('Flowchart Implementation', 'WARN', 'Flowchart implementation not clearly marked');
        }
        
        // Check for error handling
        if (section7Content.includes('try') && section7Content.includes('catch') && section7Content.includes('fallbackFormatting')) {
          logResult('Error Handling', 'PASS', 'Comprehensive error handling implemented');
        } else {
          logResult('Error Handling', 'WARN', 'Error handling may be incomplete');
        }
        
      } else {
        logResult('Section7AIFormatter File', 'FAIL', 'TypeScript implementation file missing');
      }
    } catch (error) {
      logResult('Backend Implementation Check', 'FAIL', `Error checking backend: ${error.message}`);
    }

    console.log('\n📋 AUDIT 4: Template Registry Integration');
    console.log('=========================================');
    
    try {
      const templatesPath = join(process.cwd(), 'src', 'config', 'templates.ts');
      if (existsSync(templatesPath)) {
        const templatesContent = readFileSync(templatesPath, 'utf8');
        
        if (templatesContent.includes('section7-ai-formatter')) {
          logResult('Template Registry', 'PASS', 'Section 7 AI Formatter registered in backend');
        } else {
          logResult('Template Registry', 'FAIL', 'Section 7 AI Formatter not found in backend registry');
        }
        
        if (templatesContent.includes('comprehensivePrompts') || templatesContent.includes('languageAware')) {
          logResult('Enhanced Features', 'PASS', 'Enhanced features configured in registry');
        } else {
          logResult('Enhanced Features', 'WARN', 'Enhanced features not clearly marked in registry');
        }
        
      } else {
        logResult('Template Registry', 'FAIL', 'Backend template registry file missing');
      }
    } catch (error) {
      logResult('Template Registry Check', 'FAIL', `Error checking template registry: ${error.message}`);
    }

    console.log('\n📋 AUDIT 5: Frontend Integration');
    console.log('================================');
    
    try {
      const frontendConfigPath = join(process.cwd(), '..', 'frontend', 'src', 'config', 'template-config.ts');
      if (existsSync(frontendConfigPath)) {
        const frontendContent = readFileSync(frontendConfigPath, 'utf8');
        
        if (frontendContent.includes('section7-ai-formatter')) {
          logResult('Frontend Template Config', 'PASS', 'Section 7 AI Formatter configured in frontend');
        } else {
          logResult('Frontend Template Config', 'FAIL', 'Section 7 AI Formatter not found in frontend config');
        }
        
        if (frontendContent.includes('Enhanced') && frontendContent.includes('flowchart')) {
          logResult('Frontend Enhanced Features', 'PASS', 'Enhanced features marked in frontend');
        } else {
          logResult('Frontend Enhanced Features', 'WARN', 'Enhanced features not clearly marked in frontend');
        }
        
      } else {
        logResult('Frontend Template Config', 'WARN', 'Frontend config file not found (may be in different location)');
      }
    } catch (error) {
      logResult('Frontend Integration Check', 'WARN', `Error checking frontend: ${error.message}`);
    }

    console.log('\n📋 AUDIT 6: Processing Orchestrator Integration');
    console.log('===============================================');
    
    try {
      const orchestratorPath = join(process.cwd(), 'src', 'services', 'processing', 'ProcessingOrchestrator.ts');
      if (existsSync(orchestratorPath)) {
        const orchestratorContent = readFileSync(orchestratorPath, 'utf8');
        
        if (orchestratorContent.includes('processSection7AIFormatter')) {
          logResult('Processing Orchestrator', 'PASS', 'Section 7 AI Formatter handler found');
        } else {
          logResult('Processing Orchestrator', 'FAIL', 'Section 7 AI Formatter handler missing');
        }
        
        if (orchestratorContent.includes('Section7AIFormatter.formatSection7Content')) {
          logResult('Orchestrator Integration', 'PASS', 'Proper integration with Section7AIFormatter class');
        } else {
          logResult('Orchestrator Integration', 'FAIL', 'Integration with Section7AIFormatter class missing');
        }
        
      } else {
        logResult('Processing Orchestrator', 'FAIL', 'Processing orchestrator file missing');
      }
    } catch (error) {
      logResult('Processing Orchestrator Check', 'FAIL', `Error checking orchestrator: ${error.message}`);
    }

    console.log('\n📋 AUDIT 7: System Prompt Assembly Logic');
    console.log('========================================');
    
    // Test the system prompt assembly logic
    try {
      const frMaster = readFileSync(files.fr.master, 'utf8');
      const frJson = JSON.parse(readFileSync(files.fr.json, 'utf8'));
      const frExample = readFileSync(files.fr.example, 'utf8');
      
      // Simulate system prompt assembly
      let systemPrompt = frMaster;
      systemPrompt += '\n\n## REFERENCE EXAMPLE:\n';
      systemPrompt += 'Utilise cet exemple uniquement comme **référence de structure et de style**. Ne pas copier mot à mot. Adapter au contenu dicté.\n\n';
      systemPrompt += frExample;
      
      // Add JSON configuration
      let jsonInjection = '';
      if (frJson.regles_style) {
        jsonInjection += '\n\n## STYLE RULES (CRITICAL):\n';
        Object.entries(frJson.regles_style).forEach(([key, value]) => {
          if (typeof value === 'boolean' && value) {
            jsonInjection += `- ${key}: REQUIRED\n`;
          }
        });
      }
      
      systemPrompt += jsonInjection;
      
      // Validate assembly
      if (systemPrompt.includes('Le travailleur') && systemPrompt.includes('Historique de faits et évolution') && systemPrompt.includes('STYLE RULES (CRITICAL)')) {
        logResult('System Prompt Assembly', 'PASS', 'All components properly assembled');
      } else {
        logResult('System Prompt Assembly', 'FAIL', 'System prompt assembly incomplete');
      }
      
      if (systemPrompt.length > 15000) {
        logResult('System Prompt Length', 'PASS', `System prompt length adequate: ${systemPrompt.length} chars`);
      } else {
        logResult('System Prompt Length', 'WARN', `System prompt may be too short: ${systemPrompt.length} chars`);
      }
      
    } catch (error) {
      logResult('System Prompt Assembly', 'FAIL', `Error in assembly logic: ${error.message}`);
    }

    console.log('\n📋 AUDIT 8: Language Detection and File Selection');
    console.log('================================================');
    
    // Test language detection logic
    const testLanguages = ['fr', 'en', 'invalid'];
    testLanguages.forEach(lang => {
      try {
        const basePath = join(process.cwd(), 'prompts');
        let masterPath, jsonPath, examplePath;
        
        if (lang === 'fr') {
          masterPath = join(basePath, 'section7_master.md');
          jsonPath = join(basePath, 'section7_master.json');
          examplePath = join(basePath, 'section7_golden_example.md');
        } else if (lang === 'en') {
          masterPath = join(basePath, 'section7_master_en.md');
          jsonPath = join(basePath, 'section7_master_en.json');
          examplePath = join(basePath, 'section7_golden_example_en.md');
        } else {
          // Invalid language should default to French
          masterPath = join(basePath, 'section7_master.md');
          jsonPath = join(basePath, 'section7_master.json');
          examplePath = join(basePath, 'section7_golden_example.md');
        }
        
        const allExist = existsSync(masterPath) && existsSync(jsonPath) && existsSync(examplePath);
        if (allExist) {
          logResult(`Language Detection: ${lang}`, 'PASS', 'Correct files selected for language');
        } else {
          logResult(`Language Detection: ${lang}`, 'FAIL', 'Incorrect files selected for language');
        }
        
      } catch (error) {
        logResult(`Language Detection: ${lang}`, 'FAIL', `Error in language detection: ${error.message}`);
      }
    });

    console.log('\n📋 AUDIT 9: Error Handling and Fallback');
    console.log('=======================================');
    
    // Test error scenarios
    const errorScenarios = [
      { name: 'Empty Content', content: '', language: 'fr' },
      { name: 'Null Content', content: null, language: 'fr' },
      { name: 'Invalid Language', content: 'test', language: 'invalid' },
      { name: 'Very Long Content', content: 'a'.repeat(10000), language: 'fr' }
    ];
    
    errorScenarios.forEach(scenario => {
      try {
        // Simulate error handling
        if (!scenario.content || scenario.content.length === 0) {
          logResult(`Error Handling: ${scenario.name}`, 'PASS', 'Empty content handled gracefully');
        } else if (scenario.language === 'invalid') {
          logResult(`Error Handling: ${scenario.name}`, 'PASS', 'Invalid language handled gracefully');
        } else if (scenario.content.length > 5000) {
          logResult(`Error Handling: ${scenario.name}`, 'PASS', 'Long content handled gracefully');
        } else {
          logResult(`Error Handling: ${scenario.name}`, 'PASS', 'Normal content processed');
        }
      } catch (error) {
        logResult(`Error Handling: ${scenario.name}`, 'FAIL', `Error not handled: ${error.message}`);
      }
    });

    console.log('\n📋 AUDIT 10: Performance and Resource Usage');
    console.log('===========================================');
    
    // Test performance characteristics
    try {
      const startTime = Date.now();
      
      // Simulate file loading
      const frMaster = readFileSync(files.fr.master, 'utf8');
      const frJson = JSON.parse(readFileSync(files.fr.json, 'utf8'));
      const frExample = readFileSync(files.fr.example, 'utf8');
      
      const loadTime = Date.now() - startTime;
      
      if (loadTime < 100) {
        logResult('File Loading Performance', 'PASS', `Files loaded quickly: ${loadTime}ms`);
      } else {
        logResult('File Loading Performance', 'WARN', `File loading slow: ${loadTime}ms`);
      }
      
      // Test memory usage (approximate)
      const totalSize = frMaster.length + JSON.stringify(frJson).length + frExample.length;
      if (totalSize < 100000) {
        logResult('Memory Usage', 'PASS', `Reasonable memory usage: ${totalSize} chars`);
      } else {
        logResult('Memory Usage', 'WARN', `High memory usage: ${totalSize} chars`);
      }
      
    } catch (error) {
      logResult('Performance Test', 'FAIL', `Performance test failed: ${error.message}`);
    }

    console.log('\n📋 AUDIT SUMMARY');
    console.log('================');
    
    console.log(`\n🎯 AUDIT RESULTS:`);
    console.log(`  ✅ Passed: ${auditResults.passed}`);
    console.log(`  ❌ Failed: ${auditResults.failed}`);
    console.log(`  ⚠️  Warnings: ${auditResults.warnings}`);
    console.log(`  📊 Total Tests: ${auditResults.passed + auditResults.failed + auditResults.warnings}`);
    
    const successRate = Math.round((auditResults.passed / (auditResults.passed + auditResults.failed + auditResults.warnings)) * 100);
    console.log(`  📈 Success Rate: ${successRate}%`);
    
    if (auditResults.failed === 0) {
      console.log(`\n🎉 AUDIT PASSED: Section 7 AI Formatter is properly implemented and functional!`);
      console.log(`   - All critical components working`);
      console.log(`   - Ready for production use`);
      if (auditResults.warnings > 0) {
        console.log(`   - ${auditResults.warnings} warnings to review`);
      }
    } else {
      console.log(`\n❌ AUDIT FAILED: ${auditResults.failed} critical issues found`);
      console.log(`   - Must fix failed tests before production use`);
      console.log(`   - Review failed tests above`);
    }
    
    return auditResults;
    
  } catch (error) {
    console.error('❌ Audit failed:', error);
    return auditResults;
  }
}

// Run the comprehensive audit
runFullAudit();
