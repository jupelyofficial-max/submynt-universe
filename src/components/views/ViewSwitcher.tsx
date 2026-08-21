"use client";

import { cn } from "@/lib/utils";
import { useUniverseStore } from "@/store/useUniverseStore";

export function ViewSwitcher() {
  const viewMode = useUniverseStore((s) => s.viewMode);
  const setViewMode = useUniverseStore((s) => s.setViewMode);

  return (
    <div className="flex h-9 items-center rounded-full bg-ink-0 p-1 gap-1">
      <button
        onClick={() => setViewMode("universe")}
        className={cn(
          "rounded-full px-3.5 h-full text-xs font-semibold transition-colors cursor-pointer",
          viewMode === "universe" ? "bg-white/15 text-white" : "text-white/50 hover:text-white/80"
        )}
      >
        Universe
      </button>
      <button
        onClick={() => setViewMode("list")}
        className={cn(
          "rounded-full px-3.5 h-full text-xs font-semibold transition-colors cursor-pointer",
          viewMode === "list" ? "bg-white/15 text-white" : "text-white/50 hover:text-white/80"
        )}
      >
        List
      </button>
    </div>
  );
}
