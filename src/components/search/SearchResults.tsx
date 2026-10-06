"use client";

import { useEffect, useMemo, useRef } from "react";
import { SubscriptionLogo } from "@/components/subscriptions/SubscriptionLogo";
import { searchCatalogue } from "@/lib/search";
import { catalogPriceLabel } from "@/lib/utils";
import { trackEvent } from "@/lib/events";

const MAX_SHOWN = 12;
// search_used is logged once the query has settled (no keystroke for this
// long), and only when it differs from the last one logged.
const SETTLE_MS = 800;

/** Live results for `query`: logo, name, price per cycle. Picking one hands
 * its id to `onPick` (callers open the detail panel in place). */
export function SearchResults({
  query,
  source,
  onPick,
}: {
  query: string;
  source: "header" | "explore";
  onPick: (id: string) => void;
}) {
  const results = useMemo(() => searchCatalogue(query), [query]);
  const lastLogged = useRef<string | null>(null);

  useEffect(() => {
    const q = query.trim();
    if (!q) return;
    const timer = setTimeout(() => {
      if (lastLogged.current === q) return;
      lastLogged.current = q;
      trackEvent("search_used", { query: q.slice(0, 64), result_count: results.length, source });
    }, SETTLE_MS);
    return () => clearTimeout(timer);
  }, [query, results.length, source]);

  if (!query.trim()) return null;

  if (results.length === 0) {
    return <p className="px-3 py-4 text-sm text-ink-400">No matches — try a category like Music</p>;
  }

  return (
    <ul className="flex flex-col py-1">
      {results.slice(0, MAX_SHOWN).map((sub) => (
        <li key={sub.id}>
          <button
            type="button"
            onClick={() => onPick(sub.id)}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-black/5 cursor-pointer"
          >
            <SubscriptionLogo subscription={sub} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-ink-0">{sub.name}</div>
              <div className="truncate text-xs text-ink-500">{sub.category}</div>
            </div>
            <div className="shrink-0 text-xs font-semibold text-ink-100">{catalogPriceLabel(sub)}</div>
          </button>
        </li>
      ))}
      {results.length > MAX_SHOWN && (
        <li className="px-3 pt-1 text-[11px] text-ink-500">
          {results.length - MAX_SHOWN} more — refine your search
        </li>
      )}
    </ul>
  );
}
