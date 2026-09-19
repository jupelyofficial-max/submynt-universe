"use client";

import { cn } from "@/lib/utils";
import { useUniverseStore } from "@/store/useUniverseStore";

// Real logo assets in public/ecosystems/ (see chat) — not recreated here.
// Clicking a brand searches the live catalog for it, reusing the same
// substring-match search (matchesSearch in filterSubscriptions.ts) the
// search bar already uses, so results are always real catalog entries
// (e.g. "Google" surfaces Google AI Pro + Google One), never a fabricated
// per-brand listing.
const ECOSYSTEMS = [
  { name: "Google", logo: "/ecosystems/google.png" },
  { name: "Microsoft", logo: "/ecosystems/microsoft.png" },
  { name: "Apple", logo: "/ecosystems/apple.png" },
  { name: "Adobe", logo: "/ecosystems/adobe.png" },
  { name: "Amazon", logo: "/ecosystems/amazon.png" },
];

export function EcosystemsRow() {
  const searchQuery = useUniverseStore((s) => s.searchQuery);
  const setSearchQuery = useUniverseStore((s) => s.setSearchQuery);

  function openEcosystem(name: string) {
    setSearchQuery(searchQuery.toLowerCase() === name.toLowerCase() ? "" : name);
  }

  return (
    <div className="px-4 pb-2 pt-5 lg:px-8">
      <div className="mx-auto max-w-[92rem]">
        <h2 className="font-editorial mb-3 text-lg text-ink-0">Subscription Ecosystems</h2>
        <div className="flex items-center gap-5 overflow-x-auto no-scrollbar pb-1 sm:gap-7">
          {ECOSYSTEMS.map((eco) => {
            const active = searchQuery.toLowerCase() === eco.name.toLowerCase();
            return (
              <button
                key={eco.name}
                type="button"
                onClick={() => openEcosystem(eco.name)}
                aria-pressed={active}
                aria-label={`${eco.name} subscriptions`}
                className="group flex shrink-0 flex-col items-center gap-2 cursor-pointer"
              >
                <div
                  className={cn(
                    "flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-md shadow-black/5 ring-1 ring-line-soft transition-all duration-200 sm:h-20 sm:w-20",
                    "group-hover:-translate-y-0.5 group-hover:shadow-lg group-hover:shadow-black/10 group-active:translate-y-0",
                    active ? "ring-2 ring-ocean-500" : "group-hover:ring-ocean-300"
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- matches SubscriptionLogo's plain-<img> convention */}
                  <img
                    src={eco.logo}
                    alt=""
                    draggable={false}
                    className="h-[70%] w-[70%] object-contain"
                  />
                </div>
                <span
                  className={cn(
                    "text-xs font-medium transition-colors",
                    active ? "text-ocean-600" : "text-ink-400 group-hover:text-ink-0"
                  )}
                >
                  {eco.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
