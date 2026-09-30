"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Search, Trash2 } from "lucide-react";
import { ResponsiveSheet } from "@/components/ui/ResponsiveSheet";
import { Button } from "@/components/ui/Button";
import { SubscriptionLogo } from "@/components/subscriptions/SubscriptionLogo";
import { SUBSCRIPTIONS, SUBSCRIPTIONS_BY_ID } from "@/data/subscriptions";
import { BILLING_LABELS } from "@/data/categories";
import { cn, formatOwnedPrice } from "@/lib/utils";
import { useMySubscriptionsStore } from "@/store/useMySubscriptionsStore";
import { useUniverseStore } from "@/store/useUniverseStore";
import { ServiceDetailsCard, defaultServiceDetails, type ServiceDetailsValue } from "./ServiceDetailsCard";

type Step = "welcome" | "select" | "details" | "review" | "done";
const STEP_ORDER: Step[] = ["welcome", "select", "details", "review"];
const STEP_TITLES: Record<Step, string> = {
  welcome: "Track your subscriptions",
  select: "What do you use?",
  details: "Add the details",
  review: "Review before adding",
  done: "All set",
};

export function AddSubscriptionsModal() {
  const isOpen = useUniverseStore((s) => s.isAddSubscriptionsModalOpen);
  const preselectId = useUniverseStore((s) => s.addSubscriptionsPreselectId);
  const close = () => useUniverseStore.getState().setAddSubscriptionsModalOpen(false);

  return (
    <ResponsiveSheet open={isOpen} onClose={close} hideHeader desktopVariant="center" widthClassName="w-[560px]" panelVariant="glass">
      {isOpen && <AddSubscriptionsFlow preselectId={preselectId} onClose={close} />}
    </ResponsiveSheet>
  );
}

function AddSubscriptionsFlow({ preselectId, onClose }: { preselectId: string | null; onClose: () => void }) {
  const router = useRouter();
  const addOwned = useMySubscriptionsStore((s) => s.add);

  const [step, setStep] = useState<Step>(preselectId ? "details" : "welcome");
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>(preselectId ? [preselectId] : []);
  const [details, setDetails] = useState<Record<string, ServiceDetailsValue>>(() =>
    preselectId && SUBSCRIPTIONS_BY_ID[preselectId]
      ? { [preselectId]: defaultServiceDetails(SUBSCRIPTIONS_BY_ID[preselectId]) }
      : {}
  );
  const [addedCount, setAddedCount] = useState(0);

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
      });
    }
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
        <h2 className="font-display text-base font-semibold text-ink-0">{STEP_TITLES[step]}</h2>
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
              Spot duplicates, find savings, and see everything in one place — no bank connection required.
            </p>
          </div>
        )}

        {step === "select" && (
          <div className="flex flex-col gap-3">
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
          <Button className="w-full" onClick={() => setStep("select")}>
            Get started
          </Button>
        )}
        {step === "select" && (
          <>
            <Button variant="ghost" onClick={() => setStep("welcome")}>
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
