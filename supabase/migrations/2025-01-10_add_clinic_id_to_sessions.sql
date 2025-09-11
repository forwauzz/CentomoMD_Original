-- Add clinic_id to sessions table and align policies
-- This migration adds the missing clinic_id column that the Drizzle schema expects

-- 1) Add column (nullable initially)
alter table sessions add column if not exists clinic_id uuid;

-- 2) Backfill clinic_id from users table (users already have clinic_id)
-- This assumes that sessions should inherit the clinic_id from their user
update sessions 
set clinic_id = u.clinic_id
from users u
where sessions.user_id = u.id 
  and sessions.clinic_id is null 
  and u.clinic_id is not null;

-- 3) Make not null AFTER backfill (commented for now to avoid breaking existing data)
-- alter table sessions alter column clinic_id set not null;

-- 4) Add FK constraint to clinics table
do $$
begin
  if exists (select 1 from information_schema.tables where table_name='clinics') then
    alter table sessions
      add constraint sessions_clinic_id_fkey
      foreign key (clinic_id) references clinics(id) on delete cascade;
  end if;
end $$;

-- 5) Add index for performance
create index if not exists sessions_clinic_id_idx on sessions (clinic_id);

-- 6) Update artifacts RLS policies to use sessions.clinic_id for better clinic scoping
-- Drop existing policies
drop policy if exists "tenant_can_read_artifacts" on artifacts;
drop policy if exists "tenant_can_insert_artifacts" on artifacts;

-- Recreate policies with clinic_id-based scoping
create policy "tenant_can_read_artifacts"
on artifacts for select
using (
  exists (
    select 1
    from sessions s
    where s.id = artifacts.session_id
      and (
        -- User owns the session
        s.user_id = auth.uid()
        or
        -- User has active membership in the session's clinic
        exists (
          select 1
          from memberships m
          where m.user_id = auth.uid()
            and m.clinic_id = s.clinic_id
            and m.active = true
        )
      )
  )
);

create policy "tenant_can_insert_artifacts"
on artifacts for insert
with check (
  exists (
    select 1
    from sessions s
    where s.id = artifacts.session_id
      and (
        -- User owns the session
        s.user_id = auth.uid()
        or
        -- User has active membership in the session's clinic
        exists (
          select 1
          from memberships m
          where m.user_id = auth.uid()
            and m.clinic_id = s.clinic_id
            and m.active = true
        )
      )
  )
);
