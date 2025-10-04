-- Phase 4: Remove legacy public.users table
-- This is safe since all foreign keys have been migrated to auth.users

-- First, let's verify the current state
SELECT 
    'BEFORE REMOVAL' as status,
    COUNT(*) as users_count,
    email,
    name
FROM public.users;

-- Check that no foreign keys still reference public.users
SELECT 
    'FK REFERENCES TO PUBLIC.USERS' as status,
    tc.table_name,
    tc.constraint_name,
    ccu.table_name AS foreign_table_name
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
  AND ccu.table_schema = 'public';

-- Verify all foreign keys now point to auth.users
SELECT 
    'FK REFERENCES TO AUTH.USERS' as status,
    tc.table_name,
    tc.constraint_name,
    ccu.table_name AS foreign_table_name
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
  AND ccu.table_schema = 'auth';

-- Remove the legacy public.users table
DROP TABLE public.users CASCADE;

-- Verify the table is gone
SELECT 
    'AFTER REMOVAL' as status,
    CASE 
        WHEN COUNT(*) = 0 THEN 'SUCCESS - Table removed' 
        ELSE 'FAIL - Table still exists' 
    END as result
FROM information_schema.tables 
WHERE table_name = 'users' 
  AND table_schema = 'public';
