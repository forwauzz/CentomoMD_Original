-- Test Template Overlay - Quick Verification Queries
-- Run these queries to verify template overlay and tracking are working

-- 1. Check user profiles and consent status
SELECT 
  user_id, 
  email, 
  display_name, 
  consent_analytics,
  locale,
  CASE 
    WHEN consent_analytics = true THEN '✅ Tracking Enabled'
    ELSE '❌ Tracking Disabled'
  END AS tracking_status
FROM profiles 
WHERE email IN (
  'tamonuzziel@gmail.com',
  'uzzielt@techehealthservices.com'
)
ORDER BY email;

-- 2. Check available templates
SELECT 
  id,
  name,
  name_fr,
  type,
  compatible_sections,
  is_active,
  CASE 
    WHEN id = 'section7-rd' THEN '🔬 R&D Template'
    WHEN id = 'section7-ai-formatter' THEN '🔷 Section 7 AI'
    WHEN id = 'section8-ai-formatter' THEN '🔷 Section 8 AI'
    ELSE '📝 Other'
  END AS template_type
FROM template_combinations
WHERE id IN (
  'section7-rd',
  'section7-ai-formatter',
  'section8-ai-formatter',
  'word-for-word-with-ai'
)
AND is_active = true
ORDER BY 
  CASE 
    WHEN id = 'section7-rd' THEN 1
    WHEN id = 'section7-ai-formatter' THEN 2
    WHEN id = 'section8-ai-formatter' THEN 3
    ELSE 4
  END;

-- 3. Check recent usage events (last 10)
SELECT 
  tue.id,
  tue.template_id,
  tue.user_name,
  tue.user_email,
  tue.section_id,
  tue.mode_id,
  tue.applied_at,
  tc.name AS template_name,
  EXTRACT(EPOCH FROM (NOW() - tue.applied_at)) / 60 AS minutes_ago
FROM template_usage_events tue
LEFT JOIN template_combinations tc ON tue.template_id = tc.id
WHERE tue.user_email IN (
  'tamonuzziel@gmail.com',
  'uzzielt@techehealthservices.com'
)
ORDER BY tue.applied_at DESC
LIMIT 10;

-- 4. Check pending feedback queue entries
SELECT 
  q.id,
  q.template_id,
  q.user_id,
  q.scheduled_at,
  q.created_at,
  p.email AS user_email,
  p.display_name AS user_name,
  p.consent_analytics,
  tc.name AS template_name,
  CASE 
    WHEN q.scheduled_at <= NOW() THEN '⏰ DUE NOW'
    WHEN q.scheduled_at <= NOW() + INTERVAL '1 minute' THEN '⏳ Due Soon'
    ELSE '⏸️ Scheduled'
  END AS status,
  EXTRACT(EPOCH FROM (q.scheduled_at - NOW())) / 60 AS minutes_until_due
FROM feedback_prompts_queue q
LEFT JOIN profiles p ON q.user_id = p.user_id
LEFT JOIN template_combinations tc ON q.template_id = tc.id
WHERE p.email IN (
  'tamonuzziel@gmail.com',
  'uzzielt@techehealthservices.com'
)
ORDER BY q.scheduled_at ASC;

-- 5. Check submitted feedback
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
  tc.name AS template_name,
  CASE 
    WHEN tf.rating >= 4 THEN '⭐ Excellent'
    WHEN tf.rating >= 3 THEN '👍 Good'
    WHEN tf.rating >= 2 THEN '👎 Fair'
    WHEN tf.rating >= 1 THEN '❌ Poor'
    ELSE '⏸️ No Rating'
  END AS rating_status
FROM template_feedback tf
LEFT JOIN template_combinations tc ON tf.template_id = tc.id
WHERE tf.user_email IN (
  'tamonuzziel@gmail.com',
  'uzzielt@techehealthservices.com'
)
ORDER BY tf.rated_at DESC;

-- 6. Check template usage statistics
SELECT 
  template_id,
  total_usage,
  unique_users,
  last_used_at,
  ROUND(avg_rating::numeric, 2) AS avg_rating,
  rating_count,
  success_count,
  dismissal_count,
  CASE 
    WHEN template_id = 'section7-rd' THEN '🔬 R&D Pipeline'
    WHEN template_id = 'section7-ai-formatter' THEN '🔷 Section 7 AI'
    WHEN template_id = 'section8-ai-formatter' THEN '🔷 Section 8 AI'
    ELSE '📝 Other'
  END AS template_label
FROM mv_template_stats
WHERE template_id IN (
  'section7-rd',
  'section7-ai-formatter',
  'section8-ai-formatter'
)
ORDER BY total_usage DESC;

-- 7. Check for users without consent (should not be tracked)
SELECT 
  p.user_id,
  p.email,
  p.display_name,
  p.consent_analytics,
  COUNT(tue.id) AS usage_events_count,
  CASE 
    WHEN p.consent_analytics = false AND COUNT(tue.id) > 0 THEN '⚠️ TRACKED BUT NO CONSENT'
    WHEN p.consent_analytics = true AND COUNT(tue.id) = 0 THEN 'ℹ️ NO TRACKING YET'
    WHEN p.consent_analytics = true AND COUNT(tue.id) > 0 THEN '✅ TRACKING CORRECT'
    ELSE '✅ NO TRACKING (NO CONSENT)'
  END AS tracking_status
FROM profiles p
LEFT JOIN template_usage_events tue ON p.user_id = tue.user_id
WHERE p.email IN (
  'tamonuzziel@gmail.com',
  'uzzielt@techehealthservices.com'
)
GROUP BY p.user_id, p.email, p.display_name, p.consent_analytics;

-- 8. Check template application frequency (last 24 hours)
SELECT 
  template_id,
  tc.name AS template_name,
  COUNT(*) AS application_count,
  COUNT(DISTINCT user_id) AS unique_users,
  MIN(applied_at) AS first_use,
  MAX(applied_at) AS last_use
FROM template_usage_events tue
LEFT JOIN template_combinations tc ON tue.template_id = tc.id
WHERE tue.applied_at >= NOW() - INTERVAL '24 hours'
  AND tue.user_email IN (
    'tamonuzziel@gmail.com',
    'uzzielt@techehealthservices.com'
  )
GROUP BY template_id, tc.name
ORDER BY application_count DESC;

