"use client";

import { cn } from "@/lib/utils";
import { useUniverseStore } from "@/store/useUniverseStore";

export function ViewSwitcher() {
  const viewMode = useUniverseStore((s) => s.viewMode);
  const setViewMode = useUniverseStore((s) => s.setViewMode);

  return (
    // bg-[#22c55e] — same hex the "mynt" wordmark uses (TopNav.tsx), not a
    // theme token: the logo itself is hardcoded to this exact green rather
    // than a palette entry, so matching it means matching the literal value.
    <div className="flex h-9 items-center rounded-full bg-[#22c55e] p-1 gap-1">
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
