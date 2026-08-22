"use client";

import { Search, X } from "lucide-react";
import { useUniverseStore } from "@/store/useUniverseStore";
import { cn } from "@/lib/utils";

const EXAMPLES = ["Netflix", "AI tools", "Under ₹500", "Music", "Annual subscriptions"];

export function SearchBar({ compact, size = "sm" }: { compact?: boolean; size?: "sm" | "lg" }) {
  const searchQuery = useUniverseStore((s) => s.searchQuery);
  const setSearchQuery = useUniverseStore((s) => s.setSearchQuery);
  const isLg = size === "lg";

  return (
    <div className="w-full">
      <div
        className={cn(
          "flex items-center gap-2 rounded-full border-[1.5px] border-ink-0 bg-void-950 transition-colors focus-within:border-aurora-500",
          isLg ? "h-12 px-4 shadow-sm shadow-black/5" : "h-9 px-3.5"
        )}
      >
        <Search size={isLg ? 17 : 14} className="text-ink-300 shrink-0" />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
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
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => setSearchQuery(ex)}
              className="rounded-full border border-black/10 bg-void-900/50 px-2.5 py-1 text-[11px] text-ink-300 hover:text-ink-0 hover:border-black/20 transition-colors cursor-pointer"
            >
              {ex}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
