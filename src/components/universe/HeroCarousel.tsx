"use client";

import { useState } from "react";
import { SubscriptionLogo } from "@/components/subscriptions/SubscriptionLogo";
import { SUBSCRIPTIONS_BY_ID, getPriceForward } from "@/data/subscriptions";
import { cn, formatINR, formatPrice } from "@/lib/utils";
import { useUniverseStore } from "@/store/useUniverseStore";

// User-specified picks (see chat), not auto-selected — Bloomberg Terminal
// in particular is a deliberate contrast case (real ₹2.2L/mo pricing, not
// one of the Research & Data category's "Contact for pricing" entries).
const FEATURED_IDS = ["netflix", "chatgpt-plus", "spotify-premium", "bloomberg-terminal"];

export function HeroCarousel() {
  const [index, setIndex] = useState(0);
  const select = useUniverseStore((s) => s.select);

  const items = FEATURED_IDS.map((id) => SUBSCRIPTIONS_BY_ID[id]).filter((s) => s !== undefined);
  if (items.length === 0) return null;

  const sub = items[Math.min(index, items.length - 1)]!;
  const priceInfo = getPriceForward(sub);

  return (
    <div className="px-4 pt-4 lg:px-8">
      <div
        className="relative mx-auto flex w-full max-w-6xl items-center gap-5 overflow-hidden rounded-3xl p-6 lg:p-8"
        style={{
          background: `linear-gradient(120deg, ${sub.color}33, ${sub.color}0d 60%, transparent), var(--void-900)`,
          border: "1px solid var(--line-soft)",
        }}
      >
        <SubscriptionLogo subscription={sub} size="xl" className="shrink-0" />

        <div className="min-w-0 flex-1">
          <div className="font-display text-2xl font-bold text-ink-0 lg:text-3xl">{sub.name}</div>
          <p className="mt-1 line-clamp-2 max-w-lg text-sm text-ink-400">{sub.tagline}</p>

          <div className="mt-3 flex items-baseline gap-2">
            {priceInfo.fromPrice === null ? (
              <span className="text-lg font-bold text-ink-0">{formatPrice(sub.priceMonthly, sub.priceLabel)}</span>
            ) : (
              <>
                <span className="text-lg font-bold text-ink-0">
                  {priceInfo.strikePrice !== null && "From "}
                  {formatINR(priceInfo.fromPrice)}
                  {priceInfo.fromPrice > 0 && <span className="text-sm font-medium text-ink-400">/mo</span>}
                </span>
                {priceInfo.strikePrice !== null && (
                  <span className="text-sm text-ink-500 line-through">{formatINR(priceInfo.strikePrice)}</span>
                )}
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => select(sub.id)}
            className="mt-4 inline-flex h-10 items-center rounded-full bg-ocean-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-ocean-700 cursor-pointer"
          >
            View details
          </button>
        </div>

        <div className="absolute bottom-4 right-6 flex items-center gap-1.5">
          {items.map((item, i) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show ${item.name}`}
              aria-current={i === index}
              className={cn(
                "h-2 rounded-full transition-all cursor-pointer",
                i === index ? "w-5 bg-ocean-500" : "w-2 bg-ink-600 hover:bg-ink-500"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
