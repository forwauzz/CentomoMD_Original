-- Create feedback table for server sync functionality
-- This table stores user feedback with proper user associations and compliance features

-- Create feedback table
CREATE TABLE IF NOT EXISTS public.feedback (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id uuid REFERENCES public.sessions(id) ON DELETE SET NULL,
    
    -- Feedback metadata
    meta jsonb NOT NULL DEFAULT '{}',
    ratings jsonb NOT NULL DEFAULT '{}',
    artifacts jsonb DEFAULT '{}',
    highlights jsonb DEFAULT '[]',
    comment text,
    attachments text[] DEFAULT '{}',
    
    -- Status and lifecycle
    status text DEFAULT 'open' CHECK (status IN ('open', 'triaged', 'resolved')),
    ttl_days integer DEFAULT 30,
    
    -- Timestamps
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS feedback_user_id_idx ON public.feedback (user_id);
CREATE INDEX IF NOT EXISTS feedback_session_id_idx ON public.feedback (session_id);
CREATE INDEX IF NOT EXISTS feedback_status_idx ON public.feedback (status);
CREATE INDEX IF NOT EXISTS feedback_created_at_idx ON public.feedback (created_at);

-- Add composite index for user queries
CREATE INDEX IF NOT EXISTS feedback_user_status_created_idx ON public.feedback (user_id, status, created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies for multi-tenant access
-- Users can only see their own feedback
CREATE POLICY "users_can_view_own_feedback" ON public.feedback
    FOR SELECT USING (user_id = auth.uid());

-- Users can insert their own feedback
CREATE POLICY "users_can_insert_own_feedback" ON public.feedback
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own feedback
CREATE POLICY "users_can_update_own_feedback" ON public.feedback
    FOR UPDATE USING (user_id = auth.uid());

-- Users can delete their own feedback
CREATE POLICY "users_can_delete_own_feedback" ON public.feedback
    FOR DELETE USING (user_id = auth.uid());

-- Clinic admins can view feedback from their clinic members
-- (This will be enabled when authentication is implemented)
-- CREATE POLICY "clinic_admins_can_view_clinic_feedback" ON public.feedback
--     FOR SELECT USING (
--         EXISTS (
--             SELECT 1 FROM public.sessions s
--             JOIN public.memberships m ON m.user_id = auth.uid()
--             WHERE s.id = feedback.session_id
--               AND s.clinic_id = m.clinic_id
--               AND m.role IN ('admin', 'owner')
--               AND m.active = true
--         )
--     );

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_feedback_updated_at 
    BEFORE UPDATE ON public.feedback 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add TTL cleanup function (for compliance)
CREATE OR REPLACE FUNCTION cleanup_expired_feedback()
RETURNS void AS $$
BEGIN
    DELETE FROM public.feedback 
    WHERE created_at < (now() - INTERVAL '1 day' * ttl_days);
END;
$$ language 'plpgsql';

-- Create a scheduled job to run cleanup (commented out - requires pg_cron extension)
-- SELECT cron.schedule('cleanup-feedback', '0 2 * * *', 'SELECT cleanup_expired_feedback();');

-- Add comments for documentation
COMMENT ON TABLE public.feedback IS 'User feedback with server sync capability and compliance features';
COMMENT ON COLUMN public.feedback.user_id IS 'References auth.users.id - the user who submitted feedback';
COMMENT ON COLUMN public.feedback.session_id IS 'Optional reference to the session this feedback relates to';
COMMENT ON COLUMN public.feedback.meta IS 'Feedback metadata (language, mode, browser info, etc.)';
COMMENT ON COLUMN public.feedback.ratings IS 'User ratings for different aspects (dictation, transcription, etc.)';
COMMENT ON COLUMN public.feedback.artifacts IS 'Related artifacts (raw text, files, etc.)';
COMMENT ON COLUMN public.feedback.highlights IS 'Text highlights and annotations';
COMMENT ON COLUMN public.feedback.attachments IS 'Array of file attachment keys';
COMMENT ON COLUMN public.feedback.status IS 'Feedback status: open, triaged, resolved';
COMMENT ON COLUMN public.feedback.ttl_days IS 'Time to live in days for compliance (default 30)';
