-- Track Subscriptions: store what is actually charged per billing cycle.
-- Run once in the Supabase SQL Editor, BEFORE deploying the UI that writes
-- price_amount. Safe to re-run: every statement is idempotent.
--
-- price_amount = amount charged per selected cycle (per month for
-- 'monthly', per year for 'annual'). price_monthly is kept for now (the UI
-- still writes it, as the monthly equivalent) and dropped in a later change.

-- 0. (Optional) see what triggers already exist on the table.
-- select tgname, pg_get_triggerdef(oid)
-- from pg_trigger
-- where tgrelid = 'public.owned_subscriptions'::regclass and not tgisinternal;

-- 1. Schema (additive — the currently deployed app keeps working).
alter table public.owned_subscriptions
  add column if not exists price_amount numeric check (price_amount >= 0),
  add column if not exists currency text not null default 'INR' check (char_length(currency) = 3);

-- 2. Backfill. The old field was labeled "₹/month", so its value is
--    trusted as a monthly amount: monthly rows keep it, annual rows are
--    that × 12. Only rows still missing price_amount are touched, so this
--    can (and should) be re-run once after the new UI is deployed, to
--    catch rows the old UI added in between.
update public.owned_subscriptions
set price_amount = case billing when 'annual' then price_monthly * 12 else price_monthly end
where price_amount is null
  and price_monthly is not null
  and billing in ('monthly', 'annual');

update public.owned_subscriptions set currency = 'INR' where currency is distinct from 'INR';

-- 3. Keep updated_at current on every update — only if no existing
--    trigger on this table already maintains it.
create or replace function public.owned_subscriptions_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_trigger t
    join pg_proc p on p.oid = t.tgfoid
    where t.tgrelid = 'public.owned_subscriptions'::regclass
      and not t.tgisinternal
      and p.prosrc ilike '%updated_at%'
  ) then
    create trigger owned_subscriptions_touch_updated_at
      before update on public.owned_subscriptions
      for each row execute function public.owned_subscriptions_touch_updated_at();
  end if;
end $$;

-- 4. Check: expect missing = 0, and any annual row = price_monthly * 12.
select billing,
       count(*) as total_rows,
       count(*) filter (where price_amount is null) as missing,
       count(*) filter (where billing = 'annual' and price_amount <> price_monthly * 12) as annual_mismatch
from public.owned_subscriptions
group by billing;

-- Rollback (drops the new data):
-- drop trigger if exists owned_subscriptions_touch_updated_at on public.owned_subscriptions;
-- drop function if exists public.owned_subscriptions_touch_updated_at();
-- alter table public.owned_subscriptions drop column if exists price_amount, drop column if exists currency;
