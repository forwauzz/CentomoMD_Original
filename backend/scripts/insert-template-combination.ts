/**
 * Insert template into template_combinations table
 * This script inserts the section7-v1 template into the template_combinations table
 * so it appears in the UI and database
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import { getSql } from '../src/database/connection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

const TEMPLATE_DATA = {
  id: 'section7-v1',
  name: 'Section 7 v1',
  name_fr: 'Section 7 v1',
  name_en: 'Section 7 v1',
  description: 'Section 7 v1 - Formatting with integrated voice corrections and complete rules in master prompt',
  description_fr: 'Section 7 v1 - Formatage avec corrections vocales intégrées et règles complètes dans le master prompt',
  description_en: 'Section 7 v1 - Formatting with integrated voice corrections and complete rules in master prompt',
  type: 'ai-formatter',
  compatible_sections: ['section_7'],
  compatible_modes: ['mode1', 'mode2'],
  language: 'both',
  complexity: 'high',
  tags: ['section7', 'ai-formatter', 'cnesst', 'v1', 'voice-corrections'],
  is_active: true,
  is_default: false,
  features: {
    verbatimSupport: false,
    voiceCommandsSupport: false,
    aiFormatting: true,
    postProcessing: true,
  },
  prompt: 'Section 7 v1 formatting with voice recognition error corrections and comprehensive formatting rules',
  prompt_fr: 'Formatage Section 7 v1 avec corrections d\'erreurs de reconnaissance vocale et règles de formatage complètes',
  config: {
    mode: 'mode2',
    language: 'fr',
    enforceWorkerFirst: true,
    chronologicalOrder: true,
    medicalTerminology: true
  },
  usage_stats: {
    count: 0,
    successRate: 95,
  }
};

async function insertTemplateCombination() {
  console.log('🚀 Inserting section7-v1 into template_combinations table...\n');

  try {
    const sql = getSql();

    // Check if template already exists
    const existing = await sql`
      SELECT id FROM template_combinations WHERE id = ${TEMPLATE_DATA.id} LIMIT 1
    `;

    if (existing && existing.length > 0) {
      console.log(`✅ Template ${TEMPLATE_DATA.id} already exists in template_combinations`);
      console.log('   Updating existing record...\n');
      
      // Update existing template
      await sql`
        UPDATE template_combinations
        SET 
          name = ${TEMPLATE_DATA.name},
          name_fr = ${TEMPLATE_DATA.name_fr},
          name_en = ${TEMPLATE_DATA.name_en},
          description = ${TEMPLATE_DATA.description},
          description_fr = ${TEMPLATE_DATA.description_fr},
          description_en = ${TEMPLATE_DATA.description_en},
          type = ${TEMPLATE_DATA.type},
          compatible_sections = ${JSON.stringify(TEMPLATE_DATA.compatible_sections)}::jsonb,
          compatible_modes = ${JSON.stringify(TEMPLATE_DATA.compatible_modes)}::jsonb,
          language = ${TEMPLATE_DATA.language},
          complexity = ${TEMPLATE_DATA.complexity},
          tags = ${JSON.stringify(TEMPLATE_DATA.tags)}::jsonb,
          is_active = ${TEMPLATE_DATA.is_active},
          is_default = ${TEMPLATE_DATA.is_default},
          features = ${JSON.stringify(TEMPLATE_DATA.features)}::jsonb,
          prompt = ${TEMPLATE_DATA.prompt},
          prompt_fr = ${TEMPLATE_DATA.prompt_fr},
          config = ${JSON.stringify(TEMPLATE_DATA.config)}::jsonb,
          usage_stats = ${JSON.stringify(TEMPLATE_DATA.usage_stats)}::jsonb,
          updated_at = now()
        WHERE id = ${TEMPLATE_DATA.id}
      `;
      
      console.log('✅ Template updated successfully!\n');
    } else {
      console.log('   Creating new template record...\n');
      
      // Insert new template
      await sql`
        INSERT INTO template_combinations (
          id, name, name_fr, name_en, description, description_fr, description_en,
          type, compatible_sections, compatible_modes, language, complexity, tags,
          is_active, is_default, features, prompt, prompt_fr, config, usage_stats,
          created_at, updated_at
        )
        VALUES (
          ${TEMPLATE_DATA.id},
          ${TEMPLATE_DATA.name},
          ${TEMPLATE_DATA.name_fr},
          ${TEMPLATE_DATA.name_en},
          ${TEMPLATE_DATA.description},
          ${TEMPLATE_DATA.description_fr},
          ${TEMPLATE_DATA.description_en},
          ${TEMPLATE_DATA.type},
          ${JSON.stringify(TEMPLATE_DATA.compatible_sections)}::jsonb,
          ${JSON.stringify(TEMPLATE_DATA.compatible_modes)}::jsonb,
          ${TEMPLATE_DATA.language},
          ${TEMPLATE_DATA.complexity},
          ${JSON.stringify(TEMPLATE_DATA.tags)}::jsonb,
          ${TEMPLATE_DATA.is_active},
          ${TEMPLATE_DATA.is_default},
          ${JSON.stringify(TEMPLATE_DATA.features)}::jsonb,
          ${TEMPLATE_DATA.prompt},
          ${TEMPLATE_DATA.prompt_fr},
          ${JSON.stringify(TEMPLATE_DATA.config)}::jsonb,
          ${JSON.stringify(TEMPLATE_DATA.usage_stats)}::jsonb,
          now(),
          now()
        )
      `;
      
      console.log('✅ Template inserted successfully!\n');
    }

    console.log('✨ Template combination insertion completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('💥 Failed to insert template combination:', error);
    process.exit(1);
  }
}

insertTemplateCombination();

