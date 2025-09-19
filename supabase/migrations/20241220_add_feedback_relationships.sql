-- Add foreign key relationships to feedback table
-- This connects feedback to users, sessions, and templates for better context

-- Add foreign key columns
ALTER TABLE feedback ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE feedback ADD COLUMN session_id UUID REFERENCES sessions(id) ON DELETE SET NULL;
ALTER TABLE feedback ADD COLUMN template_id UUID REFERENCES templates(id) ON DELETE SET NULL;

-- Add indexes for performance
CREATE INDEX idx_feedback_user_id ON feedback(user_id);
CREATE INDEX idx_feedback_session_id ON feedback(session_id);
CREATE INDEX idx_feedback_template_id ON feedback(template_id);

-- Add comments for documentation
COMMENT ON COLUMN feedback.user_id IS 'User who submitted the feedback (optional)';
COMMENT ON COLUMN feedback.session_id IS 'Session context for the feedback (optional)';
COMMENT ON COLUMN feedback.template_id IS 'Template context for the feedback (optional)';

-- Note: No constraint requiring context fields - allows anonymous feedback
-- In the future, we might want to add a constraint to require at least one context field
