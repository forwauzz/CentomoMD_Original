-- Phase 3: Migrate foreign keys from public.users to auth.users
-- This updates all 5 tables to reference auth.users instead of public.users

-- First, let's check current foreign key constraints
SELECT 
    'BEFORE MIGRATION' as status,
    tc.table_name,
    tc.constraint_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
  AND ccu.table_name = 'users'
ORDER BY tc.table_name;

-- Check current data in each table
SELECT 'sessions' as table_name, COUNT(*) as record_count FROM public.sessions
UNION ALL
SELECT 'cases', COUNT(*) FROM public.cases
UNION ALL
SELECT 'audit_logs', COUNT(*) FROM public.audit_logs
UNION ALL
SELECT 'export_history', COUNT(*) FROM public.export_history
UNION ALL
SELECT 'feedback', COUNT(*) FROM public.feedback;

-- Step 1: Update sessions table
-- Drop old FK constraint
ALTER TABLE public.sessions DROP CONSTRAINT IF EXISTS sessions_user_id_users_id_fk;

-- Add new FK constraint to auth.users
ALTER TABLE public.sessions 
ADD CONSTRAINT sessions_user_id_auth_users_fk 
FOREIGN KEY (user_id) REFERENCES auth.users(id) 
ON DELETE SET NULL NOT VALID;

-- Step 2: Update cases table
-- Drop old FK constraint
ALTER TABLE public.cases DROP CONSTRAINT IF EXISTS cases_user_id_users_id_fk;

-- Add new FK constraint to auth.users
ALTER TABLE public.cases 
ADD CONSTRAINT cases_user_id_auth_users_fk 
FOREIGN KEY (user_id) REFERENCES auth.users(id) 
ON DELETE SET NULL NOT VALID;

-- Step 3: Update audit_logs table
-- Drop old FK constraint
ALTER TABLE public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_user_id_users_id_fk;

-- Add new FK constraint to auth.users
ALTER TABLE public.audit_logs 
ADD CONSTRAINT audit_logs_user_id_auth_users_fk 
FOREIGN KEY (user_id) REFERENCES auth.users(id) 
ON DELETE SET NULL NOT VALID;

-- Step 4: Update export_history table
-- Drop old FK constraint
ALTER TABLE public.export_history DROP CONSTRAINT IF EXISTS export_history_user_id_users_id_fk;

-- Add new FK constraint to auth.users
ALTER TABLE public.export_history 
ADD CONSTRAINT export_history_user_id_auth_users_fk 
FOREIGN KEY (user_id) REFERENCES auth.users(id) 
ON DELETE SET NULL NOT VALID;

-- Step 5: Update feedback table
-- Drop old FK constraint
ALTER TABLE public.feedback DROP CONSTRAINT IF EXISTS feedback_user_id_users_id_fk;

-- Add new FK constraint to auth.users
ALTER TABLE public.feedback 
ADD CONSTRAINT feedback_user_id_auth_users_fk 
FOREIGN KEY (user_id) REFERENCES auth.users(id) 
ON DELETE SET NULL NOT VALID;

-- Verify new constraints were added
SELECT 
    'AFTER MIGRATION' as status,
    tc.table_name,
    tc.constraint_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
  AND ccu.table_name = 'users'
  AND ccu.table_schema = 'auth'
ORDER BY tc.table_name;
