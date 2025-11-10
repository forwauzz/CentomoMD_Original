-- Add template usage tracking and feedback system
-- Phase 1: Database Schema (RLS deferred until roles are defined)

-- Add consent_analytics to profiles table
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "consent_analytics" boolean DEFAULT true NOT NULL;

-- Set consent_analytics to true for all existing users (opt-in by default)
UPDATE "profiles" SET "consent_analytics" = true WHERE "consent_analytics" IS NULL OR "consent_analytics" = false;

-- Template Usage Events table (tracks every template application)
CREATE TABLE IF NOT EXISTS "template_usage_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"template_id" varchar(255) NOT NULL REFERENCES "template_combinations"("id") ON DELETE CASCADE,
	"user_id" uuid NOT NULL,
	"case_id" uuid REFERENCES "cases"("id") ON DELETE SET NULL,
	"session_id" uuid REFERENCES "sessions"("id") ON DELETE SET NULL,
	"section_id" text,
	"mode_id" text,
	"applied_at" timestamptz DEFAULT now() NOT NULL
);

-- Template Feedback table (one feedback per template/session/user)
CREATE TABLE IF NOT EXISTS "template_feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"template_id" varchar(255) NOT NULL REFERENCES "template_combinations"("id") ON DELETE CASCADE,
	"user_id" uuid NOT NULL,
	"session_id" uuid REFERENCES "sessions"("id") ON DELETE SET NULL,
	"case_id" uuid REFERENCES "cases"("id") ON DELETE SET NULL,
	"section_id" text,
	"mode_id" text,
	"transcript_id" uuid REFERENCES "transcripts"("id") ON DELETE SET NULL,
	"rating" smallint CHECK ("rating" >= 1 AND "rating" <= 5),
	"comment" text,
	"tags" text[] DEFAULT '{}',
	"applied_at" timestamptz NOT NULL,
	"rated_at" timestamptz DEFAULT now() NOT NULL,
	"time_to_rate" integer,
	"was_dismissed" boolean DEFAULT false NOT NULL,
	"interaction_time" integer,
	CONSTRAINT "uniq_feedback_once" UNIQUE("template_id", "session_id", "user_id")
);

-- Feedback Prompts Queue table (schedules feedback prompts)
CREATE TABLE IF NOT EXISTS "feedback_prompts_queue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"template_id" varchar(255) NOT NULL,
	"user_id" uuid NOT NULL,
	"session_id" uuid REFERENCES "sessions"("id") ON DELETE CASCADE,
	"scheduled_at" timestamptz NOT NULL,
	"created_at" timestamptz DEFAULT now() NOT NULL
);

-- Create indexes for fast queries
CREATE INDEX IF NOT EXISTS "template_usage_events_template_time_idx" ON "template_usage_events" ("template_id", "applied_at" DESC);
CREATE INDEX IF NOT EXISTS "template_usage_events_user_idx" ON "template_usage_events" ("user_id");
CREATE INDEX IF NOT EXISTS "template_feedback_template_time_idx" ON "template_feedback" ("template_id", "rated_at" DESC);
CREATE INDEX IF NOT EXISTS "template_feedback_rating_idx" ON "template_feedback" ("template_id", "rating");
CREATE INDEX IF NOT EXISTS "feedback_prompts_queue_due_idx" ON "feedback_prompts_queue" ("scheduled_at");

-- Materialized View for fast aggregates
CREATE MATERIALIZED VIEW IF NOT EXISTS "mv_template_stats" AS
SELECT
	t.id AS template_id,
	COUNT(u.id) AS total_usage,
	COUNT(DISTINCT u.user_id) AS unique_users,
	MAX(u.applied_at) AS last_used_at,
	AVG(NULLIF(f.rating, 0))::numeric(4,2) AS avg_rating,
	COUNT(f.id) AS rating_count,
	COUNT(f.id) FILTER (WHERE f.rating >= 4 AND f.was_dismissed = false) AS success_count,
	COUNT(f.id) FILTER (WHERE f.was_dismissed = true) AS dismissal_count,
	COUNT(q.id) AS prompt_impressions
FROM "template_combinations" t
LEFT JOIN "template_usage_events" u ON u.template_id = t.id
LEFT JOIN "template_feedback" f ON f.template_id = t.id
LEFT JOIN "feedback_prompts_queue" q ON q.template_id = t.id
GROUP BY t.id;

-- Create index on materialized view for fast lookups
CREATE UNIQUE INDEX IF NOT EXISTS "mv_template_stats_template_id_idx" ON "mv_template_stats" ("template_id");

-- View for easy querying (public, no RLS needed - already aggregated)
CREATE OR REPLACE VIEW "v_template_stats" AS
SELECT * FROM "mv_template_stats";

-- Note: RLS policies will be added later when user roles are defined
-- For now, backend API handles authentication and consent checks

