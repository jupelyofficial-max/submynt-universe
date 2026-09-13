"use client";

import { cn } from "@/lib/utils";
import { useUniverseStore } from "@/store/useUniverseStore";

/** Everyday/Premium catalog-wide toggle — same structural pill pattern as
 * ViewSwitcher, using ocean-600 ("Mynt Blue", the logo's own brand color —
 * see Button.tsx) as its accent rather than gold, which globals.css/
 * SavingsSection reserve for ratings and savings call-outs. Deliberately
 * NOT ViewSwitcher's #22c55e green: reusing the identical color on the
 * adjacent pill would make the two controls hard to tell apart at a
 * glance. ocean-600 clears WCAG AA against white text at 6.7:1 (same
 * comment as Button.tsx's primary variant) — ink-0 does not, so this uses
 * white/opacity text instead of ViewSwitcher's ink-0. Defaults to
 * "everyday" (see useUniverseStore) — Premium is opt-in, never the
 * default view. */
export function CatalogModeToggle() {
  const catalogMode = useUniverseStore((s) => s.catalogMode);
  const setCatalogMode = useUniverseStore((s) => s.setCatalogMode);

  return (
    <div className="flex h-9 items-center rounded-full bg-ocean-600 p-1 gap-1">
      <button
        onClick={() => setCatalogMode("everyday")}
        className={cn(
          "rounded-full px-3.5 h-full text-xs font-semibold transition-colors cursor-pointer",
          catalogMode === "everyday" ? "bg-white/15 text-white" : "text-white/70 hover:text-white"
        )}
      >
        Everyday
      </button>
      <button
        onClick={() => setCatalogMode("premium")}
        className={cn(
          "rounded-full px-3.5 h-full text-xs font-semibold transition-colors cursor-pointer",
          catalogMode === "premium" ? "bg-white/15 text-white" : "text-white/70 hover:text-white"
        )}
      >
        Premium
      </button>
    </div>
  );
}
