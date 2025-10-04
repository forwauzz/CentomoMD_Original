-- Phase 2: Add FK constraint from profiles to auth.users
-- This enforces 1:1 relationship between auth.users and public.profiles

-- First, let's check current state
SELECT 
    'BEFORE FK CONSTRAINT' as status,
    COUNT(*) as profiles_count,
    COUNT(DISTINCT user_id) as unique_user_ids
FROM public.profiles;

-- Check if any profiles reference non-existent auth users
SELECT 
    'PROFILES WITHOUT AUTH USERS' as status,
    COUNT(*) as orphaned_profiles
FROM public.profiles p
LEFT JOIN auth.users a ON p.user_id = a.id
WHERE a.id IS NULL;

-- Add FK constraint (fast, non-blocking)
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) 
ON DELETE CASCADE NOT VALID;

-- Verify constraint was added
SELECT 
    'FK CONSTRAINT ADDED' as status,
    constraint_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'profiles' 
  AND constraint_type = 'FOREIGN KEY'
  AND table_schema = 'public';

-- Note: We'll validate the constraint in the test phase
