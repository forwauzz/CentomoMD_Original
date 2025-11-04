-- Add template_combinations table for frontend template combinations
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
	"features" jsonb DEFAULT '{"verbatimSupport":false,"voiceCommandsSupport":false,"aiFormatting":false,"postProcessing":false}'::jsonb,
	"prompt" text,
	"prompt_fr" text,
	"content" text,
	"config" jsonb DEFAULT '{}'::jsonb,
	"usage_stats" jsonb DEFAULT '{"count":0,"successRate":0}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS "template_combinations_is_active_idx" ON "template_combinations" ("is_active");
CREATE INDEX IF NOT EXISTS "template_combinations_type_idx" ON "template_combinations" ("type");
CREATE INDEX IF NOT EXISTS "template_combinations_language_idx" ON "template_combinations" ("language");

-- Create GIN indexes for JSONB columns
-- GIN indexes enable fast array containment queries (e.g., @> operator)
CREATE INDEX IF NOT EXISTS "template_combinations_compatible_sections_idx" ON "template_combinations" USING GIN ("compatible_sections");
CREATE INDEX IF NOT EXISTS "template_combinations_compatible_modes_idx" ON "template_combinations" USING GIN ("compatible_modes");
CREATE INDEX IF NOT EXISTS "template_combinations_tags_idx" ON "template_combinations" USING GIN ("tags");

