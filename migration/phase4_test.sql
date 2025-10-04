-- Phase 4 Test: Verify system works without public.users
-- Run this after executing phase4_remove_legacy.sql

-- Test 1: Verify public.users table is gone
SELECT 
    'TEST 1: Public Users Table Removed' as test_name,
    CASE 
        WHEN COUNT(*) = 0 THEN 'PASS' 
        ELSE 'FAIL' 
    END as result,
    COUNT(*) as table_count
FROM information_schema.tables 
WHERE table_name = 'users' 
  AND table_schema = 'public';

-- Test 2: Verify all foreign keys still point to auth.users
SELECT 
    'TEST 2: All FK Point to Auth Users' as test_name,
    CASE 
        WHEN COUNT(*) = 5 THEN 'PASS' 
        ELSE 'FAIL' 
    END as result,
    COUNT(*) as fk_count
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

-- Test 3: Verify no foreign keys point to public.users (should be 0)
SELECT 
    'TEST 3: No FK Point to Public Users' as test_name,
    CASE 
        WHEN COUNT(*) = 0 THEN 'PASS' 
        ELSE 'FAIL' 
    END as result,
    COUNT(*) as old_fk_count
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

-- Test 4: Verify auth.users still exists
SELECT 
    'TEST 4: Auth Users Still Exists' as test_name,
    CASE 
        WHEN COUNT(*) = 7 THEN 'PASS' 
        ELSE 'FAIL' 
    END as result,
    COUNT(*) as auth_user_count
FROM auth.users;

-- Test 5: Verify public.profiles still exists
SELECT 
    'TEST 5: Public Profiles Still Exists' as test_name,
    CASE 
        WHEN COUNT(*) = 7 THEN 'PASS' 
        ELSE 'FAIL' 
    END as result,
    COUNT(*) as profile_count
FROM public.profiles;

-- Test 6: Verify FK constraint between profiles and auth.users still works
SELECT 
    'TEST 6: Profiles FK to Auth Users' as test_name,
    CASE 
        WHEN COUNT(*) > 0 THEN 'PASS' 
        ELSE 'FAIL' 
    END as result,
    COUNT(*) as fk_count
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
  AND tc.table_name = 'profiles'
  AND ccu.table_name = 'users'
  AND ccu.table_schema = 'auth';

-- Test 7: Verify all foreign key tables are still accessible
SELECT 
    'TEST 7: All FK Tables Accessible' as test_name,
    CASE 
        WHEN total_tables = 5 THEN 'PASS' 
        ELSE 'FAIL' 
    END as result,
    total_tables
FROM (
    SELECT 
        (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'sessions' AND table_schema = 'public') +
        (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'cases' AND table_schema = 'public') +
        (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'audit_logs' AND table_schema = 'public') +
        (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'export_history' AND table_schema = 'public') +
        (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'feedback' AND table_schema = 'public')
    as total_tables
) t;
