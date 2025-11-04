-- Diagnostic queries to check feedback data

-- 1. Check if feedback exists in base table
SELECT COUNT(*) as feedback_count 
FROM "template_feedback";

-- 2. Check individual feedback records (with user details via JOIN)
SELECT 
  tf.id,
  tf.template_id,
  tf.user_id,
  COALESCE(p.display_name, p.email, 'Unknown User') AS user_name,
  p.email AS user_email,
  tf.rating,
  tf.comment,
  tf.applied_at,
  tf.rated_at,
  tc.name AS template_name
FROM "template_feedback" tf
LEFT JOIN "profiles" p ON tf.user_id = p.user_id
LEFT JOIN "template_combinations" tc ON tf.template_id = tc.id
ORDER BY tf.rated_at DESC;

-- 3. Check if v_template_feedback_with_users view exists
SELECT EXISTS (
  SELECT 1 
  FROM information_schema.views 
  WHERE table_schema = 'public' 
  AND table_name = 'v_template_feedback_with_users'
) AS view_exists;

-- 4. If view exists, check feedback in view
SELECT * FROM "v_template_feedback_with_users"
ORDER BY rated_at DESC
LIMIT 10;

-- 5. Check materialized view (aggregates only - not individual records)
SELECT * FROM "mv_template_stats"
ORDER BY rating_count DESC;

-- 6. Refresh materialized view to update aggregates with latest feedback
REFRESH MATERIALIZED VIEW CONCURRENTLY "mv_template_stats";

-- 7. After refresh, check stats again
SELECT * FROM "mv_template_stats"
WHERE rating_count > 0
ORDER BY rating_count DESC;

