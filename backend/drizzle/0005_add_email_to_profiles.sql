BEGIN;

-- Add email column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS email varchar(255);

-- Add comment for documentation
COMMENT ON COLUMN profiles.email IS 'User email address for easier identification and matching with auth.users';

-- Update existing profiles with email data from auth.users (if available)
-- Note: This is a safe operation that won't break existing data
-- The email will be populated by the profile sync utility on next login

COMMIT;
