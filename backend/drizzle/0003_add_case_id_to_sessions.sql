-- Add case_id column to sessions table
ALTER TABLE "sessions" ADD COLUMN "case_id" integer;

-- Add foreign key constraint to reference cases table
DO $$ BEGIN
 ALTER TABLE "sessions" ADD CONSTRAINT "sessions_case_id_cases_uid_fk" FOREIGN KEY ("case_id") REFERENCES "cases"("uid") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
