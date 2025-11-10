-- Test Script for Feedback Queue Worker
-- Run these queries to test the feedback queue system

-- Step 1: Get your user_id
SELECT 
  user_id,
  email,
  display_name,
  consent_analytics
FROM profiles
ORDER BY created_at DESC;

-- Step 2: Check current queue entries
SELECT 
  id,
  template_id,
  user_id,
  session_id,
  scheduled_at,
  created_at,
  NOW() as current_time,
  CASE 
    WHEN scheduled_at <= NOW() THEN 'DUE'
    ELSE 'PENDING'
  END as status
FROM feedback_prompts_queue
ORDER BY scheduled_at DESC;

-- Step 3: Create a test queue entry (due NOW - shows immediately)
-- REPLACE 'YOUR_USER_ID_HERE' with your actual user_id from Step 1
INSERT INTO feedback_prompts_queue (
  template_id,
  user_id,
  session_id,
  scheduled_at,
  created_at
) VALUES (
  'section7-ai-formatter',  -- Replace with any template_id from template_combinations
  'YOUR_USER_ID_HERE',       -- REPLACE THIS with your user_id
  NULL,                       -- Or a session_id if you have one
  NOW() - INTERVAL '1 minute',  -- Already due (in the past)
  NOW()
) RETURNING *;

-- Step 4: Verify the entry is due
SELECT 
  id,
  template_id,
  user_id,
  scheduled_at <= NOW() as is_due
FROM feedback_prompts_queue
WHERE template_id = 'section7-ai-formatter'
  AND user_id = 'YOUR_USER_ID_HERE';  -- REPLACE THIS

-- Step 5: Check available templates
SELECT id, name, name_en, is_active
FROM template_combinations
WHERE is_active = true
ORDER BY name_en;

-- Step 6: Cleanup test entry (after testing)
DELETE FROM feedback_prompts_queue
WHERE template_id = 'section7-ai-formatter'
  AND user_id = 'YOUR_USER_ID_HERE'  -- REPLACE THIS
  AND scheduled_at <= NOW();

