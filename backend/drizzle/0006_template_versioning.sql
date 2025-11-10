-- Template Versioning: Create schema for Supabase Storage-based template artifacts
-- Phase 1: Postgres metadata tables for template versioning

-- 1) Template bundles registry (without FK to template_bundle_versions initially)
-- Note: Named 'template_bundles' to avoid conflict with existing 'templates' table
CREATE TABLE IF NOT EXISTS "template_bundles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL UNIQUE,
	"default_version_id" uuid, -- FK will be added after template_bundle_versions exists
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamptz DEFAULT now() NOT NULL,
	"updated_at" timestamptz DEFAULT now() NOT NULL
);

--> statement-breakpoint

-- 2) Template bundle versions metadata
CREATE TABLE IF NOT EXISTS "template_bundle_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_bundle_id" uuid NOT NULL REFERENCES "template_bundles"("id") ON DELETE CASCADE,
	"semver" text NOT NULL,
	"status" text CHECK ("status" IN ('draft', 'stable', 'deprecated')) DEFAULT 'draft',
	"created_by" uuid REFERENCES "profiles"("user_id") ON DELETE SET NULL,
	"changelog" text,
	"created_at" timestamptz DEFAULT now() NOT NULL,
	"updated_at" timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT "template_bundle_versions_bundle_id_semver_unique" UNIQUE("template_bundle_id", "semver")
);

--> statement-breakpoint

-- 3) Add foreign key from template_bundles.default_version_id (handles circular dependency)
ALTER TABLE "template_bundles"
	ADD CONSTRAINT "template_bundles_default_version_id_fkey" 
	FOREIGN KEY ("default_version_id") 
	REFERENCES "template_bundle_versions"("id") 
	ON DELETE SET NULL;

--> statement-breakpoint

-- 4) Template bundle artifacts metadata (stores info about template artifact files in Supabase Storage)
-- Note: Named 'template_bundle_artifacts' to avoid conflict with existing 'artifacts' table
CREATE TABLE IF NOT EXISTS "template_bundle_artifacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_bundle_version_id" uuid NOT NULL REFERENCES "template_bundle_versions"("id") ON DELETE CASCADE,
	"kind" text NOT NULL, -- e.g., 'master_prompt', 'json_config', 'golden_example', 'master_config', 'system_xml', 'plan_xml', 'golden_cases'
	"storage_path" text NOT NULL, -- Supabase Storage path, e.g., 'section7/v1.0.0/section7_master.md'
	"sha256" text NOT NULL, -- SHA256 hash for integrity verification
	"size_bytes" integer NOT NULL,
	"content_type" text NOT NULL, -- e.g., 'text/markdown', 'application/json', 'application/xml', 'application/x-ndjson'
	"locale" text CHECK ("locale" IN ('fr', 'en')), -- NULL for language-agnostic artifacts
	"created_at" timestamptz DEFAULT now() NOT NULL
);

--> statement-breakpoint

-- 5) Create indexes for performance
CREATE INDEX IF NOT EXISTS "template_bundles_name_idx" ON "template_bundles"("name");
CREATE INDEX IF NOT EXISTS "template_bundle_versions_bundle_id_idx" ON "template_bundle_versions"("template_bundle_id");
CREATE INDEX IF NOT EXISTS "template_bundle_versions_semver_idx" ON "template_bundle_versions"("semver");
CREATE INDEX IF NOT EXISTS "template_bundle_versions_status_idx" ON "template_bundle_versions"("status");
CREATE INDEX IF NOT EXISTS "template_bundle_artifacts_version_id_idx" ON "template_bundle_artifacts"("template_bundle_version_id");
CREATE INDEX IF NOT EXISTS "template_bundle_artifacts_kind_idx" ON "template_bundle_artifacts"("kind");
CREATE INDEX IF NOT EXISTS "template_bundle_artifacts_locale_idx" ON "template_bundle_artifacts"("locale");

--> statement-breakpoint

-- 6) Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

--> statement-breakpoint

-- 7) Create triggers for updated_at
CREATE TRIGGER update_template_bundles_updated_at BEFORE UPDATE ON "template_bundles"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_template_bundle_versions_updated_at BEFORE UPDATE ON "template_bundle_versions"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

