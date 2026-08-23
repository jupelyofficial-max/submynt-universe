import { SubscriptionLogo } from "@/components/subscriptions/SubscriptionLogo";
import type { RankedAlternative } from "@/lib/subscriptionIntelligence";
import { formatINR } from "@/lib/utils";

/** "Can I get something better or cheaper?" (part 2) — capability 12.
 * Reason tags are read straight off each RankedAlternative — see
 * rankAlternatives in subscriptionIntelligence.ts for how they're derived
 * from real price/rating/popularity deltas, never hand-written. */
export function AlternativesSection({
  alternatives,
  onSelect,
}: {
  alternatives: RankedAlternative[];
  onSelect: (id: string) => void;
}) {
  if (alternatives.length === 0) return null;

  return (
    <div id="alt-section" className="px-4 py-3">
      <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-ink-500">Alternatives &amp; related</h4>
      <div className="flex flex-col gap-1">
        {alternatives.map(({ subscription: alt, reasons }) => (
          <button
            key={alt.id}
            onClick={() => onSelect(alt.id)}
            className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 hover:bg-black/5 transition-colors text-left cursor-pointer"
          >
            <SubscriptionLogo subscription={alt} size="xs" bare />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-ink-0 truncate">{alt.name}</div>
              <div className="flex flex-wrap gap-x-1.5 text-xs text-ink-500">
                {reasons.map((r, i) => (
                  <span key={r} className="text-nebula-500">
                    {r}
                    {i < reasons.length - 1 && <span className="text-ink-500"> · </span>}
                  </span>
                ))}
              </div>
            </div>
            <div className="text-sm font-semibold text-ink-100 shrink-0">{formatINR(alt.priceMonthly)}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
