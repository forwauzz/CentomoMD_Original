/**
 * Template Pipeline Tracer
 * Tests which processing pipeline is used for each template combination
 */

import { formatWordForWordText } from './dist/src/utils/wordForWordFormatter.js';
import { Mode2Formatter } from './dist/src/services/formatter/mode2.js';
import { processingOrchestrator } from './dist/src/services/processing/ProcessingOrchestrator.js';
import { templateManager } from './dist/src/config/templates.js';
import { modeManager } from './dist/src/config/modes.js';
import { sectionManager } from './dist/src/config/sections.js';

console.log('🧪 Testing Template Pipeline Processing\n');

// Test data
const testTranscript = "Pt: The patient said open parenthesis I have diabetes close parenthesis new paragraph blood pressure is high period";

// Test configurations
const testConfigs = [
  {
    name: "Word-for-Word Template (Dragon-like)",
    sectionId: "section_7",
    modeId: "mode1", 
    templateId: "word-for-word-formatter",
    language: "en",
    expectedPipeline: "Word-for-Word Formatter (formatWordForWordText)"
  },
  {
    name: "AI Formatter Basic",
    sectionId: "section_7", 
    modeId: "mode2",
    templateId: "ai-formatter-basic",
    language: "en",
    expectedPipeline: "Mode2Formatter with AI processing"
  },
  {
    name: "AI + Verbatim Template",
    sectionId: "section_7",
    modeId: "mode2", 
    templateId: "ai-formatter-verbatim",
    language: "en",
    expectedPipeline: "Mode2Formatter with verbatim protection"
  },
  {
    name: "AI + Verbatim + Voice Commands",
    sectionId: "section_7",
    modeId: "mode2",
    templateId: "ai-formatter-full", 
    language: "en",
    expectedPipeline: "Mode2Formatter with all features"
  }
];

async function testTemplatePipeline() {
  console.log('📋 Available Templates:');
  const templates = templateManager.getAllTemplates();
  templates.forEach(template => {
    console.log(`   - ${template.id}: ${template.name}`);
    console.log(`     Features: AI=${template.features.aiFormatting}, Verbatim=${template.features.verbatimSupport}, Voice=${template.features.voiceCommandsSupport}`);
  });
  console.log('');

  console.log('⚙️ Available Modes:');
  const modes = modeManager.getAllModes();
  modes.forEach(mode => {
    console.log(`   - ${mode.id}: ${mode.name}`);
    console.log(`     Capabilities: AI=${mode.capabilities.aiFormatting}, Verbatim=${mode.capabilities.verbatimSupport}, Voice=${mode.capabilities.voiceCommands}`);
  });
  console.log('');

  console.log('📄 Available Sections:');
  const sections = sectionManager.getAllSections();
  sections.forEach(section => {
    console.log(`   - ${section.id}: ${section.name}`);
  });
  console.log('');

  // Test each configuration
  for (const config of testConfigs) {
    console.log(`🔍 Testing: ${config.name}`);
    console.log(`   Expected Pipeline: ${config.expectedPipeline}`);
    console.log(`   Input: "${testTranscript}"`);
    console.log('');

    try {
      // Test 1: Check compatibility
      const compatibility = processingOrchestrator.checkCompatibility({
        sectionId: config.sectionId,
        modeId: config.modeId,
        templateId: config.templateId,
        language: config.language,
        content: testTranscript
      });

      console.log(`   ✅ Compatibility Check: ${compatibility.compatible ? 'PASS' : 'FAIL'}`);
      if (!compatibility.compatible) {
        console.log(`   ❌ Issues: ${compatibility.issues.join(', ')}`);
        continue;
      }

      // Test 2: Process through orchestrator
      console.log('   🔄 Processing through ProcessingOrchestrator...');
      const result = await processingOrchestrator.processContent({
        sectionId: config.sectionId,
        modeId: config.modeId,
        templateId: config.templateId,
        language: config.language,
        content: testTranscript
      });

      console.log(`   📊 Orchestrator Result: ${result.success ? 'SUCCESS' : 'FAILED'}`);
      console.log(`   📝 Processed Content: "${result.processedContent}"`);
      console.log(`   ⏱️  Processing Time: ${result.metadata.processingTime}ms`);
      if (result.metadata.warnings.length > 0) {
        console.log(`   ⚠️  Warnings: ${result.metadata.warnings.join(', ')}`);
      }
      if (result.metadata.errors.length > 0) {
        console.log(`   ❌ Errors: ${result.metadata.errors.join(', ')}`);
      }

      // Test 3: Direct Word-for-Word processing (for comparison)
      if (config.templateId === 'word-for-word-formatter') {
        console.log('   🔄 Direct Word-for-Word Processing...');
        const directResult = formatWordForWordText(testTranscript);
        console.log(`   📝 Direct Result: "${directResult}"`);
        console.log(`   🔍 Match with Orchestrator: ${result.processedContent === directResult ? 'YES' : 'NO'}`);
      }

      // Test 4: Direct Mode2 processing (for comparison)
      if (config.modeId === 'mode2') {
        console.log('   🔄 Direct Mode2 Processing...');
        try {
          const mode2Formatter = new Mode2Formatter();
          const mode2Result = await mode2Formatter.format(testTranscript, {
            language: config.language,
            section: config.sectionId.replace('section_', ''),
            case_id: 'test-case',
            selected_sections: [config.sectionId],
            extra_dictation: '',
            templateCombo: config.templateId,
            verbatimSupport: config.templateId.includes('verbatim'),
            voiceCommandsSupport: config.templateId.includes('voice') || config.templateId === 'word-for-word-formatter'
          });
          console.log(`   📝 Mode2 Result: "${mode2Result.formatted}"`);
          console.log(`   🔍 Match with Orchestrator: ${result.processedContent === mode2Result.formatted ? 'YES' : 'NO'}`);
        } catch (error) {
          console.log(`   ❌ Mode2 Error: ${error.message}`);
        }
      }

    } catch (error) {
      console.log(`   ❌ Test Failed: ${error.message}`);
    }

    console.log('   ' + '─'.repeat(60));
    console.log('');
  }

  // Test 5: Pipeline Analysis
  console.log('📊 PIPELINE ANALYSIS:');
  console.log('');
  
  console.log('🔍 Word-for-Word Template Analysis:');
  console.log('   Current Implementation: ProcessingOrchestrator (placeholder methods)');
  console.log('   Expected Implementation: formatWordForWordText()');
  console.log('   Issue: Orchestrator methods are not implemented!');
  console.log('');

  console.log('🔍 AI Templates Analysis:');
  console.log('   Current Implementation: ProcessingOrchestrator (placeholder methods)');
  console.log('   Expected Implementation: Mode2Formatter');
  console.log('   Issue: Orchestrator methods are not implemented!');
  console.log('');

  console.log('🔍 Actual Processing Endpoints:');
  console.log('   - /api/format/mode2: Uses Mode2Formatter directly');
  console.log('   - /api/templates/format: Uses AIFormattingService directly');
  console.log('   - ProcessingOrchestrator: NOT USED in actual API endpoints!');
  console.log('');

  console.log('🎯 RECOMMENDATIONS:');
  console.log('   1. Implement ProcessingOrchestrator.applyTemplateProcessing()');
  console.log('   2. Implement ProcessingOrchestrator.applyModeProcessing()');
  console.log('   3. Connect Word-for-Word template to formatWordForWordText()');
  console.log('   4. Connect AI templates to Mode2Formatter');
  console.log('   5. Update API endpoints to use ProcessingOrchestrator');
  console.log('');
}

// Run the test
testTemplatePipeline().catch(console.error);
