-- Complete Test Script for Feedback Queue
-- Run these queries in order

-- ============================================
-- STEP 1: Get Your User ID
-- ============================================
-- Replace 'your-email@example.com' with your actual email
SELECT 
  user_id,
  email,
  display_name,
  consent_analytics
FROM profiles
WHERE email = 'your-email@example.com';  -- ⚠️ REPLACE THIS

-- Copy the user_id from above result
-- ============================================

-- ============================================
-- STEP 2: Get Available Templates
-- ============================================
SELECT id, name_en, name_fr, is_active
FROM template_combinations
WHERE is_active = true
ORDER BY name_en
LIMIT 10;

-- Pick a template_id from above
-- ============================================

-- ============================================
-- STEP 3: Create Test Queue Entry
-- ============================================
-- ⚠️ REPLACE THESE VALUES:
--   - 'YOUR_USER_ID_HERE' with user_id from Step 1
--   - 'section7-ai-formatter' with template_id from Step 2
-- ============================================

INSERT INTO feedback_prompts_queue (
  template_id,
  user_id,
  session_id,
  scheduled_at,
  created_at
) VALUES (
  'section7-ai-formatter',  -- ⚠️ Change to template_id from Step 2
  'YOUR_USER_ID_HERE'::uuid,  -- ⚠️ REPLACE with user_id from Step 1 (must be UUID format)
  NULL,
  NOW() - INTERVAL '1 minute',  -- Already due (in the past)
  NOW()
) RETURNING *;

-- ============================================
-- STEP 4: Verify Queue Entry
-- ============================================
-- Replace 'YOUR_USER_ID_HERE' with your user_id
SELECT 
  id,
  template_id,
  user_id,
  session_id,
  scheduled_at,
  created_at,
  NOW() as current_time,
  CASE 
    WHEN scheduled_at <= NOW() THEN '✅ DUE'
    ELSE '⏳ PENDING'
  END as status
FROM feedback_prompts_queue
WHERE user_id = 'YOUR_USER_ID_HERE'::uuid  -- ⚠️ REPLACE THIS
ORDER BY scheduled_at DESC;

-- ============================================
-- STEP 5: Cleanup (after testing)
-- ============================================
-- Uncomment and run after testing:
/*
DELETE FROM feedback_prompts_queue
WHERE user_id = 'YOUR_USER_ID_HERE'::uuid  -- ⚠️ REPLACE THIS
  AND scheduled_at <= NOW();
*/

