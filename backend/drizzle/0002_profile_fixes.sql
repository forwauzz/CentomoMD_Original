-- Profile Fixes Migration
-- Adds RLS policies, default_clinic_id column, and auto-profile creation trigger

-- 1. Add default_clinic_id column to profiles table if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'default_clinic_id'
  ) THEN
    ALTER TABLE profiles
      ADD COLUMN default_clinic_id uuid NULL REFERENCES clinics(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 2. Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS policies for profiles
CREATE POLICY users_can_read_own_profile ON profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY users_can_update_own_profile ON profiles
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY users_can_insert_own_profile ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO profiles (user_id, display_name, locale)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'fr-CA'
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 5. Create trigger to auto-create profile on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
