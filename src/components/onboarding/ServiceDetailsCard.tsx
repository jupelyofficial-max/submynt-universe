"use client";

import { cn } from "@/lib/utils";
import { SubscriptionLogo } from "@/components/subscriptions/SubscriptionLogo";
import type { AccessType, BillingCycle, BundleProvider, Subscription } from "@/types/subscription";

const ACCESS_TYPE_OPTIONS: { value: AccessType; label: string }[] = [
  { value: "direct", label: "Direct" },
  { value: "bundled", label: "Bundled" },
  { value: "promotional", label: "Promotional" },
  { value: "family", label: "Family" },
  { value: "free", label: "Free" },
];

const BUNDLE_PROVIDER_OPTIONS: { value: BundleProvider; label: string }[] = [
  { value: "airtel", label: "Airtel" },
  { value: "jio", label: "Jio" },
  { value: "amazon", label: "Amazon" },
  { value: "apple", label: "Apple" },
  { value: "google", label: "Google" },
  { value: "employer", label: "Employer" },
  { value: "family", label: "Family" },
  { value: "other", label: "Other" },
];

// Deliberately narrower than the full BillingCycle type — the onboarding
// flow only asks for monthly/annual per spec; quarterly/half-yearly/lifetime
// remain settable later via the existing Plans tab if needed.
const FLOW_BILLING_OPTIONS: { value: BillingCycle; label: string }[] = [
  { value: "monthly", label: "Monthly" },
  { value: "annual", label: "Annual" },
];

export interface ServiceDetailsValue {
  accessType: AccessType;
  bundleProvider?: BundleProvider;
  planName: string;
  priceMonthly: number;
  billing: BillingCycle;
  /** yyyy-mm-dd, matches the native date input's value format. */
  nextRenewal: string;
}

export function defaultServiceDetails(sub: Subscription): ServiceDetailsValue {
  const plan = sub.plans[0];
  const renewal = new Date();
  renewal.setDate(renewal.getDate() + 30);
  return {
    accessType: "direct",
    bundleProvider: undefined,
    planName: plan?.name ?? "",
    priceMonthly: plan?.priceMonthly ?? sub.priceMonthly ?? 0,
    billing: "monthly",
    nextRenewal: renewal.toISOString().slice(0, 10),
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

  const showBundleProvider = value.accessType === "bundled" || value.accessType === "family";

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
            {BUNDLE_PROVIDER_OPTIONS.map((opt) => (
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
          <label className="mb-1.5 block text-xs font-medium text-ink-300">Price (₹/month)</label>
          <input
            type="number"
            min={0}
            value={value.priceMonthly}
            onChange={(e) => set("priceMonthly", Number(e.target.value))}
            className="w-full rounded-lg border border-black/10 bg-void-900/70 px-3 py-2 text-sm text-ink-0 outline-none focus:border-aurora-500/50"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink-300">Billing</label>
          <select
            value={value.billing}
            onChange={(e) => set("billing", e.target.value as BillingCycle)}
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
    </div>
  );
}
