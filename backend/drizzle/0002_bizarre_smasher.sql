CREATE TABLE IF NOT EXISTS "artifacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"ir" jsonb NOT NULL,
	"role_map" jsonb NOT NULL,
	"narrative" jsonb NOT NULL,
	"processing_time" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cases" (
	"uid" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"clinic_id" uuid NOT NULL,
	"draft" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "default_clinic_id" uuid;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "profiles" ADD CONSTRAINT "profiles_default_clinic_id_clinics_id_fk" FOREIGN KEY ("default_clinic_id") REFERENCES "clinics"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "artifacts" ADD CONSTRAINT "artifacts_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cases" ADD CONSTRAINT "cases_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cases" ADD CONSTRAINT "cases_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
