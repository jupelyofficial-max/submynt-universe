"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Search, X } from "lucide-react";
import { useUniverseStore } from "@/store/useUniverseStore";
import { useOnClickOutside } from "@/hooks/useOnClickOutside";
import { SearchResults } from "@/components/search/SearchResults";
import { SEARCH_EXAMPLES } from "@/lib/search";
import { cn } from "@/lib/utils";

// Results dropdown never narrower than this, even from the mobile toolbar's
// narrow search pill; clamped to the viewport.
const MIN_RESULTS_WIDTH = 320;

export function SearchBar({ compact, size = "sm" }: { compact?: boolean; size?: "sm" | "lg" }) {
  const searchQuery = useUniverseStore((s) => s.searchQuery);
  const setSearchQuery = useUniverseStore((s) => s.setSearchQuery);
  const select = useUniverseStore((s) => s.select);
  const isLg = size === "lg";

  // Results open while typing/focused, close on an outside click or a pick.
  // Portaled with fixed positioning (same pattern as FilterDropdown) so the
  // toolbar's overflow-x-auto can't clip it.
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: MIN_RESULTS_WIDTH });
  const wrapRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const outsideRefs = useMemo(() => [wrapRef, panelRef], []);
  useOnClickOutside(outsideRefs, () => setOpen(false));

  const showResults = open && searchQuery.trim().length > 0;

  useLayoutEffect(() => {
    if (!showResults) return;
    function place() {
      const rect = wrapRef.current?.getBoundingClientRect();
      if (!rect) return;
      const width = Math.min(Math.max(rect.width, MIN_RESULTS_WIDTH), window.innerWidth - 16);
      setPos({ top: rect.bottom + 6, left: Math.max(8, Math.min(rect.left, window.innerWidth - width - 8)), width });
    }
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [showResults]);

  function runSearch(q: string) {
    setSearchQuery(q);
    setOpen(true);
  }

  // Opens the detail panel in place (it's mounted app-wide).
  function pick(id: string) {
    setOpen(false);
    select(id);
  }

  return (
    <div className="w-full">
      <div
        ref={wrapRef}
        className={cn(
          "flex items-center gap-2 rounded-full border-[1.5px] border-ink-0 bg-void-950 transition-colors focus-within:border-aurora-500",
          isLg ? "h-12 px-4 shadow-sm shadow-black/5" : "h-9 px-3.5"
        )}
      >
        <Search size={isLg ? 17 : 14} className="text-ink-300 shrink-0" />
        <input
          value={searchQuery}
          onChange={(e) => runSearch(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Search subscriptions, categories, services..."
          className={cn(
            "flex-1 min-w-0 bg-transparent text-ink-0 placeholder:text-ink-500 outline-none",
            isLg ? "text-sm" : "text-xs"
          )}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="text-ink-300 hover:text-ink-0 shrink-0 cursor-pointer"
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </div>
      {!compact && !searchQuery && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {SEARCH_EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => runSearch(ex)}
              className="rounded-full border border-black/10 bg-void-900/50 px-2.5 py-1 text-[11px] text-ink-300 hover:text-ink-0 hover:border-black/20 transition-colors cursor-pointer"
            >
              {ex}
            </button>
          ))}
        </div>
      )}

      {showResults &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={panelRef}
            style={{ position: "fixed", top: pos.top, left: pos.left, width: pos.width }}
            className="z-50 max-h-[60vh] overflow-y-auto no-scrollbar rounded-2xl border border-black/10 bg-void-900 p-1.5 shadow-xl shadow-black/40"
          >
            <SearchResults query={searchQuery} source="explore" onPick={pick} />
          </div>,
          document.body
        )}
    </div>
  );
}
