"use client";

import { ArrowRight } from "lucide-react";
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
      <div className="mx-auto max-w-[1340px]">
        <h2 className="mb-3 text-lg font-semibold text-ink-0">Education</h2>
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
          {items.map((sub) => {
            const priceInfo = getPriceForward(sub);
            return (
              <button
                key={sub.id}
                type="button"
                onClick={() => select(sub.id)}
                className="glass-panel group flex w-44 shrink-0 flex-col gap-2 rounded-2xl p-3 text-left transition-colors hover:border-black/20 cursor-pointer sm:w-52"
              >
                {/* Fixed neutral backing, logo inset within it — normalizes
                    apparent size across favicons whose own padding/fill
                    ratio varies (e.g. a small mark on a mostly-transparent
                    canvas vs one that fills its canvas edge-to-edge), since
                    every card now anchors to the same backing footprint
                    rather than each raw image's own bounding box. */}
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-black/[0.03]">
                  <SubscriptionLogo subscription={sub} size="sm" bare />
                </div>
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-ink-0">{sub.name}</h3>
                  {(isRecentlyAdded(sub) || sub.trialDays || sub.trialNote) && (
                    <div className="mt-0.5 flex flex-wrap gap-1">
                      {isRecentlyAdded(sub) && <Badge tone="nebula">New</Badge>}
                      {sub.trialNote ? (
                        <Badge tone="aurora">{sub.trialNote}</Badge>
                      ) : (
                        sub.trialDays && <Badge tone="aurora">{sub.trialDays}d trial</Badge>
                      )}
                    </div>
                  )}
                </div>
                <div className="mt-auto flex items-end justify-between gap-2">
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
                  <span className="mb-0.5 flex shrink-0 items-center gap-0.5 text-[11px] font-medium text-ink-500 transition-colors group-hover:text-ink-0">
                    View details
                    <ArrowRight size={11} />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
