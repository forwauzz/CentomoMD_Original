-- Migration: Add status column to cases table
-- Run this SQL directly in your PostgreSQL database

-- Add the status column with a default value
ALTER TABLE cases
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft';

-- Add check constraint to ensure only valid status values
ALTER TABLE cases
ADD CONSTRAINT cases_status_check CHECK (status IN ('draft', 'in_progress', 'completed'));

-- Update existing records to have 'draft' status (if any exist)
UPDATE cases
SET status = 'draft'
WHERE status IS NULL;

-- Verify the column was added correctly
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'cases' AND column_name = 'status';

