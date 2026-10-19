"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ResponsiveSheet } from "@/components/ui/ResponsiveSheet";
import { Button } from "@/components/ui/Button";
import { SUBSCRIPTIONS_BY_ID } from "@/data/subscriptions";
import { BUNDLE_CATALOGUE, type BundleCatalogueEntry, type BundleId } from "@/data/bundleCatalogue";
import { cn, ownedPriceAmount } from "@/lib/utils";
import type { BillingCycle } from "@/types/subscription";
import { useMySubscriptionsStore } from "@/store/useMySubscriptionsStore";
import { useUniverseStore, type AddFlowEntry } from "@/store/useUniverseStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useSubscriptionsReady } from "@/hooks/useSubscriptionsReady";
import { signInWithGoogle } from "@/lib/auth/signIn";
import { trackEvent } from "@/lib/events";
import { monthlyTotal, type Coverage, type QuickItem } from "@/lib/quickAdd";
import { QuickConfirmScreen, QuickSelectScreen, useQuickAdd } from "./QuickAddStep";
import { catalogPriceFor, type ServiceDetailsValue } from "./ServiceDetailsCard";
import { BundleConfirmManualStep, BundleConfirmPresetStep, BundlePickStep, BundlePlanRow, type BundlePlanValue } from "./BundleFirstSteps";

/** The whole add flow is two screens — select, then confirm — plus the
 * optional "Add from a bundle" detour (bundlePick → bundleConfirm) that
 * returns to the list. */
type Step = "select" | "confirm" | "bundlePick" | "bundleConfirm";
const STEP_ORDER: Step[] = ["select", "confirm"];
const STEP_TITLES: Record<Step, string> = {
  select: "What do you use?",
  confirm: "Confirm and add",
  bundlePick: "Do you have any bundles?",
  bundleConfirm: "Confirm what's included",
};

/** Default renewal date for a freshly-constructed ServiceDetailsValue —
 * the same 30-day default the rest of the add flow uses. */
function defaultRenewal(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 10);
}

/** "Prime" for Amazon Prime, else the service's own name — the "via X" label. */
function shortName(serviceId: string): string {
  return (SUBSCRIPTIONS_BY_ID[serviceId]?.name ?? serviceId).replace(/^Amazon /, "");
}

export function AddSubscriptionsModal() {
  const isOpen = useUniverseStore((s) => s.isAddSubscriptionsModalOpen);
  const preselectId = useUniverseStore((s) => s.addSubscriptionsPreselectId);
  const startAtBundlePick = useUniverseStore((s) => s.addSubscriptionsStartAtBundlePick);
  const entry = useUniverseStore((s) => s.addSubscriptionsEntry);
  const user = useAuthStore((s) => s.user);
  const authHydrated = useAuthStore((s) => s.hydrated);
  const ready = useSubscriptionsReady();
  const close = () => useUniverseStore.getState().setAddSubscriptionsModalOpen(false);

  // Adding needs an account. Every add entry point funnels through this
  // modal's open flag, so gating here covers all of them (header button,
  // empty-state CTA, "Add from a bundle", the bundle-first steps, the
  // detail panel's "Currently subscribed", Saved's "I have this") with no
  // way to miss one. Signed out: don't open the flow — start Google
  // sign-in instead, and replay this exact action once they're back.
  useEffect(() => {
    if (!isOpen || !authHydrated || user) return;
    useUniverseStore.getState().setAddSubscriptionsModalOpen(false);
    void signInWithGoogle({ resume: { kind: "add", preselectId, startAtBundlePick }, gate: "add" });
  }, [isOpen, authHydrated, user, preselectId, startAtBundlePick]);

  // Also waits for the signed-in account to finish loading, so the flow's
  // "already tracked" defaults reflect what's actually on the account.
  const open = isOpen && Boolean(user) && ready;

  return (
    <ResponsiveSheet open={open} onClose={close} hideHeader desktopVariant="center" widthClassName="w-[560px]" panelVariant="glass">
      {open && <AddSubscriptionsFlow preselectId={preselectId} startAtBundlePick={startAtBundlePick} entry={entry} onClose={close} />}
    </ResponsiveSheet>
  );
}

function AddSubscriptionsFlow({
  preselectId,
  startAtBundlePick,
  entry,
  onClose,
}: {
  preselectId: string | null;
  startAtBundlePick: boolean;
  entry: AddFlowEntry | null;
  onClose: () => void;
}) {
  const router = useRouter();

  // Mounts once per opening of the flow (see AddSubscriptionsModal), so
  // this logs once per open; the ref guards React's dev double-effect.
  const openLogged = useRef(false);
  useEffect(() => {
    if (openLogged.current) return;
    openLogged.current = true;
    trackEvent("add_flow_opened", { entry: entry ?? "other" });
  }, [entry]);
  const addOwned = useMySubscriptionsStore((s) => s.add);
  const isOwned = useMySubscriptionsStore((s) => s.isOwned);
  const ownedList = useMySubscriptionsStore((s) => s.owned);

  // A preselected service (detail panel / Saved "I have this") goes straight
  // to the confirm screen with just that service.
  const [step, setStep] = useState<Step>(startAtBundlePick ? "bundlePick" : preselectId ? "confirm" : "select");

  const trackedIds = useMemo(() => new Set(ownedList.map((o) => o.subscriptionId)), [ownedList]);
  const quick = useQuickAdd(trackedIds, preselectId && SUBSCRIPTIONS_BY_ID[preselectId] ? [preselectId] : []);

  // quick_add_shown — once per opening of the flow, when the list first shows.
  const listShown = useRef(false);
  useEffect(() => {
    if (step !== "select" || listShown.current) return;
    listShown.current = true;
    trackEvent("quick_add_shown", { source: entry ?? "other" });
  }, [step, entry]);

  // --- Bundle-first flow state ---
  const [selectedBundles, setSelectedBundles] = useState<BundleId[]>([]);
  const [bundleConfirmIndex, setBundleConfirmIndex] = useState(0);
  // Only explicit flips are stored; the effective on/off value is derived
  // (see effectivePresetOn) so an already-tracked service still defaults
  // off without needing an upfront init pass over the whole catalogue.
  const [presetOverrides, setPresetOverrides] = useState<Record<string, boolean>>({});
  const [manualPicks, setManualPicks] = useState<Record<BundleId, string[]>>({
    "airtel-black": [],
    jio: [],
    "amazon-prime": [],
    family: [],
    employer: [],
  });
  // Each bundle's own plan (price/cycle) — only explicit edits are stored;
  // the default comes from planValueFor. planOf maps a plan's service id to
  // the bundle it was added for, so bundle_added can report it.
  const [planOverrides, setPlanOverrides] = useState<Partial<Record<BundleId, BundlePlanValue>>>({});
  const [planOf, setPlanOf] = useState<Record<string, BundleId>>({});
  const overlapLogged = useRef(new Set<string>());

  const currentBundle: BundleCatalogueEntry | undefined = BUNDLE_CATALOGUE.find((b) => b.id === selectedBundles[bundleConfirmIndex]);

  // bundle_overlap_shown — once per bundle/service per open of this flow,
  // when that bundle's confirm screen shows the "you pay directly" note.
  useEffect(() => {
    if (step !== "bundleConfirm" || !currentBundle?.hasPresetList) return;
    for (const item of currentBundle.includedServices) {
      const owned = ownedList.find((o) => o.subscriptionId === item.serviceId);
      if (!owned || (owned.accessType ?? "direct") !== "direct") continue;
      const key = `${currentBundle.id}:${item.serviceId}`;
      if (overlapLogged.current.has(key)) continue;
      overlapLogged.current.add(key);
      trackEvent("bundle_overlap_shown", { bundle_id: currentBundle.id, service_id: item.serviceId, direct_price: owned.priceMonthly });
    }
  }, [step, currentBundle, ownedList]);

  function trackedOwned(serviceId: string) {
    return ownedList.find((o) => o.subscriptionId === serviceId);
  }

  /** Included services the user already pays for directly → their monthly
   * equivalent. Shown as a possible overlap and locked off: turning one on
   * would replace the Direct row with a ₹0 bundled one. */
  function directPricesFor(bundle: BundleCatalogueEntry): Record<string, number> {
    const out: Record<string, number> = {};
    for (const item of bundle.includedServices) {
      const owned = trackedOwned(item.serviceId);
      if (owned && (owned.accessType ?? "direct") === "direct") out[item.serviceId] = owned.priceMonthly;
    }
    return out;
  }

  /** The bundle's plan as currently entered — catalogue price prefilled
   * (when the catalogue's price is this bundle's price), else blank. */
  function planValueFor(bundle: BundleCatalogueEntry): BundlePlanValue {
    const override = planOverrides[bundle.id];
    if (override) return override;
    const sub = bundle.plan ? SUBSCRIPTIONS_BY_ID[bundle.plan.serviceId] : undefined;
    const prefill = Boolean(sub && bundle.plan?.prefillPrice);
    const billing: BillingCycle =
      prefill && sub && catalogPriceFor(sub, "monthly") === null && catalogPriceFor(sub, "annual") !== null ? "annual" : "monthly";
    return { billing, priceAmount: prefill && sub ? catalogPriceFor(sub, billing) : null };
  }

  /** Same rule as the per-service form: a cycle switch prefills the
   * catalogue's price for that cycle (or clears it) — never ×12/÷12. */
  function setPlanValue(bundle: BundleCatalogueEntry, billing: BillingCycle, priceAmount: number | null) {
    const current = planValueFor(bundle);
    let next = priceAmount;
    if (billing !== current.billing) {
      const sub = bundle.plan ? SUBSCRIPTIONS_BY_ID[bundle.plan.serviceId] : undefined;
      next = sub && bundle.plan?.prefillPrice ? catalogPriceFor(sub, billing) : null;
    }
    setPlanOverrides((prev) => ({ ...prev, [bundle.id]: { billing, priceAmount: next } }));
  }

  function planMissing(bundle: BundleCatalogueEntry): boolean {
    return Boolean(bundle.plan && !trackedOwned(bundle.plan.serviceId) && planValueFor(bundle).priceAmount === null);
  }

  function effectivePresetOn(bundleId: BundleId, serviceId: string, defaultOn: boolean): boolean {
    const owned = trackedOwned(serviceId);
    if (owned && (owned.accessType ?? "direct") === "direct") return false;
    const key = `${bundleId}:${serviceId}`;
    if (key in presetOverrides) return presetOverrides[key];
    // Already tracked (e.g. added individually before) — default this
    // off rather than silently re-tagging an existing entry as bundled.
    if (isOwned(serviceId)) return false;
    return defaultOn;
  }

  function toggleBundleSelected(id: BundleId) {
    setSelectedBundles((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function togglePresetService(bundleId: BundleId, serviceId: string, defaultOn: boolean) {
    const owned = trackedOwned(serviceId);
    if (owned && (owned.accessType ?? "direct") === "direct") return;
    const current = effectivePresetOn(bundleId, serviceId, defaultOn);
    setPresetOverrides((prev) => ({ ...prev, [`${bundleId}:${serviceId}`]: !current }));
  }

  function toggleManualPick(bundleId: BundleId, serviceId: string) {
    setManualPicks((prev) => {
      const list = prev[bundleId] ?? [];
      return { ...prev, [bundleId]: list.includes(serviceId) ? list.filter((x) => x !== serviceId) : [...list, serviceId] };
    });
  }

  function proceedFromBundlePick() {
    if (selectedBundles.length === 0) {
      finishBundlePhase([]);
      return;
    }
    setBundleConfirmIndex(0);
    setStep("bundleConfirm");
  }

  function proceedFromBundleConfirm() {
    if (bundleConfirmIndex + 1 < selectedBundles.length) {
      setBundleConfirmIndex((i) => i + 1);
      return;
    }
    finishBundlePhase(selectedBundles);
  }

  // Merges every confirmed bundle's plan row (a Direct row at the entered
  // price) and included services (bundled ₹0) into the list's selection,
  // then returns to the list — one shared write path with everything else.
  function finishBundlePhase(bundles: BundleId[]) {
    const picks: string[] = [];
    const details: Record<string, ServiceDetailsValue> = {};
    const fixed: Record<string, Coverage> = {};
    const mergedPlanOf: Record<string, BundleId> = {};
    // Each bundle's own plan first, as a Direct row at the entered price —
    // that's the bundle's real cost in spend. Skipped if already tracked,
    // or already picked in the list.
    for (const bundleId of bundles) {
      const bundle = BUNDLE_CATALOGUE.find((b) => b.id === bundleId);
      const planId = bundle?.plan?.serviceId;
      const sub = planId ? SUBSCRIPTIONS_BY_ID[planId] : undefined;
      if (!bundle?.plan || !planId || !sub || trackedOwned(planId) || details[planId]) continue;
      if (quick.res.state[planId] === "direct" && planOf[planId] !== bundleId) continue;
      const plan = planValueFor(bundle);
      picks.push(planId);
      details[planId] = {
        accessType: "direct",
        planName: bundle.plan.prefillPrice ? sub.plans.find((p) => p.billing === plan.billing)?.name ?? bundle.name : bundle.name,
        priceAmount: plan.priceAmount,
        billing: plan.billing,
        nextRenewal: defaultRenewal(),
      };
      mergedPlanOf[planId] = bundleId;
    }
    for (const bundleId of bundles) {
      const bundle = BUNDLE_CATALOGUE.find((b) => b.id === bundleId);
      if (!bundle) continue;
      const serviceIds = bundle.hasPresetList
        ? bundle.includedServices.filter((item) => effectivePresetOn(bundleId, item.serviceId, item.defaultOn ?? true)).map((item) => item.serviceId)
        : manualPicks[bundleId] ?? [];
      for (const serviceId of serviceIds) {
        if (!SUBSCRIPTIONS_BY_ID[serviceId] || serviceId === bundle.plan?.serviceId || fixed[serviceId]) continue;
        // Family writes accessType "family" (its own existing category, not
        // "bundled") with bundleProvider "family" too, so it still groups
        // correctly in groupByBundleProvider.
        fixed[serviceId] = {
          parentId: bundle.plan?.serviceId ?? "",
          provider: bundle.bundleProvider,
          accessType: bundle.id === "family" ? "family" : "bundled",
          name: bundle.plan ? shortName(bundle.plan.serviceId) : bundle.name,
          bundleId,
        };
      }
    }
    quick.addFromBundles({ picks, details, fixed });
    setPlanOf((prev) => ({ ...prev, ...mergedPlanOf }));
    setStep("select");
  }

  // ---- Final add ----

  function bundleEvents(items: QuickItem[]) {
    return selectedBundles.map((bundleId) => {
      const bundle = BUNDLE_CATALOGUE.find((b) => b.id === bundleId);
      const planId = bundle?.plan?.serviceId;
      const trackedPlan = planId ? trackedOwned(planId) : undefined;
      const addedPlan = planId && planOf[planId] === bundleId ? items.find((i) => i.id === planId && i.kind === "direct")?.value : undefined;
      return {
        bundle_id: bundleId,
        service_count: items.filter((i) => i.kind === "bundled" && i.coverage?.bundleId === bundleId).length,
        // Whether the bundle's own plan is tracked once this add is done
        // (already was, or added now) — i.e. its cost is in spend.
        anchor_tracked: Boolean(trackedPlan || addedPlan),
        anchor_price: trackedPlan ? ownedPriceAmount(trackedPlan) : addedPlan?.priceAmount ?? null,
        anchor_billing_cycle: trackedPlan?.billing ?? addedPlan?.billing ?? null,
        overlap_count: bundle?.hasPresetList ? Object.keys(directPricesFor(bundle)).length : 0,
      };
    });
  }

  function goToConfirm() {
    trackEvent("quick_add_next", { count: quick.items.length });
    setStep("confirm");
  }

  // Guards a double click adding (and logging) twice before the flow closes.
  const adding = useRef(false);
  function addAll() {
    const items = quick.items;
    if (adding.current || items.length === 0) return;
    adding.current = true;
    // Worked out before the adds below change what's "already tracked".
    const bundleProps = bundleEvents(items);
    for (const item of items) {
      if (isOwned(item.id)) continue;
      const v = item.value;
      addOwned({
        subscriptionId: item.id,
        planName: v.planName || SUBSCRIPTIONS_BY_ID[item.id]?.name || "Plan",
        priceAmount: v.priceAmount ?? 0,
        billing: v.billing,
        nextRenewal: v.nextRenewal,
        accessType: v.accessType,
        bundleProvider: v.bundleProvider,
      });
    }
    for (const props of bundleProps) trackEvent("bundle_added", props);
    trackEvent("quick_add_completed", {
      count: items.length,
      total_monthly: Math.round(monthlyTotal(items) * 100) / 100,
      with_renewal_count: items.filter((i) => i.withRenewal).length,
      source: entry ?? "other",
    });
    // Back to Track, where the overlap badges and "ways to save" line the
    // page already shows for what's tracked appear on their own.
    onClose();
    router.push("/my-subscriptions");
  }

  const stepIndex = STEP_ORDER.indexOf(step);

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between border-b border-black/10 px-5 py-4">
        <h2 className="font-display text-base font-semibold text-ink-0">
          {step === "bundleConfirm" && currentBundle ? `Confirm your ${currentBundle.name}` : STEP_TITLES[step]}
        </h2>
        <button onClick={onClose} className="text-xs text-ink-400 hover:text-ink-0 cursor-pointer">
          Close
        </button>
      </div>

      {stepIndex >= 0 && (
        <div className="flex gap-1 px-5 pt-3" aria-hidden="true">
          {STEP_ORDER.map((s, i) => (
            <div key={s} className={cn("h-1 flex-1 rounded-full", i <= stepIndex ? "bg-nebula-500" : "bg-black/10")} />
          ))}
        </div>
      )}

      {step === "select" && (
        <QuickSelectScreen
          quick={quick}
          trackedIds={trackedIds}
          showBundleLink={selectedBundles.length === 0}
          onBundle={() => setStep("bundlePick")}
          onNext={goToConfirm}
        />
      )}
      {step === "confirm" && <QuickConfirmScreen quick={quick} onBack={() => setStep("select")} onConfirm={addAll} />}

      {(step === "bundlePick" || step === "bundleConfirm") && (
        <>
          <div className="max-h-[65vh] overflow-y-auto px-5 py-4">
            {step === "bundlePick" && <BundlePickStep selected={selectedBundles} onToggle={toggleBundleSelected} />}

            {step === "bundleConfirm" && currentBundle && currentBundle.plan && SUBSCRIPTIONS_BY_ID[currentBundle.plan.serviceId] && (
              <div className="ts-theme mb-3 rounded-2xl p-3" style={{ background: "var(--ts-bg)" }}>
                <BundlePlanRow
                  bundle={currentBundle}
                  tracked={trackedOwned(currentBundle.plan.serviceId)}
                  value={planValueFor(currentBundle)}
                  onChange={(billing, priceAmount) => setPlanValue(currentBundle, billing, priceAmount)}
                />
              </div>
            )}
            {step === "bundleConfirm" && currentBundle && (
              currentBundle.hasPresetList ? (
                <BundleConfirmPresetStep
                  bundle={currentBundle}
                  toggles={Object.fromEntries(
                    currentBundle.includedServices.map((item) => [
                      item.serviceId,
                      effectivePresetOn(currentBundle.id, item.serviceId, item.defaultOn ?? true),
                    ])
                  )}
                  onToggleService={(serviceId) => {
                    const item = currentBundle.includedServices.find((x) => x.serviceId === serviceId);
                    togglePresetService(currentBundle.id, serviceId, item?.defaultOn ?? true);
                  }}
                  directPrices={directPricesFor(currentBundle)}
                />
              ) : (
                <BundleConfirmManualStep
                  bundle={currentBundle}
                  picked={manualPicks[currentBundle.id] ?? []}
                  onTogglePick={(serviceId) => toggleManualPick(currentBundle.id, serviceId)}
                />
              )
            )}
          </div>

          <div className="flex items-center justify-between border-t border-black/10 px-5 py-4">
            {step === "bundlePick" && (
              <>
                <Button variant="ghost" onClick={proceedFromBundlePick}>
                  {selectedBundles.length === 0 ? "I don't have any bundles — skip" : "Skip"}
                </Button>
                <Button onClick={proceedFromBundlePick} disabled={selectedBundles.length === 0}>
                  Continue{selectedBundles.length > 0 ? ` (${selectedBundles.length})` : ""}
                </Button>
              </>
            )}
            {step === "bundleConfirm" && (
              <>
                <Button variant="ghost" onClick={() => setStep("bundlePick")}>
                  Back
                </Button>
                <Button onClick={proceedFromBundleConfirm} disabled={Boolean(currentBundle && planMissing(currentBundle))}>
                  {bundleConfirmIndex + 1 < selectedBundles.length ? "Next bundle" : "Continue"}
                </Button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
