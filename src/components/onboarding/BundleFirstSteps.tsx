"use client";

import { useMemo, useState } from "react";
import { Check, Search } from "lucide-react";
import { SubscriptionLogo } from "@/components/subscriptions/SubscriptionLogo";
import { SUBSCRIPTIONS, SUBSCRIPTIONS_BY_ID } from "@/data/subscriptions";
import { BUNDLE_CATALOGUE, type BundleCatalogueEntry, type BundleId } from "@/data/bundleCatalogue";
import { cycleSuffix, formatINR, formatOwnedPrice, ownedPriceAmount } from "@/lib/utils";
import type { BillingCycle, OwnedSubscription } from "@/types/subscription";

/** Step 1 — pick which bundles you have, multi-select, "skip" always
 * available. Styled to the Track Subscriptions .ts-theme look. */
export function BundlePickStep({
  selected,
  onToggle,
}: {
  selected: BundleId[];
  onToggle: (id: BundleId) => void;
}) {
  return (
    <div className="ts-theme flex flex-col gap-2 rounded-2xl p-3" style={{ background: "var(--ts-bg)" }}>
      <p className="px-1 text-sm" style={{ color: "var(--ts-ink-300)" }}>
        Pick any bundles you already have — we&apos;ll check what&apos;s included.
      </p>
      {BUNDLE_CATALOGUE.map((bundle) => {
        const active = selected.includes(bundle.id);
        return (
          <button
            key={bundle.id}
            type="button"
            onClick={() => onToggle(bundle.id)}
            className="flex items-center justify-between gap-3 rounded-xl p-3 text-left transition-colors cursor-pointer"
            style={
              active
                ? { border: "1px solid var(--ts-mint-500)", background: "var(--ts-mint-tint)" }
                : { border: "1px solid var(--ts-border)", background: "var(--ts-card)" }
            }
          >
            <div>
              <div className="text-sm font-semibold" style={{ color: "var(--ts-ink-0)" }}>
                {bundle.name}
              </div>
              <div className="text-xs" style={{ color: "var(--ts-ink-500)" }}>
                {bundle.hasPresetList
                  ? `${bundle.includedServices.length} ${bundle.includedServices.length === 1 ? "service" : "services"} typically included`
                  : "You pick what's included"}
              </div>
            </div>
            <div
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
              style={
                active
                  ? { background: "var(--ts-mint-500)", color: "#fff" }
                  : { border: "1px solid var(--ts-border-strong)" }
              }
            >
              {active && <Check size={12} />}
            </div>
          </button>
        );
      })}
    </div>
  );
}

export interface BundlePlanValue {
  /** Per `billing` cycle; null = must be entered before continuing. */
  priceAmount: number | null;
  billing: BillingCycle;
}

/** The bundle's own paid plan ("Your Jio plan: ₹___ per month"), shown
 * above the included services. Already tracked → shown as tracked, with no
 * input; it won't be added again. */
export function BundlePlanRow({
  bundle,
  tracked,
  value,
  onChange,
}: {
  bundle: BundleCatalogueEntry;
  tracked: OwnedSubscription | undefined;
  value: BundlePlanValue;
  onChange: (billing: BillingCycle, priceAmount: number | null) => void;
}) {
  if (tracked) {
    const amount = ownedPriceAmount(tracked);
    return (
      <div className="rounded-xl p-3 text-sm" style={{ border: "1px solid var(--ts-border)", background: "var(--ts-card)", color: "var(--ts-ink-300)" }}>
        Your {bundle.name} plan is already tracked
        {amount > 0 ? ` — ${formatOwnedPrice(amount, tracked.accessType ?? "direct")}${cycleSuffix(tracked.billing)}` : ""}.
      </div>
    );
  }
  const missing = value.priceAmount === null;
  return (
    <div className="rounded-xl p-3" style={{ border: "1px solid var(--ts-border)", background: "var(--ts-card)" }}>
      <label className="mb-1.5 block text-xs font-medium" style={{ color: "var(--ts-ink-300)" }}>
        Your {bundle.name} plan
      </label>
      <div className="flex items-center gap-2">
        <span className="text-sm" style={{ color: "var(--ts-ink-300)" }}>
          ₹
        </span>
        <input
          type="number"
          min={0}
          value={value.priceAmount ?? ""}
          onChange={(e) => onChange(value.billing, e.target.value === "" ? null : Number(e.target.value))}
          placeholder="Enter price"
          aria-invalid={missing}
          className="min-w-0 flex-1 rounded-lg px-3 py-2 text-sm outline-none"
          style={{
            border: `1px solid ${missing ? "rgba(248,113,113,0.6)" : "var(--ts-border)"}`,
            background: "var(--ts-bg)",
            color: "var(--ts-ink-0)",
          }}
        />
        <select
          value={value.billing}
          onChange={(e) => onChange(e.target.value as BillingCycle, null)}
          className="rounded-lg px-2 py-2 text-sm outline-none"
          style={{ border: "1px solid var(--ts-border)", background: "var(--ts-bg)", color: "var(--ts-ink-0)" }}
        >
          <option value="monthly">per month</option>
          <option value="annual">per year</option>
        </select>
      </div>
      {missing && (
        <p className="mt-1 text-[11px]" style={{ color: "var(--ts-ink-500)" }}>
          Enter what you pay for this plan — it counts toward your spend; the services below stay ₹0.
        </p>
      )}
    </div>
  );
}

/** Step 2 (preset) — one screen per selected preset bundle, default-on
 * toggles per the catalogue (minus anything already tracked, which the
 * caller defaults off before this renders). `directPrices` = included
 * services the user already pays for directly (monthly equivalent): those
 * get an overlap note and can't be toggled on here, so their Direct row is
 * never overwritten by a ₹0 bundled one. */
export function BundleConfirmPresetStep({
  bundle,
  toggles,
  onToggleService,
  directPrices,
}: {
  bundle: BundleCatalogueEntry;
  toggles: Record<string, boolean>;
  onToggleService: (serviceId: string) => void;
  directPrices: Record<string, number>;
}) {
  return (
    <div className="ts-theme flex flex-col gap-2 rounded-2xl p-3" style={{ background: "var(--ts-bg)" }}>
      <p className="px-1 text-sm" style={{ color: "var(--ts-ink-300)" }}>
        What&apos;s included in your {bundle.name}? Turn off anything you don&apos;t actually have.
      </p>
      {bundle.includedServices.map((item) => {
        const sub = SUBSCRIPTIONS_BY_ID[item.serviceId];
        if (!sub) return null;
        const on = toggles[item.serviceId] ?? false;
        const directPrice = directPrices[item.serviceId];
        const paysDirectly = directPrice !== undefined;
        return (
          <div key={item.serviceId} className="flex flex-col gap-1">
          <button
            type="button"
            onClick={() => onToggleService(item.serviceId)}
            disabled={paysDirectly}
            className="flex items-center gap-3 rounded-xl p-2.5 text-left transition-colors cursor-pointer disabled:cursor-default"
            style={
              on
                ? { border: "1px solid var(--ts-mint-500)", background: "var(--ts-mint-tint)" }
                : { border: "1px solid var(--ts-border)", background: "var(--ts-card)" }
            }
          >
            <SubscriptionLogo subscription={sub} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium" style={{ color: "var(--ts-ink-0)" }}>
                {sub.name}
              </div>
              {item.note && (
                <div className="truncate text-[11px]" style={{ color: "var(--ts-ink-500)" }}>
                  {item.note}
                </div>
              )}
            </div>
            {item.standalonePrice !== null && (
              <div className="shrink-0 text-xs" style={{ color: "var(--ts-ink-500)" }}>
                {formatINR(item.standalonePrice)}/mo standalone
              </div>
            )}
            <div
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
              style={
                on
                  ? { background: "var(--ts-mint-500)", color: "#fff" }
                  : { border: "1px solid var(--ts-border-strong)" }
              }
            >
              {on && <Check size={12} />}
            </div>
          </button>
          {paysDirectly && (
            <p className="px-1 text-[11px]" style={{ color: "var(--ts-amber)" }}>
              {directPrice > 0 ? `You pay ${formatINR(directPrice)}/month for ${sub.name} directly` : `You track ${sub.name} as paid directly`}
              {" "}— it may be included with your {bundle.name} plan. Check your plan.
            </p>
          )}
          </div>
        );
      })}
    </div>
  );
}

/** Step 2 (no preset) — Family/Employer: a scoped search/select picker
 * instead of a fixed list, since there's no real catalogue to show. */
export function BundleConfirmManualStep({
  bundle,
  picked,
  onTogglePick,
}: {
  bundle: BundleCatalogueEntry;
  picked: string[];
  onTogglePick: (serviceId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pool = q ? SUBSCRIPTIONS.filter((s) => s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q)) : SUBSCRIPTIONS;
    return [...pool].sort((a, b) => b.popularity - a.popularity).slice(0, q ? 30 : 15);
  }, [query]);

  return (
    <div className="ts-theme flex flex-col gap-2 rounded-2xl p-3" style={{ background: "var(--ts-bg)" }}>
      <p className="px-1 text-sm" style={{ color: "var(--ts-ink-300)" }}>
        What&apos;s included through your {bundle.name.toLowerCase()} plan?
      </p>
      <div className="relative">
        <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--ts-ink-500)" }} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search subscriptions…"
          className="w-full rounded-xl py-2.5 pl-9 pr-3 text-sm outline-none"
          style={{ border: "1px solid var(--ts-border)", background: "var(--ts-card)", color: "var(--ts-ink-0)" }}
        />
      </div>
      {picked.length > 0 && (
        <p className="px-1 text-xs" style={{ color: "var(--ts-ink-500)" }}>
          {picked.length} selected
        </p>
      )}
      <div className="flex flex-col gap-1.5">
        {results.map((sub) => {
          const active = picked.includes(sub.id);
          return (
            <button
              key={sub.id}
              type="button"
              onClick={() => onTogglePick(sub.id)}
              className="flex items-center gap-3 rounded-xl p-2.5 text-left transition-colors cursor-pointer"
              style={
                active
                  ? { border: "1px solid var(--ts-mint-500)", background: "var(--ts-mint-tint)" }
                  : { border: "1px solid var(--ts-border)", background: "var(--ts-card)" }
              }
            >
              <SubscriptionLogo subscription={sub} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium" style={{ color: "var(--ts-ink-0)" }}>
                  {sub.name}
                </div>
                <div className="truncate text-xs" style={{ color: "var(--ts-ink-500)" }}>
                  {sub.category}
                </div>
              </div>
              <div
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                style={
                  active
                    ? { background: "var(--ts-mint-500)", color: "#fff" }
                    : { border: "1px solid var(--ts-border-strong)" }
                }
              >
                {active && <Check size={12} />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
