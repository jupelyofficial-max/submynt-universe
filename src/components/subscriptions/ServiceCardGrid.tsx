"use client";

import { SubscriptionLogo } from "@/components/subscriptions/SubscriptionLogo";
import { Button } from "@/components/ui/Button";
import { getPriceForward } from "@/data/subscriptions";
import { formatINR, formatPrice } from "@/lib/utils";
import { useUniverseStore } from "@/store/useUniverseStore";
import type { Subscription } from "@/types/subscription";

/** Grid of service cards (bundle and ecosystem pages). A card, or its
 * View Details button, opens the detail panel in place (it's mounted
 * app-wide). */
export function ServiceCardGrid({ subscriptions }: { subscriptions: Subscription[] }) {
  const select = useUniverseStore((s) => s.select);

  return (
    <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {subscriptions.map((sub) => {
        const priceInfo = getPriceForward(sub);
        return (
          <div
            key={sub.id}
            className="glass-panel group flex flex-col gap-3 rounded-2xl p-4 transition-colors hover:border-black/20 cursor-pointer"
            onClick={() => select(sub.id)}
          >
            <div className="flex items-start gap-3">
              <SubscriptionLogo subscription={sub} size="md" bare />
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-semibold text-ink-0">{sub.name}</h3>
                <p className="mt-0.5 truncate text-xs text-ink-400">{sub.category}</p>
              </div>
              <div className="shrink-0 text-right">
                {priceInfo.fromPrice === null ? (
                  <div className="text-sm font-bold text-ink-0">{formatPrice(sub.priceMonthly, sub.priceLabel)}</div>
                ) : (
                  <>
                    <div className="text-sm font-bold text-ink-0">
                      {priceInfo.strikePrice !== null && "From "}
                      {formatINR(priceInfo.fromPrice)}
                    </div>
                    {priceInfo.fromPrice > 0 && <div className="text-[11px] text-ink-500">/mo</div>}
                  </>
                )}
              </div>
            </div>

            <p className="line-clamp-2 text-xs text-ink-400">{sub.tagline}</p>

            <Button
              size="sm"
              variant="outline"
              className="mt-auto w-full"
              onClick={(e) => {
                e.stopPropagation();
                select(sub.id);
              }}
            >
              View Details
            </Button>
          </div>
        );
      })}
    </div>
  );
}
