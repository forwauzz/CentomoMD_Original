-- Artifacts table for Mode 3 pipeline outputs
create table if not exists artifacts (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  ir jsonb not null,
  role_map jsonb not null,
  narrative jsonb not null,
  processing_time jsonb,
  created_at timestamptz not null default now()
);

-- Enable Row Level Security
alter table artifacts enable row level security;

-- Read policy: user can read artifacts of sessions they own or have access to via membership
create policy "tenant_can_read_artifacts"
on artifacts for select
using (
  exists (
    select 1
    from sessions s
    join users u on u.id = s.user_id
    left join memberships m on m.user_id = u.id and m.active = true
    where s.id = artifacts.session_id
      and (s.user_id = auth.uid() or m.user_id = auth.uid())
  )
);

-- Insert policy: backend inserts in the context of authenticated user
create policy "tenant_can_insert_artifacts"
on artifacts for insert
with check (
  exists (
    select 1
    from sessions s
    join users u on u.id = s.user_id
    left join memberships m on m.user_id = u.id and m.active = true
    where s.id = artifacts.session_id
      and (s.user_id = auth.uid() or m.user_id = auth.uid())
  )
);
