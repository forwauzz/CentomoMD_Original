-- Phase 1 Test: Verify orphaned records are cleaned
-- Run this after executing phase1_cleanup.sql

-- Test 1: Verify no orphaned cases remain
SELECT 
    'TEST 1: Orphaned Cases' as test_name,
    CASE 
        WHEN COUNT(*) = 0 THEN 'PASS' 
        ELSE 'FAIL' 
    END as result,
    COUNT(*) as orphaned_count
FROM public.cases 
WHERE user_id = '00000000-0000-0000-0000-000000000001';

-- Test 2: Verify no orphaned records in any foreign key table
SELECT 
    'TEST 2: All FK Tables Clean' as test_name,
    CASE 
        WHEN total_orphaned = 0 THEN 'PASS' 
        ELSE 'FAIL' 
    END as result,
    total_orphaned
FROM (
    SELECT 
        (SELECT COUNT(*) FROM public.sessions WHERE user_id = '00000000-0000-0000-0000-000000000001') +
        (SELECT COUNT(*) FROM public.cases WHERE user_id = '00000000-0000-0000-0000-000000000001') +
        (SELECT COUNT(*) FROM public.audit_logs WHERE user_id = '00000000-0000-0000-0000-000000000001') +
        (SELECT COUNT(*) FROM public.export_history WHERE user_id = '00000000-0000-0000-0000-000000000001') +
        (SELECT COUNT(*) FROM public.feedback WHERE user_id = '00000000-0000-0000-0000-000000000001')
    as total_orphaned
) t;

-- Test 3: Verify public.users still exists (should have 1 record)
SELECT 
    'TEST 3: Public Users Exists' as test_name,
    CASE 
        WHEN COUNT(*) = 1 THEN 'PASS' 
        ELSE 'FAIL' 
    END as result,
    COUNT(*) as user_count
FROM public.users;

-- Test 4: Verify auth.users has 7 records
SELECT 
    'TEST 4: Auth Users Count' as test_name,
    CASE 
        WHEN COUNT(*) = 7 THEN 'PASS' 
        ELSE 'FAIL' 
    END as result,
    COUNT(*) as auth_user_count
FROM auth.users;

-- Test 5: Verify public.profiles has 7 records
SELECT 
    'TEST 5: Profiles Count' as test_name,
    CASE 
        WHEN COUNT(*) = 7 THEN 'PASS' 
        ELSE 'FAIL' 
    END as result,
    COUNT(*) as profile_count
FROM public.profiles;
