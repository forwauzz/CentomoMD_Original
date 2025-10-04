-- Phase 3 Test: Verify all foreign keys point to auth.users
-- Run this after executing phase3_migrate_fks.sql

-- Test 1: Verify all new FK constraints exist
SELECT 
    'TEST 1: All FK Constraints Exist' as test_name,
    CASE 
        WHEN COUNT(*) = 5 THEN 'PASS' 
        ELSE 'FAIL' 
    END as result,
    COUNT(*) as constraint_count
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

-- Test 2: Verify no old FK constraints remain
SELECT 
    'TEST 2: No Old FK Constraints' as test_name,
    CASE 
        WHEN COUNT(*) = 0 THEN 'PASS' 
        ELSE 'FAIL' 
    END as result,
    COUNT(*) as old_constraint_count
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

-- Test 3: Validate all new constraints
ALTER TABLE public.sessions VALIDATE CONSTRAINT sessions_user_id_auth_users_fk;
ALTER TABLE public.cases VALIDATE CONSTRAINT cases_user_id_auth_users_fk;
ALTER TABLE public.audit_logs VALIDATE CONSTRAINT audit_logs_user_id_auth_users_fk;
ALTER TABLE public.export_history VALIDATE CONSTRAINT export_history_user_id_auth_users_fk;
ALTER TABLE public.feedback VALIDATE CONSTRAINT feedback_user_id_auth_users_fk;

-- Test 4: Verify all constraints are valid
SELECT 
    'TEST 4: All Constraints Valid' as test_name,
    CASE 
        WHEN COUNT(*) = 5 THEN 'PASS' 
        ELSE 'FAIL' 
    END as result,
    COUNT(*) as valid_constraint_count
FROM pg_constraint 
WHERE conname IN (
    'sessions_user_id_auth_users_fk',
    'cases_user_id_auth_users_fk',
    'audit_logs_user_id_auth_users_fk',
    'export_history_user_id_auth_users_fk',
    'feedback_user_id_auth_users_fk'
) AND convalidated = true;

-- Test 5: Verify data integrity - no orphaned records
SELECT 
    'TEST 5: No Orphaned Records' as test_name,
    CASE 
        WHEN total_orphaned = 0 THEN 'PASS' 
        ELSE 'FAIL' 
    END as result,
    total_orphaned
FROM (
    SELECT 
        (SELECT COUNT(*) FROM public.sessions s LEFT JOIN auth.users a ON s.user_id = a.id WHERE s.user_id IS NOT NULL AND a.id IS NULL) +
        (SELECT COUNT(*) FROM public.cases c LEFT JOIN auth.users a ON c.user_id = a.id WHERE c.user_id IS NOT NULL AND a.id IS NULL) +
        (SELECT COUNT(*) FROM public.audit_logs al LEFT JOIN auth.users a ON al.user_id = a.id WHERE al.user_id IS NOT NULL AND a.id IS NULL) +
        (SELECT COUNT(*) FROM public.export_history eh LEFT JOIN auth.users a ON eh.user_id = a.id WHERE eh.user_id IS NOT NULL AND a.id IS NULL) +
        (SELECT COUNT(*) FROM public.feedback f LEFT JOIN auth.users a ON f.user_id = a.id WHERE f.user_id IS NOT NULL AND a.id IS NULL)
    as total_orphaned
) t;

-- Test 6: Verify public.users still exists (for Phase 4)
SELECT 
    'TEST 6: Public Users Still Exists' as test_name,
    CASE 
        WHEN COUNT(*) = 1 THEN 'PASS' 
        ELSE 'FAIL' 
    END as result,
    COUNT(*) as user_count
FROM public.users;
