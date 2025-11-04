-- ============================================================================
-- Template Versioning Schema Setup
-- Phase 1: Supabase Storage Integration - Postgres Metadata Tables
-- ============================================================================
-- 
-- Instructions:
-- 1. Run this SQL in your Supabase SQL Editor
-- 2. This creates the metadata tables for template versioning
-- 3. After running, proceed to Step 2: Create Supabase Storage bucket
--
-- ============================================================================

-- 1) Template bundles registry
-- Stores template bundle definitions (e.g., 'section7-ai-formatter', 'section7-rd')
-- Note: Named 'template_bundles' to avoid conflict with existing 'templates' table
CREATE TABLE IF NOT EXISTS "template_bundles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL UNIQUE,
	"default_version_id" uuid, -- Will reference template_bundle_versions after it's created
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamptz DEFAULT now() NOT NULL,
	"updated_at" timestamptz DEFAULT now() NOT NULL
);

-- 2) Template bundle versions metadata
-- Stores version information for each template bundle (e.g., v1.0.0, v1.1.0)
CREATE TABLE IF NOT EXISTS "template_bundle_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_bundle_id" uuid NOT NULL REFERENCES "template_bundles"("id") ON DELETE CASCADE,
	"semver" text NOT NULL, -- Semantic version (e.g., '1.0.0', '2.1.3')
	"status" text CHECK ("status" IN ('draft', 'stable', 'deprecated')) DEFAULT 'draft',
	"created_by" uuid REFERENCES "profiles"("user_id") ON DELETE SET NULL,
	"changelog" text, -- Optional changelog/notes for this version
	"created_at" timestamptz DEFAULT now() NOT NULL,
	"updated_at" timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT "template_bundle_versions_bundle_id_semver_unique" UNIQUE("template_bundle_id", "semver")
);

-- 3) Template bundle artifacts metadata
-- Stores metadata about template artifact files stored in Supabase Storage
-- Note: Named 'template_bundle_artifacts' to avoid conflict with existing 'artifacts' table
-- Each artifact has a storage_path pointing to the file in the 'template-artifacts' bucket
CREATE TABLE IF NOT EXISTS "template_bundle_artifacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_bundle_version_id" uuid NOT NULL REFERENCES "template_bundle_versions"("id") ON DELETE CASCADE,
	"kind" text NOT NULL, 
		-- Artifact types:
		-- For AI Formatter: 'master_prompt', 'json_config', 'golden_example'
		-- For R&D Pipeline: 'master_config', 'system_xml', 'plan_xml', 'golden_cases'
	"storage_path" text NOT NULL, 
		-- Supabase Storage path relative to bucket root
		-- Example: 'section7/v1.0.0/section7_master.md'
	"sha256" text NOT NULL, 
		-- SHA256 hash for integrity verification
		-- Format: lowercase hex string (64 chars)
	"size_bytes" integer NOT NULL, 
		-- File size in bytes
	"content_type" text NOT NULL, 
		-- MIME type: 'text/markdown', 'application/json', 'application/xml', 'application/x-ndjson'
	"locale" text CHECK ("locale" IN ('fr', 'en')), 
		-- Language code for locale-specific artifacts
		-- NULL for language-agnostic artifacts (e.g., XML files)
	"created_at" timestamptz DEFAULT now() NOT NULL
);

-- 4) Add foreign key from template_bundles.default_version_id
-- This creates the circular reference after template_bundle_versions exists
ALTER TABLE "template_bundles"
	ADD CONSTRAINT "template_bundles_default_version_id_fkey" 
	FOREIGN KEY ("default_version_id") 
	REFERENCES "template_bundle_versions"("id") 
	ON DELETE SET NULL;

-- 5) Create indexes for performance
CREATE INDEX IF NOT EXISTS "template_bundles_name_idx" ON "template_bundles"("name");
CREATE INDEX IF NOT EXISTS "template_bundle_versions_bundle_id_idx" ON "template_bundle_versions"("template_bundle_id");
CREATE INDEX IF NOT EXISTS "template_bundle_versions_semver_idx" ON "template_bundle_versions"("semver");
CREATE INDEX IF NOT EXISTS "template_bundle_versions_status_idx" ON "template_bundle_versions"("status");
CREATE INDEX IF NOT EXISTS "template_bundle_artifacts_version_id_idx" ON "template_bundle_artifacts"("template_bundle_version_id");
CREATE INDEX IF NOT EXISTS "template_bundle_artifacts_kind_idx" ON "template_bundle_artifacts"("kind");
CREATE INDEX IF NOT EXISTS "template_bundle_artifacts_locale_idx" ON "template_bundle_artifacts"("locale");

-- 6) Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 7) Create triggers for updated_at auto-update
DROP TRIGGER IF EXISTS update_template_bundles_updated_at ON "template_bundles";
CREATE TRIGGER update_template_bundles_updated_at 
	BEFORE UPDATE ON "template_bundles"
	FOR EACH ROW 
	EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_template_bundle_versions_updated_at ON "template_bundle_versions";
CREATE TRIGGER update_template_bundle_versions_updated_at 
	BEFORE UPDATE ON "template_bundle_versions"
	FOR EACH ROW 
	EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Verification Queries (Optional - run these to verify setup)
-- ============================================================================

-- Check tables were created:
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('template_bundles', 'template_bundle_versions', 'template_bundle_artifacts');

-- Check indexes:
-- SELECT indexname, tablename FROM pg_indexes 
-- WHERE tablename IN ('template_bundles', 'template_bundle_versions', 'template_bundle_artifacts');

-- ============================================================================
-- Next Steps:
-- 1. Verify tables were created successfully
-- 2. Proceed to Step 2: Create Supabase Storage bucket 'template-artifacts'
-- ============================================================================

