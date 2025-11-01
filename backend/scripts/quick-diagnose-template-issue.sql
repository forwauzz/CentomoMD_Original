-- Quick Diagnostic Query for Template User Differences
-- Run this to quickly identify the root cause

-- 1. Check user profiles (locale, consent)
SELECT 
  email,
  display_name,
  locale,
  consent_analytics,
  CASE 
    WHEN locale IS NULL THEN '⚠️ NULL'
    WHEN locale = 'fr-CA' THEN '🇫🇷 French'
    WHEN locale = 'en-CA' THEN '🇬🇧 English (CA)'
    WHEN locale = 'en-US' THEN '🇺🇸 English (US)'
    ELSE '❓ Unknown: ' || locale
  END AS locale_status
FROM profiles 
WHERE email IN (
  'tamonuzziel@gmail.com',
  'uzzielt@techehealthservices.com'
)
ORDER BY email;

-- 2. Check Section 7 template settings
SELECT 
  id,
  name,
  language,
  is_active,
  compatible_sections,
  compatible_modes,
  CASE 
    WHEN language = 'both' THEN '✅ Works for all locales'
    WHEN language = 'fr' THEN '🇫🇷 French only'
    WHEN language = 'en' THEN '🇬🇧 English only'
    ELSE '❓ Unknown: ' || language
  END AS language_status,
  CASE 
    WHEN is_active = true THEN '✅ Active'
    ELSE '❌ Inactive'
  END AS active_status
FROM template_combinations
WHERE id IN ('section7-rd', 'section7-ai-formatter')
ORDER BY id;

-- 3. Check compatibility between users and templates
SELECT 
  p.email,
  p.locale,
  tc.id AS template_id,
  tc.name AS template_name,
  tc.language AS template_language,
  tc.is_active AS template_active,
  CASE 
    WHEN tc.language = 'both' THEN '✅ Compatible'
    WHEN tc.language = 'fr' AND p.locale = 'fr-CA' THEN '✅ Compatible'
    WHEN tc.language = 'en' AND p.locale IN ('en-CA', 'en-US') THEN '✅ Compatible'
    ELSE '❌ NOT Compatible - Template language (' || tc.language || ') does not match user locale (' || p.locale || ')'
  END AS compatibility_status
FROM profiles p
CROSS JOIN template_combinations tc
WHERE p.email IN (
  'tamonuzziel@gmail.com',
  'uzzielt@techehealthservices.com'
)
AND tc.id IN ('section7-rd', 'section7-ai-formatter')
ORDER BY p.email, tc.id;

-- 4. Summary: Check if language filtering is the issue
SELECT 
  p.email,
  COUNT(DISTINCT tc.id) AS total_templates,
  COUNT(DISTINCT CASE 
    WHEN tc.language = 'both' 
      OR (tc.language = 'fr' AND p.locale = 'fr-CA')
      OR (tc.language = 'en' AND p.locale IN ('en-CA', 'en-US'))
    THEN tc.id
  END) AS compatible_templates,
  COUNT(DISTINCT CASE 
    WHEN NOT (tc.language = 'both' 
      OR (tc.language = 'fr' AND p.locale = 'fr-CA')
      OR (tc.language = 'en' AND p.locale IN ('en-CA', 'en-US')))
    THEN tc.id
  END) AS incompatible_templates,
  CASE 
    WHEN COUNT(DISTINCT CASE 
      WHEN NOT (tc.language = 'both' 
        OR (tc.language = 'fr' AND p.locale = 'fr-CA')
        OR (tc.language = 'en' AND p.locale IN ('en-CA', 'en-US')))
      THEN tc.id
    END) > 0 THEN '⚠️ LANGUAGE FILTERING ISSUE DETECTED'
    ELSE '✅ All templates compatible'
  END AS diagnosis
FROM profiles p
CROSS JOIN template_combinations tc
WHERE p.email IN (
  'tamonuzziel@gmail.com',
  'uzzielt@techehealthservices.com'
)
AND tc.id IN ('section7-rd', 'section7-ai-formatter')
AND tc.is_active = true
GROUP BY p.email, p.locale
ORDER BY p.email;

