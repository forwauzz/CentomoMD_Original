# SQL Migration Instructions: eval_runs and eval_results

**Date:** 2024-12-27  
**Purpose:** Create tables for model evaluation, benchmarking, and A/B testing

---

## 📋 Overview

This migration creates two tables:
1. **`eval_runs`** - Tracks each model/template execution
2. **`eval_results`** - Stores detailed metrics and analysis for each run

---

## 🚀 Instructions for Supabase

### Step 1: Access Supabase SQL Editor

1. Log into your Supabase dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**

### Step 2: Run the Migration

1. Copy the contents of `backend/migrations/create_eval_tables.sql`
2. Paste into the SQL Editor
3. Click **Run** (or press `Ctrl+Enter`)

### Step 3: Verify Tables Were Created

Run this query to verify:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('eval_runs', 'eval_results');
```

Expected result:
```
eval_runs
eval_results
```

---

## 📊 Table Structure

### `eval_runs` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `template_ref` | VARCHAR(255) | Unified template identifier |
| `template_base` | VARCHAR(255) | Base template ID |
| `template_version` | VARCHAR(50) | Template version |
| `section` | TEXT | Section (section_7, section_8, section_11) |
| `model` | VARCHAR(100) | AI model used (gpt-4o-mini, claude-3-5-sonnet, etc.) |
| `seed` | INTEGER | Seed for reproducibility |
| `temperature` | DECIMAL(3,2) | Temperature parameter |
| `prompt_hash` | VARCHAR(64) | SHA-256 hash of prompt |
| `lang` | VARCHAR(10) | Language (fr, en) |
| `layer_stack` | JSONB | Array of layer names |
| `stack_fingerprint` | VARCHAR(64) | Hash of layer stack |
| `latency_ms` | INTEGER | Processing latency in milliseconds |
| `tokens_in` | INTEGER | Input tokens |
| `tokens_out` | INTEGER | Output tokens |
| `cost_usd` | DECIMAL(10,6) | Cost in USD |
| `success` | BOOLEAN | Whether execution succeeded |
| `error` | TEXT | Error message if failed |
| `deterministic` | BOOLEAN | Whether seed was respected |
| `p_value` | DECIMAL(8,6) | Statistical p-value |
| `ci_low` | DECIMAL(8,6) | 95% CI lower bound |
| `ci_high` | DECIMAL(8,6) | 95% CI upper bound |
| `created_at` | TIMESTAMPTZ | Creation timestamp |

### `eval_results` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `run_id` | UUID | Foreign key to eval_runs.id |
| `metrics_json` | JSONB | Evaluation metrics (BLEU, ROUGE, etc.) |
| `diffs_json` | JSONB | Diff comparison results |
| `compliance_json` | JSONB | Compliance checks (Law 25, HIPAA) |
| `overall_score` | DECIMAL(5,2) | Overall score (0-100) |
| `layer_metrics` | JSONB | Per-layer performance |
| `created_at` | TIMESTAMPTZ | Creation timestamp |

---

## 🔒 Row Level Security (RLS)

The migration includes RLS policies, but they are **disabled by default** with placeholder policies.

**⚠️ IMPORTANT:** Customize RLS policies based on your security requirements:

1. **For Development:** You may disable RLS temporarily:
   ```sql
   ALTER TABLE eval_runs DISABLE ROW LEVEL SECURITY;
   ALTER TABLE eval_results DISABLE ROW LEVEL SECURITY;
   ```

2. **For Production:** Create proper policies based on user authentication:
   ```sql
   -- Example: Only allow users to see their own runs
   CREATE POLICY eval_runs_select ON eval_runs
     FOR SELECT
     USING (auth.uid() = user_id); -- Adjust based on your schema
   ```

---

## 📈 Indexes Created

### eval_runs Indexes
- `idx_eval_runs_template_ref` - Fast template lookups
- `idx_eval_runs_model` - Fast model filtering
- `idx_eval_runs_section` - Fast section filtering
- `idx_eval_runs_success` - Filter by success status
- `idx_eval_runs_created_at` - Time-based queries
- `idx_eval_runs_template_model` - Composite index for common queries
- `idx_eval_runs_stack_fingerprint` - Layer stack fingerprint lookups
- `idx_eval_runs_deterministic` - Filter deterministic runs
- `idx_eval_runs_layer_stack_gin` - GIN index for JSONB queries

### eval_results Indexes
- `idx_eval_results_run_id` - Foreign key lookup
- `idx_eval_results_created_at` - Time-based queries
- `idx_eval_results_overall_score` - Score-based sorting
- `idx_eval_results_metrics_gin` - GIN index for JSONB queries
- `idx_eval_results_compliance_gin` - GIN index for compliance queries

---

## ✅ Verification

After running the migration, verify with:

```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('eval_runs', 'eval_results');

-- Check foreign key constraint
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('eval_runs', 'eval_results');

-- Check indexes
SELECT indexname, tablename 
FROM pg_indexes 
WHERE tablename IN ('eval_runs', 'eval_results')
ORDER BY tablename, indexname;
```

---

## 🔄 Rollback (if needed)

If you need to rollback the migration:

```sql
-- Drop tables (cascade will also drop eval_results)
DROP TABLE IF EXISTS eval_results CASCADE;
DROP TABLE IF EXISTS eval_runs CASCADE;
```

---

## 📝 Notes

1. **UUID Extension:** The migration automatically enables `uuid-ossp` extension if needed
2. **JSONB:** Uses JSONB for flexible schema (layer_stack, metrics_json, etc.)
3. **Timestamps:** Uses `TIMESTAMPTZ` (timezone-aware) for all timestamps
4. **Foreign Keys:** `eval_results.run_id` has `ON DELETE CASCADE` - deleting a run deletes its results
5. **Defaults:** Most fields have sensible defaults (success=true, deterministic=false, etc.)

---

## 🎯 Next Steps

After creating the tables:

1. ✅ Verify tables exist in Supabase dashboard
2. ✅ Update your `.env` with database connection (if needed)
3. ✅ Run backend tests to verify schema matches Drizzle definitions
4. ✅ Test inserting sample data:
   ```sql
   INSERT INTO eval_runs (template_ref, model, section, lang)
   VALUES ('section7-ai-formatter', 'gpt-4o-mini', 'section_7', 'fr')
   RETURNING *;
   ```

---

**Document Version:** 1.0  
**Last Updated:** 2024-12-27
