"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Orbit, Search } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { FilterBar } from "@/components/filters/FilterBar";
import { SearchBar } from "@/components/search/SearchBar";
import { AccountMenu } from "@/components/nav/AccountMenu";

export function TopNav() {
  const pathname = usePathname();
  const isExplore = pathname === "/explore" || pathname?.startsWith("/explore/");
  const router = useRouter();
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
          <svg width="36" height="36" viewBox="0 0 240 240" className="shrink-0 transition-opacity group-hover:opacity-80" aria-hidden="true">
            <defs>
              <linearGradient id="navTop" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FF5A3C" /><stop offset="30%" stopColor="#3B3BF5" />
              <stop offset="65%" stopColor="#38A8D8" /><stop offset="100%" stopColor="#4ADE80" /></linearGradient>
              <linearGradient id="navBot" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF5A3C" /><stop offset="35%" stopColor="#3B3BF5" />
              <stop offset="75%" stopColor="#38A8D8" /><stop offset="100%" stopColor="#4ADE80" /></linearGradient>
              <linearGradient id="navTri" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FF5A3C" /><stop offset="50%" stopColor="#3B3BF5" /><stop offset="100%" stopColor="#4ADE80" /></linearGradient>
            <filter id="navGlow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.6" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
            </defs>
            <g transform="translate(120 120) scale(0.86) translate(-120 -124)" filter="url(#navGlow)">
            <g transform="rotate(-15 120 74)"><rect x="10" y="26" width="220" height="96" rx="48" fill="none" stroke="url(#navTop)" strokeWidth="3.2" opacity="1.00" /><rect x="17.5" y="33.5" width="205" height="81" rx="40.5" fill="none" stroke="url(#navTop)" strokeWidth="3.2" opacity="0.92" /><rect x="25" y="41" width="190" height="66" rx="33" fill="none" stroke="url(#navTop)" strokeWidth="3.2" opacity="0.84" /><rect x="32.5" y="48.5" width="175" height="51" rx="25.5" fill="none" stroke="url(#navTop)" strokeWidth="3.2" opacity="0.76" /><rect x="40" y="56" width="160" height="36" rx="18" fill="none" stroke="url(#navTop)" strokeWidth="3.2" opacity="0.68" /><rect x="47.5" y="63.5" width="145" height="21" rx="10.5" fill="none" stroke="url(#navTop)" strokeWidth="3.2" opacity="0.60" /></g>
            <g><rect x="14" y="126" width="212" height="96" rx="48" fill="none" stroke="url(#navBot)" strokeWidth="3.2" opacity="1.00" /><rect x="21.5" y="133.5" width="197" height="81" rx="40.5" fill="none" stroke="url(#navBot)" strokeWidth="3.2" opacity="0.92" /><rect x="29" y="141" width="182" height="66" rx="33" fill="none" stroke="url(#navBot)" strokeWidth="3.2" opacity="0.84" /><rect x="36.5" y="148.5" width="167" height="51" rx="25.5" fill="none" stroke="url(#navBot)" strokeWidth="3.2" opacity="0.76" /><rect x="44" y="156" width="152" height="36" rx="18" fill="none" stroke="url(#navBot)" strokeWidth="3.2" opacity="0.68" /><rect x="51.5" y="163.5" width="137" height="21" rx="10.5" fill="none" stroke="url(#navBot)" strokeWidth="3.2" opacity="0.60" /></g>
            <path d="M 55 152 L 185 152 L 120 118 Z" fill="url(#navTri)" />
            </g>
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
          className="hidden sm:flex items-center gap-1.5 h-10 px-3 rounded-xl text-sm text-ink-300 hover:text-ink-0 hover:bg-black/5 transition-colors shrink-0"
        >
          <Orbit size={16} />
          Track Subscriptions
        </Link>
        <Link
          href="/my-subscriptions"
          aria-label="Track Subscriptions"
          className="sm:hidden h-10 w-10 flex items-center justify-center rounded-xl text-ink-300 hover:text-ink-0 hover:bg-black/5 transition-colors shrink-0"
        >
          <Orbit size={18} />
        </Link>

        <AccountMenu />
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
