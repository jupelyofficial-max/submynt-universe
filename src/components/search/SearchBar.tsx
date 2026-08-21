"use client";

import { Search, X } from "lucide-react";
import { useUniverseStore } from "@/store/useUniverseStore";

const EXAMPLES = ["Netflix", "AI tools", "Under ₹500", "Music", "Annual subscriptions"];

export function SearchBar({ compact }: { compact?: boolean }) {
  const searchQuery = useUniverseStore((s) => s.searchQuery);
  const setSearchQuery = useUniverseStore((s) => s.setSearchQuery);

  return (
    <div className="w-full">
      <div className="glass-panel flex items-center gap-2.5 rounded-2xl px-4 h-12 shadow-xl shadow-black/30">
        <Search size={18} className="text-ink-300 shrink-0" />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search subscriptions, categories, services..."
          className="flex-1 min-w-0 bg-transparent text-sm text-ink-0 placeholder:text-ink-500 outline-none"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="text-ink-300 hover:text-ink-0 shrink-0 cursor-pointer"
            aria-label="Clear search"
          >
            <X size={16} />
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
