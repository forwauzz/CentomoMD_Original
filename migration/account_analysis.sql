-- Analysis: What happens to existing accounts during migration
-- Let's check the current state of all user accounts

-- Check auth.users (the source of truth for authentication)
SELECT 
    'AUTH.USERS' as table_name,
    COUNT(*) as total_users,
    COUNT(CASE WHEN email IS NOT NULL THEN 1 END) as users_with_email,
    COUNT(CASE WHEN raw_user_meta_data IS NOT NULL THEN 1 END) as users_with_metadata
FROM auth.users;

-- Check public.profiles (application user data)
SELECT 
    'PUBLIC.PROFILES' as table_name,
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN display_name IS NOT NULL THEN 1 END) as profiles_with_display_name,
    COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as profiles_with_user_id
FROM public.profiles;

-- Check public.users (legacy table - what we're removing)
SELECT 
    'PUBLIC.USERS (LEGACY)' as table_name,
    COUNT(*) as total_users,
    COUNT(CASE WHEN email IS NOT NULL THEN 1 END) as users_with_email,
    COUNT(CASE WHEN name IS NOT NULL THEN 1 END) as users_with_name
FROM public.users;

-- Cross-reference: Which auth.users have profiles?
SELECT 
    'AUTH USERS WITH PROFILES' as analysis,
    COUNT(*) as count
FROM auth.users a
JOIN public.profiles p ON a.id = p.user_id;

-- Cross-reference: Which auth.users DON'T have profiles?
SELECT 
    'AUTH USERS WITHOUT PROFILES' as analysis,
    COUNT(*) as count
FROM auth.users a
LEFT JOIN public.profiles p ON a.id = p.user_id
WHERE p.user_id IS NULL;

-- Cross-reference: Which profiles DON'T have auth.users?
SELECT 
    'PROFILES WITHOUT AUTH USERS' as analysis,
    COUNT(*) as count
FROM public.profiles p
LEFT JOIN auth.users a ON p.user_id = a.id
WHERE a.id IS NULL;

-- Show specific user details
SELECT 
    'USER DETAILS' as analysis,
    a.id as auth_user_id,
    a.email as auth_email,
    a.raw_user_meta_data->>'name' as auth_name,
    p.user_id as profile_user_id,
    p.display_name as profile_display_name,
    u.id as legacy_user_id,
    u.email as legacy_email,
    u.name as legacy_name
FROM auth.users a
LEFT JOIN public.profiles p ON a.id = p.user_id
LEFT JOIN public.users u ON a.email = u.email
ORDER BY a.created_at;
