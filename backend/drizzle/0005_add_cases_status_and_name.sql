-- Cases: add missing columns (name, status), backfill status from draft.metadata.status, and enforce defaults

-- 1) Add name column if missing
ALTER TABLE "cases"
  ADD COLUMN IF NOT EXISTS "name" varchar(255) DEFAULT 'Nouveau cas';

-- 2) Add status column if missing (as text; enum is enforced at application layer)
ALTER TABLE "cases"
  ADD COLUMN IF NOT EXISTS "status" text;

-- 3) Backfill status from draft.metadata.status where available; otherwise use 'draft'
UPDATE "cases"
SET "status" = COALESCE(("draft"->'metadata'->>'status'), 'draft')
WHERE "status" IS NULL;

-- 4) Enforce NOT NULL and default
ALTER TABLE "cases"
  ALTER COLUMN "status" SET DEFAULT 'draft';

ALTER TABLE "cases"
  ALTER COLUMN "status" SET NOT NULL;

-- Note: Foreign key target for user_id varies across environments (profiles.user_id vs users.id).
-- This migration intentionally does not modify FKs; standardization will be handled separately.


