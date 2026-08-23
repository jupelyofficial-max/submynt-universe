"use client";

import { useMemo, useRef } from "react";
import { ArrowUp, SearchX, Target } from "lucide-react";
import { MobileCategoryCard } from "./MobileCategoryCard";
import { SponsoredStrip } from "./SponsoredStrip";
import { buildUniverse } from "@/lib/universeLayout";
import { SUBSCRIPTIONS } from "@/data/subscriptions";
import { matchesFilters, matchesSearch } from "@/lib/filterSubscriptions";
import { useMySubscriptionsStore } from "@/store/useMySubscriptionsStore";
import { useUniverseStore } from "@/store/useUniverseStore";

/** The Universe's own dedicated mobile composition — a structured, densely
 * packed 2-column grid of category "zones," each holding a real icon
 * cluster sized in actual pixels. Deliberately NOT the desktop WebGL scene
 * scaled down: on a narrow viewport that scene has to zoom out so far to
 * fit the whole catalogue that every label and logo becomes illegible. This
 * renders every icon at a size chosen for a phone screen, not derived from
 * a camera distance. (A 3-column grid was tried; the math doesn't work —
 * see mobileClusterLayout.ts.) */
export function MobileUniverse() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef(new Map<string, HTMLDivElement>());
  const { clusters } = useMemo(() => buildUniverse(SUBSCRIPTIONS), []);
  const owned = useMySubscriptionsStore((s) => s.owned);
  const ownedIds = useMemo(() => new Set(owned.map((o) => o.subscriptionId)), [owned]);
  const searchQuery = useUniverseStore((s) => s.searchQuery);
  const filters = useUniverseStore((s) => s.filters);

  const hasQuery = searchQuery.trim().length > 0;
  const hasFilters =
    filters.categories.length + filters.billing.length + filters.priceBands.length + filters.userStatus.length + filters.regions.length > 0;

  const byCategory = useMemo(() => {
    const map = new Map<string, typeof SUBSCRIPTIONS>();
    SUBSCRIPTIONS.forEach((s) => {
      if ((hasQuery && !matchesSearch(s, searchQuery)) || (hasFilters && !matchesFilters(s, filters, ownedIds))) return;
      const arr = map.get(s.category) ?? [];
      arr.push(s);
      map.set(s.category, arr);
    });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, filters, ownedIds]);

  const ordered = useMemo(
    () =>
      clusters
        .filter((c) => (byCategory.get(c.name)?.length ?? 0) > 0)
        .sort((a, b) => (byCategory.get(b.name)?.length ?? 0) - (byCategory.get(a.name)?.length ?? 0)),
    [clusters, byCategory]
  );

  function scrollToTop() {
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }

  function scrollToMine() {
    if (owned.length === 0) return;
    const firstOwnedSub = SUBSCRIPTIONS.find((s) => s.id === owned[0].subscriptionId);
    if (!firstOwnedSub) return;
    cardRefs.current.get(firstOwnedSub.category)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <div className="relative flex flex-1 min-h-0 flex-col">
      <div
        ref={scrollRef}
        className="relative flex-1 min-h-0 overflow-y-auto no-scrollbar"
        style={{ backgroundColor: "#FCFBF7" }}
      >

        {ordered.length === 0 ? (
          <div className="relative flex flex-col items-center gap-2 px-6 py-16 text-center">
            <SearchX size={22} className="text-ink-500" />
            <p className="text-sm font-medium text-ink-0">No subscriptions match</p>
            <p className="text-xs text-ink-500">Try a different search term or clear your filters.</p>
          </div>
        ) : (
          // Bottom padding clears the fixed sponsored bar below so the last
          // row of categories is never hidden behind it.
          <div className="relative grid grid-cols-2 gap-2 p-2" style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 76px)" }}>
            {ordered.map((cluster) => (
              <div key={cluster.name} ref={(el) => { if (el) cardRefs.current.set(cluster.name, el); }}>
                <MobileCategoryCard cluster={cluster} subs={byCategory.get(cluster.name) ?? []} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating action stack — fixed to the viewport (not the scroll
          container) so it stays put above the sponsored bar regardless of
          scroll position, safe-area aware for the home indicator. */}
      <div
        className="pointer-events-none fixed right-3 z-20 flex flex-col gap-2"
        style={{ bottom: "calc(env(safe-area-inset-bottom) + 88px)" }}
      >
        {owned.length > 0 && (
          <button
            onClick={scrollToMine}
            aria-label="Jump to my subscriptions"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-void-950/90 text-ink-200 shadow-md shadow-black/10 backdrop-blur pointer-events-auto cursor-pointer active:scale-95 transition-transform"
          >
            <Target size={18} />
          </button>
        )}
        <button
          onClick={scrollToTop}
          aria-label="Back to top"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-void-950/90 text-ink-200 shadow-md shadow-black/10 backdrop-blur pointer-events-auto cursor-pointer active:scale-95 transition-transform"
        >
          <ArrowUp size={18} />
        </button>
      </div>

      <div
        className="pointer-events-none fixed inset-x-0 z-20 px-3"
        style={{ bottom: "calc(env(safe-area-inset-bottom) + 10px)" }}
      >
        {/* w-full so this box is genuinely bounded by the wrapper's own
            padding, and deliberately NOT centered — a flex `justify-center`
            child that overflows a scroll container clips its start edge
            with no way to scroll back to it in most browsers (content is
            centered using the container's full intrinsic width, not its
            visible/scrollable width). Left-aligned + overflow-x-auto is the
            one layout that's actually reachable end-to-end by scrolling. */}
        <div className="pointer-events-auto w-full overflow-x-auto no-scrollbar">
          <SponsoredStrip compact />
        </div>
      </div>
    </div>
  );
}
