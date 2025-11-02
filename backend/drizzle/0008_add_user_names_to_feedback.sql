-- Add user names to template feedback for easier identification
-- This adds denormalized user_name column and creates a view with full user details

-- Add user_name column to template_feedback (denormalized for easy viewing)
ALTER TABLE "template_feedback" ADD COLUMN IF NOT EXISTS "user_name" varchar(255);
ALTER TABLE "template_feedback" ADD COLUMN IF NOT EXISTS "user_email" varchar(255);

-- Backfill existing records with user names from profiles
UPDATE "template_feedback" tf
SET 
  "user_name" = COALESCE(p.display_name, p.email, 'Unknown User'),
  "user_email" = p.email
FROM "profiles" p
WHERE tf.user_id = p.user_id
  AND (tf.user_name IS NULL OR tf.user_email IS NULL);

-- Create trigger to automatically update user_name and user_email on insert
CREATE OR REPLACE FUNCTION update_template_feedback_user_info()
RETURNS TRIGGER AS $$
BEGIN
  -- Get user name and email from profiles
  SELECT 
    COALESCE(display_name, email, 'Unknown User'),
    email
  INTO NEW.user_name, NEW.user_email
  FROM profiles
  WHERE user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for inserts
DROP TRIGGER IF EXISTS trg_template_feedback_user_info ON "template_feedback";
CREATE TRIGGER trg_template_feedback_user_info
  BEFORE INSERT ON "template_feedback"
  FOR EACH ROW
  EXECUTE FUNCTION update_template_feedback_user_info();

-- Create a view that shows feedback with full user details (for admin queries)
CREATE OR REPLACE VIEW "v_template_feedback_with_users" AS
SELECT 
  tf.id,
  tf.template_id,
  tf.user_id,
  tf.user_name,
  tf.user_email,
  p.display_name AS profile_display_name,
  p.email AS profile_email,
  tf.session_id,
  tf.case_id,
  tf.section_id,
  tf.mode_id,
  tf.transcript_id,
  tf.rating,
  tf.comment,
  tf.tags,
  tf.applied_at,
  tf.rated_at,
  tf.time_to_rate,
  tf.was_dismissed,
  tf.interaction_time,
  tc.name AS template_name,
  tc.name_fr AS template_name_fr,
  tc.name_en AS template_name_en
FROM "template_feedback" tf
LEFT JOIN "profiles" p ON tf.user_id = p.user_id
LEFT JOIN "template_combinations" tc ON tf.template_id = tc.id
ORDER BY tf.rated_at DESC;

-- Add user_name and user_email to template_usage_events for consistency
ALTER TABLE "template_usage_events" ADD COLUMN IF NOT EXISTS "user_name" varchar(255);
ALTER TABLE "template_usage_events" ADD COLUMN IF NOT EXISTS "user_email" varchar(255);

-- Backfill template_usage_events
UPDATE "template_usage_events" tue
SET 
  "user_name" = COALESCE(p.display_name, p.email, 'Unknown User'),
  "user_email" = p.email
FROM "profiles" p
WHERE tue.user_id = p.user_id
  AND (tue.user_name IS NULL OR tue.user_email IS NULL);

-- Create trigger for template_usage_events
CREATE OR REPLACE FUNCTION update_template_usage_events_user_info()
RETURNS TRIGGER AS $$
BEGIN
  SELECT 
    COALESCE(display_name, email, 'Unknown User'),
    email
  INTO NEW.user_name, NEW.user_email
  FROM profiles
  WHERE user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_template_usage_events_user_info ON "template_usage_events";
CREATE TRIGGER trg_template_usage_events_user_info
  BEFORE INSERT ON "template_usage_events"
  FOR EACH ROW
  EXECUTE FUNCTION update_template_usage_events_user_info();

-- Create a view for template_usage_events with user details
CREATE OR REPLACE VIEW "v_template_usage_events_with_users" AS
SELECT 
  tue.id,
  tue.template_id,
  tue.user_id,
  tue.user_name,
  tue.user_email,
  p.display_name AS profile_display_name,
  p.email AS profile_email,
  tue.case_id,
  tue.session_id,
  tue.section_id,
  tue.mode_id,
  tue.applied_at,
  tc.name AS template_name,
  tc.name_fr AS template_name_fr,
  tc.name_en AS template_name_en
FROM "template_usage_events" tue
LEFT JOIN "profiles" p ON tue.user_id = p.user_id
LEFT JOIN "template_combinations" tc ON tue.template_id = tc.id
ORDER BY tue.applied_at DESC;

