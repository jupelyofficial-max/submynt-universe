"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlarmClock,
  ArrowLeft,
  Compass,
  FileText,
  Gem,
  Layers,
  Orbit,
  Plus,
  Sparkles,
  Trash2,
  Wallet,
} from "lucide-react";
import { SubscriptionLogo } from "@/components/subscriptions/SubscriptionLogo";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ScoreRing } from "@/components/track/ScoreRing";
import { SUBSCRIPTIONS_BY_ID, potentialSavingsMonthly } from "@/data/subscriptions";
import { daysUntil, formatDate, formatINR, formatOwnedPrice } from "@/lib/utils";
import { computeSubmyntScore, type Recommendation } from "@/lib/submyntScore";
import { computeMonthlySpend, directItemsOf, type OwnedItem } from "@/lib/subscriptionStats";
import { findDuplicateCategories, groupByBundleProvider } from "@/lib/bundleIntelligence";
import { annualSwitchSuggestion } from "@/lib/planOptimization";
import { accessChipFor } from "@/lib/trackPresentation";
import { useMySubscriptionsStore } from "@/store/useMySubscriptionsStore";
import { useUniverseStore } from "@/store/useUniverseStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useSubscriptionsReady } from "@/hooks/useSubscriptionsReady";
import { consumeResumeIntent } from "@/lib/auth/signIn";
import { requireSignIn } from "@/lib/auth/requireSignIn";

const RENEWAL_WINDOW_DAYS = 30;
const SOON_WINDOW_DAYS = 7;
// Card-level "Renews in Nd" chip uses a tighter window than the 30-day
// aggregate insight below — a renewal 4 weeks out doesn't need its own
// per-card badge, only the ones genuinely coming up soon do.
const CARD_RENEWAL_CHIP_DAYS = 14;

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

// Covers both the current fixed enum (Airtel Black/Jio/Family/Employer/
// Others) and legacy Amazon/Apple/Google values already stored for
// existing users, so old data still renders a real label, never a raw key.
const BUNDLE_PROVIDER_LABELS: Record<string, string> = {
  airtel: "Airtel Black",
  jio: "Jio",
  amazon: "Amazon",
  apple: "Apple",
  google: "Google",
  employer: "your employer",
  family: "a family plan",
  other: "that provider",
};

export default function MySubscriptionsPage() {
  const owned = useMySubscriptionsStore((s) => s.owned);
  const ready = useSubscriptionsReady();
  const user = useAuthStore((s) => s.user);
  const remove = useMySubscriptionsStore((s) => s.remove);
  const select = useUniverseStore((s) => s.select);
  const router = useRouter();

  // Back from signing in with an add action pending (see AddSubscriptionsModal's
  // gate) — replay it once the account has loaded, so the user lands on the
  // add flow they originally asked for.
  useEffect(() => {
    if (!user || !ready) return;
    const intent = consumeResumeIntent();
    if (intent) {
      useUniverseStore.getState().setAddSubscriptionsModalOpen(true, intent.preselectId ?? null, intent.startAtBundlePick);
    }
  }, [user, ready]);

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
  // promotional (₹0-to-the-user) entries — the "You pay / month" figure
  // the redesign asks for, unchanged from the Sprint 3/6 formula.
  const monthlySpend = useMemo(() => computeMonthlySpend(items), [items]);
  const annualSpend = monthlySpend * 12;

  const directItems = useMemo(() => directItemsOf(items), [items]);
  const savingsCandidateCount = useMemo(() => directItems.filter((x) => potentialSavingsMonthly(x.sub) > 0).length, [directItems]);

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

  // Sprint 7 — category-based overlap only (no bundle-content data exists
  // to check "already included in a bundle you own"; see bundleIntelligence.ts).
  const duplicateGroups = useMemo(() => findDuplicateCategories(items), [items]);
  // subscriptionId -> name of the other overlapping item, for the new
  // per-card "Overlaps X" chip (first other member of its duplicate group).
  const overlapNameBySubId = useMemo(() => {
    const map = new Map<string, string>();
    for (const group of duplicateGroups) {
      for (const item of group.items) {
        const other = group.items.find((x) => x.sub.id !== item.sub.id);
        if (other) map.set(item.sub.id, other.sub.name);
      }
    }
    return map;
  }, [duplicateGroups]);
  // Purely reflects the bundle_provider the user themselves recorded —
  // not a claim about what that provider's bundle actually contains.
  const bundleProviderGroups = useMemo(
    () => groupByBundleProvider(items).filter((g) => g.items.length >= 2),
    [items]
  );

  // Sprint 8 — annual-switch candidates, separate from the cross-subscription
  // "alternative" savings above.
  const annualSwitchCandidates = useMemo(
    () => items.filter((x) => annualSwitchSuggestion(x.owned, x.sub) !== null),
    [items]
  );

  // Redesign — aggregate Submynt Score ring + the combined savings nudge
  // ("N ways to save ₹X/mo"), both pure presentation derived from the
  // same per-item computeSubmyntScore/potentialSavingsMonthly/
  // annualSwitchSuggestion calls already used elsewhere on this page.
  const scoredItems = useMemo(
    () => items.map((x) => ({ ...x, result: computeSubmyntScore(x.sub, x.owned.accessType ?? "direct", x.owned.usageFrequency) })),
    [items]
  );
  const aggregateScore = useMemo(() => {
    if (scoredItems.length === 0) return 0;
    return Math.round(scoredItems.reduce((sum, x) => sum + x.result.score, 0) / scoredItems.length);
  }, [scoredItems]);
  const savingsWaysCount = savingsCandidateCount + annualSwitchCandidates.length;
  const savingsAmountMonthly = useMemo(() => {
    const altSavings = directItems.reduce((sum, x) => sum + potentialSavingsMonthly(x.sub), 0);
    const annualSavings = annualSwitchCandidates.reduce((sum, x) => sum + (annualSwitchSuggestion(x.owned, x.sub)?.savingsMonthly ?? 0), 0);
    return altSavings + annualSavings;
  }, [directItems, annualSwitchCandidates]);

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
    <div className="ts-theme mx-auto w-full max-w-5xl flex-1 px-4 py-10 lg:px-8">
      <Link
        href="/explore"
        className="mb-4 inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm transition-colors hover:bg-[var(--ts-mint-tint)]"
        style={{ color: "var(--ts-ink-300)" }}
      >
        <ArrowLeft size={16} />
        Back
      </Link>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span
            className="flex h-11 w-11 items-center justify-center rounded-2xl"
            style={{ background: "var(--ts-mint-tint)", color: "var(--ts-mint-400)" }}
          >
            <Orbit size={20} />
          </span>
          <div>
            <h1 className="font-display text-2xl font-semibold" style={{ color: "var(--ts-ink-0)" }}>
              Track Subscriptions
            </h1>
            <p className="text-sm" style={{ color: "var(--ts-ink-500)" }}>
              {items.length > 0 ? `${items.length} tracked` : "Nothing tracked yet."}
            </p>
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

      {!ready ? (
        <LoadingState />
      ) : items.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* Summary strip */}
          <div className="ts-card mb-4 flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--ts-ink-500)" }}>
                You pay / month
              </div>
              <div className="ts-tabular font-display text-3xl font-bold" style={{ color: "var(--ts-ink-0)" }}>
                {formatINR(monthlySpend)}
              </div>
              <div className="ts-tabular mt-0.5 text-xs" style={{ color: "var(--ts-ink-500)" }}>
                {formatINR(annualSpend)} / year
              </div>
            </div>

            <ScoreRing score={aggregateScore} />
          </div>

          {savingsWaysCount > 0 && (
            <Link
              href="/optimize"
              className="mb-4 flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors"
              style={{ background: "var(--ts-mint-tint)", color: "var(--ts-mint-400)" }}
            >
              <Sparkles size={14} />
              {savingsWaysCount} way{savingsWaysCount === 1 ? "" : "s"} to save {formatINR(savingsAmountMonthly)}/mo
            </Link>
          )}

          {/* Insights — unchanged from Sprint 5/7/8, restyled */}
          <div className="mb-6 flex flex-col gap-2">
            {renewalsSoonCount > 0 && (
              <div
                className="flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm"
                style={{ background: "var(--ts-card)", color: "var(--ts-ink-300)", border: "1px solid var(--ts-border)" }}
              >
                <Orbit size={14} />
                {renewalsSoonCount} renewal{renewalsSoonCount === 1 ? "" : "s"} coming up in the next {RENEWAL_WINDOW_DAYS} days
              </div>
            )}
            {(renewalsWithin7 > 0 || promosEndingWithin7 > 0) && (
              <Link
                href="/renewals"
                className="flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors"
                style={{ background: "var(--ts-amber-tint)", color: "var(--ts-amber)" }}
              >
                <AlarmClock size={14} />
                {soonInsightText(renewalsWithin7, promosEndingWithin7)} — view calendar
              </Link>
            )}
            {bundleProviderGroups.map((group) => (
              <div
                key={group.provider}
                className="flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm"
                style={{ background: "var(--ts-card)", color: "var(--ts-ink-300)", border: "1px solid var(--ts-border)" }}
              >
                <Gem size={14} />
                You have {group.items.length} subscriptions bundled via {BUNDLE_PROVIDER_LABELS[group.provider] ?? group.provider}:{" "}
                {group.items.map((x) => x.sub.name).join(", ")}
              </div>
            ))}
          </div>

          {/* Subscription cards — flat list, default sort by next renewal */}
          <div className="flex flex-col gap-3">
            {scoredItems.map(({ owned: o, sub, result: scoreResult }) => {
              const savings = (o.accessType ?? "direct") === "direct" ? potentialSavingsMonthly(sub) : 0;
              const accessType = o.accessType ?? "direct";
              const accessChip = accessChipFor(o);
              const daysToRenewal = Math.ceil(daysUntil(o.nextRenewal));
              const overlapName = overlapNameBySubId.get(sub.id);
              const rarelyUsed = o.usageFrequency === "rarely" || o.usageFrequency === "never";

              return (
                <div key={o.ownedId} className="ts-card flex flex-col gap-3 p-4">
                  <div className="flex items-start gap-3">
                    <SubscriptionLogo subscription={sub} size="md" ring />
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-semibold" style={{ color: "var(--ts-ink-0)" }}>
                        {sub.name}
                      </h3>
                      <p className="truncate text-xs" style={{ color: "var(--ts-ink-500)" }}>
                        {o.planName}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="ts-tabular text-sm font-semibold" style={{ color: "var(--ts-ink-0)" }}>
                        {formatOwnedPrice(o.priceMonthly, accessType)}
                      </div>
                      {o.priceMonthly > 0 ? (
                        <div className="text-[11px]" style={{ color: "var(--ts-ink-500)" }}>
                          /month
                        </div>
                      ) : (
                        accessType !== "direct" && (
                          <div className="text-[11px]" style={{ color: "var(--ts-ink-500)" }}>
                            included
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge tone={accessChip.tone}>{accessChip.label}</Badge>
                    {daysToRenewal >= 0 && daysToRenewal <= CARD_RENEWAL_CHIP_DAYS && (
                      <Badge tone="gold">Renews in {daysToRenewal}d</Badge>
                    )}
                    {rarelyUsed && <Badge tone="coral">Rarely opened</Badge>}
                    {overlapName && <Badge tone="nebula">Overlaps {overlapName}</Badge>}
                  </div>

                  <div className="text-xs" style={{ color: "var(--ts-ink-500)" }}>
                    Renews {formatDate(o.nextRenewal)}
                  </div>

                  {/* Displayed as its own distinct line, never merged
                      into "Renews" — a promo ending is a different
                      event from the subscription's own renewal. */}
                  {accessType === "promotional" && o.promoEndDate && (
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--ts-amber)" }}>
                      <AlarmClock size={12} />
                      Promo ends {formatDate(o.promoEndDate)}
                    </div>
                  )}

                  {savings > 0 && (
                    <div
                      className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px]"
                      style={{ background: "var(--ts-amber-tint)", color: "var(--ts-amber)" }}
                    >
                      <Sparkles size={12} />
                      Save ~{formatINR(savings)}/mo (estimated) — see Optimize
                    </div>
                  )}

                  {/* Submynt Score (Sprint 4) — rule-based, explainable
                      factors only (usage / price-value / cheaper
                      alternatives), never a raw quality number. */}
                  <div className="rounded-lg px-2.5 py-2" style={{ border: "1px solid var(--ts-border)" }}>
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <Badge tone={RECOMMENDATION_TONES[scoreResult.recommendation]}>
                        {RECOMMENDATION_LABELS[scoreResult.recommendation]}
                      </Badge>
                      <span className="ts-tabular text-[11px] font-semibold" style={{ color: "var(--ts-ink-500)" }}>
                        Score {scoreResult.score}
                      </span>
                    </div>
                    <p className="text-[11px] leading-snug" style={{ color: "var(--ts-ink-500)" }}>
                      {scoreResult.reasons.join(" · ")}
                    </p>
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
                      onClick={() => void requireSignIn(() => remove(o.ownedId))}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
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
        <Button className="flex-1" onClick={() => useUniverseStore.getState().setAddSubscriptionsModalOpen(true, null, true)}>
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
  if (renewals > 0 && promos > 0) {
    return `${renewals} renewing and ${promos} promo${promos === 1 ? "" : "s"} ending in the next ${SOON_WINDOW_DAYS} days`;
  }
  if (promos > 0) {
    return `${promos} promo${promos === 1 ? "" : "s"} ending in the next ${SOON_WINDOW_DAYS} days`;
  }
  return `${renewals} renewal${renewals === 1 ? "" : "s"} coming up in the next ${SOON_WINDOW_DAYS} days`;
}
