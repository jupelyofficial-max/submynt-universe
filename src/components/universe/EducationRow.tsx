"use client";

import { SubscriptionLogo } from "@/components/subscriptions/SubscriptionLogo";
import { Badge } from "@/components/ui/Badge";
import { getPriceForward, isRecentlyAdded, SUBSCRIPTIONS_BY_ID } from "@/data/subscriptions";
import { formatINR, formatPrice } from "@/lib/utils";
import { useUniverseStore } from "@/store/useUniverseStore";

// Real catalog ids only (src/data/subscriptions.ts) — same card markup as
// ListView's subscription cards (logo, name, badges, pricing), just laid
// out as a horizontal-scroll row instead of a grid.
const EDUCATION_IDS = ["duolingo-super", "linkedin-learning", "coursera-plus", "pw-pi-pro", "udemy-personal-plan", "skillshare"];

export function EducationRow() {
  const select = useUniverseStore((s) => s.select);
  const items = EDUCATION_IDS.map((id) => SUBSCRIPTIONS_BY_ID[id]).filter((s) => s !== undefined);
  if (items.length === 0) return null;

  return (
    <div className="px-4 pb-2 pt-5 lg:px-8">
      <div className="mx-auto max-w-[92rem]">
        <h2 className="mb-3 text-lg font-semibold text-ink-0">Education</h2>
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
          {items.map((sub) => {
            const priceInfo = getPriceForward(sub);
            return (
              <button
                key={sub.id}
                type="button"
                onClick={() => select(sub.id)}
                className="glass-panel flex w-44 shrink-0 flex-col gap-3 rounded-2xl p-4 text-left transition-colors hover:border-black/20 cursor-pointer sm:w-52"
              >
                <SubscriptionLogo subscription={sub} size="lg" bare />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1">
                    <h3 className="truncate text-sm font-semibold text-ink-0">{sub.name}</h3>
                  </div>
                  {(isRecentlyAdded(sub) || sub.trialDays || sub.trialNote) && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {isRecentlyAdded(sub) && <Badge tone="nebula">New</Badge>}
                      {sub.trialNote ? (
                        <Badge tone="aurora">{sub.trialNote}</Badge>
                      ) : (
                        sub.trialDays && <Badge tone="aurora">{sub.trialDays}d trial</Badge>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  {priceInfo.fromPrice === null ? (
                    <div className="text-sm font-bold text-ink-0">{formatPrice(sub.priceMonthly, sub.priceLabel)}</div>
                  ) : (
                    <>
                      <div className="text-sm font-bold text-ink-0">
                        {priceInfo.strikePrice !== null && "From "}
                        {formatINR(priceInfo.fromPrice)}
                      </div>
                      <div className="flex items-center gap-1">
                        {priceInfo.strikePrice !== null && (
                          <span className="text-[11px] text-ink-500 line-through">{formatINR(priceInfo.strikePrice)}</span>
                        )}
                        {priceInfo.fromPrice > 0 && <span className="text-[11px] text-ink-500">/mo</span>}
                      </div>
                    </>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
