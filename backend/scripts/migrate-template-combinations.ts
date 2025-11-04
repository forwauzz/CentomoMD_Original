/**
 * Migrate template combinations from static config to database
 * This script reads TEMPLATE_CONFIGS and inserts into template_combinations table
 */

import * as dotenv from 'dotenv';
import { getDb } from '../src/database/connection.js';
import { templateCombinations } from '../src/database/schema.js';
import { eq } from 'drizzle-orm';
import { logger } from '../src/utils/logger.js';
import { readFileSync } from 'fs';
import { join } from 'path';

dotenv.config();

// Template config interface
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
 * Load TEMPLATE_CONFIGS from frontend config file
 * Reads the TypeScript file and extracts the TEMPLATE_CONFIGS array
 */
function loadTemplateConfigs(): TemplateConfig[] {
  try {
    // Path to frontend template config (relative to backend folder)
    const configPath = join(process.cwd(), '..', 'frontend', 'src', 'config', 'template-config.ts');
    
    // Read the file
    const fileContent = readFileSync(configPath, 'utf-8');
    
    // Extract the array content using a regex
    // Find the TEMPLATE_CONFIGS export
    const exportMatch = fileContent.match(/export const TEMPLATE_CONFIGS:\s*TemplateConfig\[\]\s*=\s*(\[[\s\S]*?\]);/);
    
    if (!exportMatch || !exportMatch[1]) {
      throw new Error('Could not find TEMPLATE_CONFIGS array in config file');
    }
    
    // Clean up the array string to make it valid JSON-like
    let arrayStr = exportMatch[1];
    
    // Replace TypeScript/JavaScript syntax with JSON-compatible syntax
    // This is a simplified parser - handles common cases
    arrayStr = arrayStr
      // Remove trailing commas before closing brackets/braces
      .replace(/,(\s*[}\]])/g, '$1')
      // Convert single quotes to double quotes (basic)
      .replace(/'/g, '"')
      // Convert undefined to null
      .replace(/undefined/g, 'null')
      // Keep object keys unquoted for eval (they'll be valid JS)
      // Actually, we need to keep it as valid JS for eval
    
    // Use eval to parse (safe since it's our own code)
    // eslint-disable-next-line no-eval
    const templates: TemplateConfig[] = eval(arrayStr);
    
    return templates;
  } catch (error) {
    console.error('Error loading template configs:', error);
    throw error;
  }
}

/**
 * Migrate template combinations from static config to database
 */
async function migrateTemplateCombinations() {
  const db = getDb();
  
  try {
    console.log('🚀 Starting template combinations migration...');
    
    // Load templates from frontend config
    const templateConfigs = loadTemplateConfigs();
    console.log(`📊 Found ${templateConfigs.length} templates in static config`);
    
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;
    const errors: Array<{ id: string; error: string }> = [];
    
    for (const templateConfig of templateConfigs) {
      try {
        // Check if template already exists
        const existing = await db
          .select()
          .from(templateCombinations)
          .where(eq(templateCombinations.id, templateConfig.id))
          .limit(1);
        
        if (existing.length > 0) {
          console.log(`⏭️  Template ${templateConfig.id} already exists, skipping...`);
          skipCount++;
          continue;
        }
        
        // Map TemplateConfig to database schema
        const dbTemplate = {
          id: templateConfig.id,
          name: templateConfig.name,
          name_fr: templateConfig.nameFr,
          name_en: templateConfig.name,
          description: templateConfig.description || null,
          description_fr: templateConfig.descriptionFr || null,
          description_en: templateConfig.description || null,
          type: templateConfig.type,
          compatible_sections: templateConfig.compatibleSections,
          compatible_modes: templateConfig.compatibleModes,
          language: templateConfig.language,
          complexity: templateConfig.complexity,
          tags: templateConfig.tags || [],
          is_active: templateConfig.isActive,
          is_default: templateConfig.isDefault || false,
          features: {
            verbatimSupport: templateConfig.features.verbatimSupport || false,
            voiceCommandsSupport: templateConfig.features.voiceCommandsSupport || false,
            aiFormatting: templateConfig.features.aiFormatting || false,
            postProcessing: templateConfig.features.postProcessing || false,
          },
          prompt: templateConfig.prompt || null,
          prompt_fr: templateConfig.promptFr || null,
          content: templateConfig.content || null,
          config: templateConfig.config || {},
          usage_stats: {
            count: templateConfig.usage.count || 0,
            lastUsed: templateConfig.usage.lastUsed || null,
            successRate: templateConfig.usage.successRate || 0,
          },
          created_at: new Date(templateConfig.created || new Date().toISOString()),
          updated_at: new Date(templateConfig.updated || new Date().toISOString()),
        };
        
        // Insert template into database
        await db.insert(templateCombinations).values(dbTemplate);
        
        console.log(`✅ Migrated template: ${templateConfig.id} (${templateConfig.name})`);
        successCount++;
        
        // Log migration
        logger.info('Template combination migrated', {
          templateId: templateConfig.id,
          name: templateConfig.name,
          type: templateConfig.type,
          isActive: templateConfig.isActive,
        });
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`❌ Failed to migrate template ${templateConfig.id}:`, errorMessage);
        errors.push({ id: templateConfig.id, error: errorMessage });
        errorCount++;
      }
    }
    
    // Summary
    console.log('\n📊 Migration Summary:');
    console.log(`✅ Successfully migrated: ${successCount} templates`);
    console.log(`⏭️  Skipped (already exist): ${skipCount} templates`);
    console.log(`❌ Failed: ${errorCount} templates`);
    
    if (errors.length > 0) {
      console.log('\n❌ Errors:');
      errors.forEach(({ id, error }) => {
        console.log(`  - ${id}: ${error}`);
      });
    }
    
    // Verify migrated data
    const totalInDb = await db
      .select()
      .from(templateCombinations);
    
    console.log(`\n📊 Total templates in database: ${totalInDb.length}`);
    
    // Show active templates
    const activeTemplates = totalInDb.filter(t => t.is_active);
    console.log(`📊 Active templates: ${activeTemplates.length}`);
    
    if (successCount > 0 || skipCount > 0) {
      console.log('✅ Data migration completed successfully');
    } else if (errorCount > 0) {
      throw new Error('No templates were migrated - all failed');
    }
    
  } catch (error) {
    console.error('❌ Data migration failed:', error);
    logger.error('Template combinations migration failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
}

// Run migration if executed directly
migrateTemplateCombinations()
  .then(() => {
    console.log('🎉 Migration completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration failed:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    process.exit(1);
  });

export { migrateTemplateCombinations };
