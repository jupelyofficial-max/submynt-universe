import { Gift } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { BILLING_LABELS } from "@/data/categories";
import { getProviderUrl } from "@/lib/subscriptionIntelligence";
import { canClaimTrial } from "@/lib/verification/claims";
import { cn, formatINR } from "@/lib/utils";
import type { Subscription } from "@/types/subscription";
import type { SubscriptionVerification } from "@/types/verification";

/** "What does it really cost?" — capabilities 5 + 6. Extends the existing
 * plan-grid pattern with an effective-monthly-vs-annual-savings line (only
 * computed against the same subscription's own monthly plan, never a
 * cross-subscription comparison) and a trial section that only ever
 * presents a confident "Start Free Trial" claim when canClaimTrial() says
 * the trial is sourced — otherwise the same info renders, clearly qualified
 * as unverified (never deleted, never disguised as confirmed). */
export function PlansSection({ sub, verification }: { sub: Subscription; verification: SubscriptionVerification }) {
  const monthlyPlan = sub.plans.find((p) => p.billing === "monthly") ?? sub.plans[0];
  const providerUrl = getProviderUrl(sub);
  const trialVerified = canClaimTrial(verification);

  return (
    <div className="px-5 py-4 border-t border-[#E5E5E5]">
      <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-[#6B6B6B]">Available plans</h4>
      <div className="grid grid-cols-2 gap-1.5">
        {sub.plans.map((plan) => {
          const annualSavings = monthlyPlan && plan.name !== monthlyPlan.name ? (monthlyPlan.priceMonthly - plan.priceMonthly) * 12 : 0;
          return (
            <div key={plan.name} className="flex flex-col items-start rounded-lg border border-[#E5E5E5] bg-white px-3 py-2">
              <span className="text-xs text-[#6B6B6B]">{plan.name} · {BILLING_LABELS[plan.billing]}</span>
              <span className="text-sm font-semibold text-black">{formatINR(plan.priceMonthly)}</span>
              {annualSavings > 0 && <span className="mt-0.5 text-[10px] font-medium text-nebula-500">Save {formatINR(annualSavings)}/yr</span>}
            </div>
          );
        })}
      </div>

      {sub.trialDays && (
        <div
          className={cn(
            "mt-2.5 flex items-center justify-between gap-3 rounded-lg border bg-white px-3 py-2.5",
            trialVerified ? "border-nebula-500/40" : "border-gold-500/40"
          )}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Gift size={15} className={cn("shrink-0", trialVerified ? "text-nebula-500" : "text-gold-500")} />
            <span className="text-xs font-medium text-black truncate">
              {trialVerified ? `Free trial available — ${sub.trialDays} days` : `Trial info unverified — ${sub.trialDays} days (per catalogue data)`}
            </span>
          </div>
          {providerUrl && (
            <Button size="sm" variant="outline" className="shrink-0" href={providerUrl} target="_blank" rel="noopener noreferrer">
              {trialVerified ? "Start Free Trial" : "View Plan Details"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
