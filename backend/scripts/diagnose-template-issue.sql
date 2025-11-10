-- Diagnostic Queries for Template Issue
-- Problem: Section 7 templates work for tamonuzziel@gmail.com but NOT for uzzielt@techehealthservices.com

-- 1. Check user profiles (locale, language preferences)
SELECT 
  user_id, 
  email, 
  display_name, 
  locale,
  consent_analytics,
  created_at
FROM profiles 
WHERE email IN (
  'tamonuzziel@gmail.com',
  'uzzielt@techehealthservices.com'
)
ORDER BY email;

-- 2. Check ALL Section 7 templates in database
SELECT 
  id,
  name,
  name_fr,
  name_en,
  type,
  compatible_sections,
  compatible_modes,
  language,
  is_active,
  is_default,
  created_at,
  updated_at
FROM template_combinations
WHERE 
  id IN ('section7-rd', 'section7-ai-formatter')
  OR compatible_sections @> '["section_7"]'::jsonb
ORDER BY id;

-- 3. Check template usage events for both users (Section 7 templates only)
SELECT 
  tue.id,
  tue.template_id,
  tue.user_name,
  tue.user_email,
  tue.section_id,
  tue.mode_id,
  tue.applied_at,
  tc.name AS template_name,
  tc.is_active AS template_is_active,
  tc.language AS template_language
FROM template_usage_events tue
LEFT JOIN template_combinations tc ON tue.template_id = tc.id
WHERE tue.user_email IN (
  'tamonuzziel@gmail.com',
  'uzzielt@techehealthservices.com'
)
AND tue.template_id IN ('section7-rd', 'section7-ai-formatter')
ORDER BY tue.applied_at DESC;

-- 4. Check which Section 7 templates are active in database
SELECT 
  id,
  name,
  is_active,
  language,
  compatible_sections,
  compatible_modes,
  CASE 
    WHEN is_active = true THEN '✅ ACTIVE'
    ELSE '❌ INACTIVE'
  END AS status
FROM template_combinations
WHERE id IN ('section7-rd', 'section7-ai-formatter')
ORDER BY id;

-- 5. Check if there are any errors in feedback queue for Section 7 templates
SELECT 
  q.id,
  q.template_id,
  q.user_id,
  q.scheduled_at,
  p.email AS user_email,
  p.display_name AS user_name,
  p.locale AS user_locale,
  tc.name AS template_name,
  tc.is_active AS template_is_active,
  tc.language AS template_language,
  CASE 
    WHEN q.scheduled_at <= NOW() THEN '⏰ DUE NOW'
    ELSE '⏸️ Scheduled'
  END AS status
FROM feedback_prompts_queue q
LEFT JOIN profiles p ON q.user_id = p.user_id
LEFT JOIN template_combinations tc ON q.template_id = tc.id
WHERE p.email IN (
  'tamonuzziel@gmail.com',
  'uzzielt@techehealthservices.com'
)
AND q.template_id IN ('section7-rd', 'section7-ai-formatter')
ORDER BY q.scheduled_at DESC;

-- 6. Check template compatibility with user locale
-- This will show if language filtering might be excluding templates
SELECT 
  p.email,
  p.locale,
  tc.id AS template_id,
  tc.name AS template_name,
  tc.language AS template_language,
  tc.is_active AS template_is_active,
  CASE 
    WHEN tc.language = 'both' THEN '✅ Compatible (both)'
    WHEN tc.language = 'fr' AND p.locale = 'fr-CA' THEN '✅ Compatible (fr)'
    WHEN tc.language = 'en' AND p.locale = 'en-CA' THEN '✅ Compatible (en)'
    WHEN tc.language = 'both' THEN '✅ Compatible (both)'
    ELSE '❌ NOT Compatible'
  END AS compatibility_status
FROM profiles p
CROSS JOIN template_combinations tc
WHERE p.email IN (
  'tamonuzziel@gmail.com',
  'uzzielt@techehealthservices.com'
)
AND tc.id IN ('section7-rd', 'section7-ai-formatter')
ORDER BY p.email, tc.id;

-- 7. Check if templates exist in static config (fallback check)
-- This will help determine if the issue is with API vs static config

