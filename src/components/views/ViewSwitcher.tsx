"use client";

import { cn } from "@/lib/utils";
import { useUniverseStore } from "@/store/useUniverseStore";

export function ViewSwitcher() {
  const viewMode = useUniverseStore((s) => s.viewMode);
  const setViewMode = useUniverseStore((s) => s.setViewMode);

  return (
    <div className="glass-panel flex items-center rounded-xl p-1 gap-1">
      <button
        onClick={() => setViewMode("universe")}
        className={cn(
          "rounded-lg px-3 h-9 text-xs font-semibold transition-colors cursor-pointer",
          viewMode === "universe" ? "bg-aurora-500 text-white" : "text-ink-300 hover:text-ink-0"
        )}
      >
        Universe
      </button>
      <button
        onClick={() => setViewMode("list")}
        className={cn(
          "rounded-lg px-3 h-9 text-xs font-semibold transition-colors cursor-pointer",
          viewMode === "list" ? "bg-aurora-500 text-white" : "text-ink-300 hover:text-ink-0"
        )}
      >
        List
      </button>
    </div>
  );
}
