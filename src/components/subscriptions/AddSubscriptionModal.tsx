"use client";

import { useMemo, useState } from "react";
import { Check, Search } from "lucide-react";
import { ResponsiveSheet } from "@/components/ui/ResponsiveSheet";
import { Button } from "@/components/ui/Button";
import { SubscriptionLogo } from "@/components/subscriptions/SubscriptionLogo";
import { useUniverseStore } from "@/store/useUniverseStore";
import { useMySubscriptionsStore } from "@/store/useMySubscriptionsStore";
import { SUBSCRIPTIONS, SUBSCRIPTIONS_BY_ID } from "@/data/subscriptions";
import { BILLING_LABELS } from "@/data/categories";
import type { BillingCycle, Subscription } from "@/types/subscription";

function defaultRenewalDate(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d.toISOString().slice(0, 10);
}

export function AddSubscriptionModal() {
  const isOpen = useUniverseStore((s) => s.isAddModalOpen);
  const prefillId = useUniverseStore((s) => s.addModalPrefillId);
  const close = useUniverseStore((s) => s.closeAddModal);

  return (
    <ResponsiveSheet open={isOpen} onClose={close} title="Add Subscription" desktopVariant="center" widthClassName="w-[480px]">
      {/* Keying on prefillId + isOpen forces a fresh mount each time the modal opens,
          so form state is derived once at mount instead of synced via an effect. */}
      {isOpen && <AddSubscriptionForm key={prefillId ?? "blank"} prefillId={prefillId} onClose={close} />}
    </ResponsiveSheet>
  );
}

function AddSubscriptionForm({ prefillId, onClose }: { prefillId: string | null; onClose: () => void }) {
  const addOwned = useMySubscriptionsStore((s) => s.add);
  const select = useUniverseStore((s) => s.select);

  const prefill = prefillId ? SUBSCRIPTIONS_BY_ID[prefillId] : null;
  const [query, setQuery] = useState(prefill?.name ?? "");
  const [chosen, setChosen] = useState<Subscription | null>(prefill ?? null);
  const [planName, setPlanName] = useState(prefill?.plans[0]?.name ?? "");
  const [price, setPrice] = useState(prefill?.plans[0]?.priceMonthly ?? 0);
  const [billing, setBilling] = useState<BillingCycle>(prefill?.plans[0]?.billing ?? "monthly");
  const [renewal, setRenewal] = useState(defaultRenewalDate());
  const [success, setSuccess] = useState(false);

  const results = useMemo(() => {
    if (chosen || !query.trim()) return [];
    const q = query.trim().toLowerCase();
    return SUBSCRIPTIONS.filter((s) => s.name.toLowerCase().includes(q)).slice(0, 7);
  }, [query, chosen]);

  function pick(sub: Subscription) {
    setChosen(sub);
    setQuery(sub.name);
    setPlanName(sub.plans[0]?.name ?? "");
    setPrice(sub.plans[0]?.priceMonthly ?? 0);
    setBilling(sub.plans[0]?.billing ?? "monthly");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!chosen) return;
    addOwned({
      subscriptionId: chosen.id,
      planName: planName || chosen.plans[0]?.name || "Standard",
      priceMonthly: price,
      billing,
      nextRenewal: renewal,
    });
    setSuccess(true);
    setTimeout(() => {
      select(chosen.id);
      onClose();
    }, 900);
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 px-8 py-16 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-nebula-500/15 text-nebula-400">
          <Check size={26} />
        </span>
        <p className="font-display text-lg font-semibold text-ink-0">Added to your universe</p>
        <p className="text-sm text-ink-300">{chosen?.name} now has its signature glow.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-5 py-5">
      <div>
        <label className="mb-1.5 block text-xs font-medium text-ink-300">Subscription</label>
        <div className="relative">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setChosen(null);
            }}
            placeholder="Search Netflix, Spotify, ChatGPT..."
            className="w-full rounded-xl border border-black/10 bg-void-900/70 py-2.5 pl-9 pr-3 text-sm text-ink-0 outline-none placeholder:text-ink-500 focus:border-aurora-500/50"
            required
          />
        </div>
        {results.length > 0 && (
          <div className="mt-1.5 max-h-52 overflow-y-auto no-scrollbar rounded-xl border border-black/10 bg-void-900">
            {results.map((s) => (
              <button
                type="button"
                key={s.id}
                onClick={() => pick(s)}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-black/5 cursor-pointer"
              >
                <SubscriptionLogo subscription={s} size="xs" />
                <span className="text-sm text-ink-0">{s.name}</span>
                <span className="ml-auto text-xs text-ink-500">{s.category}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {chosen && (
        <>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-300">Plan</label>
            <select
              value={planName}
              onChange={(e) => {
                setPlanName(e.target.value);
                const p = chosen.plans.find((pl) => pl.name === e.target.value);
                if (p) {
                  setPrice(p.priceMonthly);
                  setBilling(p.billing);
                }
              }}
              className="w-full rounded-xl border border-black/10 bg-void-900/70 px-3 py-2.5 text-sm text-ink-0 outline-none focus:border-aurora-500/50"
            >
              {chosen.plans.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-ink-300">Price (₹/month)</label>
              <input
                type="number"
                min={0}
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full rounded-xl border border-black/10 bg-void-900/70 px-3 py-2.5 text-sm text-ink-0 outline-none focus:border-aurora-500/50"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-ink-300">Billing cycle</label>
              <select
                value={billing}
                onChange={(e) => setBilling(e.target.value as BillingCycle)}
                className="w-full rounded-xl border border-black/10 bg-void-900/70 px-3 py-2.5 text-sm text-ink-0 outline-none focus:border-aurora-500/50"
              >
                {chosen.billing.map((b) => (
                  <option key={b} value={b}>
                    {BILLING_LABELS[b]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-ink-300">Next renewal date</label>
              <input
                type="date"
                value={renewal}
                onChange={(e) => setRenewal(e.target.value)}
                className="w-full rounded-xl border border-black/10 bg-void-900/70 px-3 py-2.5 text-sm text-ink-0 outline-none focus:border-aurora-500/50"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-ink-300">Category</label>
              <input
                disabled
                value={chosen.category}
                className="w-full rounded-xl border border-black/10 bg-void-900/40 px-3 py-2.5 text-sm text-ink-500"
              />
            </div>
          </div>
        </>
      )}

      <Button type="submit" size="lg" disabled={!chosen} className="mt-1">
        Add Subscription
      </Button>
      <p className="text-center text-[11px] text-ink-500">
        No bank login, no OTP, no statements — just what you tell us.
      </p>
    </form>
  );
}
