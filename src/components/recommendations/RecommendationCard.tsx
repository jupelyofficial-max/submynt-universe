import { Scale, Sparkle } from "lucide-react";
import { SubscriptionLogo } from "@/components/subscriptions/SubscriptionLogo";
import { Button } from "@/components/ui/Button";
import { formatINR } from "@/lib/utils";
import type { RecommendationResult } from "@/types/recommendation";

/**
 * Reusable "Submynt recommends this" card (item 26). Deliberately generic —
 * takes an already-computed RecommendationResult rather than a subscription
 * + context, so it never has a way to see sponsorship data and can't
 * accidentally be wired to a paid placement. Reused wherever a personalized
 * pick needs to be shown (today: the detail panel's top alternative).
 */
export function RecommendationCard({
  result,
  onExplore,
  onCompare,
}: {
  result: RecommendationResult;
  onExplore: () => void;
  onCompare?: () => void;
}) {
  const { subscription: sub, score, reasons } = result;

  return (
    <div className="rounded-xl border border-[#E5E5E5] border-l-2 border-l-aurora-500 bg-white p-4">
      <div className="flex items-center gap-1.5 mb-2.5">
        <Sparkle size={13} className="text-aurora-500" />
        <span className="text-xs font-semibold uppercase tracking-wider text-aurora-500">Recommended for you</span>
      </div>

      <div className="flex items-start gap-3">
        <SubscriptionLogo subscription={sub} size="md" bare />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-semibold text-black truncate">{sub.name}</h4>
            <span className="shrink-0 text-xs font-semibold text-aurora-500">{score}% match</span>
          </div>
          <p className="text-xs text-[#6B6B6B]">{sub.category}</p>
          {reasons[0] && <p className="mt-1 text-xs text-[#6B6B6B]">{reasons[0]}</p>}
        </div>
      </div>

      <div className="mt-3 text-sm font-semibold text-black">{formatINR(sub.priceMonthly)}{sub.priceMonthly > 0 && <span className="text-xs font-normal text-[#6B6B6B]">/mo</span>}</div>

      <div className="mt-3 flex gap-2">
        <Button size="sm" variant="secondary" className="flex-1" onClick={onExplore}>
          Explore →
        </Button>
        {onCompare && (
          <Button size="sm" variant="outline" onClick={onCompare}>
            <Scale size={14} />
          </Button>
        )}
      </div>
    </div>
  );
}
