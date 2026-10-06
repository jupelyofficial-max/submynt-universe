"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Search, Trash2 } from "lucide-react";
import { ResponsiveSheet } from "@/components/ui/ResponsiveSheet";
import { Button } from "@/components/ui/Button";
import { SubscriptionLogo } from "@/components/subscriptions/SubscriptionLogo";
import { SUBSCRIPTIONS, SUBSCRIPTIONS_BY_ID } from "@/data/subscriptions";
import { BILLING_LABELS } from "@/data/categories";
import { BUNDLE_CATALOGUE, type BundleCatalogueEntry, type BundleId } from "@/data/bundleCatalogue";
import { cn, formatOwnedPrice } from "@/lib/utils";
import { useMySubscriptionsStore } from "@/store/useMySubscriptionsStore";
import { useUniverseStore, type AddFlowEntry } from "@/store/useUniverseStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useSubscriptionsReady } from "@/hooks/useSubscriptionsReady";
import { signInWithGoogle } from "@/lib/auth/signIn";
import { trackEvent } from "@/lib/events";
import { ServiceDetailsCard, defaultServiceDetails, type ServiceDetailsValue } from "./ServiceDetailsCard";
import { BundleConfirmManualStep, BundleConfirmPresetStep, BundlePickStep } from "./BundleFirstSteps";

type Step = "welcome" | "bundlePick" | "bundleConfirm" | "select" | "details" | "review" | "done";
const STEP_ORDER: Step[] = ["welcome", "select", "details", "review"];
const STEP_TITLES: Record<Step, string> = {
  welcome: "Track your subscriptions",
  bundlePick: "Do you have any bundles?",
  bundleConfirm: "Confirm what's included",
  select: "What do you use?",
  details: "Add the details",
  review: "Review before adding",
  done: "All set",
};

/** Default renewal date for a freshly-constructed ServiceDetailsValue —
 * mirrors defaultServiceDetails's own 30-day default exactly. */
function defaultRenewal(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 10);
}

/** A bundle-confirmed service's details — accessType/bundleProvider come
 * from the bundle itself, price is 0/included, reusing the exact same
 * ServiceDetailsValue shape (and so the exact same add() write path) as
 * the individual flow below. Family writes accessType "family" (its own
 * existing category, not "bundled") with bundleProvider "family" too, so
 * it still groups correctly in groupByBundleProvider. */
function bundledServiceDetails(bundle: BundleCatalogueEntry): ServiceDetailsValue {
  return {
    accessType: bundle.id === "family" ? "family" : "bundled",
    bundleProvider: bundle.bundleProvider,
    planName: "Bundled",
    priceMonthly: 0,
    billing: "monthly",
    nextRenewal: defaultRenewal(),
    usageFrequency: undefined,
    promoEndDate: undefined,
  };
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

  const [step, setStep] = useState<Step>(startAtBundlePick ? "bundlePick" : preselectId ? "details" : "welcome");
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>(preselectId ? [preselectId] : []);
  const [details, setDetails] = useState<Record<string, ServiceDetailsValue>>(() =>
    preselectId && SUBSCRIPTIONS_BY_ID[preselectId]
      ? { [preselectId]: defaultServiceDetails(SUBSCRIPTIONS_BY_ID[preselectId]) }
      : {}
  );
  const [addedCount, setAddedCount] = useState(0);

  // --- Bundle-first flow state ---
  const [selectedBundles, setSelectedBundles] = useState<BundleId[]>([]);
  const [bundleConfirmIndex, setBundleConfirmIndex] = useState(0);
  // Only explicit flips are stored; the effective on/off value is derived
  // (see effectivePresetOn) so an already-tracked service still defaults
  // off without needing an upfront init pass over the whole catalogue.
  const [presetOverrides, setPresetOverrides] = useState<Record<string, boolean>>({});
  const [manualPicks, setManualPicks] = useState<Record<BundleId, string[]>>({ "airtel-black": [], jio: [], family: [], employer: [] });
  const [bundleAddedCount, setBundleAddedCount] = useState(0);
  // Which confirmed bundle each bundle-added service came from, so the
  // final confirm can log bundle_added per bundle.
  const [bundleOf, setBundleOf] = useState<Record<string, BundleId>>({});

  const currentBundle: BundleCatalogueEntry | undefined = BUNDLE_CATALOGUE.find((b) => b.id === selectedBundles[bundleConfirmIndex]);

  function effectivePresetOn(bundleId: BundleId, serviceId: string, defaultOn: boolean): boolean {
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

  // Merges every confirmed bundle service into the same selectedIds/
  // details state the individual flow already uses below — one shared
  // write path, committed together at the final "Confirm & Add".
  function finishBundlePhase(bundles: BundleId[]) {
    const mergedIds: string[] = [];
    const mergedDetails: Record<string, ServiceDetailsValue> = {};
    const mergedBundleOf: Record<string, BundleId> = {};
    for (const bundleId of bundles) {
      const bundle = BUNDLE_CATALOGUE.find((b) => b.id === bundleId);
      if (!bundle) continue;
      const serviceIds = bundle.hasPresetList
        ? bundle.includedServices.filter((item) => effectivePresetOn(bundleId, item.serviceId, item.defaultOn ?? true)).map((item) => item.serviceId)
        : manualPicks[bundleId] ?? [];
      for (const serviceId of serviceIds) {
        if (mergedDetails[serviceId]) continue; // already added from an earlier selected bundle
        if (!SUBSCRIPTIONS_BY_ID[serviceId]) continue;
        mergedIds.push(serviceId);
        mergedDetails[serviceId] = bundledServiceDetails(bundle);
        mergedBundleOf[serviceId] = bundleId;
      }
    }
    setSelectedIds((prev) => [...prev, ...mergedIds.filter((id) => !prev.includes(id))]);
    setDetails((prev) => ({ ...prev, ...mergedDetails }));
    setBundleOf((prev) => ({ ...prev, ...mergedBundleOf }));
    setBundleAddedCount(mergedIds.length);
    setStep("select");
  }

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pool = q
      ? SUBSCRIPTIONS.filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            s.provider.toLowerCase().includes(q) ||
            s.category.toLowerCase().includes(q) ||
            s.tags.some((t) => t.toLowerCase().includes(q))
        )
      : SUBSCRIPTIONS;
    return [...pool].sort((a, b) => b.popularity - a.popularity).slice(0, q ? 40 : 30);
  }, [query]);

  function toggleSelected(id: string) {
    trackEvent(selectedIds.includes(id) ? "service_deselected" : "service_selected", { service_id: id });
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      return [...prev, id];
    });
    setDetails((prev) => {
      if (prev[id]) return prev;
      const sub = SUBSCRIPTIONS_BY_ID[id];
      return sub ? { ...prev, [id]: defaultServiceDetails(sub) } : prev;
    });
  }

  function removeSelected(id: string) {
    trackEvent("service_deselected", { service_id: id });
    setSelectedIds((prev) => prev.filter((x) => x !== id));
    setDetails((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  function goToDetails() {
    // Backfill details for anything selected before it had a default (guards
    // against the toggle/details-init race for a rapid multi-select).
    setDetails((prev) => {
      const next = { ...prev };
      for (const id of selectedIds) {
        if (!next[id] && SUBSCRIPTIONS_BY_ID[id]) next[id] = defaultServiceDetails(SUBSCRIPTIONS_BY_ID[id]);
      }
      return next;
    });
    setStep("details");
  }

  function handleConfirm() {
    for (const id of selectedIds) {
      const entry = details[id];
      if (!entry) continue;
      addOwned({
        subscriptionId: id,
        planName: entry.planName || SUBSCRIPTIONS_BY_ID[id]?.name || "Plan",
        priceMonthly: entry.priceMonthly,
        billing: entry.billing,
        nextRenewal: entry.nextRenewal,
        accessType: entry.accessType,
        bundleProvider: entry.bundleProvider,
        usageFrequency: entry.usageFrequency,
        promoEndDate: entry.promoEndDate,
      });
    }
    const servicesPerBundle = new Map<BundleId, number>();
    for (const id of selectedIds) {
      const bundleId = bundleOf[id];
      if (bundleId && details[id]) servicesPerBundle.set(bundleId, (servicesPerBundle.get(bundleId) ?? 0) + 1);
    }
    for (const [bundleId, count] of servicesPerBundle) trackEvent("bundle_added", { bundle_id: bundleId, service_count: count });
    setAddedCount(selectedIds.length);
    setStep("done");
  }

  function goToTrackPage() {
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
        <div className="flex gap-1 px-5 pt-3">
          {STEP_ORDER.map((s, i) => (
            <div key={s} className={cn("h-1 flex-1 rounded-full", i <= stepIndex ? "bg-nebula-500" : "bg-black/10")} />
          ))}
        </div>
      )}

      <div className="max-h-[65vh] overflow-y-auto px-5 py-4">
        {step === "welcome" && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <p className="font-display text-lg text-ink-0">Track what you&apos;re actually paying for</p>
            <p className="max-w-sm text-sm text-ink-400">
              No bank connection required. Tracked subscriptions power your monthly and annual spend totals, your
              Submynt Score, renewal reminders, and bundle and savings recommendations.
            </p>
          </div>
        )}

        {step === "bundlePick" && <BundlePickStep selected={selectedBundles} onToggle={toggleBundleSelected} />}

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
            />
          ) : (
            <BundleConfirmManualStep
              bundle={currentBundle}
              picked={manualPicks[currentBundle.id] ?? []}
              onTogglePick={(serviceId) => toggleManualPick(currentBundle.id, serviceId)}
            />
          )
        )}

        {step === "select" && (
          <div className="flex flex-col gap-3">
            {bundleAddedCount > 0 && (
              <div className="rounded-xl bg-nebula-500/10 px-3 py-2 text-xs text-nebula-400">
                {bundleAddedCount} subscription{bundleAddedCount === 1 ? "" : "s"} already added from your bundles.
              </div>
            )}
            {selectedBundles.length === 0 && (
              <button
                type="button"
                onClick={() => setStep("bundlePick")}
                className="self-start text-xs font-medium text-nebula-400 hover:text-nebula-500 cursor-pointer"
              >
                Add from a bundle instead →
              </button>
            )}
            <div className="relative">
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search subscriptions…"
                className="w-full rounded-xl border border-black/10 bg-void-900/70 py-2.5 pl-9 pr-3 text-sm text-ink-0 outline-none placeholder:text-ink-500 focus:border-aurora-500/50"
              />
            </div>
            {selectedIds.length > 0 && (
              <p className="text-xs text-ink-400">{selectedIds.length} selected</p>
            )}
            <div className="flex flex-col gap-1.5">
              {results.map((sub) => {
                const active = selectedIds.includes(sub.id);
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => toggleSelected(sub.id)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border px-3 py-2 text-left transition-colors cursor-pointer",
                      active ? "border-nebula-500 bg-nebula-500/10" : "border-black/10 hover:border-black/20"
                    )}
                  >
                    <SubscriptionLogo subscription={sub} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-ink-0">{sub.name}</div>
                      <div className="truncate text-xs text-ink-500">{sub.category}</div>
                    </div>
                    <div
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                        active ? "border-nebula-500 bg-nebula-500 text-white" : "border-black/15"
                      )}
                    >
                      {active && <Check size={12} />}
                    </div>
                  </button>
                );
              })}
              {results.length === 0 && <p className="py-6 text-center text-sm text-ink-500">No matches.</p>}
            </div>
          </div>
        )}

        {step === "details" && (
          <div className="flex flex-col gap-3">
            {selectedIds.map((id) => {
              const sub = SUBSCRIPTIONS_BY_ID[id];
              const value = details[id];
              if (!sub || !value) return null;
              return (
                <ServiceDetailsCard
                  key={id}
                  sub={sub}
                  value={value}
                  onChange={(next) => setDetails((prev) => ({ ...prev, [id]: next }))}
                />
              );
            })}
          </div>
        )}

        {step === "review" && (
          <div className="flex flex-col gap-2">
            {selectedIds.map((id) => {
              const sub = SUBSCRIPTIONS_BY_ID[id];
              const value = details[id];
              if (!sub || !value) return null;
              return (
                <div key={id} className="flex items-center gap-3 rounded-xl border border-black/10 px-3 py-2.5">
                  <SubscriptionLogo subscription={sub} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-ink-0">{sub.name}</div>
                    <div className="truncate text-xs text-ink-500">
                      {value.accessType === "bundled" || value.accessType === "family"
                        ? `${value.accessType} · ${value.bundleProvider ?? "unspecified"}`
                        : value.accessType}
                      {" · "}
                      {value.planName || "Plan"} · {BILLING_LABELS[value.billing]}
                    </div>
                  </div>
                  <div className="shrink-0 text-right text-sm font-semibold text-ink-0">
                    {formatOwnedPrice(value.priceMonthly, value.accessType)}
                    {value.priceMonthly > 0 && "/mo"}
                  </div>
                  <button
                    onClick={() => removeSelected(id)}
                    aria-label={`Remove ${sub.name}`}
                    className="shrink-0 text-ink-500 hover:text-red-400 cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {step === "done" && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-nebula-500/15 text-nebula-400">
              <Check size={26} />
            </span>
            <p className="font-display text-lg font-semibold text-ink-0">
              {addedCount} subscription{addedCount === 1 ? "" : "s"} added
            </p>
            <p className="text-sm text-ink-400">They&apos;re now in Track Subscriptions.</p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-black/10 px-5 py-4">
        {step === "welcome" && (
          <>
            <Button variant="ghost" onClick={() => setStep("bundlePick")}>
              Add from a bundle
            </Button>
            <Button onClick={() => setStep("select")}>Get started</Button>
          </>
        )}
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
            <Button onClick={proceedFromBundleConfirm}>
              {bundleConfirmIndex + 1 < selectedBundles.length ? "Next bundle" : "Continue"}
            </Button>
          </>
        )}
        {step === "select" && (
          <>
            <Button variant="ghost" onClick={() => setStep(selectedBundles.length > 0 ? "bundlePick" : "welcome")}>
              Back
            </Button>
            <Button onClick={goToDetails} disabled={selectedIds.length === 0}>
              Continue
            </Button>
          </>
        )}
        {step === "details" && (
          <>
            <Button variant="ghost" onClick={() => setStep("select")}>
              Back
            </Button>
            <Button onClick={() => setStep("review")}>Review</Button>
          </>
        )}
        {step === "review" && (
          <>
            <Button variant="ghost" onClick={() => setStep("details")}>
              Back
            </Button>
            <Button onClick={handleConfirm} disabled={selectedIds.length === 0}>
              Confirm & Add
            </Button>
          </>
        )}
        {step === "done" && (
          <>
            <Button variant="ghost" className="flex-1" onClick={onClose}>
              Done
            </Button>
            <Button className="flex-1" onClick={goToTrackPage}>
              View Track Subscriptions
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
