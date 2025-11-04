-- Get Your User ID
-- Run this first to find your user_id before creating test queue entries

-- Option 1: Find by email (replace with your email)
SELECT 
  user_id,
  email,
  display_name,
  consent_analytics
FROM profiles
WHERE email = 'your-email@example.com';  -- REPLACE WITH YOUR EMAIL

-- Option 2: Show all users (find yours)
SELECT 
  user_id,
  email,
  display_name,
  consent_analytics,
  created_at
FROM profiles
ORDER BY created_at DESC;

