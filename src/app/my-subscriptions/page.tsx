"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlarmClock, ArrowLeft, FileText, Gem, Layers, Orbit, PiggyBank, Plus, Sparkles, Trash2, Wallet } from "lucide-react";
import { SubscriptionLogo } from "@/components/subscriptions/SubscriptionLogo";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/dashboard/StatCard";
import { SUBSCRIPTIONS_BY_ID, potentialSavingsMonthly } from "@/data/subscriptions";
import { daysUntil, formatDate, formatINR, formatOwnedPrice } from "@/lib/utils";
import { computeSubmyntScore, type Recommendation } from "@/lib/submyntScore";
import {
  computeBundledFamilyValue,
  computeMonthlySpend,
  computePotentialAnnualSavings,
  directItemsOf,
  type OwnedItem,
} from "@/lib/subscriptionStats";
import { useMySubscriptionsStore } from "@/store/useMySubscriptionsStore";
import { useUniverseStore } from "@/store/useUniverseStore";
import type { AccessType, Category } from "@/types/subscription";

const ACCESS_TYPE_LABELS: Record<AccessType, string> = {
  direct: "Direct",
  bundled: "Bundled",
  promotional: "Promotional",
  family: "Family",
  free: "Free",
};

const ACCESS_TYPE_TONES: Record<AccessType, "neutral" | "aurora" | "gold" | "nebula" | "danger"> = {
  direct: "neutral",
  bundled: "nebula",
  promotional: "gold",
  family: "aurora",
  free: "neutral",
};

const RENEWAL_WINDOW_DAYS = 30;
const SOON_WINDOW_DAYS = 7;

const RECOMMENDATION_LABELS: Record<Recommendation, string> = {
  keep: "Keep",
  optimize: "Optimize",
  reassess: "Reassess",
};

const RECOMMENDATION_TONES: Record<Recommendation, "neutral" | "aurora" | "gold" | "nebula" | "danger"> = {
  keep: "nebula",
  optimize: "gold",
  reassess: "danger",
};

export default function MySubscriptionsPage() {
  const owned = useMySubscriptionsStore((s) => s.owned);
  const hydrated = useMySubscriptionsStore((s) => s.hydrated);
  const remove = useMySubscriptionsStore((s) => s.remove);
  const select = useUniverseStore((s) => s.select);
  const router = useRouter();

  const items: OwnedItem[] = useMemo(
    () =>
      owned
        .map((o) => ({ owned: o, sub: SUBSCRIPTIONS_BY_ID[o.subscriptionId] }))
        .filter((x): x is OwnedItem => Boolean(x.sub))
        .sort((a, b) => new Date(a.owned.nextRenewal).getTime() - new Date(b.owned.nextRenewal).getTime()),
    [owned]
  );

  // Entry-point branching (Sprint 3): the "Track Subscriptions" nav item
  // always lands here — an empty portfolio launches the Sprint 2 onboarding
  // flow immediately instead of showing a bare empty page; anything already
  // tracked goes straight to the snapshot below. Gated on `hydrated` so this
  // never fires on the store's pre-hydration empty state.
  useEffect(() => {
    if (hydrated && items.length === 0) {
      useUniverseStore.getState().setAddSubscriptionsModalOpen(true);
    }
  }, [hydrated, items.length]);

  // priceMonthly is already the monthly-equivalent cost regardless of
  // billing cycle (confirmed against the catalogue's own annual plan
  // entries, which are lower per-month than their monthly counterparts,
  // not ~12x higher) — summed directly, no /12 or *12 correction here.
  // Formulas live in lib/subscriptionStats.ts, shared with the Sprint 6
  // Monthly Report so both pages report identical numbers.
  const monthlySpend = useMemo(() => computeMonthlySpend(items), [items]);
  const totalValue = useMemo(() => monthlySpend + computeBundledFamilyValue(items), [items, monthlySpend]);
  const potentialAnnualSavings = useMemo(() => computePotentialAnnualSavings(items), [items]);

  const directItems = useMemo(() => directItemsOf(items), [items]);
  const savingsCandidateCount = useMemo(() => directItems.filter((x) => potentialSavingsMonthly(x.sub) > 0).length, [directItems]);

  const accessTypeCounts = useMemo(() => {
    const counts: Partial<Record<AccessType, number>> = {};
    for (const x of items) {
      const t = x.owned.accessType ?? "direct";
      counts[t] = (counts[t] ?? 0) + 1;
    }
    return counts;
  }, [items]);

  const byCategory = useMemo(() => {
    const groups = new Map<Category, OwnedItem[]>();
    for (const x of items) {
      const list = groups.get(x.sub.category) ?? [];
      list.push(x);
      groups.set(x.sub.category, list);
    }
    return [...groups.entries()].sort((a, b) => b[1].length - a[1].length);
  }, [items]);

  const renewalsSoonCount = useMemo(
    () => items.filter((x) => { const days = daysUntil(x.owned.nextRenewal); return days >= 0 && days <= RENEWAL_WINDOW_DAYS; }).length,
    [items]
  );

  // Sprint 5 — a tighter 7-day window, and renewals/promo-expiries counted
  // and worded separately (a promo ending is never called a "renewal").
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

  function openDetails(id: string) {
    select(id);
    router.push(`/explore?focus=${id}`);
  }

  // "Explore Alternative" (US-038) — reuses DetailPanel's existing
  // Alternatives tab rather than building a new view; selectWithTab deep-
  // links it open directly on that tab instead of Overview.
  function exploreAlternative(id: string) {
    useUniverseStore.getState().selectWithTab(id, "alternatives");
    router.push(`/explore?focus=${id}`);
  }

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 lg:px-8">
      <Link
        href="/explore"
        className="mb-4 inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm text-ink-300 transition-colors hover:bg-black/5 hover:text-ink-0"
      >
        <ArrowLeft size={16} />
        Back
      </Link>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-nebula-500/15 text-nebula-400">
            <Orbit size={20} />
          </span>
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink-0">Track Subscriptions</h1>
            <p className="text-sm text-ink-400">{items.length > 0 ? `${items.length} tracked` : "Nothing tracked yet."}</p>
          </div>
        </div>
        {items.length > 0 && (
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => router.push("/report")}>
              <FileText size={14} />
              Monthly Report
            </Button>
            <Button size="sm" onClick={() => useUniverseStore.getState().setAddSubscriptionsModalOpen(true)}>
              <Plus size={14} />
              Add subscriptions
            </Button>
          </div>
        )}
      </div>

      {hydrated && items.length === 0 ? (
        <div className="glass-panel flex flex-col items-center gap-3 rounded-2xl p-16 text-center">
          <p className="font-display text-lg text-ink-0">Nothing tracked yet</p>
          <p className="max-w-sm text-sm text-ink-400">
            Add the subscriptions you actually pay for — no bank connection required.
          </p>
          <Button className="mt-1" onClick={() => useUniverseStore.getState().setAddSubscriptionsModalOpen(true)}>
            <Plus size={14} />
            Track your subscriptions
          </Button>
        </div>
      ) : (
        <>
          {/* Snapshot stats */}
          <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard icon={<Layers size={16} />} label="Services" value={String(items.length)} />
            <StatCard icon={<Wallet size={16} />} label="Monthly spend" value={`${formatINR(monthlySpend)}/mo`} />
            <StatCard icon={<Gem size={16} />} label="Total value" value={`${formatINR(totalValue)}/mo`} />
            <StatCard icon={<PiggyBank size={16} />} label="Potential annual savings" value={formatINR(potentialAnnualSavings)} />
          </div>

          {/* Access-type breakdown */}
          <div className="mb-4 flex flex-wrap gap-1.5">
            {(Object.keys(ACCESS_TYPE_LABELS) as AccessType[])
              .filter((t) => accessTypeCounts[t])
              .map((t) => (
                <Badge key={t} tone={ACCESS_TYPE_TONES[t]}>
                  {ACCESS_TYPE_LABELS[t]} · {accessTypeCounts[t]}
                </Badge>
              ))}
          </div>

          {/* Insights */}
          <div className="mb-6 flex flex-col gap-2">
            {savingsCandidateCount > 0 && (
              <Link
                href="/optimize"
                className="flex items-center gap-2 rounded-xl bg-gold-500/10 px-3.5 py-2.5 text-sm text-gold-400 transition-colors hover:bg-gold-500/15"
              >
                <Sparkles size={14} />
                You have {savingsCandidateCount} subscription{savingsCandidateCount === 1 ? "" : "s"} with cheaper alternatives
                available — see Optimize
              </Link>
            )}
            {renewalsSoonCount > 0 && (
              <div className="flex items-center gap-2 rounded-xl bg-black/5 px-3.5 py-2.5 text-sm text-ink-300">
                <Orbit size={14} />
                {renewalsSoonCount} renewal{renewalsSoonCount === 1 ? "" : "s"} coming up in the next {RENEWAL_WINDOW_DAYS} days
              </div>
            )}
            {(renewalsWithin7 > 0 || promosEndingWithin7 > 0) && (
              <Link
                href="/renewals"
                className="flex items-center gap-2 rounded-xl bg-rose-500/10 px-3.5 py-2.5 text-sm text-rose-400 transition-colors hover:bg-rose-500/15"
              >
                <AlarmClock size={14} />
                {soonInsightText(renewalsWithin7, promosEndingWithin7)} — view calendar
              </Link>
            )}
          </div>

          {/* Grouped by category */}
          <div className="flex flex-col gap-8">
            {byCategory.map(([category, categoryItems]) => (
              <div key={category}>
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-500">
                  {category} · {categoryItems.length}
                </h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {categoryItems.map(({ owned: o, sub }) => {
                    const savings = (o.accessType ?? "direct") === "direct" ? potentialSavingsMonthly(sub) : 0;
                    const accessType = o.accessType ?? "direct";
                    const scoreResult = computeSubmyntScore(sub, accessType, o.usageFrequency);
                    return (
                      <div key={o.ownedId} className="glass-panel flex flex-col gap-3 rounded-2xl p-4">
                        <div className="flex items-start gap-3">
                          <SubscriptionLogo subscription={sub} size="md" ring />
                          <div className="min-w-0 flex-1">
                            <h3 className="truncate text-sm font-semibold text-ink-0">{sub.name}</h3>
                            <p className="text-xs text-ink-400">{o.planName}</p>
                          </div>
                          <div className="shrink-0 text-right">
                            <div className="text-sm font-semibold text-ink-0">{formatOwnedPrice(o.priceMonthly, accessType)}</div>
                            {o.priceMonthly > 0 && <div className="text-[11px] text-ink-500">/mo</div>}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge tone={ACCESS_TYPE_TONES[accessType]}>{ACCESS_TYPE_LABELS[accessType]}</Badge>
                          {o.bundleProvider && (
                            <span className="text-[11px] text-ink-500">via {o.bundleProvider}</span>
                          )}
                        </div>

                        <div className="text-xs text-ink-500">Renews {formatDate(o.nextRenewal)}</div>

                        {/* Displayed as its own distinct line, never merged
                            into "Renews" — a promo ending is a different
                            event from the subscription's own renewal. */}
                        {accessType === "promotional" && o.promoEndDate && (
                          <div className="flex items-center gap-1.5 text-xs text-gold-400">
                            <AlarmClock size={12} />
                            Promo ends {formatDate(o.promoEndDate)}
                          </div>
                        )}

                        {savings > 0 && (
                          <div className="flex items-center gap-1.5 rounded-lg bg-gold-500/10 px-2.5 py-1.5 text-[11px] text-gold-400">
                            <Sparkles size={12} />
                            Save ~{formatINR(savings)}/mo (estimated) — see Optimize
                          </div>
                        )}

                        {/* Submynt Score (Sprint 4) — rule-based, explainable
                            factors only (usage / price-value / cheaper
                            alternatives), never a raw quality number. */}
                        <div className="rounded-lg border border-black/10 px-2.5 py-2">
                          <div className="mb-1 flex items-center justify-between gap-2">
                            <Badge tone={RECOMMENDATION_TONES[scoreResult.recommendation]}>
                              {RECOMMENDATION_LABELS[scoreResult.recommendation]}
                            </Badge>
                            <span className="text-[11px] font-semibold text-ink-400">Score {scoreResult.score}</span>
                          </div>
                          <p className="text-[11px] leading-snug text-ink-500">{scoreResult.reasons.join(" · ")}</p>
                        </div>

                        <div className="mt-auto flex gap-2 pt-1">
                          <Button size="sm" variant="outline" className="flex-1" onClick={() => openDetails(sub.id)}>
                            View Details
                          </Button>
                          {scoreResult.recommendation === "reassess" && (
                            <Button size="sm" variant="ghost" className="flex-1 text-gold-400" onClick={() => exploreAlternative(sub.id)}>
                              Explore Alternative
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-300 hover:text-red-200"
                            onClick={() => remove(o.ownedId)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Never calls a promo expiry a "renewal" — the wording branches on which
// event types are actually present rather than merging them into one count.
function soonInsightText(renewals: number, promos: number): string {
  if (renewals > 0 && promos > 0) {
    return `${renewals} renewing and ${promos} promo${promos === 1 ? "" : "s"} ending in the next ${SOON_WINDOW_DAYS} days`;
  }
  if (promos > 0) {
    return `${promos} promo${promos === 1 ? "" : "s"} ending in the next ${SOON_WINDOW_DAYS} days`;
  }
  return `${renewals} renewal${renewals === 1 ? "" : "s"} coming up in the next ${SOON_WINDOW_DAYS} days`;
}
