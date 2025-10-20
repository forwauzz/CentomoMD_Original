-- Read-only SQL to understand Supabase database structure
-- This query shows table relationships and foreign key constraints

-- 1. Check all tables in the public schema
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 2. Check foreign key relationships for sessions and cases tables
SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name IN ('sessions', 'cases', 'profiles')
ORDER BY tc.table_name, kcu.column_name;

-- 3. Check the structure of key tables
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name IN ('sessions', 'cases', 'profiles', 'users')
ORDER BY table_name, ordinal_position;

-- 4. Check if there are any records in users table
SELECT COUNT(*) as user_count FROM users;

-- 5. Check profiles table structure and sample data
SELECT 
    user_id,
    display_name,
    locale,
    created_at
FROM profiles 
LIMIT 5;

-- 6. Check current foreign key constraints on sessions table
SELECT 
    conname as constraint_name,
    conrelid::regclass as table_name,
    confrelid::regclass as referenced_table,
    a.attname as column_name,
    af.attname as referenced_column
FROM pg_constraint c
JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
JOIN pg_attribute af ON af.attnum = ANY(c.confkey) AND af.attrelid = c.confrelid
WHERE c.contype = 'f' 
    AND conrelid::regclass::text IN ('sessions', 'cases')
ORDER BY conrelid::regclass, a.attname;
