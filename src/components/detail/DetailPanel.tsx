"use client";

import { useState } from "react";
import { Check, Heart, Repeat, Share2, Sparkles, Trash2 } from "lucide-react";
import { ResponsiveSheet } from "@/components/ui/ResponsiveSheet";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { SubscriptionLogo } from "@/components/subscriptions/SubscriptionLogo";
import { useUniverseStore } from "@/store/useUniverseStore";
import { useMySubscriptionsStore } from "@/store/useMySubscriptionsStore";
import { SUBSCRIPTIONS_BY_ID, bestSavingsAlternative, getAlternatives, potentialSavingsMonthly } from "@/data/subscriptions";
import { cn, formatDate, formatINR } from "@/lib/utils";
import { BILLING_LABELS } from "@/data/categories";

export function DetailPanel() {
  const selectedId = useUniverseStore((s) => s.selectedId);
  const select = useUniverseStore((s) => s.select);
  const sub = selectedId ? SUBSCRIPTIONS_BY_ID[selectedId] : null;

  return (
    <ResponsiveSheet open={Boolean(sub)} onClose={() => select(null)} title={sub?.category ?? ""} desktopVariant="side">
      {sub && <DetailContent subscriptionId={sub.id} />}
    </ResponsiveSheet>
  );
}

function DetailContent({ subscriptionId }: { subscriptionId: string }) {
  const sub = SUBSCRIPTIONS_BY_ID[subscriptionId];
  const select = useUniverseStore((s) => s.select);
  const sendCameraCommand = useUniverseStore((s) => s.sendCameraCommand);

  const isOwned = useMySubscriptionsStore((s) => s.isOwned(sub.id));
  const owned = useMySubscriptionsStore((s) => s.getOwned(sub.id));
  const removeOwned = useMySubscriptionsStore((s) => s.remove);
  const addOwned = useMySubscriptionsStore((s) => s.add);

  const [kept, setKept] = useState(false);
  const [shared, setShared] = useState(false);
  const [switchingPlan, setSwitchingPlan] = useState(false);

  const alternatives = getAlternatives(sub, 5);
  const savingsAlt = bestSavingsAlternative(sub);
  const savings = potentialSavingsMonthly(sub);

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

  return (
    <div className="flex flex-col">
      <div className="px-5 pt-5 pb-4 border-b border-line-soft">
        <div className="flex items-start gap-4">
          <SubscriptionLogo subscription={sub} size="xl" ring={isOwned} />
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-xl font-semibold text-ink-0 truncate">{sub.name}</h2>
            <p className="mt-1 text-sm text-ink-300 line-clamp-2">{sub.tagline}</p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              <Badge tone="aurora">{sub.category}</Badge>
              <Badge tone="neutral">{sub.region}</Badge>
              {sub.trialDays && <Badge tone="nebula">{sub.trialDays}-day free trial</Badge>}
              {sub.isNew && <Badge tone="nebula">New</Badge>}
              {isOwned && <Badge tone="nebula">In your universe</Badge>}
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-end justify-between">
          <div>
            <div className="font-display text-3xl font-semibold text-ink-0">{formatINR(sub.priceMonthly)}</div>
            {sub.priceMonthly > 0 && <div className="text-xs text-ink-500">per month, {sub.billing.includes("annual") ? "billed monthly or annually" : "billed monthly"}</div>}
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold text-gold-400">★ {sub.rating.toFixed(1)}</div>
            <div className="text-xs text-ink-500">{sub.popularity}% popularity</div>
          </div>
        </div>
      </div>

      {/* Primary actions */}
      <div className="px-5 py-4 border-b border-line-soft">
        <div className={cn("grid gap-2", isOwned ? "grid-cols-2" : "grid-cols-1")}>
          {isOwned && (
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
          )}
          <Button variant="outline" onClick={() => document.getElementById("alt-section")?.scrollIntoView({ behavior: "smooth" })}>
            Explore Alternatives
          </Button>
        </div>
        <div className="mt-2 flex gap-2">
          {isOwned && (
            <Button variant="ghost" size="sm" onClick={() => setSwitchingPlan((v) => !v)}>
              <Repeat size={14} />
              Switch Plan
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={handleShare}>
            <Share2 size={14} />
            {shared ? "Link copied" : "Share"}
          </Button>
          {isOwned && owned && (
            <Button variant="ghost" size="sm" className="ml-auto text-red-300 hover:text-red-200" onClick={() => removeOwned(owned.ownedId)}>
              <Trash2 size={14} />
              Remove
            </Button>
          )}
        </div>
      </div>

      {switchingPlan && isOwned && owned && (
        <div className="px-5 py-4 border-b border-line-soft bg-black/[0.02]">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-500">Choose a plan</h4>
          <div className="flex flex-col gap-2">
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
                className="flex items-center justify-between rounded-xl border border-black/10 bg-void-900/60 px-3.5 py-2.5 text-left hover:border-aurora-500/40 transition-colors cursor-pointer"
              >
                <span className="text-sm text-ink-0">{plan.name} · {BILLING_LABELS[plan.billing]}</span>
                <span className="text-sm font-semibold text-ink-0">{formatINR(plan.priceMonthly)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {isOwned && owned && (
        <div className="px-5 py-4 border-b border-line-soft grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-ink-500">Current plan</div>
            <div className="text-sm font-medium text-ink-0 mt-0.5">{owned.planName}</div>
          </div>
          <div>
            <div className="text-xs text-ink-500">Next renewal</div>
            <div className="text-sm font-medium text-ink-0 mt-0.5">{formatDate(owned.nextRenewal)}</div>
          </div>
        </div>
      )}

      {savings > 0 && (
        <div className="mx-5 my-4 rounded-2xl border border-gold-500/25 bg-gold-500/[0.06] p-4">
          <div className="flex items-center gap-2 text-gold-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles size={14} />
            Potential saving
          </div>
          <p className="mt-1.5 text-sm text-ink-100">
            Switching to <span className="font-semibold text-ink-0">{savingsAlt?.name}</span> could save you{" "}
            <span className="font-semibold text-gold-400">{formatINR(savings)}/month</span> — roughly{" "}
            {formatINR(savings * 12)} a year.
          </p>
          {savingsAlt && (
            <Button size="sm" variant="secondary" className="mt-3" onClick={() => openAlternative(savingsAlt.id)}>
              View {savingsAlt.name}
            </Button>
          )}
        </div>
      )}

      <div className="px-5 py-4 border-b border-line-soft">
        <h4 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-ink-500">Available plans</h4>
        <div className="flex flex-col gap-2">
          {sub.plans.map((plan) => (
            <div key={plan.name} className="flex items-center justify-between rounded-xl bg-black/[0.03] px-3.5 py-2.5">
              <span className="text-sm text-ink-100">{plan.name} · {BILLING_LABELS[plan.billing]}</span>
              <span className="text-sm font-semibold text-ink-0">{formatINR(plan.priceMonthly)}</span>
            </div>
          ))}
        </div>
      </div>

      <div id="alt-section" className="px-5 py-4">
        <h4 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-ink-500">
          Alternatives &amp; related
        </h4>
        <div className="flex flex-col gap-2">
          {alternatives.map((alt) => (
            <button
              key={alt.id}
              onClick={() => openAlternative(alt.id)}
              className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-black/5 transition-colors text-left cursor-pointer"
            >
              <SubscriptionLogo subscription={alt} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-ink-0 truncate">{alt.name}</div>
                <div className="text-xs text-ink-500">{alt.category}</div>
              </div>
              <div className="text-sm font-semibold text-ink-100 shrink-0">{formatINR(alt.priceMonthly)}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
