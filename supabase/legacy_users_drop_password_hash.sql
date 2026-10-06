-- Drop the legacy password hashes. Sign-in has been Google-only (Supabase
-- Auth) since the move off the custom auth that wrote public.users, and no
-- application code references this column (checked across every branch and
-- the full git history).
--
-- Run once in the Supabase SQL Editor. The guard below aborts — dropping
-- nothing — if any function, policy or view in the database still mentions
-- password_hash; investigate those first if it does. Irreversible: the
-- hashes cannot be recovered once dropped (take a backup first if wanted).

do $$
declare
  refs text;
begin
  select string_agg(ref, E'\n') into refs
  from (
    select 'function ' || n.nspname || '.' || p.proname as ref
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname not in ('pg_catalog', 'information_schema')
      and p.prosrc ilike '%password_hash%'
    union all
    select 'policy ' || schemaname || '.' || tablename || ': ' || policyname
    from pg_policies
    where coalesce(qual, '') ilike '%password_hash%'
       or coalesce(with_check, '') ilike '%password_hash%'
    union all
    select 'view ' || schemaname || '.' || viewname
    from pg_views
    where schemaname not in ('pg_catalog', 'information_schema')
      and definition ilike '%password_hash%'
  ) found;

  if refs is not null then
    raise exception 'password_hash is still referenced — not dropped:%', E'\n' || refs;
  end if;

  alter table public.users drop column if exists password_hash;
end $$;

-- Check: expect 0 rows.
select column_name
from information_schema.columns
where table_schema = 'public' and table_name = 'users' and column_name = 'password_hash';
