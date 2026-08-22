"use client";

import { useMemo, useRef } from "react";
import { ArrowUp, Target } from "lucide-react";
import { MobileCategoryCard } from "./MobileCategoryCard";
import { buildUniverse } from "@/lib/universeLayout";
import { SUBSCRIPTIONS } from "@/data/subscriptions";
import { useMySubscriptionsStore } from "@/store/useMySubscriptionsStore";

/** The Universe's own dedicated mobile composition — a structured, densely
 * packed 2-column grid of category cards, each holding a real icon cluster
 * sized in actual pixels. Deliberately NOT the desktop WebGL scene scaled
 * down: on a narrow viewport that scene has to zoom out so far to fit the
 * whole catalogue that every label and logo becomes illegible. This renders
 * every icon at a size chosen for a phone screen, not derived from a camera
 * distance. */
export function MobileUniverse() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef(new Map<string, HTMLDivElement>());
  const { clusters } = useMemo(() => buildUniverse(SUBSCRIPTIONS), []);
  const owned = useMySubscriptionsStore((s) => s.owned);

  const byCategory = useMemo(() => {
    const map = new Map<string, typeof SUBSCRIPTIONS>();
    SUBSCRIPTIONS.forEach((s) => {
      const arr = map.get(s.category) ?? [];
      arr.push(s);
      map.set(s.category, arr);
    });
    return map;
  }, []);

  const ordered = useMemo(() => [...clusters].sort((a, b) => b.count - a.count), [clusters]);

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
    <div ref={scrollRef} className="relative flex-1 min-h-0 overflow-y-auto no-scrollbar">
      {/* Extremely subtle backdrop — a faint grid, nothing that competes with the icons. */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(28,21,13,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(28,21,13,0.05) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative grid grid-cols-2 gap-2.5 p-3">
        {ordered.map((cluster) => (
          <div key={cluster.name} ref={(el) => { if (el) cardRefs.current.set(cluster.name, el); }}>
            <MobileCategoryCard cluster={cluster} subs={byCategory.get(cluster.name) ?? []} />
          </div>
        ))}
      </div>

      <div className="pointer-events-none sticky bottom-3 z-20 flex justify-end pr-3">
        <div className="pointer-events-auto flex flex-col gap-2">
          {owned.length > 0 && (
            <button
              onClick={scrollToMine}
              aria-label="Jump to my subscriptions"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-void-950/95 text-ink-200 shadow-lg shadow-black/10 backdrop-blur cursor-pointer active:scale-95 transition-transform"
            >
              <Target size={18} />
            </button>
          )}
          <button
            onClick={scrollToTop}
            aria-label="Back to top"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-void-950/95 text-ink-200 shadow-lg shadow-black/10 backdrop-blur cursor-pointer active:scale-95 transition-transform"
          >
            <ArrowUp size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
