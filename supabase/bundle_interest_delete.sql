-- Lets a signed-in user remove their own bundle interest (Saved page →
-- "Remove"). Run once in the Supabase SQL Editor after bundle_interest.sql;
-- safe to re-run. Until it's run, Remove fails gracefully (console.error,
-- the item stays).
grant delete on public.bundle_interest to authenticated;

drop policy if exists "bundle_interest: delete own" on public.bundle_interest;
create policy "bundle_interest: delete own"
  on public.bundle_interest for delete
  to authenticated
  using (user_id = auth.uid());
