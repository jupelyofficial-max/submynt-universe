"use client";

import { useMemo } from "react";
import { Check, Search } from "lucide-react";
import { SubscriptionLogo } from "@/components/subscriptions/SubscriptionLogo";
import { SUBSCRIPTIONS } from "@/data/subscriptions";
import { cn, formatINR } from "@/lib/utils";
import type { Subscription } from "@/types/subscription";
import { defaultServiceDetails, type ServiceDetailsValue } from "./ServiceDetailsCard";

/** How many popular services the quick-add grid shows. */
export const QUICK_ADD_COUNT = 20;
const SEARCH_LIMIT = 12;

const BY_POPULARITY = [...SUBSCRIPTIONS].sort((a, b) => b.popularity - a.popularity);

/** What a quick add writes for `sub`: the same catalogue default plan and
 * price the detailed flow prefills (defaultServiceDetails), or null when the
 * catalogue has no price for it — those need the detailed flow. */
export function quickAddDetails(sub: Subscription): ServiceDetailsValue | null {
  const d = defaultServiceDetails(sub);
  return d.priceAmount !== null && d.priceAmount > 0 ? d : null;
}

function priceLabel(d: ServiceDetailsValue): string {
  return `${formatINR(d.priceAmount ?? 0)}/${d.billing === "annual" ? "yr" : "mo"}`;
}

export function QuickAddStep({
  query,
  onQueryChange,
  selectedIds,
  trackedIds,
  onToggle,
  onPickBundle,
}: {
  query: string;
  onQueryChange: (q: string) => void;
  selectedIds: string[];
  /** Already on the account — shown disabled; adding again would overwrite
   * that row's real price/plan with the catalogue default. */
  trackedIds: Set<string>;
  onToggle: (id: string) => void;
  onPickBundle: () => void;
}) {
  const q = query.trim().toLowerCase();

  const popular = useMemo(
    () => BY_POPULARITY.filter((s) => !trackedIds.has(s.id) && quickAddDetails(s)).slice(0, QUICK_ADD_COUNT),
    [trackedIds]
  );

  const shown = useMemo(() => {
    if (!q) {
      // Picks made through search stay visible (first) when the query clears.
      const extras = selectedIds.map((id) => SUBSCRIPTIONS.find((s) => s.id === id)).filter((s): s is Subscription => Boolean(s) && !popular.some((p) => p.id === s!.id));
      return [...extras, ...popular];
    }
    return BY_POPULARITY.filter(
      (s) =>
        quickAddDetails(s) &&
        (s.name.toLowerCase().includes(q) ||
          s.provider.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q) ||
          s.tags.some((t) => t.toLowerCase().includes(q)))
    ).slice(0, SEARCH_LIMIT);
  }, [q, popular, selectedIds]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-ink-400">Tap everything you pay for.</p>
        <button type="button" onClick={onPickBundle} className="shrink-0 text-xs font-medium text-nebula-400 hover:text-nebula-500 cursor-pointer">
          I get some via a bundle →
        </button>
      </div>

      <div className="relative">
        <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          aria-label="Search subscriptions"
          placeholder="Search for anything not shown…"
          className="w-full rounded-xl border border-black/10 bg-void-900/70 py-2.5 pl-9 pr-3 text-sm text-ink-0 outline-none placeholder:text-ink-500 focus:border-aurora-500/50"
        />
      </div>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4" role="group" aria-label={q ? "Search results" : "Popular subscriptions"}>
        {shown.map((sub) => {
          const tracked = trackedIds.has(sub.id);
          const active = selectedIds.includes(sub.id);
          const d = quickAddDetails(sub);
          return (
            <button
              key={sub.id}
              type="button"
              disabled={tracked}
              aria-pressed={active}
              title={sub.name}
              onClick={() => onToggle(sub.id)}
              className={cn(
                "relative flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-center transition-colors",
                tracked ? "cursor-default border-black/10 opacity-50" : "cursor-pointer",
                active ? "border-nebula-500 bg-nebula-500/10" : !tracked && "border-black/10 hover:border-black/20"
              )}
            >
              <SubscriptionLogo subscription={sub} size="sm" />
              <span className="line-clamp-2 w-full break-words text-xs font-medium leading-tight text-ink-0">{sub.name}</span>
              <span className="text-[11px] text-ink-500">{tracked ? "Already tracked" : d ? priceLabel(d) : ""}</span>
              {active && (
                <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-nebula-500 text-white">
                  <Check size={10} />
                </span>
              )}
            </button>
          );
        })}
      </div>
      {shown.length === 0 && (
        <p className="py-4 text-center text-sm text-ink-500">
          No matches with a standard price. Try &ldquo;Add with details&rdquo; to enter it yourself.
        </p>
      )}

      <p className="text-xs text-ink-500">
        Not sure of the price? We&apos;ll use the usual price. You can adjust prices and renewal dates later from each
        subscription.
      </p>
    </div>
  );
}
