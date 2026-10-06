"use client";

import { useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlarmClock, Compass, Gem, Layers, Orbit, Plus, Sparkles, Wallet } from "lucide-react";
import { SubscriptionLogo } from "@/components/subscriptions/SubscriptionLogo";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { SUBSCRIPTIONS_BY_ID, potentialSavingsMonthly } from "@/data/subscriptions";
import { cycleSuffix, daysUntil, formatDate, formatINR, formatOwnedPrice, ownedPriceAmount } from "@/lib/utils";
import { computeMonthlySpend, directItemsOf, type OwnedItem } from "@/lib/subscriptionStats";
import { findDuplicateCategories } from "@/lib/bundleIntelligence";
import { annualSwitchSuggestion } from "@/lib/planOptimization";
import { accessChipFor } from "@/lib/trackPresentation";
import { useMySubscriptionsStore } from "@/store/useMySubscriptionsStore";
import { useUniverseStore } from "@/store/useUniverseStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useSubscriptionsReady } from "@/hooks/useSubscriptionsReady";
import { consumeResumeIntent } from "@/lib/auth/signIn";
import { trackEvent } from "@/lib/events";
import type { OwnedSubscription } from "@/types/subscription";

const SOON_WINDOW_DAYS = 7;
// A row's "Renews in Nd" badge uses a wider window than the one-line
// "this week" alert — a renewal 4 weeks out doesn't need a badge, but one
// in the next two weeks does.
const CARD_RENEWAL_CHIP_DAYS = 14;

type RowBadge = ReturnType<typeof accessChipFor>;

/** At most one badge per row, by priority: promo ends > renews soon >
 * overlaps another tracked sub > how it's paid for (non-direct only). */
function rowBadge(o: OwnedSubscription, overlapName: string | undefined): RowBadge | null {
  const accessType = o.accessType ?? "direct";
  if (accessType === "promotional" && o.promoEndDate) return { label: `Promo ends ${formatDate(o.promoEndDate)}`, tone: "gold" };
  const days = Math.ceil(daysUntil(o.nextRenewal));
  if (days >= 0 && days <= CARD_RENEWAL_CHIP_DAYS) return { label: `Renews in ${days}d`, tone: "gold" };
  if (overlapName) return { label: `Overlaps ${overlapName}`, tone: "nebula" };
  if (accessType !== "direct") return accessChipFor(o);
  return null;
}

export default function MySubscriptionsPage() {
  const owned = useMySubscriptionsStore((s) => s.owned);
  const ready = useSubscriptionsReady();
  const user = useAuthStore((s) => s.user);
  const select = useUniverseStore((s) => s.select);

  // Back from signing in with an add action pending (see AddSubscriptionsModal's
  // gate) — replay it once the account has loaded, so the user lands on the
  // add flow they originally asked for.
  useEffect(() => {
    if (!user || !ready) return;
    const intent = consumeResumeIntent();
    if (intent) {
      useUniverseStore.getState().setAddSubscriptionsModalOpen(true, intent.preselectId ?? null, intent.startAtBundlePick, "resume");
    }
  }, [user, ready]);

  // Once per visit to this page, as soon as the list is trustworthy.
  const viewLogged = useRef(false);
  useEffect(() => {
    if (!ready || viewLogged.current) return;
    viewLogged.current = true;
    trackEvent("track_page_viewed", { has_subs: owned.length > 0 });
  }, [ready, owned.length]);

  const items: OwnedItem[] = useMemo(
    () =>
      owned
        .map((o) => ({ owned: o, sub: SUBSCRIPTIONS_BY_ID[o.subscriptionId] }))
        .filter((x): x is OwnedItem => Boolean(x.sub))
        .sort((a, b) => new Date(a.owned.nextRenewal).getTime() - new Date(b.owned.nextRenewal).getTime()),
    [owned]
  );

  // priceMonthly is already the monthly-equivalent cost regardless of
  // billing cycle. computeMonthlySpend already excludes bundled/family/
  // promotional (₹0-to-the-user) entries — the "You pay / month" figure.
  const monthlySpend = useMemo(() => computeMonthlySpend(items), [items]);
  const annualSpend = monthlySpend * 12;

  const directItems = useMemo(() => directItemsOf(items), [items]);
  const savingsCandidateCount = useMemo(() => directItems.filter((x) => potentialSavingsMonthly(x.sub) > 0).length, [directItems]);

  // Renewals and promo-expiries in the next 7 days, counted and worded
  // separately (a promo ending is never called a "renewal").
  const renewalsWithin7 = useMemo(
    () => items.filter((x) => { const days = daysUntil(x.owned.nextRenewal); return days >= 0 && days <= SOON_WINDOW_DAYS; }).length,
    [items]
  );
  const promosEndingWithin7 = useMemo(
    () =>
      items.filter((x) => {
        if ((x.owned.accessType ?? "direct") !== "promotional" || !x.owned.promoEndDate) return false;
        const days = daysUntil(x.owned.promoEndDate);
        return days >= 0 && days <= SOON_WINDOW_DAYS;
      }).length,
    [items]
  );

  // Category-based overlap only — subscriptionId -> name of the other
  // overlapping item, for the row's "Overlaps X" badge.
  const overlapNameBySubId = useMemo(() => {
    const map = new Map<string, string>();
    for (const group of findDuplicateCategories(items)) {
      for (const item of group.items) {
        const other = group.items.find((x) => x.sub.id !== item.sub.id);
        if (other) map.set(item.sub.id, other.sub.name);
      }
    }
    return map;
  }, [items]);

  // Annual-switch candidates, separate from the cross-subscription
  // "alternative" savings — both feed the one "N ways to save" line.
  const annualSwitchCandidates = useMemo(
    () => items.filter((x) => annualSwitchSuggestion(x.owned, x.sub) !== null),
    [items]
  );
  const savingsWaysCount = savingsCandidateCount + annualSwitchCandidates.length;
  const savingsAmountMonthly = useMemo(() => {
    const altSavings = directItems.reduce((sum, x) => sum + potentialSavingsMonthly(x.sub), 0);
    const annualSavings = annualSwitchCandidates.reduce((sum, x) => sum + (annualSwitchSuggestion(x.owned, x.sub)?.savingsMonthly ?? 0), 0);
    return altSavings + annualSavings;
  }, [directItems, annualSwitchCandidates]);

  // formatINR shows 0 as "Free", which reads wrong as a spend total.
  const spend = (amount: number) => (amount > 0 ? formatINR(amount) : "₹0");

  return (
    <div className="ts-theme mx-auto w-full max-w-5xl flex-1 px-4 py-8 lg:px-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold" style={{ color: "var(--ts-ink-0)" }}>
          Track Subscriptions
          <span className="ml-1.5 text-base font-normal" style={{ color: "var(--ts-ink-500)" }}>
            · {items.length > 0 ? `${items.length} tracked` : "nothing tracked yet"}
          </span>
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          {/* Shown signed out too: the add flow's sign-in gate replays it
              (straight to the bundle picker) once they're back. */}
          <Button
            size="sm"
            variant="outline"
            style={{ color: "var(--ts-ink-300)" }}
            onClick={() => useUniverseStore.getState().setAddSubscriptionsModalOpen(true, null, true, "bundle")}
          >
            <Layers size={14} />
            Add a bundle
          </Button>
          {items.length > 0 && (
            <Button size="sm" onClick={() => useUniverseStore.getState().setAddSubscriptionsModalOpen(true, null, false, "page_header")}>
              <Plus size={14} />
              Add subscription
            </Button>
          )}
        </div>
      </div>

      {!ready ? (
        <LoadingState />
      ) : items.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="ts-card mb-3 flex flex-col gap-3 p-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="ts-tabular font-display text-3xl font-bold" style={{ color: "var(--ts-ink-0)" }}>
                {spend(monthlySpend)}
                <span className="text-base font-medium" style={{ color: "var(--ts-ink-500)" }}>
                  /month
                </span>
              </div>
              <div className="ts-tabular mt-0.5 text-sm" style={{ color: "var(--ts-ink-500)" }}>
                {spend(annualSpend)}/year
              </div>
            </div>
            <div className="flex flex-col gap-1 text-sm sm:items-end">
              {savingsWaysCount > 0 && (
                <Link href="/optimize" className="inline-flex items-center gap-1.5 font-medium hover:underline" style={{ color: "var(--ts-mint-400)" }}>
                  <Sparkles size={14} />
                  {savingsWaysCount} way{savingsWaysCount === 1 ? "" : "s"} to save {formatINR(savingsAmountMonthly)}/mo → Optimize
                </Link>
              )}
              <Link href="/report" className="hover:underline" style={{ color: "var(--ts-ink-300)" }}>
                Monthly report
              </Link>
            </div>
          </div>

          {(renewalsWithin7 > 0 || promosEndingWithin7 > 0) && (
            <Link
              href="/renewals"
              className="mb-3 flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors"
              style={{ background: "var(--ts-amber-tint)", color: "var(--ts-amber)" }}
            >
              <AlarmClock size={14} />
              {soonInsightText(renewalsWithin7, promosEndingWithin7)} → calendar
            </Link>
          )}

          {/* Compact rows, soonest renewal first. A row opens the detail
              panel in place (it's mounted app-wide in the layout). */}
          <ul className="ts-card overflow-hidden">
            {items.map(({ owned: o, sub }, i) => {
              const accessType = o.accessType ?? "direct";
              const amount = ownedPriceAmount(o);
              const badge = rowBadge(o, overlapNameBySubId.get(sub.id));
              return (
                <li key={o.ownedId} style={i > 0 ? { borderTop: "1px solid var(--ts-border)" } : undefined}>
                  <button
                    type="button"
                    onClick={() => select(sub.id)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--ts-mint-tint)] cursor-pointer"
                  >
                    <SubscriptionLogo subscription={sub} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold" style={{ color: "var(--ts-ink-0)" }}>
                        {sub.name}
                      </div>
                      <div className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs" style={{ color: "var(--ts-ink-500)" }}>
                        <span className="truncate">
                          {/* Plan name is dropped on phones so the date fits beside a badge. */}
                          {o.planName && <span className="hidden sm:inline">{o.planName} · </span>}
                          Renews {formatDate(o.nextRenewal)}
                        </span>
                        {badge && (
                          <span className="shrink-0">
                            <Badge tone={badge.tone}>{badge.label}</Badge>
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="ts-tabular text-sm font-semibold" style={{ color: "var(--ts-ink-0)" }}>
                        {formatOwnedPrice(amount, accessType)}
                      </div>
                      {amount > 0 && (
                        <div className="text-[11px]" style={{ color: "var(--ts-ink-500)" }}>
                          {cycleSuffix(o.billing)}
                        </div>
                      )}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col gap-3" aria-busy="true" aria-label="Loading your subscriptions">
      <div className="ts-card h-28 animate-pulse" />
      <div className="ts-card h-32 animate-pulse" />
      <div className="ts-card h-32 animate-pulse" />
    </div>
  );
}

function EmptyState() {
  const router = useRouter();
  const signedIn = useAuthStore((s) => Boolean(s.user));
  return (
    <div className="ts-card flex flex-col items-center gap-5 p-10 text-center sm:p-16">
      <span
        className="flex h-14 w-14 items-center justify-center rounded-2xl"
        style={{ background: "var(--ts-mint-tint)", color: "var(--ts-mint-400)" }}
      >
        <Orbit size={26} />
      </span>
      <div>
        <p className="font-display text-xl font-semibold" style={{ color: "var(--ts-ink-0)" }}>
          Nothing tracked yet
        </p>
        <p className="mx-auto mt-1 max-w-sm text-sm" style={{ color: "var(--ts-ink-500)" }}>
          Add what you actually pay for — no bank connection required.
        </p>
      </div>

      <div className="flex w-full max-w-sm flex-col gap-2.5 text-left">
        <PerkRow icon={<Wallet />} text="See your real monthly and annual spend" />
        <PerkRow icon={<Gem />} text="A Submynt Score for every subscription" />
        <PerkRow icon={<AlarmClock />} text="Renewal reminders before you get charged" />
        <PerkRow icon={<Layers />} text="Bundle and duplicate savings you might be missing" />
      </div>

      <div className="flex w-full max-w-sm flex-col gap-2 sm:flex-row">
        <Button className="flex-1" onClick={() => useUniverseStore.getState().setAddSubscriptionsModalOpen(true, null, true, "empty_state")}>
          <Plus size={14} />
          Add your first subscription
        </Button>
        <Button variant="outline" className="flex-1" style={{ color: "var(--ts-ink-300)" }} onClick={() => router.push("/explore")}>
          <Compass size={14} />
          Browse popular services
        </Button>
      </div>
      {!signedIn && (
        <p className="text-xs" style={{ color: "var(--ts-ink-500)" }}>
          Tracking needs a free account — you&apos;ll sign in with Google first.
        </p>
      )}
    </div>
  );
}

function PerkRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2.5 text-sm" style={{ color: "var(--ts-ink-300)" }}>
      <span
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg [&>svg]:h-3.5 [&>svg]:w-3.5"
        style={{ background: "var(--ts-mint-tint)", color: "var(--ts-mint-400)" }}
      >
        {icon}
      </span>
      {text}
    </div>
  );
}

// Never calls a promo expiry a "renewal" — the wording branches on which
// event types are actually present rather than merging them into one count.
function soonInsightText(renewals: number, promos: number): string {
  const promoText = `${promos} promo${promos === 1 ? "" : "s"} end${promos === 1 ? "s" : ""}`;
  if (renewals > 0 && promos > 0) return `${renewals} renew and ${promoText} this week`;
  if (promos > 0) return `${promoText} this week`;
  return `${renewals} renew${renewals === 1 ? "s" : ""} this week`;
}
