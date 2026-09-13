"use client";

import { Globe2 } from "lucide-react";
import { SUBSCRIPTIONS } from "@/data/subscriptions";
import { filterByCatalogMode } from "@/lib/filterSubscriptions";
import { useUniverseStore } from "@/store/useUniverseStore";

export function EcosystemStats() {
  const catalogMode = useUniverseStore((s) => s.catalogMode);
  const visible = filterByCatalogMode(SUBSCRIPTIONS, catalogMode);
  const categoryCount = new Set(visible.map((s) => s.category)).size;

  return (
    <div className="glass-panel flex items-center gap-3 rounded-2xl px-4 py-3 shadow-lg shadow-black/5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ocean-500/10 text-ocean-600">
        <Globe2 size={17} />
      </div>
      <div className="leading-tight">
        <div className="text-sm font-semibold text-ink-0">{visible.length}+ Subscriptions</div>
        <div className="text-[11px] text-ink-500">Across {categoryCount} categories</div>
      </div>
    </div>
  );
}
