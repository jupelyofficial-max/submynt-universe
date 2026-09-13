"use client";

import { cn } from "@/lib/utils";
import { useUniverseStore } from "@/store/useUniverseStore";

/** Everyday/Premium catalog-wide toggle — same structural pill pattern as
 * ViewSwitcher, with the Elite Access gold (#B08D4F) as its accent instead
 * of ViewSwitcher's green, so the two controls read as related but
 * distinct. Defaults to "everyday" (see useUniverseStore) — Premium is
 * opt-in, never the default view. */
export function CatalogModeToggle() {
  const catalogMode = useUniverseStore((s) => s.catalogMode);
  const setCatalogMode = useUniverseStore((s) => s.setCatalogMode);

  return (
    <div className="flex h-9 items-center rounded-full bg-[#B08D4F] p-1 gap-1">
      <button
        onClick={() => setCatalogMode("everyday")}
        className={cn(
          "rounded-full px-3.5 h-full text-xs font-semibold transition-colors cursor-pointer",
          catalogMode === "everyday" ? "bg-white/15 text-ink-0" : "text-ink-0/80 hover:text-ink-0"
        )}
      >
        Everyday
      </button>
      <button
        onClick={() => setCatalogMode("premium")}
        className={cn(
          "rounded-full px-3.5 h-full text-xs font-semibold transition-colors cursor-pointer",
          catalogMode === "premium" ? "bg-white/15 text-ink-0" : "text-ink-0/80 hover:text-ink-0"
        )}
      >
        Premium
      </button>
    </div>
  );
}
