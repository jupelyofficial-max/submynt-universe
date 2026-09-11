"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Rocket, Search, Upload, User } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { FilterBar } from "@/components/filters/FilterBar";
import { SearchBar } from "@/components/search/SearchBar";
import { ViewSwitcher } from "@/components/views/ViewSwitcher";
import { useMySubscriptionsStore } from "@/store/useMySubscriptionsStore";
import { useUniverseStore } from "@/store/useUniverseStore";

export function TopNav() {
  const pathname = usePathname();
  const isExplore = pathname === "/explore" || pathname?.startsWith("/explore/");
  const router = useRouter();
  const ownedCount = useMySubscriptionsStore((s) => s.owned.length);
  const setBoostModalOpen = useUniverseStore((s) => s.setBoostModalOpen);
  const setSubmitModalOpen = useUniverseStore((s) => s.setSubmitModalOpen);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearchOpen(false);
    router.push(`/explore${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ""}`);
  }

  return (
    <header
      className="sticky top-0 z-40 border-b border-line-soft bg-void-950/80 backdrop-blur-xl"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-4 px-4 lg:px-8">
        <Link href="/explore" className="flex items-center gap-2 shrink-0 group">
          <svg width="28" height="28" viewBox="0 0 240 240" className="shrink-0 transition-opacity group-hover:opacity-80" aria-hidden="true">
            <defs>
              <linearGradient id="navLogoGreen" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0EA672" />
                <stop offset="100%" stopColor="#5EEAA0" />
              </linearGradient>
              <linearGradient id="navLogoBlue" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38BDF8" />
                <stop offset="100%" stopColor="#1D4ED8" />
              </linearGradient>
            </defs>
            <rect x="10" y="26" width="220" height="96" rx="48" fill="url(#navLogoGreen)" transform="rotate(-15 120 74)" />
            <rect x="14" y="126" width="212" height="96" rx="48" fill="url(#navLogoBlue)" />
            <path d="M 55 118 L 185 118 L 120 152 Z" fill="#0B1F5C" />
          </svg>
          <span className="font-display text-xl font-bold tracking-tight transition-opacity group-hover:opacity-80">
            <span className="text-ink-0">sub</span>
            <span className="relative pr-[0.16em] text-[#22c55e]">
              mynt
              {/* Coin Terminal — a small disc stamped on the crossbar of the final "t". */}
              <span className="absolute right-[0.02em] top-[0.3em] h-[0.15em] w-[0.15em] rounded-full bg-[#22c55e]" aria-hidden="true" />
            </span>
          </span>
        </Link>

        <div className="flex-1" />

        {isExplore && (
          <div className="hidden min-w-0 items-center gap-2 overflow-x-auto no-scrollbar md:flex">
            <div className="w-44 shrink-0 lg:w-56">
              <SearchBar compact />
            </div>
            <FilterBar className="flex-nowrap shrink-0" />
            <div className="shrink-0">
              <ViewSwitcher />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-9 shrink-0 rounded-full border-[1.5px] border-ocean-600 bg-void-950 text-ocean-600 hover:bg-ocean-500/5"
              onClick={() => setBoostModalOpen(true)}
            >
              <Rocket size={13} />
              Boost
            </Button>
            <Button size="sm" className="h-9 shrink-0 rounded-full" onClick={() => setSubmitModalOpen(true)}>
              <Upload size={13} />
              Submit
            </Button>
          </div>
        )}

        {!isExplore && (
          <>
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden sm:flex items-center gap-2 h-10 px-3.5 rounded-xl border border-black/10 text-ink-300 hover:text-ink-0 hover:border-black/20 transition-colors cursor-pointer"
              aria-label="Search subscriptions"
            >
              <Search size={16} />
              <span className="text-sm">Search the universe</span>
            </button>
            <button
              onClick={() => setSearchOpen(true)}
              className="sm:hidden h-10 w-10 flex items-center justify-center rounded-xl text-ink-300 hover:text-ink-0 hover:bg-black/5 cursor-pointer"
              aria-label="Search subscriptions"
            >
              <Search size={18} />
            </button>
          </>
        )}

        <Link
          href="/my-subscriptions"
          className="relative h-10 w-10 flex shrink-0 items-center justify-center rounded-xl text-ink-300 hover:text-ink-0 hover:bg-black/5 transition-colors"
          aria-label="Profile"
        >
          <User size={18} />
          {ownedCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-nebula-500 text-void-950 text-[10px] font-bold flex items-center justify-center">
              {ownedCount}
            </span>
          )}
        </Link>
      </div>

      {/* Search overlay */}
      <AnimatePresence>
        {searchOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
              onClick={() => setSearchOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="fixed left-1/2 top-24 z-50 w-[92%] max-w-xl -translate-x-1/2"
            >
              <form onSubmit={submitSearch} className="glass-panel rounded-2xl p-2 flex items-center gap-2">
                <Search size={18} className="text-ink-300 ml-3" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search subscriptions, categories, services..."
                  className="flex-1 bg-transparent py-3 text-sm text-ink-0 placeholder:text-ink-500 outline-none"
                />
                <Button type="submit" size="sm">
                  Search
                </Button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
