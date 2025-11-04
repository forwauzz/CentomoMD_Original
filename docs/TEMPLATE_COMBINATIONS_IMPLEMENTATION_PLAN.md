# Template Combinations Migration - Surgical Implementation Plan

**Date:** 2025-01-09  
**Branch:** `cases/templates-enhanced`  
**Approach:** Surgical implementation following Project rules

---

## 🟡 Before Coding - Project Rules Compliance

### 1. Acceptance Criteria

✅ **Core Requirements:**
- Create `template_combinations` database table
- Migrate existing template combinations from static config to database
- Frontend can fetch templates from API with static fallback
- All existing functionality remains intact (no breaking changes)
- Zero impact on ProcessingOrchestrator, format endpoints, layers, language system

✅ **Success Criteria:**
- Database table created successfully
- All 8+ templates migrated to database
- API endpoints return correct data
- Frontend loads templates from API (with static fallback)
- Transcription interface continues working
- All critical systems unaffected

### 2. Impacted Files + Justification

#### **Files to Modify:**

1. **`backend/src/database/schema.ts`**
   - **Why:** Add `template_combinations` table schema
   - **Impact:** New table definition only (no changes to existing tables)

2. **`backend/scripts/migrate-template-combinations.ts`** (NEW)
   - **Why:** Data migration script
   - **Impact:** One-time migration, can be run multiple times (idempotent)

3. **`backend/src/services/templateCombinationService.ts`** (NEW)
   - **Why:** Service to query template combinations from database
   - **Impact:** New service, doesn't touch existing services

4. **`backend/src/routes/templateCombinations.ts`** (NEW)
   - **Why:** API endpoints for template combinations
   - **Impact:** New endpoints only, no changes to existing endpoints

5. **`backend/src/index.ts`**
   - **Why:** Mount new template combinations router
   - **Impact:** Add router mount only (line ~656), no changes to existing routes

6. **`frontend/src/contexts/TemplateContext.tsx`**
   - **Why:** Add API fetching with static fallback
   - **Impact:** Change template loading only, all existing functionality preserved

#### **Files NOT to Touch (Critical Protection):**

- ❌ `backend/src/services/processing/ProcessingOrchestrator.ts` - NO CHANGES
- ❌ `backend/src/routes/format.ts` - NO CHANGES
- ❌ `backend/src/services/layers/*` - NO CHANGES
- ❌ `backend/src/config/templates.ts` - NO CHANGES (backend registry, separate from frontend)
- ❌ `backend/src/config/sections.ts` - NO CHANGES
- ❌ `backend/src/config/modes.ts` - NO CHANGES
- ❌ `frontend/src/stores/uiStore.ts` - NO CHANGES
- ❌ All formatter services - NO CHANGES
- ❌ WebSocket system - NO CHANGES

### 3. Implementation Plan (3-6 Steps)

#### **Step 1: Database Schema**
- Add `template_combinations` table schema to `backend/src/database/schema.ts`
- Define all fields matching `TemplateConfig` interface
- Add type exports

#### **Step 2: Database Migration**
- Create migration SQL file using Drizzle Kit
- Run migration to create table
- Verify table creation

#### **Step 3: Data Migration Script**
- Create `backend/scripts/migrate-template-combinations.ts`
- Map `TEMPLATE_CONFIGS` from frontend config to database schema
- Insert all templates with idempotent checks
- Verify data migration

#### **Step 4: Backend Service**
- Create `backend/src/services/templateCombinationService.ts`
- Implement database query methods
- Add filtering by section, mode, language, active status
- Add usage stats update method

#### **Step 5: Backend API Endpoints**
- Create `backend/src/routes/templateCombinations.ts`
- Implement GET endpoints (list, by ID, by section)
- Implement POST endpoint for usage stats
- Mount router in `backend/src/index.ts`

#### **Step 6: Frontend Integration**
- Update `frontend/src/contexts/TemplateContext.tsx`
- Add API fetching with static config fallback
- Map database schema to `TemplateConfig` format
- Verify backward compatibility

### 4. Test Plan

#### **Happy Path Tests:**

1. **Database Migration:**
   - ✅ Table created successfully
   - ✅ All columns exist with correct types
   - ✅ Indexes created

2. **Data Migration:**
   - ✅ All templates migrated successfully
   - ✅ No duplicates created (idempotent check)
   - ✅ Data matches source config

3. **API Endpoints:**
   - ✅ GET `/api/template-combinations` returns all templates
   - ✅ GET `/api/template-combinations/:id` returns specific template
   - ✅ GET `/api/template-combinations/section/:section` filters by section
   - ✅ POST `/api/template-combinations/:id/usage` updates stats

4. **Frontend Integration:**
   - ✅ Frontend loads templates from API
   - ✅ Template selection works
   - ✅ Transcription interface works
   - ✅ Static fallback works if API fails

5. **Critical Systems Verification:**
   - ✅ ProcessingOrchestrator still works
   - ✅ Format endpoints still work (`/api/format/mode2`)
   - ✅ Layer system still works
   - ✅ Language system still works
   - ✅ WebSocket still works

#### **Unhappy Path Tests:**

1. **API Failure:**
   - ✅ Frontend falls back to static config
   - ✅ No errors in console
   - ✅ UI remains functional

2. **Database Errors:**
   - ✅ Service handles errors gracefully
   - ✅ API returns appropriate error responses
   - ✅ Frontend doesn't crash

3. **Data Migration Failures:**
   - ✅ Script can be run multiple times (idempotent)
   - ✅ Partial failures don't break entire migration
   - ✅ Errors are logged clearly

4. **Backward Compatibility:**
   - ✅ Existing template IDs still work
   - ✅ Existing API calls still work
   - ✅ No breaking changes to frontend

### 5. Authentication Requirement

**Status:** ✅ **Authentication NOT Required**

**Justification:**
- Following Project Rules: "Authentication is deferred by default"
- New endpoints are template management only (read-only for frontend)
- Can add authentication later if needed
- Critical systems (format endpoints) already handle auth appropriately

---

## 🛠️ Implementation Steps

### Step 1: Database Schema

**File:** `backend/src/database/schema.ts`

Add after existing tables:

```typescript
// Template Combinations table (new)
export const templateCombinations = pgTable('template_combinations', {
  id: varchar('id', { length: 255 }).primaryKey(),
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
  config: json('config').$type<Record<string, any>>().default('{}'),
  usage_stats: json('usage_stats').$type<{
    count: number;
    lastUsed?: string;
    successRate: number;
  }>().default('{"count": 0, "successRate": 0}'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export type TemplateCombination = typeof templateCombinations.$inferSelect;
export type NewTemplateCombination = typeof templateCombinations.$inferInsert;
```

**Verification:**
```bash
cd backend
npx tsc --noEmit  # Check TypeScript errors
```

---

### Step 2: Database Migration

**Command:**
```bash
cd backend
npx drizzle-kit generate --name add_template_combinations
```

**Or create manually:**
- Create `backend/drizzle/XXXX_add_template_combinations.sql`
- Run migration: `npm run db:migrate`

**Verification:**
```sql
-- Check table exists
SELECT * FROM information_schema.tables 
WHERE table_name = 'template_combinations';

-- Check columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'template_combinations';
```

---

### Step 3: Data Migration Script

**File:** `backend/scripts/migrate-template-combinations.ts`

See migration plan document for full script.

**Run:**
```bash
cd backend
npx tsx scripts/migrate-template-combinations.ts
```

**Verification:**
```sql
SELECT COUNT(*) FROM template_combinations;
SELECT id, name, type, is_active FROM template_combinations LIMIT 5;
```

---

### Step 4: Backend Service

**File:** `backend/src/services/templateCombinationService.ts`

See migration plan document for full service implementation.

**Verification:**
```typescript
import { templateCombinationService } from './services/templateCombinationService';

// Test service
const templates = await templateCombinationService.getAllTemplates({ isActive: true });
console.log('Active templates:', templates.length);
```

---

### Step 5: Backend API Endpoints

**File:** `backend/src/routes/templateCombinations.ts`

See migration plan document for full endpoint implementation.

**Mount in `backend/src/index.ts`:**
```typescript
// After format router mount (~line 656)
try {
  const templateCombinationsRouter = await import('./routes/templateCombinations.js');
  app.use('/api/template-combinations', templateCombinationsRouter.default);
  console.log('✅ /api/template-combinations routes mounted');
} catch (e) {
  console.error('❌ mount /api/template-combinations:', e);
}
```

**Verification:**
```bash
curl http://localhost:3001/api/template-combinations
curl http://localhost:3001/api/template-combinations/word-for-word-with-ai
```

---

### Step 6: Frontend Integration

**File:** `frontend/src/contexts/TemplateContext.tsx`

Update `loadTemplateCombinations` function (see migration plan for full code).

**Key Changes:**
1. Try API fetch first
2. Map database schema to `TemplateConfig` format
3. Fallback to static config if API fails
4. Preserve all existing functionality

**Verification:**
1. Start frontend: `cd frontend && npm run dev`
2. Check browser console for "Loaded templates from API" message
3. Verify template selection works
4. Test transcription interface with template selection
5. Disable API temporarily to test fallback

---

## ✅ After Coding - Verification Checklist

- [ ] All TypeScript errors resolved (`npx tsc --noEmit`)
- [ ] Linter passes (`npm run lint`)
- [ ] Tests pass (if applicable)
- [ ] Database migration successful
- [ ] Data migration successful (all templates migrated)
- [ ] API endpoints return correct data
- [ ] Frontend loads templates from API
- [ ] Static fallback works if API fails
- [ ] ProcessingOrchestrator still works
- [ ] Format endpoints still work (`/api/format/mode2`)
- [ ] Layer system still works
- [ ] Language system still works
- [ ] WebSocket still works
- [ ] Transcription interface works end-to-end

---

## 🚨 Rollback Plan

If any step fails:

1. **Frontend:** Revert `TemplateContext.tsx` changes (use static config only)
2. **Backend:** Remove router mount from `index.ts`
3. **Database:** Drop table if needed: `DROP TABLE IF EXISTS template_combinations;`
4. **Code:** Revert commits if necessary: `git revert <commit>`

---

## 📋 Next Steps

1. **Start with Step 1** (Database Schema)
2. **Test each step** before proceeding to next
3. **Verify critical systems** after each step
4. **Commit incrementally** after each successful step
5. **Document any deviations** from plan

---

**Ready to start surgical implementation!**

