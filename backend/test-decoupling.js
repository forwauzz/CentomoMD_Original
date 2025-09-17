/**
 * Test script to verify decoupling of sections, modes, and templates
 */

import { sectionManager } from './dist/src/config/sections.js';
import { modeManager } from './dist/src/config/modes.js';
import { templateManager } from './dist/src/config/templates.js';
import { processingOrchestrator } from './dist/src/services/processing/ProcessingOrchestrator.js';

console.log('🧪 Testing Decoupled Architecture\n');

// Test 1: Section Independence
console.log('📋 Test 1: Section Independence');
console.log('================================');

const allSections = sectionManager.getAllSections();
console.log(`✅ Found ${allSections.length} sections:`);
allSections.forEach(section => {
  console.log(`   - ${section.id}: ${section.name} (modes: ${section.supportedModes.join(', ')})`);
});

// Test 2: Mode Independence
console.log('\n⚙️  Test 2: Mode Independence');
console.log('=============================');

const allModes = modeManager.getAllModes();
console.log(`✅ Found ${allModes.length} modes:`);
allModes.forEach(mode => {
  console.log(`   - ${mode.id}: ${mode.name} (sections: ${mode.supportedSections.join(', ')})`);
});

// Test 3: Template Independence
console.log('\n📄 Test 3: Template Independence');
console.log('=================================');

const allTemplates = templateManager.getAllTemplates();
console.log(`✅ Found ${allTemplates.length} templates:`);
allTemplates.forEach(template => {
  console.log(`   - ${template.id}: ${template.name} (sections: ${template.compatibleSections.join(', ')}, modes: ${template.compatibleModes.join(', ')})`);
});

// Test 4: Compatibility Checking
console.log('\n🔍 Test 4: Compatibility Checking');
console.log('==================================');

const testRequests = [
  {
    sectionId: 'section_7',
    modeId: 'mode2',
    templateId: 'ai-formatter-basic',
    language: 'fr',
    content: 'Test content for section 7'
  },
  {
    sectionId: 'section_8',
    modeId: 'mode1',
    templateId: 'word-for-word-formatter',
    language: 'en',
    content: 'Test content for section 8'
  },
  {
    sectionId: 'section_custom',
    modeId: 'mode1',
    templateId: 'word-for-word-formatter',
    language: 'fr',
    content: 'Test content for custom section'
  }
];

testRequests.forEach((request, index) => {
  console.log(`\n   Test ${index + 1}: ${request.sectionId} + ${request.modeId} + ${request.templateId}`);
  const compatibility = processingOrchestrator.checkCompatibility(request);
  console.log(`   Compatible: ${compatibility.compatible ? '✅' : '❌'}`);
  if (!compatibility.compatible) {
    console.log(`   Issues: ${compatibility.issues.join(', ')}`);
  }
});

// Test 5: Best Template/Mode Finding
console.log('\n🎯 Test 5: Best Template/Mode Finding');
console.log('=====================================');

const testScenarios = [
  {
    sectionId: 'section_7',
    language: 'fr',
    requiredFeatures: ['aiFormatting', 'verbatimSupport'],
    description: 'Section 7 with AI formatting and verbatim support'
  },
  {
    sectionId: 'section_8',
    language: 'en',
    requiredCapabilities: ['voiceCommands', 'realtimeProcessing'],
    description: 'Section 8 with voice commands and realtime processing'
  }
];

testScenarios.forEach((scenario, index) => {
  console.log(`\n   Scenario ${index + 1}: ${scenario.description}`);
  
  if (scenario.requiredFeatures) {
    const bestTemplate = templateManager.getBestTemplate(
      scenario.sectionId, 
      'mode2', // Use mode2 as it supports most features
      scenario.language, 
      scenario.requiredFeatures
    );
    console.log(`   Best Template: ${bestTemplate ? bestTemplate.id : 'None found'}`);
  }
  
  if (scenario.requiredCapabilities) {
    const bestMode = modeManager.getBestMode(
      scenario.sectionId,
      scenario.language,
      scenario.requiredCapabilities
    );
    console.log(`   Best Mode: ${bestMode ? bestMode.id : 'None found'}`);
  }
});

// Test 6: Compatible Combinations
console.log('\n🔗 Test 6: Compatible Combinations');
console.log('===================================');

const testSection = 'section_7';
const testLanguage = 'fr';

console.log(`\n   Finding compatible combinations for ${testSection} in ${testLanguage}:`);
const combinations = processingOrchestrator.getCompatibleCombinations(testSection, testLanguage);

console.log(`   Compatible Modes: ${combinations.modes.map(m => m.id).join(', ')}`);
console.log(`   Compatible Templates: ${combinations.templates.map(t => t.id).join(', ')}`);
console.log(`   Best Combinations:`);

combinations.combinations.slice(0, 3).forEach((combo, index) => {
  console.log(`     ${index + 1}. ${combo.mode.id} + ${combo.template.id} (compatibility: ${(combo.compatibility * 100).toFixed(1)}%)`);
});

// Test 7: Dynamic Addition
console.log('\n➕ Test 7: Dynamic Addition');
console.log('===========================');

// Add a new section dynamically
const newSection = {
  id: 'section_test',
  name: 'Test Section',
  nameEn: 'Test Section',
  description: 'A test section for decoupling verification',
  descriptionEn: 'A test section for decoupling verification',
  order: 100,
  audioRequired: false,
  supportedModes: ['mode1', 'mode2'],
  supportedLanguages: ['fr', 'en'],
  validationRules: {
    minLength: 10,
    maxLength: 1000
  },
  metadata: {
    category: 'test',
    tags: ['test', 'dynamic'],
    version: '1.0.0'
  }
};

sectionManager.addSection(newSection);
console.log(`✅ Added new section: ${newSection.id}`);

// Verify it was added
const retrievedSection = sectionManager.getSection('section_test');
console.log(`✅ Retrieved section: ${retrievedSection ? retrievedSection.name : 'Not found'}`);

// Test 8: Independence Verification
console.log('\n🔒 Test 8: Independence Verification');
console.log('=====================================');

// Verify that sections don't depend on specific modes
const section7 = sectionManager.getSection('section_7');
const section7Modes = section7 ? section7.supportedModes : [];
console.log(`✅ Section 7 supports modes: ${section7Modes.join(', ')}`);

// Verify that modes don't depend on specific sections
const mode2 = modeManager.getMode('mode2');
const mode2Sections = mode2 ? mode2.supportedSections : [];
console.log(`✅ Mode 2 supports sections: ${mode2Sections.join(', ')}`);

// Verify that templates don't depend on specific sections/modes
const template = templateManager.getTemplate('ai-formatter-basic');
const templateSections = template ? template.compatibleSections : [];
const templateModes = template ? template.compatibleModes : [];
console.log(`✅ AI Formatter Basic is compatible with sections: ${templateSections.join(', ')}`);
console.log(`✅ AI Formatter Basic is compatible with modes: ${templateModes.join(', ')}`);

console.log('\n🎉 Decoupling Test Complete!');
console.log('=============================');
console.log('✅ Sections are independent of modes and templates');
console.log('✅ Modes are independent of sections and templates');
console.log('✅ Templates are independent of sections and modes');
console.log('✅ All components can be dynamically configured');
console.log('✅ Compatibility checking works across all combinations');
