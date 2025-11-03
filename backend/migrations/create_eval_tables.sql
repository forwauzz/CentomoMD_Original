-- =====================================================
-- Migration: Create eval_runs and eval_results tables
-- Date: 2024-12-27
-- Purpose: Support for model evaluation, benchmarking, and A/B testing
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- Table: eval_runs
-- Description: Tracks each model/template execution for evaluation and benchmarking
-- =====================================================
CREATE TABLE IF NOT EXISTS eval_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Template identification
  template_ref VARCHAR(255) NOT NULL,
  template_base VARCHAR(255),
  template_version VARCHAR(50),
  section TEXT NOT NULL CHECK (section IN ('section_7', 'section_8', 'section_11')),
  
  -- Model configuration
  model VARCHAR(100) NOT NULL,
  seed INTEGER,
  temperature DECIMAL(3, 2),
  prompt_hash VARCHAR(64), -- SHA-256 hash of prompt
  
  -- Language and layer configuration
  lang VARCHAR(10) NOT NULL, -- 'fr' | 'en'
  layer_stack JSONB DEFAULT '[]'::jsonb, -- Array of layer names
  stack_fingerprint VARCHAR(64), -- Hash of layer stack for tracking
  
  -- Performance metrics
  latency_ms INTEGER,
  tokens_in INTEGER,
  tokens_out INTEGER,
  cost_usd DECIMAL(10, 6),
  
  -- Execution status
  success BOOLEAN NOT NULL DEFAULT true,
  error TEXT,
  deterministic BOOLEAN NOT NULL DEFAULT false, -- False if seed was ignored by model
  
  -- Statistical analysis (for A/B testing)
  p_value DECIMAL(8, 6), -- Wilcoxon test p-value
  ci_low DECIMAL(8, 6), -- 95% CI lower bound
  ci_high DECIMAL(8, 6), -- 95% CI upper bound
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- Table: eval_results
-- Description: Stores detailed metrics, diffs, and compliance checks for each run
-- =====================================================
CREATE TABLE IF NOT EXISTS eval_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign key to eval_runs
  run_id UUID NOT NULL REFERENCES eval_runs(id) ON DELETE CASCADE,
  
  -- Metrics and analysis
  metrics_json JSONB, -- Record<string, number> - various evaluation metrics
  diffs_json JSONB, -- Record<string, any> - Diff comparison results
  compliance_json JSONB, -- Record<string, boolean> - Law 25, HIPAA compliance checks
  overall_score DECIMAL(5, 2), -- 0-100 overall evaluation score
  layer_metrics JSONB, -- Record<string, any> - Per-layer performance metrics
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- Indexes for common query patterns
-- =====================================================

-- Indexes on eval_runs
CREATE INDEX IF NOT EXISTS idx_eval_runs_template_ref ON eval_runs(template_ref);
CREATE INDEX IF NOT EXISTS idx_eval_runs_model ON eval_runs(model);
CREATE INDEX IF NOT EXISTS idx_eval_runs_section ON eval_runs(section);
CREATE INDEX IF NOT EXISTS idx_eval_runs_success ON eval_runs(success);
CREATE INDEX IF NOT EXISTS idx_eval_runs_created_at ON eval_runs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_eval_runs_template_model ON eval_runs(template_ref, model);
CREATE INDEX IF NOT EXISTS idx_eval_runs_stack_fingerprint ON eval_runs(stack_fingerprint);
CREATE INDEX IF NOT EXISTS idx_eval_runs_deterministic ON eval_runs(deterministic);

-- Indexes on eval_results
CREATE INDEX IF NOT EXISTS idx_eval_results_run_id ON eval_results(run_id);
CREATE INDEX IF NOT EXISTS idx_eval_results_created_at ON eval_results(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_eval_results_overall_score ON eval_results(overall_score DESC);

-- GIN indexes for JSONB queries
CREATE INDEX IF NOT EXISTS idx_eval_runs_layer_stack_gin ON eval_runs USING GIN(layer_stack);
CREATE INDEX IF NOT EXISTS idx_eval_results_metrics_gin ON eval_results USING GIN(metrics_json);
CREATE INDEX IF NOT EXISTS idx_eval_results_compliance_gin ON eval_results USING GIN(compliance_json);

-- =====================================================
-- Comments for documentation
-- =====================================================

COMMENT ON TABLE eval_runs IS 'Tracks each model/template execution for evaluation, benchmarking, and A/B testing. Stores reproducibility controls (seed, temperature, prompt_hash) and performance metrics.';
COMMENT ON TABLE eval_results IS 'Stores detailed metrics, diff comparisons, and compliance checks for each evaluation run. Linked to eval_runs via run_id.';

COMMENT ON COLUMN eval_runs.template_ref IS 'Unified template identifier (templateRef) - can be base template or template combination';
COMMENT ON COLUMN eval_runs.template_base IS 'Base template ID extracted from templateRef';
COMMENT ON COLUMN eval_runs.layer_stack IS 'JSONB array of layer names applied to this run';
COMMENT ON COLUMN eval_runs.stack_fingerprint IS 'SHA-256 hash of sorted layer stack for fingerprinting';
COMMENT ON COLUMN eval_runs.prompt_hash IS 'SHA-256 hash of prompt for version tracking';
COMMENT ON COLUMN eval_runs.deterministic IS 'True if seed was supported and used, false if seed was ignored by model';
COMMENT ON COLUMN eval_runs.p_value IS 'Wilcoxon test p-value for A/B testing statistical significance';
COMMENT ON COLUMN eval_runs.ci_low IS '95% confidence interval lower bound (bootstrap method)';
COMMENT ON COLUMN eval_runs.ci_high IS '95% confidence interval upper bound (bootstrap method)';

COMMENT ON COLUMN eval_results.metrics_json IS 'JSON object with various evaluation metrics (BLEU, ROUGE, etc.)';
COMMENT ON COLUMN eval_results.diffs_json IS 'JSON object with diff comparison results against benchmarks';
COMMENT ON COLUMN eval_results.compliance_json IS 'JSON object with compliance checks (Law 25, HIPAA, PIPEDA)';
COMMENT ON COLUMN eval_results.overall_score IS 'Overall evaluation score (0-100)';
COMMENT ON COLUMN eval_results.layer_metrics IS 'JSON object with per-layer performance metrics';

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================
-- Note: Adjust these policies based on your security requirements

-- Enable RLS
ALTER TABLE eval_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE eval_results ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own evaluation runs
-- Adjust this based on your authentication setup
-- Example (commented out - customize as needed):
-- CREATE POLICY eval_runs_select ON eval_runs
--   FOR SELECT
--   USING (true); -- Adjust: auth.uid() = user_id or similar

-- Policy: Users can insert their own evaluation runs
-- Example (commented out - customize as needed):
-- CREATE POLICY eval_runs_insert ON eval_runs
--   FOR INSERT
--   WITH CHECK (true); -- Adjust based on your auth setup

-- =====================================================
-- Verification Queries (optional - run these to verify)
-- =====================================================

-- Verify tables exist
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
--   AND table_name IN ('eval_runs', 'eval_results');

-- Verify indexes
-- SELECT indexname FROM pg_indexes 
-- WHERE tablename IN ('eval_runs', 'eval_results');

-- =====================================================
-- Rollback (if needed)
-- =====================================================
-- DROP TABLE IF EXISTS eval_results CASCADE;
-- DROP TABLE IF EXISTS eval_runs CASCADE;
