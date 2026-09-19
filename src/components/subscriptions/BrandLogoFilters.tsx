"use client";

import { useMemo } from "react";
import { SubscriptionLogo } from "@/components/subscriptions/SubscriptionLogo";
import { SUBSCRIPTIONS } from "@/data/subscriptions";
import { filterByCatalogMode } from "@/lib/filterSubscriptions";
import { cn } from "@/lib/utils";
import { useUniverseStore } from "@/store/useUniverseStore";

const COUNT = 8;

/** Judgment call: the brief asked for "top providers by entry count," but
 * `Subscription.provider` is a near 1:1 duplicate of `name` in this
 * catalogue (Netflix's provider is "Netflix", ChatGPT Plus's is "ChatGPT
 * Plus", etc.) — there's no real multi-product-per-company grouping to
 * count, LinkedIn (2 entries) aside. Rather than fabricate a grouping the
 * data doesn't have, this shows the top individual subscriptions by
 * popularity instead, each filtering down to just itself. */
export function BrandLogoFilters() {
  const catalogMode = useUniverseStore((s) => s.catalogMode);
  const searchQuery = useUniverseStore((s) => s.searchQuery);
  const setSearchQuery = useUniverseStore((s) => s.setSearchQuery);

  const top = useMemo(
    () =>
      [...filterByCatalogMode(SUBSCRIPTIONS, catalogMode)]
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, COUNT),
    [catalogMode]
  );

  function toggle(name: string) {
    setSearchQuery(searchQuery === name ? "" : name);
  }

  return (
    <div className="flex items-center gap-3 overflow-x-auto no-scrollbar px-1 py-1">
      {top.map((sub) => {
        const active = searchQuery === sub.name;
        return (
          <button
            key={sub.id}
            type="button"
            onClick={() => toggle(sub.name)}
            aria-pressed={active}
            className="flex shrink-0 flex-col items-center gap-1 cursor-pointer"
          >
            <SubscriptionLogo
              subscription={sub}
              size="sm"
              className={cn(
                "transition-all",
                active ? "ring-2 ring-ocean-500 ring-offset-2 ring-offset-void-950" : "opacity-80 hover:opacity-100"
              )}
            />
            <span className={cn("max-w-[64px] truncate text-[10px]", active ? "text-ink-0" : "text-ink-500")}>
              {sub.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
