CREATE TABLE IF NOT EXISTS "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"session_id" uuid,
	"action" varchar(255) NOT NULL,
	"resource_type" varchar(100) NOT NULL,
	"resource_id" uuid,
	"metadata" json,
	"ip_address" varchar(45),
	"user_agent" text,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "clinics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"address" text,
	"phone" varchar(20),
	"email" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "export_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"format" text NOT NULL,
	"fidelity" text NOT NULL,
	"sections" json NOT NULL,
	"file_path" varchar(500),
	"file_size_bytes" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"clinic_id" uuid NOT NULL,
	"role" text DEFAULT 'physician' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "memberships_user_id_clinic_id_unique" UNIQUE("user_id","clinic_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"display_name" varchar(255),
	"locale" text DEFAULT 'fr-CA' NOT NULL,
	"consent_pipeda" boolean DEFAULT false NOT NULL,
	"consent_marketing" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"patient_id" varchar(255) NOT NULL,
	"consent_verified" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"mode" text DEFAULT 'smart_dictation' NOT NULL,
	"current_section" text DEFAULT 'section_7' NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"ended_at" timestamp,
	"duration_seconds" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"section" text NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"content" text NOT NULL,
	"language" text DEFAULT 'fr' NOT NULL,
	"version" varchar(50) DEFAULT '1.0.0' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"voice_commands" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "transcripts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"section" text NOT NULL,
	"content" text NOT NULL,
	"is_final" boolean DEFAULT false NOT NULL,
	"confidence_score" numeric(3, 2),
	"language_detected" varchar(10),
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"role" text DEFAULT 'doctor' NOT NULL,
	"clinic_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "voice_command_mappings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" uuid,
	"trigger" varchar(255) NOT NULL,
	"action" varchar(255) NOT NULL,
	"parameters" json,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "export_history" ADD CONSTRAINT "export_history_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "export_history" ADD CONSTRAINT "export_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "memberships" ADD CONSTRAINT "memberships_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transcripts" ADD CONSTRAINT "transcripts_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "voice_command_mappings" ADD CONSTRAINT "voice_command_mappings_template_id_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "templates"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
