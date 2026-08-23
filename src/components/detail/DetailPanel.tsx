"use client";

import { useMemo, useState } from "react";
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
import { VerificationBadge } from "@/components/detail/VerificationBadge";
import { useUniverseStore } from "@/store/useUniverseStore";
import { useMySubscriptionsStore } from "@/store/useMySubscriptionsStore";
import { SUBSCRIPTIONS_BY_ID, bestSavingsAlternative, potentialSavingsMonthly } from "@/data/subscriptions";
import { VERIFICATION_BY_ID } from "@/data/verification";
import { getProviderUrl, rankAlternatives } from "@/lib/subscriptionIntelligence";
import { canClaimSavings } from "@/lib/verification/claims";
import { FRESHNESS_DAYS } from "@/lib/verification/freshness";
import { cn, formatDate, formatINR } from "@/lib/utils";
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
    <ResponsiveSheet open={Boolean(sub)} onClose={handleClose} title={sub?.category ?? ""} desktopVariant="side">
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

  const [kept, setKept] = useState(false);
  const [shared, setShared] = useState(false);
  const [switchingPlan, setSwitchingPlan] = useState(false);

  const alternatives = useMemo(() => rankAlternatives(sub, 5), [sub]);
  const savingsAlt = bestSavingsAlternative(sub);
  const savings = potentialSavingsMonthly(sub);
  const providerUrl = getProviderUrl(sub);
  const verification = VERIFICATION_BY_ID[sub.id];
  const savingsVerified = savingsAlt ? canClaimSavings(verification, VERIFICATION_BY_ID[savingsAlt.id]) : false;

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
      {/* 1. What is this? */}
      <div className="px-4 pt-4 pb-3 border-b border-line-soft">
        <div className="flex items-start gap-3">
          <SubscriptionLogo subscription={sub} size="lg" ring={isOwned} bare />
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-lg font-semibold text-ink-0 truncate">{sub.name}</h2>
            <p className="mt-0.5 text-sm text-ink-300 line-clamp-2">{sub.tagline}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Badge tone="aurora">{sub.category}</Badge>
              <Badge tone="neutral">{sub.region}</Badge>
              {sub.isNew && <Badge tone="nebula">New</Badge>}
              {isOwned && <Badge tone="nebula">In your universe</Badge>}
            </div>
          </div>
        </div>

        <div className="mt-3">
          <VerificationBadge field={verification.price} freshnessDays={FRESHNESS_DAYS.price} />
        </div>

        <div className="mt-3 flex items-end justify-between">
          <div>
            <div className="font-display text-2xl font-semibold text-ink-0">{formatINR(sub.priceMonthly)}</div>
            {sub.priceMonthly > 0 && <div className="text-xs text-ink-500">per month, {sub.billing.includes("annual") ? "billed monthly or annually" : "billed monthly"}</div>}
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold text-gold-400">★ {sub.rating.toFixed(1)}</div>
            <div className="text-xs text-ink-500">{sub.popularity}% Submynt Popularity</div>
          </div>
        </div>
      </div>

      {/* 2. Is it right for me? */}
      <InsightSection sub={sub} />

      {/* 3. What does it really cost? */}
      <PlansSection sub={sub} verification={verification} />

      {/* 4. Can I get something better or cheaper? */}
      {savingsAlt && savings > 0 && (
        <SavingsSection
          sub={sub}
          alternative={savingsAlt}
          monthlySavings={savings}
          verified={savingsVerified}
          onViewAlternative={() => openAlternative(savingsAlt.id)}
        />
      )}
      <AlternativesSection alternatives={alternatives} onSelect={openAlternative} />

      {/* 5. What should I do next? */}
      <div className="px-4 py-3 border-b border-line-soft">
        <div className="grid grid-cols-2 gap-2">
          {sub.dealUrl ? (
            <Button href={sub.dealUrl} target="_blank" rel="noopener noreferrer" className="col-span-2">
              Get Deal →
            </Button>
          ) : providerUrl ? (
            <Button href={providerUrl} target="_blank" rel="noopener noreferrer" className="col-span-2">
              Visit Provider →
            </Button>
          ) : null}
          <Button variant="outline" size="sm" onClick={handleCompare} className={cn(!sub.dealUrl && !providerUrl && "col-span-2")}>
            <Scale size={14} />
            Compare
          </Button>
          {(sub.dealUrl || providerUrl) && (
            <Button variant="ghost" size="sm" onClick={handleShare}>
              <Share2 size={14} />
              {shared ? "Link copied" : "Share"}
            </Button>
          )}
        </div>
        {!sub.dealUrl && !providerUrl && (
          <Button variant="ghost" size="sm" className="mt-2 w-full" onClick={handleShare}>
            <Share2 size={14} />
            {shared ? "Link copied" : "Share"}
          </Button>
        )}
      </div>

      <SubscriptionStatusPicker sub={sub} />

      {isOwned && owned && (
        <>
          <div className="px-4 py-3 border-b border-line-soft">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={kept ? "secondary" : "primary"}
                onClick={() => {
                  setKept(true);
                  setTimeout(() => setKept(false), 1500);
                }}
              >
                {kept ? <Check size={16} /> : <Heart size={16} />}
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
              className="mt-2 w-full text-red-300 hover:text-red-200"
              onClick={() => removeOwned(owned.ownedId)}
            >
              <Trash2 size={14} />
              Remove
            </Button>
          </div>

          {switchingPlan && (
            <div className="px-4 py-3 border-b border-line-soft bg-black/[0.02]">
              <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-ink-500">Choose a plan</h4>
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
                    className="flex flex-col items-start rounded-xl border border-black/10 bg-void-900/60 px-3 py-2 text-left hover:border-aurora-500/40 transition-colors cursor-pointer"
                  >
                    <span className="text-xs text-ink-300">{plan.name} · {BILLING_LABELS[plan.billing]}</span>
                    <span className="text-sm font-semibold text-ink-0">{formatINR(plan.priceMonthly)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="px-4 py-3 border-b border-line-soft grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-ink-500">Current plan</div>
              <div className="text-sm font-medium text-ink-0 mt-0.5">{owned.planName}</div>
            </div>
            <div>
              <div className="text-xs text-ink-500">Next renewal</div>
              <div className="text-sm font-medium text-ink-0 mt-0.5">{formatDate(owned.nextRenewal)}</div>
            </div>
          </div>
        </>
      )}

      <div className="px-4 py-3">
        <PriceAlertToggle subscriptionId={sub.id} />
      </div>
    </div>
  );
}
