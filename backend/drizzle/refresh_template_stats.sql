-- Refresh materialized view to update aggregate stats with latest feedback
-- Run this after new feedback is added to update mv_template_stats

REFRESH MATERIALIZED VIEW CONCURRENTLY "mv_template_stats";

-- Check the updated stats
SELECT 
  template_id,
  total_usage,
  unique_users,
  avg_rating,
  rating_count,
  success_count,
  dismissal_count,
  last_used_at
FROM "mv_template_stats"
WHERE rating_count > 0
ORDER BY rating_count DESC;

