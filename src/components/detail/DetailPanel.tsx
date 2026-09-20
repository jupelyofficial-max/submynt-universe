"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, Repeat, Scale, Share2, Trash2, X } from "lucide-react";
import { ResponsiveSheet } from "@/components/ui/ResponsiveSheet";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { SubscriptionLogo } from "@/components/subscriptions/SubscriptionLogo";
import { PlansSection } from "@/components/detail/PlansSection";
import { SavingsSection } from "@/components/detail/SavingsSection";
import { AlternativesSection } from "@/components/detail/AlternativesSection";
import { SubscriptionStatusPicker } from "@/components/detail/SubscriptionStatusPicker";
import { PriceAlertToggle } from "@/components/detail/PriceAlertToggle";
import { RecommendationCard } from "@/components/recommendations/RecommendationCard";
import { useUniverseStore } from "@/store/useUniverseStore";
import { useMySubscriptionsStore } from "@/store/useMySubscriptionsStore";
import { useDemandSignalsStore } from "@/store/useDemandSignalsStore";
import { SUBSCRIPTIONS_BY_ID, bestSavingsAlternative, isRecentlyAdded, potentialSavingsMonthly } from "@/data/subscriptions";
import { VERIFICATION_BY_ID } from "@/data/verification";
import { computeBestFor, getProviderUrl, rankAlternatives } from "@/lib/subscriptionIntelligence";
import { getRecommendation } from "@/lib/recommendations";
import { canClaimSavings } from "@/lib/verification/claims";
import { cn, formatDate, formatINR, formatPrice } from "@/lib/utils";
import { BILLING_LABELS } from "@/data/categories";
import type { Subscription } from "@/types/subscription";

type Tab = "overview" | "plans" | "alternatives";
const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "plans", label: "Plans" },
  { id: "alternatives", label: "Alternatives" },
];

export function DetailPanel() {
  const selectedId = useUniverseStore((s) => s.selectedId);
  const select = useUniverseStore((s) => s.select);
  const sub = selectedId ? SUBSCRIPTIONS_BY_ID[selectedId] : null;

  function handleClose() {
    select(null);
  }

  return (
    <ResponsiveSheet open={Boolean(sub)} onClose={handleClose} desktopVariant="side" panelVariant="solid" hideHeader>
      {sub && <DetailContent subscriptionId={sub.id} onClose={handleClose} />}
    </ResponsiveSheet>
  );
}

function DetailContent({ subscriptionId, onClose }: { subscriptionId: string; onClose: () => void }) {
  const sub = SUBSCRIPTIONS_BY_ID[subscriptionId];
  const router = useRouter();
  const select = useUniverseStore((s) => s.select);

  const isOwned = useMySubscriptionsStore((s) => s.isOwned(sub.id));
  const owned = useMySubscriptionsStore((s) => s.getOwned(sub.id));
  const removeOwned = useMySubscriptionsStore((s) => s.remove);
  const addOwned = useMySubscriptionsStore((s) => s.add);
  const toggleKept = useMySubscriptionsStore((s) => s.toggleKept);
  const ownedList = useMySubscriptionsStore((s) => s.owned);
  const recordDemand = useDemandSignalsStore((s) => s.record);

  const [tab, setTab] = useState<Tab>("overview");
  const [shared, setShared] = useState(false);
  const [switchingPlan, setSwitchingPlan] = useState(false);

  const alternatives = useMemo(() => rankAlternatives(sub, 5), [sub]);
  const savingsAlt = bestSavingsAlternative(sub);
  const savings = potentialSavingsMonthly(sub);
  const providerUrl = getProviderUrl(sub);
  const verification = VERIFICATION_BY_ID[sub.id];
  const savingsVerified = savingsAlt ? canClaimSavings(verification, VERIFICATION_BY_ID[savingsAlt.id]) : false;
  const bestFor = computeBestFor(sub);

  const ownedSubscriptions = useMemo(
    () => ownedList.map((o) => SUBSCRIPTIONS_BY_ID[o.subscriptionId]).filter((s): s is NonNullable<typeof s> => Boolean(s)),
    [ownedList]
  );
  const topRecommendation = alternatives[0] ? getRecommendation(alternatives[0].subscription, { ownedSubscriptions }) : null;
  const secondaryAlternatives = alternatives.slice(1);

  // Anonymous, per-subscription view counter — see useDemandSignalsStore.
  useEffect(() => {
    recordDemand(sub.id, "views");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sub.id]);

  const isKept = Boolean(isOwned && owned?.kept);

  // Heart is clickable immediately, with no prior "add to My Subscriptions"
  // step — that means a click here can't assume an owned record already
  // exists. Already-owned: flip the existing kept flag, exactly as before.
  // Not yet owned: this click IS the add, using the subscription's first
  // listed plan as a reasonable default (same day-count-by-billing
  // convention SubscriptionStatusPicker's confirmPlan already uses) so the
  // click never does nothing.
  function handleToggleKeep() {
    if (isOwned && owned) {
      toggleKept(owned.ownedId);
      return;
    }
    // Enterprise-sales-only entries (no public price) have no real plan
    // to snapshot a price/billing from — nothing to add.
    if (sub.plans.length === 0) return;
    const plan = sub.plans[0];
    const days = plan.billing === "annual" ? 365 : plan.billing === "quarterly" ? 90 : 30;
    const nextRenewal = new Date();
    nextRenewal.setDate(nextRenewal.getDate() + days);
    addOwned({
      subscriptionId: sub.id,
      planName: plan.name,
      priceMonthly: plan.priceMonthly,
      billing: plan.billing,
      nextRenewal: nextRenewal.toISOString(),
      kept: true,
    });
  }

  function handleShare() {
    const url = `${window.location.origin}/explore?focus=${sub.id}`;
    if (navigator.share) {
      navigator.share({ title: sub.name, url }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(url);
      setShared(true);
      setTimeout(() => setShared(false), 1600);
    }
  }

  function openAlternative(id: string) {
    recordDemand(sub.id, "comparisons");
    select(id);
  }

  function handleCompare() {
    const topAlt = alternatives[0]?.subscription;
    const ids = topAlt ? `${sub.id},${topAlt.id}` : sub.id;
    router.push(`/compare?ids=${ids}`);
  }

  const priceLine = `${formatPrice(sub.priceMonthly, sub.priceLabel)}${sub.priceMonthly !== null && sub.priceMonthly > 0 ? "/mo" : ""}`;
  const ctaHref = sub.dealUrl ?? providerUrl;
  const ctaLabel = sub.dealUrl ? "Get Deal →" : "Visit Provider →";

  return (
    <div className="flex flex-col">
      {/* Banner — gradient built from the subscription's own real `color`
          field (already the source of truth for its logo elsewhere), not a
          hardcoded hex, so every entry gets a real, distinct banner. */}
      <div
        className="relative h-28 shrink-0"
        style={{ background: `linear-gradient(135deg, ${sub.color}, color-mix(in srgb, ${sub.color} 100%, black 40%))` }}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3.5 top-3.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/25 text-white backdrop-blur-sm transition-colors hover:bg-white/35 cursor-pointer"
        >
          <X size={16} />
        </button>
      </div>

      {/* Logo overlapping the banner edge + name/category/price + Heart */}
      <div className="relative px-5">
        <div className="-mt-8 flex items-end gap-3">
          <div className="shrink-0 rounded-full border-4 border-white">
            <SubscriptionLogo subscription={sub} size="lg" />
          </div>
          <div className="min-w-0 flex-1 pb-1">
            <h2 className="font-display text-lg font-semibold text-black truncate">{sub.name}</h2>
            <p className="text-xs text-[#6B6B6B]">
              {sub.category} · {priceLine}
            </p>
          </div>
          <button
            onClick={handleToggleKeep}
            disabled={!isOwned && sub.plans.length === 0}
            aria-label={isKept ? "Remove from kept" : "Keep this subscription"}
            aria-pressed={isKept}
            className={cn(
              "mb-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors",
              !isOwned && sub.plans.length === 0
                ? "cursor-not-allowed border-[#E5E5E5] bg-white text-[#D5D5D5]"
                : "cursor-pointer",
              isKept
                ? "border-rose-300 bg-rose-50 text-rose-500"
                : "border-[#E5E5E5] bg-white text-[#6B6B6B] hover:border-black/20"
            )}
          >
            <Heart size={16} className={isKept ? "fill-current" : ""} />
          </button>
        </div>

        <div className="mt-2 flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={handleCompare}>
            <Scale size={14} />
            Compare
          </Button>
          <Button variant="ghost" size="sm" onClick={handleShare}>
            <Share2 size={14} />
            {shared ? "Link copied" : "Share"}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-3 flex gap-4 border-b border-[#E5E5E5] px-5">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "-mb-px border-b-2 pb-2.5 text-sm font-semibold transition-colors cursor-pointer",
              tab === t.id ? "border-ocean-600 text-ocean-600" : "border-transparent text-[#6B6B6B] hover:text-black"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab body */}
      <div className="flex-1">
        {tab === "overview" && <OverviewTab sub={sub} bestFor={bestFor} isOwned={isOwned} />}
        {tab === "plans" && (
          <PlansTab
            sub={sub}
            isOwned={isOwned}
            owned={owned}
            switchingPlan={switchingPlan}
            setSwitchingPlan={setSwitchingPlan}
            addOwned={addOwned}
            removeOwned={removeOwned}
          />
        )}
        {tab === "alternatives" && (
          <AlternativesTab
            savingsAlt={savingsAlt}
            savings={savings}
            savingsVerified={savingsVerified}
            topRecommendation={topRecommendation}
            secondaryAlternatives={secondaryAlternatives}
            openAlternative={openAlternative}
            onCompareTop={
              topRecommendation ? () => router.push(`/compare?ids=${sub.id},${topRecommendation.subscription.id}`) : undefined
            }
          />
        )}
      </div>

      {/* Sticky bottom price + primary CTA */}
      <div className="sticky bottom-0 flex shrink-0 items-center gap-3 border-t border-[#E5E5E5] bg-white px-5 py-3">
        <div className="shrink-0">
          <div className="font-display text-lg font-bold leading-none text-black">{formatPrice(sub.priceMonthly, sub.priceLabel)}</div>
          {sub.priceMonthly !== null && sub.priceMonthly > 0 && <div className="mt-1 text-[11px] text-[#6B6B6B]">per month</div>}
        </div>
        {ctaHref && (
          <Button
            href={ctaHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1"
            onClick={() => recordDemand(sub.id, "clickThroughs")}
          >
            {ctaLabel}
          </Button>
        )}
      </div>
    </div>
  );
}

function OverviewTab({ sub, bestFor, isOwned }: { sub: Subscription; bestFor: string[]; isOwned: boolean }) {
  return (
    <div className="flex flex-col gap-4 px-5 py-4">
      <div>
        <h4 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#6B6B6B]">About</h4>
        <p className="text-sm leading-relaxed text-black">{sub.tagline}</p>
      </div>

      {bestFor.length > 0 && (
        <div>
          <h4 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#6B6B6B]">Best Fit</h4>
          <div className="flex flex-wrap gap-1.5">
            {bestFor.map((tag) => (
              <span key={tag} className="rounded-full border border-[#E5E5E5] bg-white px-2.5 py-0.5 text-[11px] font-medium text-black">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 rounded-xl border border-[#E5E5E5] p-3">
        <div>
          <div className="text-sm font-semibold text-black">★ {sub.rating.toFixed(1)}</div>
          <div className="text-[11px] text-[#6B6B6B]">Rating</div>
        </div>
        <div>
          <div className="text-sm font-semibold text-black">{sub.popularity}%</div>
          <div className="text-[11px] text-[#6B6B6B]">Popularity</div>
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-black">{sub.region}</div>
          <div className="text-[11px] text-[#6B6B6B]">Region</div>
        </div>
      </div>

      {(isRecentlyAdded(sub) || isOwned) && (
        <div className="flex flex-wrap gap-1.5">
          {isRecentlyAdded(sub) && <Badge tone="nebula">New</Badge>}
          {isOwned && <Badge tone="nebula">In your universe</Badge>}
        </div>
      )}

      <div className="border-t border-[#E5E5E5] pt-4">
        <SubscriptionStatusPicker sub={sub} />
      </div>

      <div className="border-t border-[#E5E5E5] pt-4">
        <PriceAlertToggle subscriptionId={sub.id} />
      </div>
    </div>
  );
}

function PlansTab({
  sub,
  isOwned,
  owned,
  switchingPlan,
  setSwitchingPlan,
  addOwned,
  removeOwned,
}: {
  sub: Subscription;
  isOwned: boolean;
  owned: ReturnType<typeof useMySubscriptionsStore.getState>["owned"][number] | undefined;
  switchingPlan: boolean;
  setSwitchingPlan: (fn: (v: boolean) => boolean) => void;
  addOwned: ReturnType<typeof useMySubscriptionsStore.getState>["add"];
  removeOwned: ReturnType<typeof useMySubscriptionsStore.getState>["remove"];
}) {
  return (
    <div className="divide-y divide-[#E5E5E5]">
      <PlansSection sub={sub} />

      {sub.plans.length === 0 && (
        <p className="px-5 py-4 text-sm text-[#6B6B6B]">No published plans — contact the provider for pricing.</p>
      )}

      {isOwned && owned && (
        <>
          <div className="px-5 py-4">
            <Button variant="ghost" className="w-full" onClick={() => setSwitchingPlan((v) => !v)}>
              <Repeat size={14} />
              Switch Plan
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 w-full text-red-500 hover:text-red-600"
              onClick={() => removeOwned(owned.ownedId)}
            >
              <Trash2 size={14} />
              Remove
            </Button>
          </div>

          {switchingPlan && (
            <div className="px-5 py-4">
              <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-[#6B6B6B]">Choose a plan</h4>
              <div className="grid grid-cols-2 gap-1.5">
                {sub.plans.map((plan) => (
                  <button
                    key={plan.name}
                    onClick={() => {
                      addOwned({
                        subscriptionId: sub.id,
                        planName: plan.name,
                        priceMonthly: plan.priceMonthly,
                        billing: plan.billing,
                        nextRenewal: owned.nextRenewal,
                      });
                      setSwitchingPlan(() => false);
                    }}
                    className="flex flex-col items-start rounded-lg border border-[#E5E5E5] bg-white px-3 py-2 text-left hover:border-aurora-500/40 transition-colors cursor-pointer"
                  >
                    <span className="text-xs text-[#6B6B6B]">
                      {plan.name} · {BILLING_LABELS[plan.billing]}
                    </span>
                    <span className="text-sm font-semibold text-black">{formatINR(plan.priceMonthly)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 px-5 py-4">
            <div>
              <div className="text-xs text-[#6B6B6B]">Current plan</div>
              <div className="mt-0.5 text-sm font-medium text-black">{owned.planName}</div>
            </div>
            <div>
              <div className="text-xs text-[#6B6B6B]">Next renewal</div>
              <div className="mt-0.5 text-sm font-medium text-black">{formatDate(owned.nextRenewal)}</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function AlternativesTab({
  savingsAlt,
  savings,
  savingsVerified,
  topRecommendation,
  secondaryAlternatives,
  openAlternative,
  onCompareTop,
}: {
  savingsAlt: Subscription | null;
  savings: number;
  savingsVerified: boolean;
  topRecommendation: ReturnType<typeof getRecommendation> | null;
  secondaryAlternatives: ReturnType<typeof rankAlternatives>;
  openAlternative: (id: string) => void;
  onCompareTop?: () => void;
}) {
  const hasContent = Boolean((savingsAlt && savings > 0) || topRecommendation || secondaryAlternatives.length > 0);
  return (
    <div className="divide-y divide-[#E5E5E5]">
      {savingsAlt && savings > 0 && (
        <SavingsSection
          alternative={savingsAlt}
          monthlySavings={savings}
          verified={savingsVerified}
          onViewAlternative={() => openAlternative(savingsAlt.id)}
        />
      )}
      {topRecommendation && (
        <div className="px-5 py-4">
          <RecommendationCard result={topRecommendation} onExplore={() => openAlternative(topRecommendation.subscription.id)} onCompare={onCompareTop} />
        </div>
      )}
      <AlternativesSection alternatives={secondaryAlternatives} onSelect={openAlternative} />
      {!hasContent && <p className="px-5 py-4 text-sm text-[#6B6B6B]">No alternatives found in this category yet.</p>}
    </div>
  );
}
