"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMySubscriptionsStore } from "@/store/useMySubscriptionsStore";
import { useSubscriptionStatusStore, type SubscriptionStatus } from "@/store/useSubscriptionStatusStore";
import { useUniverseStore } from "@/store/useUniverseStore";
import type { Subscription } from "@/types/subscription";

const OPTIONS: { value: SubscriptionStatus | "subscribed"; label: string }[] = [
  { value: "considering", label: "Considering" },
  { value: "trial", label: "Free trial" },
  { value: "subscribed", label: "Currently subscribed" },
  { value: "cancelled", label: "Cancelled" },
];

/**
 * "Add to My Subscriptions" — capability 10. Three of the four states
 * (considering / trial / cancelled) are a lightweight, independent signal
 * in useSubscriptionStatusStore — they never touch real ownership. Only
 * "Currently subscribed" can create a real owned record (the thing that
 * actually drives filters, renewal tracking, savings badges elsewhere) —
 * it opens the same pre-filled Add Subscriptions flow used everywhere else
 * (Sprint 8+), rather than a second, divergent inline plan-chooser that
 * used to live here and skipped access-type/bundle-source entirely.
 */
export function SubscriptionStatusPicker({ sub }: { sub: Subscription }) {
  const isOwned = useMySubscriptionsStore((s) => s.isOwned(sub.id));
  const status = useSubscriptionStatusStore((s) => s.statuses[sub.id]);
  const setStatus = useSubscriptionStatusStore((s) => s.setStatus);
  const clearStatus = useSubscriptionStatusStore((s) => s.clearStatus);

  const active: SubscriptionStatus | "subscribed" | undefined = isOwned ? "subscribed" : status;

  function handlePick(value: SubscriptionStatus | "subscribed") {
    if (value === "subscribed") {
      if (isOwned) return; // already real — Remove (in primary actions) is how you undo this
      clearStatus(sub.id);
      useUniverseStore.getState().setAddSubscriptionsModalOpen(true, sub.id);
      return;
    }
    setStatus(sub.id, value);
  }

  return (
    <div>
      <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-[#6B6B6B]">Add to Track Subscriptions</h4>
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
    </div>
  );
}
