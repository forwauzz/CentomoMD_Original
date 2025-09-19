-- Add feedback table for development feedback collection
-- This is a simple table to store feedback items with configurable TTL

CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content JSONB NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  ttl_days INTEGER NOT NULL DEFAULT 30
);

-- Add constraints for data integrity
ALTER TABLE feedback ADD CONSTRAINT feedback_content_size CHECK (octet_length(content::text) < 10240); -- 10KB limit
ALTER TABLE feedback ADD CONSTRAINT feedback_ttl_range CHECK (ttl_days BETWEEN 1 AND 365);
ALTER TABLE feedback ADD CONSTRAINT feedback_content_not_empty CHECK (content IS NOT NULL AND content != '{}'::jsonb);

-- Add indexes for performance
CREATE INDEX idx_feedback_created_at ON feedback(created_at);
CREATE INDEX idx_feedback_ttl_days ON feedback(ttl_days);
CREATE INDEX idx_feedback_content_gin ON feedback USING GIN (content); -- For JSONB queries

-- Add comment for documentation
COMMENT ON TABLE feedback IS 'Development feedback collection - stores feedback items with configurable TTL';
COMMENT ON COLUMN feedback.content IS 'Full FeedbackItem JSON from frontend (max 10KB)';
COMMENT ON COLUMN feedback.ttl_days IS 'Time to live in days (1-365, default 30)';
COMMENT ON COLUMN feedback.created_at IS 'Timestamp when feedback was created';
