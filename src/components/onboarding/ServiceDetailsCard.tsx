"use client";

import { cn, planCycleAmount } from "@/lib/utils";
import { SubscriptionLogo } from "@/components/subscriptions/SubscriptionLogo";
import type { AccessType, BillingCycle, BundleProvider, Subscription, UsageFrequency } from "@/types/subscription";

const ACCESS_TYPE_OPTIONS: { value: AccessType; label: string }[] = [
  { value: "direct", label: "Direct" },
  { value: "bundled", label: "Bundled" },
  { value: "promotional", label: "Promotional" },
  { value: "family", label: "Family" },
  { value: "free", label: "Free" },
];

// Fixed, narrowed set — Amazon/Apple/Google dropped as pickable options
// (the BundleProvider type keeps them for reading any already-stored
// data, just not offered here going forward).
const BUNDLE_PROVIDER_OPTIONS: { value: BundleProvider; label: string }[] = [
  { value: "airtel", label: "Airtel Black" },
  { value: "jio", label: "Jio" },
  { value: "family", label: "Family" },
  { value: "employer", label: "Employer" },
  { value: "other", label: "Others" },
];

/** A subscription can't be bundled under its own provider (e.g. the
 * Airtel catalog entry itself can't have bundle-source "Airtel Black"). */
export function bundleOptionsFor(sub: Subscription): { value: BundleProvider; label: string }[] {
  return BUNDLE_PROVIDER_OPTIONS.filter((opt) => opt.value !== sub.id);
}

// Deliberately narrower than the full BillingCycle type — the onboarding
// flow only asks for monthly/annual per spec; quarterly/half-yearly/lifetime
// remain settable later via the existing Plans tab if needed.
const FLOW_BILLING_OPTIONS: { value: BillingCycle; label: string }[] = [
  { value: "monthly", label: "Monthly" },
  { value: "annual", label: "Annual" },
];

const USAGE_FREQUENCY_OPTIONS: { value: UsageFrequency; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "rarely", label: "Rarely" },
  { value: "never", label: "Never" },
];

export interface ServiceDetailsValue {
  accessType: AccessType;
  bundleProvider?: BundleProvider;
  planName: string;
  /** Charged per `billing` cycle (₹ per month / ₹ per year). null = not
   * known for this cycle yet; the user must enter it before continuing. */
  priceAmount: number | null;
  billing: BillingCycle;
  /** yyyy-mm-dd, matches the native date input's value format. */
  nextRenewal: string;
  /** Optional/skippable — feeds the Sprint 4 Submynt Score, but nothing
   * here requires it (missing usage is a dropped term, not a penalty). */
  usageFrequency?: UsageFrequency;
  /** Sprint 5 — only shown/meaningful when accessType is 'promotional'.
   * Deliberately separate from nextRenewal (see OwnedSubscription). */
  promoEndDate?: string;
}

/** The catalogue's own price for `billing` (per that cycle), or null when
 * the catalogue doesn't list one — never derived by ×12 or ÷12. */
export function catalogPriceFor(sub: Subscription, billing: BillingCycle): number | null {
  const plan = sub.plans.find((p) => p.billing === billing);
  if (plan) return planCycleAmount(plan);
  if (billing === "monthly" && sub.billing.includes("monthly") && sub.priceMonthly !== null) return sub.priceMonthly;
  return null;
}

export function defaultServiceDetails(sub: Subscription): ServiceDetailsValue {
  // Start on whichever flow cycle the catalogue actually prices (monthly
  // first), so the prefilled amount always matches the selected cycle.
  const billing = FLOW_BILLING_OPTIONS.map((o) => o.value).find((b) => catalogPriceFor(sub, b) !== null) ?? "monthly";
  const plan = sub.plans.find((p) => p.billing === billing) ?? sub.plans[0];
  const renewal = new Date();
  renewal.setDate(renewal.getDate() + 30);
  return {
    accessType: "direct",
    bundleProvider: undefined,
    planName: plan?.name ?? "",
    priceAmount: catalogPriceFor(sub, billing),
    billing,
    nextRenewal: renewal.toISOString().slice(0, 10),
    usageFrequency: undefined,
    promoEndDate: undefined,
  };
}

export function ServiceDetailsCard({
  sub,
  value,
  onChange,
}: {
  sub: Subscription;
  value: ServiceDetailsValue;
  onChange: (next: ServiceDetailsValue) => void;
}) {
  function set<K extends keyof ServiceDetailsValue>(key: K, v: ServiceDetailsValue[K]) {
    onChange({ ...value, [key]: v });
  }

  // Switching cycle prefills the catalogue's price for the new cycle, or
  // clears the amount so it must be re-entered — never ×12/÷12, since an
  // annual plan is usually discounted. A catalogue plan name follows along;
  // a custom one is left as typed.
  function setBilling(billing: BillingCycle) {
    const isCatalogPlanName = sub.plans.some((p) => p.name === value.planName);
    const nextPlanName = isCatalogPlanName ? sub.plans.find((p) => p.billing === billing)?.name ?? value.planName : value.planName;
    onChange({ ...value, billing, priceAmount: catalogPriceFor(sub, billing), planName: nextPlanName });
  }

  const showBundleProvider = value.accessType === "bundled" || value.accessType === "family";
  const showPromoEndDate = value.accessType === "promotional";

  return (
    <div className="rounded-xl border border-black/10 bg-void-900/40 p-4">
      <div className="mb-3 flex items-center gap-2.5">
        <SubscriptionLogo subscription={sub} size="sm" />
        <span className="text-sm font-semibold text-ink-0">{sub.name}</span>
      </div>

      <div className="mb-3">
        <label className="mb-1.5 block text-xs font-medium text-ink-300">How do you access this?</label>
        <div className="grid grid-cols-3 gap-1.5">
          {ACCESS_TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => set("accessType", opt.value)}
              className={cn(
                "rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors cursor-pointer",
                value.accessType === opt.value
                  ? "border-nebula-500 bg-nebula-500/10 text-nebula-400"
                  : "border-black/10 text-ink-300 hover:border-black/20"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {showBundleProvider && (
        <div className="mb-3">
          <label className="mb-1.5 block text-xs font-medium text-ink-300">Bundled with</label>
          <div className="grid grid-cols-4 gap-1.5">
            {bundleOptionsFor(sub).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => set("bundleProvider", opt.value)}
                className={cn(
                  "rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors cursor-pointer",
                  value.bundleProvider === opt.value
                    ? "border-nebula-500 bg-nebula-500/10 text-nebula-400"
                    : "border-black/10 text-ink-300 hover:border-black/20"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {showPromoEndDate && (
        <div className="mb-3">
          <label className="mb-1.5 block text-xs font-medium text-ink-300">Promo ends on (optional)</label>
          <input
            type="date"
            value={value.promoEndDate ?? ""}
            onChange={(e) => set("promoEndDate", e.target.value || undefined)}
            className="w-full rounded-lg border border-black/10 bg-void-900/70 px-3 py-2 text-sm text-ink-0 outline-none focus:border-aurora-500/50"
          />
          <p className="mt-1 text-[11px] text-ink-500">
            When the discount/trial ends — separate from when it renews at full price below.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink-300">Plan name</label>
          <input
            value={value.planName}
            onChange={(e) => set("planName", e.target.value)}
            placeholder="e.g. Standard"
            className="w-full rounded-lg border border-black/10 bg-void-900/70 px-3 py-2 text-sm text-ink-0 outline-none focus:border-aurora-500/50"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink-300">
            Price (₹ per {value.billing === "annual" ? "year" : "month"})
          </label>
          <input
            type="number"
            min={0}
            value={value.priceAmount ?? ""}
            onChange={(e) => set("priceAmount", e.target.value === "" ? null : Number(e.target.value))}
            placeholder="Enter price"
            aria-invalid={value.priceAmount === null}
            className={cn(
              "w-full rounded-lg border bg-void-900/70 px-3 py-2 text-sm text-ink-0 outline-none focus:border-aurora-500/50",
              value.priceAmount === null ? "border-red-400/60" : "border-black/10"
            )}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink-300">Billing</label>
          <select
            value={value.billing}
            onChange={(e) => setBilling(e.target.value as BillingCycle)}
            className="w-full rounded-lg border border-black/10 bg-void-900/70 px-3 py-2 text-sm text-ink-0 outline-none focus:border-aurora-500/50"
          >
            {FLOW_BILLING_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink-300">Renews on</label>
          <input
            type="date"
            value={value.nextRenewal}
            onChange={(e) => set("nextRenewal", e.target.value)}
            className="w-full rounded-lg border border-black/10 bg-void-900/70 px-3 py-2 text-sm text-ink-0 outline-none focus:border-aurora-500/50"
          />
        </div>
      </div>

      <div className="mt-3">
        <label className="mb-1.5 block text-xs font-medium text-ink-300">How often do you use it? (optional)</label>
        <div className="grid grid-cols-5 gap-1.5">
          {USAGE_FREQUENCY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => set("usageFrequency", value.usageFrequency === opt.value ? undefined : opt.value)}
              className={cn(
                "rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors cursor-pointer",
                value.usageFrequency === opt.value
                  ? "border-nebula-500 bg-nebula-500/10 text-nebula-400"
                  : "border-black/10 text-ink-300 hover:border-black/20"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
