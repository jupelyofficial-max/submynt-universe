"use client";

import { SubscriptionLogo } from "@/components/subscriptions/SubscriptionLogo";
import { SUBSCRIPTIONS } from "@/data/subscriptions";
import { getSponsoredSubscriptionIds } from "@/data/vendors";
import { isPremiumCategory } from "@/lib/filterSubscriptions";
import { useUniverseStore } from "@/store/useUniverseStore";

export function SponsoredStrip({ compact }: { compact?: boolean }) {
  const catalogMode = useUniverseStore((s) => s.catalogMode);
  // Real structured vendor/sponsorship data (data/vendors.ts) — not a
  // hardcoded id list — is the single source of truth for what's sponsored.
  const items = getSponsoredSubscriptionIds()
    .map((id) => SUBSCRIPTIONS.find((s) => s.id === id))
    .filter((s) => s !== undefined)
    .filter((s) => isPremiumCategory(s.category) === (catalogMode === "premium"));
  if (items.length === 0) return null;

  return (
    <div
      className={
        // compact (mobile) is stretched to the scroll wrapper's full width
        // with the icons justified across it — MobileUniverse.tsx's own
        // wrapper is already w-full, so an unstretched natural-width pill
        // inside it left dead space at the end of the row. Desktop's
        // (non-compact) className is untouched.
        compact
          ? "glass-panel flex w-full items-center gap-2 rounded-full px-3 py-1.5 shadow-md shadow-black/5"
          : "glass-panel flex items-center gap-3 rounded-full px-4 py-2 shadow-lg shadow-black/5"
      }
    >
      <span className="font-editorial shrink-0 text-xs font-semibold text-ink-500">Featured</span>
      <div className={compact ? "flex flex-1 items-center justify-between gap-1.5" : "flex items-center gap-2"}>
        {items.map((sub) => (
          <SubscriptionLogo
            key={sub.id}
            subscription={sub}
            size={compact ? "xs" : "sm"}
            className="opacity-85 transition-opacity hover:opacity-100"
            bare
          />
        ))}
      </div>
    </div>
  );
}
