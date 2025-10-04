-- Phase 1: Clean up orphaned development records
-- This removes the 8 development case records that reference the placeholder user_id

-- First, let's see what we're deleting (for verification)
SELECT 
    'BEFORE CLEANUP' as status,
    COUNT(*) as case_count,
    user_id,
    MIN(created_at) as earliest_case,
    MAX(created_at) as latest_case
FROM public.cases 
WHERE user_id = '00000000-0000-0000-0000-000000000001'
GROUP BY user_id;

-- Delete the orphaned development cases
DELETE FROM public.cases 
WHERE user_id = '00000000-0000-0000-0000-000000000001';

-- Verify cleanup
SELECT 
    'AFTER CLEANUP' as status,
    COUNT(*) as remaining_orphaned_cases
FROM public.cases 
WHERE user_id = '00000000-0000-0000-0000-000000000001';

-- Check total case count
SELECT 
    'TOTAL CASES' as status,
    COUNT(*) as total_cases
FROM public.cases;
