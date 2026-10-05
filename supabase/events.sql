-- Funnel events for the Track Subscriptions sign-in gate (src/lib/events.ts).
-- Run once in the Supabase SQL Editor. Insert-only: nobody can read these
-- rows through the API (use the dashboard / service role).
create table if not exists public.events (
  id         bigint generated always as identity primary key,
  event_name text        not null,
  user_id    uuid,
  anon_id    text,
  props      jsonb       not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.events enable row level security;

grant insert on public.events to anon, authenticated;

-- A signed-in client may only attribute events to itself; a signed-out one
-- may only insert with a null user_id.
create policy "events: insert only"
  on public.events for insert
  to anon, authenticated
  with check (user_id is null or user_id = auth.uid());
