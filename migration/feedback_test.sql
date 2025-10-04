-- Test: Check feedback table after migration
-- This verifies that the new foreign key architecture is working

-- Check if there are any feedback records
SELECT 
    'FEEDBACK TABLE STATUS' as test_name,
    COUNT(*) as total_feedback_records,
    COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as records_with_user_id,
    COUNT(CASE WHEN user_id IS NULL THEN 1 END) as records_without_user_id
FROM public.feedback;

-- Show recent feedback records with user details
SELECT 
    'RECENT FEEDBACK RECORDS' as analysis,
    f.id as feedback_id,
    f.user_id,
    f.content,
    f.rating,
    f.created_at,
    a.email as auth_email,
    p.display_name as profile_display_name
FROM public.feedback f
LEFT JOIN auth.users a ON f.user_id = a.id
LEFT JOIN public.profiles p ON f.user_id = p.user_id
ORDER BY f.created_at DESC
LIMIT 10;

-- Verify foreign key constraint is working
SELECT 
    'FK CONSTRAINT TEST' as test_name,
    CASE 
        WHEN COUNT(*) = 0 THEN 'PASS - No orphaned feedback records' 
        ELSE 'FAIL - Found orphaned feedback records' 
    END as result,
    COUNT(*) as orphaned_count
FROM public.feedback f
LEFT JOIN auth.users a ON f.user_id = a.id
WHERE f.user_id IS NOT NULL AND a.id IS NULL;

-- Check if feedback table has the expected structure
SELECT 
    'FEEDBACK TABLE STRUCTURE' as analysis,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'feedback' 
  AND table_schema = 'public'
ORDER BY ordinal_position;
