-- Row Level Security (RLS) Policies for CentomoMD
-- This file contains the RLS policies that should be applied after running migrations

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_command_mappings ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only access their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Memberships: users can view their own memberships
CREATE POLICY "Users can view own memberships" ON memberships
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own memberships" ON memberships
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own memberships" ON memberships
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Sessions: users can access sessions where they have clinic membership
CREATE POLICY "Users can access clinic sessions" ON sessions
  FOR ALL USING (
    sessions.user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM memberships 
      WHERE memberships.user_id = auth.uid() 
      AND memberships.clinic_id = sessions.clinic_id 
      AND memberships.active = true
    )
  );

-- Transcripts: users can access transcripts for sessions they have access to
CREATE POLICY "Users can access session transcripts" ON transcripts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM sessions 
      JOIN memberships ON memberships.clinic_id = sessions.clinic_id
      WHERE sessions.id = transcripts.session_id 
      AND memberships.user_id = auth.uid() 
      AND memberships.active = true
    )
  );

-- Templates: users can access templates if they have clinic membership
CREATE POLICY "Users can access clinic templates" ON templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM memberships 
      WHERE memberships.user_id = auth.uid() 
      AND memberships.active = true
    )
  );

-- Audit logs: users can view audit logs for their own actions or clinic actions
CREATE POLICY "Users can view relevant audit logs" ON audit_logs
  FOR SELECT USING (
    audit_logs.user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM memberships 
      WHERE memberships.user_id = auth.uid() 
      AND memberships.clinic_id = audit_logs.clinic_id 
      AND memberships.active = true
    )
  );

-- Export history: users can access their own exports or clinic exports
CREATE POLICY "Users can access relevant exports" ON export_history
  FOR ALL USING (
    export_history.user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM sessions 
      JOIN memberships ON memberships.clinic_id = sessions.clinic_id
      WHERE sessions.id = export_history.session_id 
      AND memberships.user_id = auth.uid() 
      AND memberships.active = true
    )
  );

-- Voice command mappings: users can access if they have template access
CREATE POLICY "Users can access voice commands" ON voice_command_mappings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM templates 
      JOIN memberships ON memberships.user_id = auth.uid()
      WHERE templates.id = voice_command_mappings.template_id 
      AND memberships.active = true
    )
  );

-- Note: These policies assume that:
-- 1. auth.uid() returns the current user's UUID from Supabase Auth
-- 2. The sessions table has a clinic_id column (may need to be added)
-- 3. The audit_logs table has a clinic_id column (may need to be added)
-- 4. All tables are in the public schema
