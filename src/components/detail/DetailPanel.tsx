"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Heart, Repeat, Scale, Share2, Trash2 } from "lucide-react";
import { ResponsiveSheet } from "@/components/ui/ResponsiveSheet";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { SubscriptionLogo } from "@/components/subscriptions/SubscriptionLogo";
import { InsightSection } from "@/components/detail/InsightSection";
import { PlansSection } from "@/components/detail/PlansSection";
import { SavingsSection } from "@/components/detail/SavingsSection";
import { AlternativesSection } from "@/components/detail/AlternativesSection";
import { SubscriptionStatusPicker } from "@/components/detail/SubscriptionStatusPicker";
import { PriceAlertToggle } from "@/components/detail/PriceAlertToggle";
import { RecommendationCard } from "@/components/recommendations/RecommendationCard";
import { useUniverseStore } from "@/store/useUniverseStore";
import { useMySubscriptionsStore } from "@/store/useMySubscriptionsStore";
import { useDemandSignalsStore } from "@/store/useDemandSignalsStore";
import { SUBSCRIPTIONS_BY_ID, bestSavingsAlternative, potentialSavingsMonthly } from "@/data/subscriptions";
import { VERIFICATION_BY_ID } from "@/data/verification";
import { computeBestFor, getProviderUrl, rankAlternatives } from "@/lib/subscriptionIntelligence";
import { getRecommendation } from "@/lib/recommendations";
import { canClaimSavings } from "@/lib/verification/claims";
import { formatDate, formatINR } from "@/lib/utils";
import { BILLING_LABELS } from "@/data/categories";

export function DetailPanel() {
  const selectedId = useUniverseStore((s) => s.selectedId);
  const select = useUniverseStore((s) => s.select);
  const sendCameraCommand = useUniverseStore((s) => s.sendCameraCommand);
  const sub = selectedId ? SUBSCRIPTIONS_BY_ID[selectedId] : null;

  function handleClose() {
    select(null);
    // Closing should always return the desktop Universe to its default
    // fitted framing, not leave the camera wherever "focus-node" zoomed it
    // in to — a no-op when the panel was opened from List view or on
    // mobile, since there's no CameraController mounted to receive it.
    sendCameraCommand({ type: "reset" });
  }

  return (
    <ResponsiveSheet open={Boolean(sub)} onClose={handleClose} title={sub?.category ?? ""} desktopVariant="side" panelVariant="solid">
      {sub && <DetailContent subscriptionId={sub.id} />}
    </ResponsiveSheet>
  );
}

function DetailContent({ subscriptionId }: { subscriptionId: string }) {
  const sub = SUBSCRIPTIONS_BY_ID[subscriptionId];
  const router = useRouter();
  const select = useUniverseStore((s) => s.select);
  const sendCameraCommand = useUniverseStore((s) => s.sendCameraCommand);

  const isOwned = useMySubscriptionsStore((s) => s.isOwned(sub.id));
  const owned = useMySubscriptionsStore((s) => s.getOwned(sub.id));
  const removeOwned = useMySubscriptionsStore((s) => s.remove);
  const addOwned = useMySubscriptionsStore((s) => s.add);
  const ownedList = useMySubscriptionsStore((s) => s.owned);
  const recordDemand = useDemandSignalsStore((s) => s.record);

  const [kept, setKept] = useState(false);
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
    sendCameraCommand({ type: "focus-node", id });
  }

  function handleCompare() {
    const topAlt = alternatives[0]?.subscription;
    const ids = topAlt ? `${sub.id},${topAlt.id}` : sub.id;
    router.push(`/compare?ids=${ids}`);
  }

  return (
    <div className="flex flex-col">
      {/* 1. Provider + category */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-start gap-3">
          <SubscriptionLogo subscription={sub} size="lg" ring={isOwned} bare />
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-lg font-semibold text-black truncate">{sub.name}</h2>
            <p className="mt-0.5 text-sm text-[#6B6B6B] line-clamp-2">{sub.tagline}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Badge tone="aurora">{sub.category}</Badge>
              <Badge tone="neutral">{sub.region}</Badge>
              {sub.isNew && <Badge tone="nebula">New</Badge>}
              {isOwned && <Badge tone="nebula">In your universe</Badge>}
            </div>
          </div>
        </div>

        {/* 2. Best for */}
        {bestFor.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {bestFor.map((tag) => (
              <span key={tag} className="rounded-full border border-[#E5E5E5] bg-white px-2.5 py-0.5 text-[11px] font-medium text-black">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* 3. Price */}
        <div className="mt-4 flex items-end justify-between border-t border-[#E5E5E5] pt-4">
          <div>
            <div className="font-display text-[28px] leading-none font-semibold text-black">{formatINR(sub.priceMonthly)}</div>
            {sub.priceMonthly > 0 && <div className="mt-1 text-xs text-[#6B6B6B]">per month, {sub.billing.includes("annual") ? "billed monthly or annually" : "billed monthly"}</div>}
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold text-black">★ {sub.rating.toFixed(1)}</div>
            <div className="text-xs text-[#6B6B6B]">{sub.popularity}% Submynt Popularity</div>
          </div>
        </div>
      </div>

      {/* 4. Submynt recommendation/insight */}
      <InsightSection sub={sub} />

      {/* 5. Plans */}
      <PlansSection sub={sub} verification={verification} />

      {/* 6. Best alternative / recommendation — savings estimate and the
          personalized pick together, so price-vs-alternative information
          only appears once in this part of the panel. */}
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
          <RecommendationCard
            result={topRecommendation}
            onExplore={() => openAlternative(topRecommendation.subscription.id)}
            onCompare={() => {
              router.push(`/compare?ids=${sub.id},${topRecommendation.subscription.id}`);
            }}
          />
        </div>
      )}
      <AlternativesSection alternatives={secondaryAlternatives} onSelect={openAlternative} />

      {/* 7. Primary CTA — the one dominant action in this panel. */}
      <div className="px-5 py-4 border-t border-[#E5E5E5]">
        {sub.dealUrl ? (
          <Button
            href={sub.dealUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full"
            onClick={() => recordDemand(sub.id, "clickThroughs")}
          >
            Get Deal →
          </Button>
        ) : providerUrl ? (
          <Button
            href={providerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full"
            onClick={() => recordDemand(sub.id, "clickThroughs")}
          >
            Visit Provider →
          </Button>
        ) : null}
        <div className="mt-2 flex items-center justify-center gap-1">
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

      <SubscriptionStatusPicker sub={sub} />

      {isOwned && owned && (
        <>
          <div className="px-5 py-4 border-t border-[#E5E5E5]">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setKept(true);
                  setTimeout(() => setKept(false), 1500);
                }}
              >
                {kept ? <Check size={16} className="text-nebula-500" /> : <Heart size={16} />}
                {kept ? "Kept" : "Keep"}
              </Button>
              <Button variant="ghost" onClick={() => setSwitchingPlan((v) => !v)}>
                <Repeat size={14} />
                Switch Plan
              </Button>
            </div>
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
            <div className="px-5 py-4 border-t border-[#E5E5E5]">
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
                      setSwitchingPlan(false);
                    }}
                    className="flex flex-col items-start rounded-lg border border-[#E5E5E5] bg-white px-3 py-2 text-left hover:border-aurora-500/40 transition-colors cursor-pointer"
                  >
                    <span className="text-xs text-[#6B6B6B]">{plan.name} · {BILLING_LABELS[plan.billing]}</span>
                    <span className="text-sm font-semibold text-black">{formatINR(plan.priceMonthly)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="px-5 py-4 border-t border-[#E5E5E5] grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-[#6B6B6B]">Current plan</div>
              <div className="text-sm font-medium text-black mt-0.5">{owned.planName}</div>
            </div>
            <div>
              <div className="text-xs text-[#6B6B6B]">Next renewal</div>
              <div className="text-sm font-medium text-black mt-0.5">{formatDate(owned.nextRenewal)}</div>
            </div>
          </div>
        </>
      )}

      <div className="px-5 py-4 border-t border-[#E5E5E5]">
        <PriceAlertToggle subscriptionId={sub.id} />
      </div>
    </div>
  );
}
