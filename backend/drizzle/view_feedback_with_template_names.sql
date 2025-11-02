-- View all feedback with user names and template names
-- This query shows individual feedback records with full context

SELECT 
  tf.id,
  tf.template_id,
  tc.name AS template_name,
  tc.name_en AS template_name_en,
  tf.user_id,
  tf.user_name,
  tf.user_email,
  tf.rating,
  tf.comment,
  tf.tags,
  tf.applied_at,
  tf.rated_at,
  tf.time_to_rate,
  tf.was_dismissed,
  tf.section_id,
  tf.mode_id,
  tf.case_id,
  tf.session_id
FROM "template_feedback" tf
LEFT JOIN "template_combinations" tc ON tf.template_id = tc.id
ORDER BY tf.rated_at DESC;

