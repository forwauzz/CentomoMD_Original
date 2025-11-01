# Template Combinations Migration Plan

**Date:** 2025-01-09  
**Branch:** `cases/templates-enhanced`  
**Objective:** Create separate `template_combinations` table and migrate static configs to database

---

## Executive Summary

This migration plan outlines the step-by-step process to:
1. Create a new `template_combinations` table in the database
2. Migrate existing template combinations from static config (`frontend/src/config/template-config.ts`) to database
3. Update API endpoints to query database instead of returning placeholders
4. Update frontend to fetch templates from API with static config as fallback
5. Maintain backward compatibility during transition

**Estimated Time:** 2-3 hours  
**Risk Level:** Medium (with rollback plan)  
**Breaking Changes:** None (frontend fallback ensures compatibility)

---

## Phase 1: Schema Design

### 1.1 Drizzle Schema Definition

**File:** `backend/src/database/schema.ts`

Add the new `template_combinations` table schema:

```typescript
// Template Combinations table (new)
export const templateCombinations = pgTable('template_combinations', {
  id: varchar('id', { length: 255 }).primaryKey(), // Use template ID from config
  name: varchar('name', { length: 255 }).notNull(),
  name_fr: varchar('name_fr', { length: 255 }).notNull(),
  name_en: varchar('name_en', { length: 255 }).notNull(),
  description: text('description'),
  description_fr: text('description_fr'),
  description_en: text('description_en'),
  type: text('type', { enum: ['formatter', 'ai-formatter', 'template-combo'] }).notNull(),
  compatible_sections: json('compatible_sections').$type<string[]>().notNull().default('[]'),
  compatible_modes: json('compatible_modes').$type<string[]>().notNull().default('[]'),
  language: text('language', { enum: ['fr', 'en', 'both'] }).notNull().default('both'),
  complexity: text('complexity', { enum: ['low', 'medium', 'high'] }).notNull().default('medium'),
  tags: json('tags').$type<string[]>().default('[]'),
  is_active: boolean('is_active').notNull().default(true),
  is_default: boolean('is_default').notNull().default(false),
  features: json('features').$type<{
    verbatimSupport: boolean;
    voiceCommandsSupport: boolean;
    aiFormatting: boolean;
    postProcessing: boolean;
  }>().default('{}'),
  prompt: text('prompt'),
  prompt_fr: text('prompt_fr'),
  content: text('content'),
  config: json('config').$type<{
    mode?: string;
    section?: string;
    language?: string;
    enforceWorkerFirst?: boolean;
    chronologicalOrder?: boolean;
    medicalTerminology?: boolean;
    templateCombo?: string;
    aiFormattingEnabled?: boolean;
    deterministicFirst?: boolean;
  }>().default('{}'),
  usage_stats: json('usage_stats').$type<{
    count: number;
    lastUsed?: string;
    successRate: number;
  }>().default('{"count": 0, "successRate": 0}'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});
```

**Key Design Decisions:**
- ✅ Use `varchar` for `id` to match existing template IDs (e.g., `'word-for-word-with-ai'`)
- ✅ Use `json` columns for arrays and complex objects (PostgreSQL JSONB)
- ✅ Support multilingual names/descriptions (separate columns for FR/EN)
- ✅ Support `language: 'both'` option
- ✅ Include all fields from `TemplateConfig` interface

### 1.2 Drizzle Type Exports

Add type exports after schema definition:

```typescript
export type TemplateCombination = typeof templateCombinations.$inferSelect;
export type NewTemplateCombination = typeof templateCombinations.$inferInsert;
```

---

## Phase 2: Database Migration

### 2.1 Create Migration SQL File

**File:** `backend/drizzle/XXXX_add_template_combinations.sql`

Generate migration SQL using Drizzle Kit:

```bash
cd backend
npx drizzle-kit generate --name add_template_combinations
```

Or manually create the SQL file:

```sql
-- Add template_combinations table
CREATE TABLE IF NOT EXISTS "template_combinations" (
  "id" varchar(255) PRIMARY KEY NOT NULL,
  "name" varchar(255) NOT NULL,
  "name_fr" varchar(255) NOT NULL,
  "name_en" varchar(255) NOT NULL,
  "description" text,
  "description_fr" text,
  "description_en" text,
  "type" text NOT NULL CHECK ("type" IN ('formatter', 'ai-formatter', 'template-combo')),
  "compatible_sections" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "compatible_modes" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "language" text NOT NULL DEFAULT 'both' CHECK ("language" IN ('fr', 'en', 'both')),
  "complexity" text NOT NULL DEFAULT 'medium' CHECK ("complexity" IN ('low', 'medium', 'high')),
  "tags" jsonb DEFAULT '[]'::jsonb,
  "is_active" boolean NOT NULL DEFAULT true,
  "is_default" boolean NOT NULL DEFAULT false,
  "features" jsonb DEFAULT '{}'::jsonb,
  "prompt" text,
  "prompt_fr" text,
  "content" text,
  "config" jsonb DEFAULT '{}'::jsonb,
  "usage_stats" jsonb DEFAULT '{"count": 0, "successRate": 0}'::jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS "template_combinations_is_active_idx" ON "template_combinations" ("is_active");
CREATE INDEX IF NOT EXISTS "template_combinations_type_idx" ON "template_combinations" ("type");
CREATE INDEX IF NOT EXISTS "template_combinations_language_idx" ON "template_combinations" ("language");

-- Create GIN index for JSONB columns (for array searches)
CREATE INDEX IF NOT EXISTS "template_combinations_compatible_sections_idx" ON "template_combinations" USING GIN ("compatible_sections");
CREATE INDEX IF NOT EXISTS "template_combinations_compatible_modes_idx" ON "template_combinations" USING GIN ("compatible_modes");
CREATE INDEX IF NOT EXISTS "template_combinations_tags_idx" ON "template_combinations" USING GIN ("tags");
```

### 2.2 Run Migration

**Option A: Using Drizzle Migrator (Recommended)**

```bash
cd backend
npm run db:migrate
```

**Option B: Manual SQL Execution**

```bash
cd backend
psql $DATABASE_URL -f drizzle/XXXX_add_template_combinations.sql
```

### 2.3 Verify Migration

**Script:** `backend/scripts/verify-template-combinations-migration.ts`

```typescript
import { getDb } from '@/database';
import { templateCombinations } from '@/database/schema';
import { sql } from 'drizzle-orm';

async function verifyMigration() {
  const db = getDb();
  
  try {
    // Check if table exists
    const tableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'template_combinations'
      );
    `);
    
    console.log('✅ Table exists:', tableExists.rows[0]?.exists);
    
    // Check table structure
    const columns = await db.execute(sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'template_combinations'
      ORDER BY ordinal_position;
    `);
    
    console.log('📊 Table columns:', columns.rows);
    
    // Check row count
    const count = await db.select({ count: sql<number>`count(*)` }).from(templateCombinations);
    console.log('📊 Row count:', count[0]?.count || 0);
    
    console.log('✅ Migration verified successfully');
  } catch (error) {
    console.error('❌ Migration verification failed:', error);
    throw error;
  }
}

verifyMigration();
```

---

## Phase 3: Data Migration

### 3.1 Create Data Migration Script

**File:** `backend/scripts/migrate-template-combinations.ts`

```typescript
import { getDb } from '@/database';
import { templateCombinations } from '@/database/schema';
import { TEMPLATE_CONFIGS } from '../../frontend/src/config/template-config';
import { logger } from '@/utils/logger';

/**
 * Migrate template combinations from static config to database
 */
async function migrateTemplateCombinations() {
  const db = getDb();
  
  try {
    console.log('🚀 Starting template combinations migration...');
    console.log(`📊 Found ${TEMPLATE_CONFIGS.length} templates in static config`);
    
    let successCount = 0;
    let errorCount = 0;
    const errors: Array<{ id: string; error: string }> = [];
    
    for (const templateConfig of TEMPLATE_CONFIGS) {
      try {
        // Check if template already exists
        const existing = await db
          .select()
          .from(templateCombinations)
          .where(sql`id = ${templateConfig.id}`)
          .limit(1);
        
        if (existing.length > 0) {
          console.log(`⏭️  Template ${templateConfig.id} already exists, skipping...`);
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
        
        console.log(`✅ Migrated template: ${templateConfig.id}`);
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
    console.log(`❌ Failed: ${errorCount} templates`);
    
    if (errors.length > 0) {
      console.log('\n❌ Errors:');
      errors.forEach(({ id, error }) => {
        console.log(`  - ${id}: ${error}`);
      });
    }
    
    // Verify migrated data
    const totalInDb = await db
      .select({ count: sql<number>`count(*)` })
      .from(templateCombinations);
    
    console.log(`📊 Total templates in database: ${totalInDb[0]?.count || 0}`);
    
    if (successCount > 0) {
      console.log('✅ Data migration completed successfully');
    } else {
      throw new Error('No templates were migrated');
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
if (require.main === module) {
  migrateTemplateCombinations()
    .then(() => {
      console.log('🎉 Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

export { migrateTemplateCombinations };
```

### 3.2 Run Data Migration

```bash
cd backend
npx tsx scripts/migrate-template-combinations.ts
```

### 3.3 Verify Migrated Data

**Manual Verification:**

```sql
-- Check all templates
SELECT id, name, type, language, is_active, is_default
FROM template_combinations
ORDER BY created_at;

-- Check active templates count
SELECT COUNT(*) FROM template_combinations WHERE is_active = true;

-- Check template types distribution
SELECT type, COUNT(*) FROM template_combinations GROUP BY type;

-- Check language distribution
SELECT language, COUNT(*) FROM template_combinations GROUP BY language;
```

---

## Phase 4: Backend API Integration

### 4.1 Create Template Combinations Service

**File:** `backend/src/services/templateCombinationService.ts`

```typescript
import { getDb } from '@/database';
import { templateCombinations } from '@/database/schema';
import { eq, inArray, sql, and, or } from 'drizzle-orm';
import { logger } from '@/utils/logger';
import type { TemplateCombination, NewTemplateCombination } from '@/database/schema';

export class TemplateCombinationService {
  /**
   * Get all template combinations
   */
  async getAllTemplates(filters?: {
    isActive?: boolean;
    type?: 'formatter' | 'ai-formatter' | 'template-combo';
    language?: 'fr' | 'en' | 'both';
    section?: string;
    mode?: string;
  }): Promise<TemplateCombination[]> {
    const db = getDb();
    
    try {
      let query = db.select().from(templateCombinations);
      
      const conditions = [];
      
      if (filters?.isActive !== undefined) {
        conditions.push(eq(templateCombinations.is_active, filters.isActive));
      }
      
      if (filters?.type) {
        conditions.push(eq(templateCombinations.type, filters.type));
      }
      
      if (filters?.language) {
        conditions.push(
          or(
            eq(templateCombinations.language, filters.language),
            eq(templateCombinations.language, 'both')
          )
        );
      }
      
      if (filters?.section) {
        conditions.push(
          sql`${templateCombinations.compatible_sections} @> ${JSON.stringify([filters.section])}::jsonb`
        );
      }
      
      if (filters?.mode) {
        conditions.push(
          sql`${templateCombinations.compatible_modes} @> ${JSON.stringify([filters.mode])}::jsonb`
        );
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
      
      const templates = await query;
      
      logger.info('Fetched template combinations', {
        count: templates.length,
        filters,
      });
      
      return templates;
    } catch (error) {
      logger.error('Failed to fetch template combinations', {
        error: error instanceof Error ? error.message : 'Unknown error',
        filters,
      });
      throw error;
    }
  }
  
  /**
   * Get template combination by ID
   */
  async getTemplateById(id: string): Promise<TemplateCombination | null> {
    const db = getDb();
    
    try {
      const templates = await db
        .select()
        .from(templateCombinations)
        .where(eq(templateCombinations.id, id))
        .limit(1);
      
      return templates[0] || null;
    } catch (error) {
      logger.error('Failed to fetch template combination', {
        id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
  
  /**
   * Get templates by section
   */
  async getTemplatesBySection(section: string): Promise<TemplateCombination[]> {
    const db = getDb();
    
    try {
      const templates = await db
        .select()
        .from(templateCombinations)
        .where(
          sql`${templateCombinations.compatible_sections} @> ${JSON.stringify([section])}::jsonb`
        )
        .where(eq(templateCombinations.is_active, true));
      
      return templates;
    } catch (error) {
      logger.error('Failed to fetch templates by section', {
        section,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
  
  /**
   * Get templates by mode
   */
  async getTemplatesByMode(mode: string): Promise<TemplateCombination[]> {
    const db = getDb();
    
    try {
      const templates = await db
        .select()
        .from(templateCombinations)
        .where(
          sql`${templateCombinations.compatible_modes} @> ${JSON.stringify([mode])}::jsonb`
        )
        .where(eq(templateCombinations.is_active, true));
      
      return templates;
    } catch (error) {
      logger.error('Failed to fetch templates by mode', {
        mode,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
  
  /**
   * Update template combination usage stats
   */
  async updateUsageStats(id: string, incrementCount: boolean = true): Promise<void> {
    const db = getDb();
    
    try {
      if (incrementCount) {
        await db
          .update(templateCombinations)
          .set({
            usage_stats: sql`jsonb_set(
              jsonb_set(
                ${templateCombinations.usage_stats},
                '{count}',
                ((${templateCombinations.usage_stats}->>'count')::int + 1)::text::jsonb
              ),
              '{lastUsed}',
              ${new Date().toISOString()}::text::jsonb
            )`,
            updated_at: new Date(),
          })
          .where(eq(templateCombinations.id, id));
      }
    } catch (error) {
      logger.error('Failed to update usage stats', {
        id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      // Don't throw - usage stats update failure shouldn't break the app
    }
  }
}

export const templateCombinationService = new TemplateCombinationService();
```

### 4.2 Update API Endpoints

**File:** `backend/src/index.ts` (or `backend/src/routes/templateCombinations.ts`)

Replace placeholder endpoints with actual database queries:

```typescript
import { templateCombinationService } from '@/services/templateCombinationService';
import { authenticateUser } from '@/middleware/auth';

// GET /api/template-combinations - Get all template combinations
app.get('/api/template-combinations', authenticateUser, async (req, res) => {
  try {
    const { isActive, type, language, section, mode } = req.query;
    
    const templates = await templateCombinationService.getAllTemplates({
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      type: type as any,
      language: language as any,
      section: section as string,
      mode: mode as string,
    });
    
    res.json({
      success: true,
      data: templates,
      count: templates.length,
    });
  } catch (error) {
    logger.error('Failed to fetch template combinations', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch template combinations',
    });
  }
});

// GET /api/template-combinations/:id - Get template combination by ID
app.get('/api/template-combinations/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const template = await templateCombinationService.getTemplateById(id);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template combination not found',
      });
    }
    
    res.json({
      success: true,
      data: template,
    });
  } catch (error) {
    logger.error('Failed to fetch template combination', {
      id: req.params.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch template combination',
    });
  }
});

// GET /api/template-combinations/section/:section - Get templates by section
app.get('/api/template-combinations/section/:section', authenticateUser, async (req, res) => {
  try {
    const { section } = req.params;
    const templates = await templateCombinationService.getTemplatesBySection(section);
    
    res.json({
      success: true,
      data: templates,
      count: templates.length,
    });
  } catch (error) {
    logger.error('Failed to fetch templates by section', {
      section: req.params.section,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch templates by section',
    });
  }
});

// POST /api/template-combinations/:id/usage - Update usage stats
app.post('/api/template-combinations/:id/usage', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    await templateCombinationService.updateUsageStats(id, true);
    
    res.json({
      success: true,
      message: 'Usage stats updated',
    });
  } catch (error) {
    logger.error('Failed to update usage stats', {
      id: req.params.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(500).json({
      success: false,
      error: 'Failed to update usage stats',
    });
  }
});
```

---

## Phase 5: Frontend Integration

### 5.1 Update Template Context

**File:** `frontend/src/contexts/TemplateContext.tsx`

Update `loadTemplateCombinations` to fetch from API with fallback:

```typescript
import { api } from '@/lib/api';
import { TEMPLATE_CONFIGS, TemplateConfig } from '@/config/template-config';

const loadTemplateCombinations = async (): Promise<TemplateConfig[]> => {
  try {
    setLoading(true);
    setError(null);
    
    // Try to fetch from API first
    try {
      const response = await api('/template-combinations?isActive=true');
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.data && data.data.length > 0) {
          // Map database schema to TemplateConfig format
          const templates = data.data.map((dbTemplate: any): TemplateConfig => ({
            id: dbTemplate.id,
            name: dbTemplate.name_en || dbTemplate.name,
            nameFr: dbTemplate.name_fr || dbTemplate.name,
            description: dbTemplate.description_en || dbTemplate.description || '',
            descriptionFr: dbTemplate.description_fr || dbTemplate.description || '',
            type: dbTemplate.type,
            compatibleSections: dbTemplate.compatible_sections || [],
            compatibleModes: dbTemplate.compatible_modes || [],
            language: dbTemplate.language,
            complexity: dbTemplate.complexity,
            tags: dbTemplate.tags || [],
            isActive: dbTemplate.is_active,
            isDefault: dbTemplate.is_default,
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
            created: dbTemplate.created_at || new Date().toISOString().split('T')[0],
            updated: dbTemplate.updated_at || new Date().toISOString().split('T')[0],
          }));
          
          console.log('✅ Loaded templates from API:', templates.length);
          return templates;
        }
      }
    } catch (apiError) {
      console.warn('⚠️  Failed to fetch from API, falling back to static config:', apiError);
      // Fall through to static config fallback
    }
    
    // Fallback to static config
    const activeTemplates = TEMPLATE_CONFIGS.filter(template => template.isActive);
    console.log('📦 Using static config fallback:', activeTemplates.length, 'templates');
    return activeTemplates;
    
  } catch (error) {
    console.error('❌ Error loading template combinations:', error);
    setError('Failed to load template combinations');
    
    // Always return static config as final fallback
    return TEMPLATE_CONFIGS.filter(template => template.isActive);
  } finally {
    setLoading(false);
  }
};
```

### 5.2 Update Template Management Page

**File:** `frontend/src/pages/TemplateCombinationManagement.tsx`

Update to support both API and static config:

- Add toggle to switch between API and static config
- Update `updateTemplate` to save to API when available
- Keep static config as fallback

### 5.3 Add API Type Definitions

**File:** `frontend/src/types/api.ts`

Add template combination API types:

```typescript
export interface TemplateCombinationAPI {
  id: string;
  name: string;
  name_fr: string;
  name_en: string;
  description?: string;
  description_fr?: string;
  description_en?: string;
  type: 'formatter' | 'ai-formatter' | 'template-combo';
  compatible_sections: string[];
  compatible_modes: string[];
  language: 'fr' | 'en' | 'both';
  complexity: 'low' | 'medium' | 'high';
  tags: string[];
  is_active: boolean;
  is_default: boolean;
  features: {
    verbatimSupport: boolean;
    voiceCommandsSupport: boolean;
    aiFormatting: boolean;
    postProcessing: boolean;
  };
  prompt?: string;
  prompt_fr?: string;
  content?: string;
  config: Record<string, any>;
  usage_stats: {
    count: number;
    lastUsed?: string;
    successRate: number;
  };
  created_at: string;
  updated_at: string;
}
```

---

## Phase 6: Testing

### 6.1 Unit Tests

**File:** `backend/src/services/__tests__/templateCombinationService.test.ts`

```typescript
import { describe, it, expect, beforeEach } from '@jest/globals';
import { templateCombinationService } from '../templateCombinationService';
import { getDb } from '@/database';
import { templateCombinations } from '@/database/schema';

describe('TemplateCombinationService', () => {
  beforeEach(async () => {
    // Clean up test data
    const db = getDb();
    await db.delete(templateCombinations);
  });
  
  it('should fetch all templates', async () => {
    // Insert test data
    // ... test code
  });
  
  it('should filter by section', async () => {
    // ... test code
  });
  
  // More tests...
});
```

### 6.2 Integration Tests

**File:** `backend/src/routes/__tests__/templateCombinations.test.ts`

Test API endpoints:
- GET `/api/template-combinations`
- GET `/api/template-combinations/:id`
- GET `/api/template-combinations/section/:section`
- POST `/api/template-combinations/:id/usage`

### 6.3 Manual Testing Checklist

- [ ] Database table created successfully
- [ ] Data migrated successfully (verify all templates)
- [ ] API endpoints return correct data
- [ ] Frontend loads templates from API
- [ ] Frontend falls back to static config if API fails
- [ ] Template selection works in transcription interface
- [ ] Template management page works with API
- [ ] Usage stats update correctly

---

## Phase 7: Rollback Plan

### 7.1 Rollback Steps

If migration fails or causes issues:

1. **Stop using API endpoints** (revert frontend changes)
   ```typescript
   // Temporarily disable API fetching
   const loadTemplateCombinations = async () => {
     return TEMPLATE_CONFIGS.filter(template => template.isActive);
   };
   ```

2. **Drop database table** (if needed)
   ```sql
   DROP TABLE IF EXISTS template_combinations;
   ```

3. **Revert schema changes**
   ```bash
   git revert <migration-commit>
   ```

### 7.2 Rollback Verification

After rollback:
- [ ] Frontend uses static config (verify console logs)
- [ ] No API errors in browser console
- [ ] Template selection works
- [ ] No database errors

---

## Phase 8: Deployment Checklist

### Pre-Deployment

- [ ] Schema migration tested in staging
- [ ] Data migration script tested in staging
- [ ] API endpoints tested
- [ ] Frontend integration tested
- [ ] Rollback plan tested
- [ ] Database backups created

### Deployment Steps

1. **Run schema migration**
   ```bash
   cd backend
   npm run db:migrate
   ```

2. **Run data migration**
   ```bash
   cd backend
   npx tsx scripts/migrate-template-combinations.ts
   ```

3. **Deploy backend** (with new API endpoints)

4. **Deploy frontend** (with API integration)

5. **Verify deployment**
   - Check API endpoints return data
   - Check frontend loads templates
   - Check browser console for errors

### Post-Deployment

- [ ] Monitor API logs for errors
- [ ] Monitor database query performance
- [ ] Check template usage stats are updating
- [ ] Verify no regressions in transcription interface

---

## Phase 9: Future Enhancements

After successful migration:

1. **Remove static config dependency** (optional)
   - Remove `TEMPLATE_CONFIGS` array
   - Update all references to use API only

2. **Add template CRUD operations**
   - POST `/api/template-combinations` - Create template
   - PUT `/api/template-combinations/:id` - Update template
   - DELETE `/api/template-combinations/:id` - Delete template

3. **Add template versioning**
   - Track template versions
   - Support template rollback

4. **Add template sharing**
   - Share templates between clinics/users
   - Template marketplace

5. **Add advanced analytics**
   - Template usage dashboard
   - Success rate tracking
   - Performance metrics

---

## Timeline

| Phase | Task | Estimated Time |
|-------|------|----------------|
| Phase 1 | Schema Design | 30 min |
| Phase 2 | Database Migration | 15 min |
| Phase 3 | Data Migration | 30 min |
| Phase 4 | Backend API Integration | 45 min |
| Phase 5 | Frontend Integration | 30 min |
| Phase 6 | Testing | 30 min |
| **Total** | | **~3 hours** |

---

## Risk Mitigation

### Low Risk Items
- ✅ Schema changes (non-breaking)
- ✅ Data migration (idempotent)
- ✅ Frontend fallback (backward compatible)

### Medium Risk Items
- ⚠️ API performance (add caching if needed)
- ⚠️ Database query performance (add indexes)

### Mitigation Strategies
1. **Gradual rollout**: Enable API fetching gradually (feature flag)
2. **Monitoring**: Add logging and error tracking
3. **Fallback**: Always keep static config as fallback
4. **Testing**: Comprehensive testing before deployment

---

**End of Migration Plan**

