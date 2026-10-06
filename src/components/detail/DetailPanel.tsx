"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Heart, Plus, Repeat, Scale, Share2, Sparkle, Trash2, X } from "lucide-react";
import { ResponsiveSheet } from "@/components/ui/ResponsiveSheet";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { SubscriptionLogo } from "@/components/subscriptions/SubscriptionLogo";
import { PlansSection } from "@/components/detail/PlansSection";
import { SavingsSection } from "@/components/detail/SavingsSection";
import { AlternativesSection } from "@/components/detail/AlternativesSection";
import { SubscriptionStatusPicker } from "@/components/detail/SubscriptionStatusPicker";
import { RecommendationCard } from "@/components/recommendations/RecommendationCard";
import { useUniverseStore } from "@/store/useUniverseStore";
import { useMySubscriptionsStore } from "@/store/useMySubscriptionsStore";
import { useSubscriptionStatusStore } from "@/store/useSubscriptionStatusStore";
import { useDemandSignalsStore } from "@/store/useDemandSignalsStore";
import { SUBSCRIPTIONS_BY_ID, bestSavingsAlternative, isRecentlyAdded, potentialSavingsMonthly } from "@/data/subscriptions";
import { VERIFICATION_BY_ID } from "@/data/verification";
import { computeBestFor, getProviderUrl, rankAlternatives } from "@/lib/subscriptionIntelligence";
import { getRecommendation } from "@/lib/recommendations";
import { canClaimSavings } from "@/lib/verification/claims";
import { cn, cycleSuffix, formatDate, formatINR, formatOwnedPrice, formatPrice, ownedPriceAmount, planCycleAmount } from "@/lib/utils";
import { BILLING_LABELS } from "@/data/categories";
import { bundleOptionsFor } from "@/components/onboarding/ServiceDetailsCard";
import { computeSubmyntScore } from "@/lib/submyntScore";
import { accessChipFor, scoreBand } from "@/lib/trackPresentation";
import { requireSignIn } from "@/lib/auth/requireSignIn";
import { useAuthStore } from "@/store/useAuthStore";
import { trackEvent } from "@/lib/events";
import type { BillingCycle, BundleProvider, OwnedSubscription, Subscription, UsageFrequency } from "@/types/subscription";

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

  const owned = useMySubscriptionsStore((s) => s.getOwned(sub.id));
  const removeOwnedRaw = useMySubscriptionsStore((s) => s.remove);
  const updatePlanRaw = useMySubscriptionsStore((s) => s.updatePlan);
  const updateUsageFrequencyRaw = useMySubscriptionsStore((s) => s.updateUsageFrequency);
  const updateBundleProviderRaw = useMySubscriptionsStore((s) => s.updateBundleProvider);
  // Changing or removing a tracked item needs an account: signed out, these
  // start Google sign-in instead (requireSignIn). The store actions
  // themselves are unchanged.
  const removeOwned: typeof removeOwnedRaw = (...args) => void requireSignIn(() => removeOwnedRaw(...args));
  // A plan switch is an edit of the existing entry (plan fields only) and
  // logs the plan pick alongside it.
  const switchPlan = (ownedId: string, plan: Parameters<typeof updatePlanRaw>[1]) =>
    void requireSignIn(() => {
      trackEvent("plan_selected", { service_id: sub.id, plan_id: plan.planName });
      updatePlanRaw(ownedId, plan);
    });
  const updateUsageFrequency: typeof updateUsageFrequencyRaw = (...args) =>
    void requireSignIn(() => updateUsageFrequencyRaw(...args));
  const updateBundleProvider: typeof updateBundleProviderRaw = (...args) =>
    void requireSignIn(() => updateBundleProviderRaw(...args));
  const ownedList = useMySubscriptionsStore((s) => s.owned);
  const savedStatus = useSubscriptionStatusStore((s) => s.statuses[sub.id]);
  const setSavedStatus = useSubscriptionStatusStore((s) => s.setStatus);
  const clearSavedStatus = useSubscriptionStatusStore((s) => s.clearStatus);
  const recordDemand = useDemandSignalsStore((s) => s.record);

  const pendingDetailTab = useUniverseStore((s) => s.pendingDetailTab);
  const clearPendingDetailTab = useUniverseStore((s) => s.clearPendingDetailTab);

  // A one-shot "alternatives" deep link (selectWithTab, e.g. an "Explore
  // Alternative" CTA) opens "More" and scrolls to Alternatives — read once,
  // when the panel mounts, via the lazy initializers.
  const [moreOpen, setMoreOpen] = useState(() => pendingDetailTab === "alternatives");
  const scrollToAlternatives = useRef(pendingDetailTab === "alternatives");
  const alternativesRef = useRef<HTMLDivElement>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [shared, setShared] = useState(false);
  const [switchingPlan, setSwitchingPlan] = useState(false);

  useEffect(() => {
    if (pendingDetailTab) clearPendingDetailTab();
  }, [pendingDetailTab, clearPendingDetailTab]);

  useEffect(() => {
    if (!moreOpen || !scrollToAlternatives.current) return;
    scrollToAlternatives.current = false;
    alternativesRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [moreOpen]);

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

  // "Saved" (interested in) is a lightweight, non-owning signal —
  // useSubscriptionStatusStore's "considering" state — deliberately
  // decoupled from real ownership (useMySubscriptionsStore). Adding a real
  // tracked subscription only happens through the add flow.
  const isSaved = savedStatus === "considering";

  function handleToggleSaved() {
    if (isSaved) {
      clearSavedStatus(sub.id);
    } else {
      setSavedStatus(sub.id, "considering");
    }
  }

  // Same as the status picker's "Currently subscribed": opens the add flow
  // pre-filled with this service (its own sign-in gate handles signed out).
  function handleAdd() {
    if (useAuthStore.getState().user) clearSavedStatus(sub.id);
    useUniverseStore.getState().setAddSubscriptionsModalOpen(true, sub.id, false, "detail_panel");
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
      {/* Compact header: logo, name, close. Untracked also shows the
          catalogue price here (tracked shows the user's own in the card). */}
      <div className="flex items-center gap-3 px-5 pb-3 pt-5">
        <SubscriptionLogo subscription={sub} size="md" />
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-display text-lg font-semibold text-black">{sub.name}</h2>
          <p className="truncate text-xs text-[#6B6B6B]">
            {sub.category}
            {!owned && ` · ${priceLine}`}
          </p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#E5E5E5] text-[#6B6B6B] transition-colors hover:border-black/20 hover:text-black cursor-pointer"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1">
        {owned ? (
          <TrackedBody
            sub={sub}
            owned={owned}
            switchingPlan={switchingPlan}
            setSwitchingPlan={setSwitchingPlan}
            switchPlan={switchPlan}
            removeOwned={removeOwned}
            editOpen={editOpen}
            setEditOpen={setEditOpen}
            updateUsageFrequency={updateUsageFrequency}
            updateBundleProvider={updateBundleProvider}
          />
        ) : (
          <div className="flex flex-col">
            <PlansSection sub={sub} />
            {sub.plans.length === 0 && <p className="px-5 py-4 text-sm text-[#6B6B6B]">No published plans — contact the provider for pricing.</p>}
            <div className="flex gap-2 px-5 pb-4">
              <Button className="flex-1" onClick={handleAdd}>
                <Plus size={14} />
                I have this — add
              </Button>
              <Button variant="outline" onClick={handleToggleSaved} aria-pressed={isSaved}>
                <Heart size={14} className={isSaved ? "fill-current text-rose-500" : ""} />
                {isSaved ? "Saved" : "Save"}
              </Button>
            </div>
          </div>
        )}

        {/* Secondary info, collapsed */}
        <div className="border-t border-[#E5E5E5]">
          <button
            type="button"
            onClick={() => setMoreOpen((v) => !v)}
            aria-expanded={moreOpen}
            className="flex w-full items-center justify-between px-5 py-3 text-sm font-semibold text-black cursor-pointer"
          >
            More
            <ChevronDown size={16} className={cn("text-[#6B6B6B] transition-transform", moreOpen && "rotate-180")} />
          </button>
          {moreOpen && (
            <div className="flex flex-col divide-y divide-[#E5E5E5] border-t border-[#E5E5E5]">
              <AboutSection sub={sub} bestFor={bestFor} />
              <div ref={alternativesRef} className="scroll-mt-2">
                <h4 className="px-5 pt-4 text-[11px] font-semibold uppercase tracking-wider text-[#6B6B6B]">Alternatives</h4>
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
              </div>
              <div className="flex items-center gap-1 px-3 py-3">
                {!owned && (
                  <Button variant="ghost" size="sm" onClick={handleCompare}>
                    <Scale size={14} />
                    Compare
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={handleShare}>
                  <Share2 size={14} />
                  {shared ? "Link copied" : "Share"}
                </Button>
              </div>
              <div className="px-5 py-4">
                {owned ? <SubscriptionStatusPicker sub={sub} /> : <SubscriptionStatusPicker sub={sub} only={["trial", "cancelled"]} />}
              </div>
            </div>
          )}
        </div>
      </div>

      {ctaHref && (
        <div className="sticky bottom-0 shrink-0 border-t border-[#E5E5E5] bg-white px-5 py-3">
          <Button
            href={ctaHref}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full"
            onClick={() => recordDemand(sub.id, "clickThroughs")}
          >
            {ctaLabel}
          </Button>
        </div>
      )}
    </div>
  );
}

function TsTapTile({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg px-2 py-1.5 text-xs font-medium transition-colors cursor-pointer"
      style={
        active
          ? { border: "1px solid var(--ts-mint-500)", background: "var(--ts-mint-tint)", color: "var(--ts-mint-400)" }
          : { border: "1px solid var(--ts-border)", background: "var(--ts-card)", color: "var(--ts-ink-300)" }
      }
    >
      {children}
    </button>
  );
}

const USAGE_FREQUENCY_OPTIONS: { value: UsageFrequency; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "rarely", label: "Rarely" },
  { value: "never", label: "Never" },
];

/** Tracked: "Your plan" card with its actions, the one-line score, and the
 * editable details collapsed under "Edit details". */
function TrackedBody({
  sub,
  owned,
  switchingPlan,
  setSwitchingPlan,
  switchPlan,
  removeOwned,
  editOpen,
  setEditOpen,
  updateUsageFrequency,
  updateBundleProvider,
}: {
  sub: Subscription;
  owned: OwnedSubscription;
  switchingPlan: boolean;
  setSwitchingPlan: (fn: (v: boolean) => boolean) => void;
  switchPlan: (ownedId: string, plan: { planName: string; priceAmount: number; billing: BillingCycle }) => void;
  removeOwned: (ownedId: string) => void;
  editOpen: boolean;
  setEditOpen: (fn: (v: boolean) => boolean) => void;
  updateUsageFrequency: (ownedId: string, usageFrequency: UsageFrequency) => void;
  updateBundleProvider: (ownedId: string, bundleProvider: BundleProvider | undefined) => void;
}) {
  const accessType = owned.accessType ?? "direct";
  const amount = ownedPriceAmount(owned);
  const scoreResult = computeSubmyntScore(sub, accessType, owned.usageFrequency);

  return (
    <div className="ts-theme mx-5 mb-4 flex flex-col gap-3 rounded-2xl p-3" style={{ background: "var(--ts-bg)" }}>
      <div className="ts-card p-3.5">
        <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--ts-ink-500)" }}>
          Your plan
        </div>
        <div className="mt-1 flex flex-wrap items-baseline gap-x-2">
          <span className="ts-tabular font-display text-2xl font-bold" style={{ color: "var(--ts-ink-0)" }}>
            {formatOwnedPrice(amount, accessType)}
            {amount > 0 && (
              <span className="text-sm font-medium" style={{ color: "var(--ts-ink-500)" }}>
                {cycleSuffix(owned.billing)}
              </span>
            )}
          </span>
          {amount > 0 && owned.billing !== "monthly" && owned.priceMonthly > 0 && (
            <span className="ts-tabular text-xs" style={{ color: "var(--ts-ink-500)" }}>
              ≈ {formatINR(owned.priceMonthly)}/mo
            </span>
          )}
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
          <div className="min-w-0">
            <dt style={{ color: "var(--ts-ink-500)" }}>Plan</dt>
            <dd className="truncate font-medium" style={{ color: "var(--ts-ink-0)" }}>
              {owned.planName || "—"}
            </dd>
          </div>
          <div>
            <dt style={{ color: "var(--ts-ink-500)" }}>Next renewal</dt>
            <dd className="font-medium" style={{ color: "var(--ts-ink-0)" }}>
              {formatDate(owned.nextRenewal)}
            </dd>
          </div>
          <div className="min-w-0">
            <dt style={{ color: "var(--ts-ink-500)" }}>How you get it</dt>
            <dd className="truncate font-medium" style={{ color: "var(--ts-ink-0)" }}>
              {accessChipFor(owned).label}
            </dd>
          </div>
          {accessType === "promotional" && owned.promoEndDate && (
            <div>
              <dt style={{ color: "var(--ts-ink-500)" }}>Promo ends</dt>
              <dd className="font-medium" style={{ color: "var(--ts-amber)" }}>
                {formatDate(owned.promoEndDate)}
              </dd>
            </div>
          )}
        </dl>
        <div className="mt-3 flex gap-2">
          {sub.plans.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              style={{ color: "var(--ts-ink-300)" }}
              onClick={() => setSwitchingPlan((v) => !v)}
              aria-expanded={switchingPlan}
            >
              <Repeat size={14} />
              Switch plan
            </Button>
          )}
          <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600" onClick={() => removeOwned(owned.ownedId)}>
            <Trash2 size={14} />
            Remove
          </Button>
        </div>
        {switchingPlan && (
          <div className="mt-3 grid grid-cols-2 gap-1.5">
            {sub.plans.map((plan) => (
              <button
                key={plan.name}
                onClick={() => {
                  switchPlan(owned.ownedId, {
                    planName: plan.name,
                    priceAmount: planCycleAmount(plan),
                    billing: plan.billing,
                  });
                  setSwitchingPlan(() => false);
                }}
                className="flex flex-col items-start rounded-lg px-3 py-2 text-left transition-colors cursor-pointer"
                style={{ border: "1px solid var(--ts-border)", background: "var(--ts-bg)" }}
              >
                <span className="text-xs" style={{ color: "var(--ts-ink-500)" }}>
                  {plan.name.toLowerCase() === BILLING_LABELS[plan.billing].toLowerCase()
                    ? plan.name
                    : `${plan.name} · ${BILLING_LABELS[plan.billing]}`}
                </span>
                {/* What the plan charges per its own cycle (₹804/year), not
                    the catalogue's monthly equivalent. */}
                <span className="ts-tabular text-sm font-semibold" style={{ color: "var(--ts-ink-0)" }}>
                  {formatINR(planCycleAmount(plan))}
                  {planCycleAmount(plan) > 0 && cycleSuffix(plan.billing)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <p className="flex gap-1.5 px-1 text-xs leading-snug" style={{ color: "var(--ts-ink-300)" }}>
        <Sparkle size={12} className="mt-0.5 shrink-0" style={{ color: "var(--ts-mint-400)" }} />
        <span>
          <span className="font-semibold">
            Submynt Score {scoreResult.score} · {scoreBand(scoreResult.score)}
          </span>
          {scoreResult.reasons.length > 0 && ` — ${scoreResult.reasons.join(" · ")}`}
        </span>
      </p>

      <div>
        <button
          type="button"
          onClick={() => setEditOpen((v) => !v)}
          aria-expanded={editOpen}
          className="flex w-full items-center justify-between px-1 py-1 text-xs font-semibold uppercase tracking-wider cursor-pointer"
          style={{ color: "var(--ts-ink-500)" }}
        >
          Edit details
          <ChevronDown size={14} className={cn("transition-transform", editOpen && "rotate-180")} />
        </button>
        {editOpen && (
          <div className="mt-2 flex flex-col gap-3">
            <div>
              <h4 className="mb-1.5 text-xs font-medium" style={{ color: "var(--ts-ink-500)" }}>
                How often do you use it?
              </h4>
              <div className="grid grid-cols-4 gap-1.5">
                {USAGE_FREQUENCY_OPTIONS.map((opt) => (
                  <TsTapTile key={opt.value} active={owned.usageFrequency === opt.value} onClick={() => updateUsageFrequency(owned.ownedId, opt.value)}>
                    {opt.label}
                  </TsTapTile>
                ))}
              </div>
            </div>
            {/* Bundle-source editor; a "Direct" tile clears it. */}
            <div>
              <h4 className="mb-1.5 text-xs font-medium" style={{ color: "var(--ts-ink-500)" }}>
                How do you get this?
              </h4>
              <div className="grid grid-cols-2 gap-1.5">
                <TsTapTile active={!owned.bundleProvider} onClick={() => updateBundleProvider(owned.ownedId, undefined)}>
                  Direct
                </TsTapTile>
                {bundleOptionsFor(sub).map((opt) => (
                  <TsTapTile
                    key={opt.value}
                    active={owned.bundleProvider === opt.value}
                    onClick={() => updateBundleProvider(owned.ownedId, opt.value)}
                  >
                    {opt.label}
                  </TsTapTile>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** About + catalogue facts, shown under "More". */
function AboutSection({ sub, bestFor }: { sub: Subscription; bestFor: string[] }) {
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

      {isRecentlyAdded(sub) && (
        <div>
          <Badge tone="nebula">New</Badge>
        </div>
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
