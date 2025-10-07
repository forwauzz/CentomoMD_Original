ALTER TABLE "audit_logs" ADD COLUMN "clinic_id" uuid;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "clinic_id" uuid;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sessions" ADD CONSTRAINT "sessions_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
