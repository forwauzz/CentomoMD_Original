/**
 * Test Template Combinations
 * Comprehensive test suite to verify all templates work correctly
 */

import * as dotenv from 'dotenv';
import { getDb } from '../src/database/connection.js';
import { templateCombinations } from '../src/database/schema.js';
import { TemplateCombinationService } from '../src/services/TemplateCombinationService.js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { eq } from 'drizzle-orm';

dotenv.config();

interface TemplateConfig {
  id: string;
  name: string;
  nameFr: string;
  description: string;
  descriptionFr: string;
  type: 'formatter' | 'ai-formatter' | 'template-combo';
  compatibleSections: string[];
  compatibleModes: string[];
  language: 'fr' | 'en' | 'both';
  complexity: 'low' | 'medium' | 'high';
  tags: string[];
  isActive: boolean;
  isDefault: boolean;
  features: {
    verbatimSupport: boolean;
    voiceCommandsSupport: boolean;
    aiFormatting: boolean;
    postProcessing: boolean;
  };
  prompt?: string;
  promptFr?: string;
  content?: string;
  config: Record<string, any>;
  usage: {
    count: number;
    lastUsed?: string;
    successRate: number;
  };
  created: string;
  updated: string;
}

/**
 * Load TEMPLATE_CONFIGS from static config
 */
function loadStaticConfigs(): TemplateConfig[] {
  const configPath = join(process.cwd(), '..', 'frontend', 'src', 'config', 'template-config.ts');
  const fileContent = readFileSync(configPath, 'utf-8');
  const exportMatch = fileContent.match(/export const TEMPLATE_CONFIGS:\s*TemplateConfig\[\]\s*=\s*(\[[\s\S]*?\]);/);
  
  if (!exportMatch || !exportMatch[1]) {
    throw new Error('Could not find TEMPLATE_CONFIGS array in config file');
  }
  
  const arrayStr = exportMatch[1]
    .replace(/,(\s*[}\]])/g, '$1')
    .replace(/'/g, '"')
    .replace(/undefined/g, 'null');
  
  // eslint-disable-next-line no-eval
  return eval(arrayStr) as TemplateConfig[];
}

/**
 * Map database template to frontend config format (same as frontend mapper)
 */
function mapDbTemplateToConfig(dbTemplate: any): TemplateConfig {
  return {
    id: dbTemplate.id,
    name: dbTemplate.name_en || dbTemplate.name,
    nameFr: dbTemplate.name_fr,
    description: dbTemplate.description_en || dbTemplate.description || '',
    descriptionFr: dbTemplate.description_fr || dbTemplate.description || '',
    type: dbTemplate.type as 'formatter' | 'ai-formatter' | 'template-combo',
    compatibleSections: dbTemplate.compatible_sections || [],
    compatibleModes: dbTemplate.compatible_modes || [],
    language: dbTemplate.language as 'fr' | 'en' | 'both',
    complexity: dbTemplate.complexity as 'low' | 'medium' | 'high',
    tags: dbTemplate.tags || [],
    isActive: dbTemplate.is_active ?? true,
    isDefault: dbTemplate.is_default ?? false,
    features: {
      verbatimSupport: dbTemplate.features?.verbatimSupport || false,
      voiceCommandsSupport: dbTemplate.features?.voiceCommandsSupport || false,
      aiFormatting: dbTemplate.features?.aiFormatting || false,
      postProcessing: dbTemplate.features?.postProcessing || false,
    },
    prompt: dbTemplate.prompt || undefined,
    promptFr: dbTemplate.prompt_fr || undefined,
    content: dbTemplate.content || undefined,
    config: dbTemplate.config || {},
    usage: {
      count: dbTemplate.usage_stats?.count || 0,
      lastUsed: dbTemplate.usage_stats?.lastUsed || undefined,
      successRate: dbTemplate.usage_stats?.successRate || 0,
    },
    created: dbTemplate.created_at
      ? new Date(dbTemplate.created_at).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    updated: dbTemplate.updated_at
      ? new Date(dbTemplate.updated_at).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
  };
}

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  details?: any;
}

async function runTests(): Promise<void> {
  const db = getDb();
  const results: TestResult[] = [];
  let passedCount = 0;
  let failedCount = 0;

  console.log('🧪 Starting Template Combinations Test Suite...\n');

  // Test 1: Database Connection
  try {
    await db.select().from(templateCombinations).limit(1);
    results.push({
      name: 'Database Connection',
      passed: true,
      message: 'Successfully connected to database',
    });
    passedCount++;
    console.log('✅ Test 1: Database Connection - PASSED');
  } catch (error) {
    results.push({
      name: 'Database Connection',
      passed: false,
      message: `Failed to connect: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
    failedCount++;
    console.error('❌ Test 1: Database Connection - FAILED');
    return; // Can't continue without DB connection
  }

  // Test 2: Load Static Configs
  let staticConfigs: TemplateConfig[] = [];
  try {
    staticConfigs = loadStaticConfigs();
    results.push({
      name: 'Load Static Configs',
      passed: true,
      message: `Loaded ${staticConfigs.length} templates from static config`,
      details: { count: staticConfigs.length },
    });
    passedCount++;
    console.log(`✅ Test 2: Load Static Configs - PASSED (${staticConfigs.length} templates)`);
  } catch (error) {
    results.push({
      name: 'Load Static Configs',
      passed: false,
      message: `Failed to load: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
    failedCount++;
    console.error('❌ Test 2: Load Static Configs - FAILED');
  }

  // Test 3: Load Database Templates
  let dbTemplates: any[] = [];
  try {
    dbTemplates = await db.select().from(templateCombinations);
    results.push({
      name: 'Load Database Templates',
      passed: true,
      message: `Loaded ${dbTemplates.length} templates from database`,
      details: { count: dbTemplates.length },
    });
    passedCount++;
    console.log(`✅ Test 3: Load Database Templates - PASSED (${dbTemplates.length} templates)`);
  } catch (error) {
    results.push({
      name: 'Load Database Templates',
      passed: false,
      message: `Failed to load: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
    failedCount++;
    console.error('❌ Test 3: Load Database Templates - FAILED');
  }

  // Test 4: Template Service - Get Active Templates
  try {
    const activeTemplates = await TemplateCombinationService.getActiveTemplates();
    results.push({
      name: 'Template Service - Get Active Templates',
      passed: true,
      message: `Retrieved ${activeTemplates.length} active templates`,
      details: { count: activeTemplates.length },
    });
    passedCount++;
    console.log(`✅ Test 4: Template Service - Get Active Templates - PASSED (${activeTemplates.length} active)`);
  } catch (error) {
    results.push({
      name: 'Template Service - Get Active Templates',
      passed: false,
      message: `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
    failedCount++;
    console.error('❌ Test 4: Template Service - Get Active Templates - FAILED');
  }

  // Test 5: Template Service - Get All Templates
  try {
    const allTemplates = await TemplateCombinationService.getAllTemplates();
    results.push({
      name: 'Template Service - Get All Templates',
      passed: true,
      message: `Retrieved ${allTemplates.length} total templates`,
      details: { count: allTemplates.length },
    });
    passedCount++;
    console.log(`✅ Test 5: Template Service - Get All Templates - PASSED (${allTemplates.length} total)`);
  } catch (error) {
    results.push({
      name: 'Template Service - Get All Templates',
      passed: false,
      message: `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
    failedCount++;
    console.error('❌ Test 5: Template Service - Get All Templates - FAILED');
  }

  // Test 6: Template Service - Get By Section
  try {
    const section7Templates = await TemplateCombinationService.getTemplatesBySection('section_7');
    results.push({
      name: 'Template Service - Get By Section',
      passed: true,
      message: `Found ${section7Templates.length} templates for section_7`,
      details: { section: 'section_7', count: section7Templates.length },
    });
    passedCount++;
    console.log(`✅ Test 6: Template Service - Get By Section - PASSED (${section7Templates.length} for section_7)`);
  } catch (error) {
    results.push({
      name: 'Template Service - Get By Section',
      passed: false,
      message: `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
    failedCount++;
    console.error('❌ Test 6: Template Service - Get By Section - FAILED');
  }

  // Test 7: Template Service - Get By Mode
  try {
    const mode2Templates = await TemplateCombinationService.getTemplatesByMode('mode2');
    results.push({
      name: 'Template Service - Get By Mode',
      passed: true,
      message: `Found ${mode2Templates.length} templates for mode2`,
      details: { mode: 'mode2', count: mode2Templates.length },
    });
    passedCount++;
    console.log(`✅ Test 7: Template Service - Get By Mode - PASSED (${mode2Templates.length} for mode2)`);
  } catch (error) {
    results.push({
      name: 'Template Service - Get By Mode',
      passed: false,
      message: `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
    failedCount++;
    console.error('❌ Test 7: Template Service - Get By Mode - FAILED');
  }

  // Test 8: Template Service - Get By Section and Mode
  try {
    const combo = await TemplateCombinationService.getTemplatesBySectionAndMode('section_7', 'mode2');
    results.push({
      name: 'Template Service - Get By Section and Mode',
      passed: true,
      message: `Found ${combo.length} templates for section_7 + mode2`,
      details: { section: 'section_7', mode: 'mode2', count: combo.length },
    });
    passedCount++;
    console.log(`✅ Test 8: Template Service - Get By Section and Mode - PASSED (${combo.length} templates)`);
  } catch (error) {
    results.push({
      name: 'Template Service - Get By Section and Mode',
      passed: false,
      message: `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
    failedCount++;
    console.error('❌ Test 8: Template Service - Get By Section and Mode - FAILED');
  }

  // Test 9: Data Consistency - Count Match
  if (staticConfigs.length > 0 && dbTemplates.length > 0) {
    const staticCount = staticConfigs.length;
    const dbCount = dbTemplates.length;
    const countMatch = staticCount === dbCount;
    
    results.push({
      name: 'Data Consistency - Count Match',
      passed: countMatch,
      message: countMatch
        ? `Template counts match: ${staticCount} in static, ${dbCount} in database`
        : `Template counts mismatch: ${staticCount} in static, ${dbCount} in database`,
      details: { staticCount, dbCount },
    });
    
    if (countMatch) {
      passedCount++;
      console.log(`✅ Test 9: Data Consistency - Count Match - PASSED (${staticCount} = ${dbCount})`);
    } else {
      failedCount++;
      console.warn(`⚠️ Test 9: Data Consistency - Count Match - FAILED (${staticCount} ≠ ${dbCount})`);
    }
  }

  // Test 10: Data Consistency - ID Match
  if (staticConfigs.length > 0 && dbTemplates.length > 0) {
    const staticIds = new Set(staticConfigs.map(t => t.id));
    const dbIds = new Set(dbTemplates.map(t => t.id));
    const missingInDb = staticConfigs.filter(t => !dbIds.has(t.id));
    const extraInDb = dbTemplates.filter(t => !staticIds.has(t.id));
    
    const allMatch = missingInDb.length === 0 && extraInDb.length === 0;
    
    results.push({
      name: 'Data Consistency - ID Match',
      passed: allMatch,
      message: allMatch
        ? 'All template IDs match between static and database'
        : `Template ID mismatch: ${missingInDb.length} missing in DB, ${extraInDb.length} extra in DB`,
      details: {
        missingInDb: missingInDb.map(t => t.id),
        extraInDb: extraInDb.map(t => t.id),
      },
    });
    
    if (allMatch) {
      passedCount++;
      console.log('✅ Test 10: Data Consistency - ID Match - PASSED');
    } else {
      failedCount++;
      console.warn(`⚠️ Test 10: Data Consistency - ID Match - FAILED`);
      if (missingInDb.length > 0) {
        console.warn(`   Missing in DB: ${missingInDb.map(t => t.id).join(', ')}`);
      }
      if (extraInDb.length > 0) {
        console.warn(`   Extra in DB: ${extraInDb.map(t => t.id).join(', ')}`);
      }
    }
  }

  // Test 11: Mapper Function - Verify Mapping
  if (dbTemplates.length > 0) {
    try {
      const testTemplate = dbTemplates[0];
      const mapped = mapDbTemplateToConfig(testTemplate);
      
      // Verify required fields
      const hasRequiredFields = 
        mapped.id &&
        mapped.name &&
        mapped.nameFr &&
        mapped.type &&
        Array.isArray(mapped.compatibleSections) &&
        Array.isArray(mapped.compatibleModes);
      
      results.push({
        name: 'Mapper Function - Verify Mapping',
        passed: hasRequiredFields,
        message: hasRequiredFields
          ? 'Mapper function correctly converts database template to TemplateConfig'
          : 'Mapper function missing required fields',
        details: { templateId: mapped.id },
      });
      
      if (hasRequiredFields) {
        passedCount++;
        console.log(`✅ Test 11: Mapper Function - Verify Mapping - PASSED (${mapped.id})`);
      } else {
        failedCount++;
        console.error(`❌ Test 11: Mapper Function - Verify Mapping - FAILED (${mapped.id})`);
      }
    } catch (error) {
      results.push({
        name: 'Mapper Function - Verify Mapping',
        passed: false,
        message: `Mapper failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
      failedCount++;
      console.error('❌ Test 11: Mapper Function - Verify Mapping - FAILED');
    }
  }

  // Test 12: Template Structure Validation
  if (dbTemplates.length > 0) {
    const invalidTemplates: string[] = [];
    
    for (const template of dbTemplates) {
      const issues: string[] = [];
      
      if (!template.id) issues.push('missing id');
      if (!template.name) issues.push('missing name');
      if (!template.name_fr) issues.push('missing name_fr');
      if (!template.type) issues.push('missing type');
      if (!Array.isArray(template.compatible_sections)) issues.push('invalid compatible_sections');
      if (!Array.isArray(template.compatible_modes)) issues.push('invalid compatible_modes');
      if (!['fr', 'en', 'both'].includes(template.language)) issues.push('invalid language');
      if (!['low', 'medium', 'high'].includes(template.complexity)) issues.push('invalid complexity');
      
      if (issues.length > 0) {
        invalidTemplates.push(`${template.id}: ${issues.join(', ')}`);
      }
    }
    
    const allValid = invalidTemplates.length === 0;
    
    results.push({
      name: 'Template Structure Validation',
      passed: allValid,
      message: allValid
        ? `All ${dbTemplates.length} templates have valid structure`
        : `${invalidTemplates.length} templates have invalid structure`,
      details: { invalidTemplates },
    });
    
    if (allValid) {
      passedCount++;
      console.log(`✅ Test 12: Template Structure Validation - PASSED (${dbTemplates.length} templates)`);
    } else {
      failedCount++;
      console.warn(`⚠️ Test 12: Template Structure Validation - FAILED`);
      invalidTemplates.forEach(issue => console.warn(`   - ${issue}`));
    }
  }

  // Test 13: Get Template By ID
  if (dbTemplates.length > 0) {
    try {
      const testId = dbTemplates[0].id;
      const template = await TemplateCombinationService.getTemplateById(testId);
      
      const found = template !== null && template.id === testId;
      
      results.push({
        name: 'Get Template By ID',
        passed: found,
        message: found
          ? `Successfully retrieved template: ${testId}`
          : `Failed to retrieve template: ${testId}`,
        details: { templateId: testId },
      });
      
      if (found) {
        passedCount++;
        console.log(`✅ Test 13: Get Template By ID - PASSED (${testId})`);
      } else {
        failedCount++;
        console.error(`❌ Test 13: Get Template By ID - FAILED (${testId})`);
      }
    } catch (error) {
      results.push({
        name: 'Get Template By ID',
        passed: false,
        message: `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
      failedCount++;
      console.error('❌ Test 13: Get Template By ID - FAILED');
    }
  }

  // Test 14: Get Default Templates
  try {
    const defaultTemplates = await TemplateCombinationService.getDefaultTemplates();
    results.push({
      name: 'Get Default Templates',
      passed: true,
      message: `Found ${defaultTemplates.length} default templates`,
      details: { count: defaultTemplates.length },
    });
    passedCount++;
    console.log(`✅ Test 14: Get Default Templates - PASSED (${defaultTemplates.length} default)`);
  } catch (error) {
    results.push({
      name: 'Get Default Templates',
      passed: false,
      message: `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
    failedCount++;
    console.error('❌ Test 14: Get Default Templates - FAILED');
  }

  // Test 15: Get Templates By Language
  try {
    const frTemplates = await TemplateCombinationService.getTemplatesByLanguage('fr');
    const enTemplates = await TemplateCombinationService.getTemplatesByLanguage('en');
    const bothTemplates = await TemplateCombinationService.getTemplatesByLanguage('both');
    
    results.push({
      name: 'Get Templates By Language',
      passed: true,
      message: `Found ${frTemplates.length} FR, ${enTemplates.length} EN, ${bothTemplates.length} BOTH`,
      details: { fr: frTemplates.length, en: enTemplates.length, both: bothTemplates.length },
    });
    passedCount++;
    console.log(`✅ Test 15: Get Templates By Language - PASSED (FR: ${frTemplates.length}, EN: ${enTemplates.length}, BOTH: ${bothTemplates.length})`);
  } catch (error) {
    results.push({
      name: 'Get Templates By Language',
      passed: false,
      message: `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
    failedCount++;
    console.error('❌ Test 15: Get Templates By Language - FAILED');
  }

  // Summary
  console.log('\n📊 Test Summary:');
  console.log(`✅ Passed: ${passedCount}`);
  console.log(`❌ Failed: ${failedCount}`);
  console.log(`📈 Total: ${passedCount + failedCount}`);
  console.log(`🎯 Success Rate: ${Math.round((passedCount / (passedCount + failedCount)) * 100)}%`);

  if (failedCount > 0) {
    console.log('\n❌ Failed Tests:');
    results
      .filter(r => !r.passed)
      .forEach(r => {
        console.log(`   - ${r.name}: ${r.message}`);
      });
  }

  console.log('\n📋 Detailed Results:');
  results.forEach((result, index) => {
    const icon = result.passed ? '✅' : '❌';
    console.log(`${icon} Test ${index + 1}: ${result.name}`);
    if (result.details) {
      console.log(`   Details:`, result.details);
    }
  });

  // Exit with appropriate code
  process.exit(failedCount > 0 ? 1 : 0);
}

// Run tests
runTests()
  .then(() => {
    console.log('\n🎉 Test suite completed');
  })
  .catch((error) => {
    console.error('\n💥 Test suite failed:', error);
    process.exit(1);
  });

