BEGIN;

-- Prereqs
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- gen_random_uuid()

-- ////////////////////////////////////////////////////////////////////
-- A) Assert profiles(user_id) exists and is PK (no-op if already correct)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='profiles'
  ) THEN
    RAISE EXCEPTION 'profiles table missing. Create it before applying this migration.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='profiles' AND column_name='user_id'
  ) THEN
    RAISE EXCEPTION 'profiles.user_id missing. Create it (uuid PK) before applying this migration.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_name='profiles'
      AND tc.constraint_type='PRIMARY KEY'
      AND kcu.column_name='user_id'
  ) THEN
    EXECUTE 'ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_pkey';
    EXECUTE 'ALTER TABLE profiles ADD CONSTRAINT profiles_pkey PRIMARY KEY (user_id)';
  END IF;
END $$;

-- ////////////////////////////////////////////////////////////////////
-- B) Backfill profiles for any referenced users (safe if already present)
WITH src AS (
  SELECT DISTINCT user_id FROM sessions WHERE user_id IS NOT NULL
  UNION
  SELECT DISTINCT user_id FROM cases    WHERE user_id IS NOT NULL
)
INSERT INTO profiles (user_id)
SELECT s.user_id
FROM src s
LEFT JOIN profiles p ON p.user_id = s.user_id
WHERE p.user_id IS NULL;

-- ////////////////////////////////////////////////////////////////////
-- C) SESSIONS: user_id must be uuid; FK → profiles(user_id)
DO $$
DECLARE col_type text;
BEGIN
  SELECT data_type INTO col_type
  FROM information_schema.columns
  WHERE table_name='sessions' AND column_name='user_id';

  IF col_type IS NULL THEN
    RAISE EXCEPTION 'sessions.user_id column missing';
  END IF;

  IF col_type <> 'uuid' THEN
    BEGIN
      EXECUTE 'ALTER TABLE sessions ALTER COLUMN user_id TYPE uuid USING user_id::uuid';
    EXCEPTION WHEN others THEN
      EXECUTE 'ALTER TABLE sessions ADD COLUMN user_id_uuid uuid';
      EXECUTE 'UPDATE sessions SET user_id_uuid = NULLIF(user_id::text, '''')::uuid';
      EXECUTE 'ALTER TABLE sessions DROP COLUMN user_id';
      EXECUTE 'ALTER TABLE sessions RENAME COLUMN user_id_uuid TO user_id';
    END;
  END IF;
END $$;

ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_user_id_users_id_fk;
ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_user_id_profiles_user_id_fk;

ALTER TABLE sessions
  ADD CONSTRAINT sessions_user_id_profiles_user_id_fk
  FOREIGN KEY (user_id) REFERENCES profiles(user_id)
  ON DELETE CASCADE;

-- ////////////////////////////////////////////////////////////////////
-- D) CASES: switch to uuid PK (id) and FK → profiles(user_id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='cases' AND column_name='id'
  ) THEN
    EXECUTE 'ALTER TABLE cases ADD COLUMN id uuid DEFAULT gen_random_uuid() NOT NULL';
  END IF;
END $$;

DO $$
DECLARE col_type text;
BEGIN
  SELECT data_type INTO col_type
  FROM information_schema.columns
  WHERE table_name='cases' AND column_name='user_id';

  IF col_type IS NULL THEN
    RAISE NOTICE 'cases.user_id not present; skipping type change.';
  ELSIF col_type <> 'uuid' THEN
    BEGIN
      EXECUTE 'ALTER TABLE cases ALTER COLUMN user_id TYPE uuid USING user_id::uuid';
    EXCEPTION WHEN others THEN
      EXECUTE 'ALTER TABLE cases ADD COLUMN user_id_uuid uuid';
      EXECUTE 'UPDATE cases SET user_id_uuid = NULLIF(user_id::text, '''')::uuid';
      EXECUTE 'ALTER TABLE cases DROP COLUMN user_id';
      EXECUTE 'ALTER TABLE cases RENAME COLUMN user_id_uuid TO user_id';
    END;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name='cases' AND constraint_type='PRIMARY KEY'
  ) THEN
    EXECUTE 'ALTER TABLE cases DROP CONSTRAINT IF EXISTS cases_pkey';
  END IF;
  EXECUTE 'ALTER TABLE cases ADD CONSTRAINT cases_pkey PRIMARY KEY (id)';
END $$;

ALTER TABLE cases DROP CONSTRAINT IF EXISTS cases_user_id_users_id_fk;
ALTER TABLE cases DROP CONSTRAINT IF EXISTS cases_user_id_profiles_user_id_fk;

ALTER TABLE cases
  ADD CONSTRAINT cases_user_id_profiles_user_id_fk
  FOREIGN KEY (user_id) REFERENCES profiles(user_id)
  ON DELETE SET NULL;

ALTER TABLE cases DROP COLUMN IF EXISTS uid;
DROP SEQUENCE IF EXISTS cases_uid_seq;

COMMIT;
