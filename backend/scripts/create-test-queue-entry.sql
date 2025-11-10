-- Create Test Queue Entry
-- Step 1: Get your user_id first (run get-my-user-id.sql)
-- Step 2: Replace YOUR_USER_ID_HERE below with your actual user_id

-- First, check available templates:
SELECT id, name_en, is_active
FROM template_combinations
WHERE is_active = true
LIMIT 10;

-- Then create test queue entry (REPLACE YOUR_USER_ID_HERE with your actual user_id):
INSERT INTO feedback_prompts_queue (
  template_id,
  user_id,
  session_id,
  scheduled_at,
  created_at
) VALUES (
  'section7-ai-formatter',  -- Change to any template_id from above
  'PASTE_YOUR_USER_ID_HERE'::uuid,  -- REPLACE THIS - must be a valid UUID
  NULL,
  NOW() - INTERVAL '1 minute',  -- Already due (in the past)
  NOW()
) RETURNING *;

-- Verify it was created and is due:
SELECT 
  id,
  template_id,
  user_id,
  scheduled_at,
  NOW() as current_time,
  scheduled_at <= NOW() as is_due
FROM feedback_prompts_queue
WHERE user_id = 'PASTE_YOUR_USER_ID_HERE'::uuid  -- REPLACE THIS
ORDER BY scheduled_at DESC;

