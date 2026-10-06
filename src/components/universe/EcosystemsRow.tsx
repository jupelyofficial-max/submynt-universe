"use client";

import { useState } from "react";
import Image from "next/image";
import { SubscriptionLogo } from "@/components/subscriptions/SubscriptionLogo";
import { ECOSYSTEMS, ecosystemServices, type EcosystemId } from "@/data/ecosystems";
import { catalogPriceLabel, cn } from "@/lib/utils";
import { trackEvent } from "@/lib/events";
import { useUniverseStore } from "@/store/useUniverseStore";

// Only brands with at least this many catalogue subscriptions are shown —
// a "family" of one isn't an ecosystem.
const MIN_SERVICES = 2;

export function EcosystemsRow() {
  const select = useUniverseStore((s) => s.select);
  const [openId, setOpenId] = useState<EcosystemId | null>(null);

  const ecosystems = ECOSYSTEMS.map((eco) => ({ ...eco, services: ecosystemServices(eco) })).filter(
    (eco) => eco.services.length >= MIN_SERVICES
  );
  const open = ecosystems.find((eco) => eco.id === openId);

  // Clicking a brand opens its strip below; clicking it again closes it,
  // clicking another switches to that one.
  function toggle(id: EcosystemId) {
    if (openId === id) {
      setOpenId(null);
      return;
    }
    setOpenId(id);
    trackEvent("ecosystem_opened", { brand: id });
  }

  if (ecosystems.length === 0) return null;

  return (
    <div className="px-4 pb-2 pt-5 lg:px-8">
      <div className="mx-auto max-w-[92rem]">
        <h2 className="mb-3 text-lg font-semibold text-ink-0">Subscription Ecosystems</h2>
        <div className="flex items-center justify-center gap-4 overflow-x-auto no-scrollbar pb-1 sm:gap-7">
          {ecosystems.map((eco) => {
            const active = eco.id === openId;
            return (
              <button
                key={eco.id}
                type="button"
                onClick={() => toggle(eco.id)}
                aria-expanded={active}
                aria-label={`${eco.name} subscriptions`}
                className="group flex shrink-0 flex-col items-center gap-2 cursor-pointer"
              >
                <div
                  className={cn(
                    "relative flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-md shadow-black/5 transition-all duration-200 sm:h-24 sm:w-24",
                    "group-hover:-translate-y-0.5 group-hover:shadow-lg group-hover:shadow-black/10 group-active:translate-y-0",
                    active && "ring-2 ring-ocean-500"
                  )}
                >
                  {/* next/image: source files are ~0.8-1MB despite rendering
                      at 64-96px — auto-resize matters a lot here. Above the
                      fold on /explore, but small enough not to need
                      `priority` (hero carousel is the real LCP candidate). */}
                  <div className="relative h-[70%] w-[70%]">
                    <Image src={eco.logo} alt="" fill sizes="96px" className="object-contain" draggable={false} />
                  </div>
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

        {/* The open brand's subscriptions; a card opens its detail panel in place. */}
        {open && (
          <div className="mt-4">
            <p className="mb-2 text-sm font-medium text-ink-300">{open.name} subscriptions</p>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
              {open.services.map((sub) => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => select(sub.id)}
                  className="flex w-60 shrink-0 items-center gap-3 rounded-2xl border border-black/10 bg-void-900 p-3 text-left transition-colors hover:border-black/20 cursor-pointer"
                >
                  <SubscriptionLogo subscription={sub} size="sm" />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-ink-0">{sub.name}</div>
                    <div className="truncate text-xs text-ink-500">{catalogPriceLabel(sub)}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
