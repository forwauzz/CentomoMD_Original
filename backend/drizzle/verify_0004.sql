-- FKs on sessions/cases
SELECT
  tc.constraint_name,
  kcu.table_name  AS source_table,
  kcu.column_name AS source_column,
  ccu.table_name  AS target_table,
  ccu.column_name AS target_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type='FOREIGN KEY'
  AND kcu.table_name IN ('sessions','cases')
ORDER BY 1;

-- Column/type checks
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name IN ('sessions','cases','profiles')
  AND column_name IN ('id','user_id')
ORDER BY table_name, column_name;

-- PK on cases.id
SELECT tc.constraint_name, kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name='cases' AND tc.constraint_type='PRIMARY KEY';

-- Orphans (should be none)
SELECT s.user_id
FROM sessions s
LEFT JOIN profiles p ON p.user_id = s.user_id
WHERE p.user_id IS NULL;

SELECT c.user_id
FROM cases c
LEFT JOIN profiles p ON p.user_id = c.user_id
WHERE c.user_id IS NOT NULL AND p.user_id IS NULL;
