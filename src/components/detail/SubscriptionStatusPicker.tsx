"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { BILLING_LABELS } from "@/data/categories";
import { cn, formatINR } from "@/lib/utils";
import { useMySubscriptionsStore } from "@/store/useMySubscriptionsStore";
import { useSubscriptionStatusStore, type SubscriptionStatus } from "@/store/useSubscriptionStatusStore";
import type { Subscription } from "@/types/subscription";

const OPTIONS: { value: SubscriptionStatus | "subscribed"; label: string }[] = [
  { value: "considering", label: "Considering" },
  { value: "trial", label: "Free trial" },
  { value: "subscribed", label: "Currently subscribed" },
  { value: "cancelled", label: "Cancelled" },
];

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

/**
 * "Add to My Subscriptions" — capability 10. Three of the four states
 * (considering / trial / cancelled) are a lightweight, independent signal
 * in useSubscriptionStatusStore — they never touch real ownership. Only
 * "Currently subscribed" can create a real owned record (the thing that
 * actually drives filters, renewal tracking, savings badges elsewhere), and
 * even then a single click doesn't do it — it opens a plan choice first, so
 * nothing is assumed from the click alone.
 */
export function SubscriptionStatusPicker({ sub }: { sub: Subscription }) {
  const isOwned = useMySubscriptionsStore((s) => s.isOwned(sub.id));
  const addOwned = useMySubscriptionsStore((s) => s.add);
  const status = useSubscriptionStatusStore((s) => s.statuses[sub.id]);
  const setStatus = useSubscriptionStatusStore((s) => s.setStatus);
  const clearStatus = useSubscriptionStatusStore((s) => s.clearStatus);

  const [choosingPlan, setChoosingPlan] = useState(false);

  const active: SubscriptionStatus | "subscribed" | undefined = isOwned ? "subscribed" : status;

  function handlePick(value: SubscriptionStatus | "subscribed") {
    if (value === "subscribed") {
      if (isOwned) return; // already real — Remove (in primary actions) is how you undo this
      setChoosingPlan((v) => !v);
      return;
    }
    setChoosingPlan(false);
    setStatus(sub.id, value);
  }

  function confirmPlan(planName: string, priceMonthly: number, billing: Subscription["billing"][number]) {
    addOwned({
      subscriptionId: sub.id,
      planName,
      priceMonthly,
      billing,
      nextRenewal: addDays(billing === "annual" ? 365 : billing === "quarterly" ? 90 : 30),
    });
    clearStatus(sub.id);
    setChoosingPlan(false);
  }

  return (
    <div className="px-5 py-4 border-t border-[#E5E5E5]">
      <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-[#6B6B6B]">Add to My Subscriptions</h4>
      <div className="grid grid-cols-2 gap-1.5">
        {OPTIONS.map((opt) => {
          const isActive = active === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => handlePick(opt.value)}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-medium transition-colors cursor-pointer",
                isActive
                  ? "border-nebula-500 bg-nebula-500/10 text-nebula-500"
                  : "border-[#E5E5E5] bg-white text-[#6B6B6B] hover:border-black/20"
              )}
            >
              {isActive && <Check size={12} />}
              {opt.label}
            </button>
          );
        })}
      </div>

      {choosingPlan && !isOwned && (
        <div className="mt-2 rounded-lg border border-[#E5E5E5] bg-white p-2.5">
          <div className="mb-1.5 text-[11px] text-[#6B6B6B]">Which plan?</div>
          <div className="grid grid-cols-2 gap-1.5">
            {sub.plans.map((plan) => (
              <button
                key={plan.name}
                onClick={() => confirmPlan(plan.name, plan.priceMonthly, plan.billing)}
                className="flex flex-col items-start rounded-lg border border-[#E5E5E5] bg-white px-3 py-2 text-left hover:border-nebula-500/40 transition-colors cursor-pointer"
              >
                <span className="text-[11px] text-[#6B6B6B]">{plan.name} · {BILLING_LABELS[plan.billing]}</span>
                <span className="text-sm font-semibold text-black">{formatINR(plan.priceMonthly)}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
