-- Phase 2 Test: Verify FK constraint works
-- Run this after executing phase2_fk_constraint.sql

-- Test 1: Verify FK constraint exists
SELECT 
    'TEST 1: FK Constraint Exists' as test_name,
    CASE 
        WHEN COUNT(*) > 0 THEN 'PASS' 
        ELSE 'FAIL' 
    END as result,
    COUNT(*) as constraint_count
FROM information_schema.table_constraints 
WHERE table_name = 'profiles' 
  AND constraint_type = 'FOREIGN KEY'
  AND table_schema = 'public';

-- Test 2: Verify no orphaned profiles
SELECT 
    'TEST 2: No Orphaned Profiles' as test_name,
    CASE 
        WHEN COUNT(*) = 0 THEN 'PASS' 
        ELSE 'FAIL' 
    END as result,
    COUNT(*) as orphaned_count
FROM public.profiles p
LEFT JOIN auth.users a ON p.user_id = a.id
WHERE a.id IS NULL;

-- Test 3: Verify all profiles have matching auth users
SELECT 
    'TEST 3: All Profiles Have Auth Users' as test_name,
    CASE 
        WHEN COUNT(*) = 0 THEN 'PASS' 
        ELSE 'FAIL' 
    END as result,
    COUNT(*) as missing_auth_count
FROM public.profiles p
LEFT JOIN auth.users a ON p.user_id = a.id
WHERE a.id IS NULL;

-- Test 4: Verify constraint is NOT VALID (as expected)
SELECT 
    'TEST 4: Constraint is NOT VALID' as test_name,
    CASE 
        WHEN is_valid = false THEN 'PASS' 
        ELSE 'FAIL' 
    END as result,
    is_valid
FROM pg_constraint 
WHERE conname = 'profiles_user_id_fkey';

-- Test 5: Validate the constraint (this will lock briefly)
ALTER TABLE public.profiles VALIDATE CONSTRAINT profiles_user_id_fkey;

-- Test 6: Verify constraint is now VALID
SELECT 
    'TEST 6: Constraint is VALID' as test_name,
    CASE 
        WHEN is_valid = true THEN 'PASS' 
        ELSE 'FAIL' 
    END as result,
    is_valid
FROM pg_constraint 
WHERE conname = 'profiles_user_id_fkey';
