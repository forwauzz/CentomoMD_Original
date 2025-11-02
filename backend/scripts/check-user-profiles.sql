-- Check User Profiles for Testing
-- Run this to verify user consent status and profile information

-- Check profiles for identified test users
SELECT 
  user_id, 
  email, 
  display_name, 
  consent_analytics,
  locale,
  created_at,
  updated_at
FROM profiles 
WHERE email IN (
  'tamonuzziel@gmail.com',
  'uzzielt@techehealthservices.com'
)
ORDER BY email;

-- Check template availability
SELECT 
  id,
  name,
  name_fr,
  type,
  compatible_sections,
  is_active,
  is_default,
  created_at
FROM template_combinations
WHERE id IN (
  'section7-rd',
  'section7-ai-formatter',
  'section8-ai-formatter',
  'word-for-word-with-ai',
  'section7-clinical-extraction'
)
ORDER BY name;

-- Check recent usage events for test users
SELECT 
  tue.id,
  tue.template_id,
  tue.user_name,
  tue.user_email,
  tue.section_id,
  tue.mode_id,
  tue.applied_at,
  tc.name AS template_name
FROM template_usage_events tue
LEFT JOIN template_combinations tc ON tue.template_id = tc.id
WHERE tue.user_email IN (
  'tamonuzziel@gmail.com',
  'uzzielt@techehealthservices.com'
)
ORDER BY tue.applied_at DESC
LIMIT 20;

-- Check feedback queue
SELECT 
  q.id,
  q.template_id,
  q.user_id,
  q.scheduled_at,
  q.created_at,
  p.email AS user_email,
  p.display_name AS user_name,
  tc.name AS template_name
FROM feedback_prompts_queue q
LEFT JOIN profiles p ON q.user_id = p.user_id
LEFT JOIN template_combinations tc ON q.template_id = tc.id
WHERE p.email IN (
  'tamonuzziel@gmail.com',
  'uzzielt@techehealthservices.com'
)
ORDER BY q.scheduled_at DESC;

-- Check submitted feedback
SELECT 
  tf.id,
  tf.template_id,
  tf.user_name,
  tf.user_email,
  tf.rating,
  tf.comment,
  tf.applied_at,
  tf.rated_at,
  tf.time_to_rate,
  tf.was_dismissed,
  tc.name AS template_name
FROM template_feedback tf
LEFT JOIN template_combinations tc ON tf.template_id = tc.id
WHERE tf.user_email IN (
  'tamonuzziel@gmail.com',
  'uzzielt@techehealthservices.com'
)
ORDER BY tf.rated_at DESC;

-- Check template stats
SELECT 
  template_id,
  total_usage,
  unique_users,
  last_used_at,
  avg_rating,
  rating_count,
  success_count,
  dismissal_count
FROM mv_template_stats
WHERE template_id IN (
  'section7-rd',
  'section7-ai-formatter',
  'section8-ai-formatter'
)
ORDER BY total_usage DESC;

