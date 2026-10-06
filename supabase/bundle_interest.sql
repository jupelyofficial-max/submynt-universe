-- "Notify me when bundle pricing launches" on curated bundle pages
-- (src/lib/bundleInterest.ts). Run once in the Supabase SQL Editor; safe to
-- re-run. Until it's run, the button fails gracefully (console warning,
-- button stays as it was).
create table if not exists public.bundle_interest (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users (id) on delete cascade,
  bundle_slug text        not null,
  created_at  timestamptz not null default now(),
  unique (user_id, bundle_slug)
);

alter table public.bundle_interest enable row level security;

grant select, insert on public.bundle_interest to authenticated;

-- A signed-in user can only add and see their own rows. No update/delete
-- policies: rows are written once (insert ... on conflict do nothing).
drop policy if exists "bundle_interest: insert own" on public.bundle_interest;
create policy "bundle_interest: insert own"
  on public.bundle_interest for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "bundle_interest: select own" on public.bundle_interest;
create policy "bundle_interest: select own"
  on public.bundle_interest for select
  to authenticated
  using (user_id = auth.uid());

-- Check: interest per bundle.
-- select bundle_slug, count(*) from public.bundle_interest group by bundle_slug order by 2 desc;
