import { Gift } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { BILLING_LABELS } from "@/data/categories";
import { getProviderUrl } from "@/lib/subscriptionIntelligence";
import { formatINR } from "@/lib/utils";
import type { Subscription } from "@/types/subscription";

/** "What does it really cost?" — capabilities 5 + 6. Extends the existing
 * plan-grid pattern with an effective-monthly-vs-annual-savings line (only
 * computed against the same subscription's own monthly plan, never a
 * cross-subscription comparison) and a trial CTA that only appears when
 * there's real trial data AND a real URL to send someone to. */
export function PlansSection({ sub }: { sub: Subscription }) {
  const monthlyPlan = sub.plans.find((p) => p.billing === "monthly") ?? sub.plans[0];
  const providerUrl = getProviderUrl(sub);

  return (
    <div className="px-4 py-3 border-b border-line-soft">
      <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-ink-500">Available plans</h4>
      <div className="grid grid-cols-2 gap-1.5">
        {sub.plans.map((plan) => {
          const annualSavings = monthlyPlan && plan.name !== monthlyPlan.name ? (monthlyPlan.priceMonthly - plan.priceMonthly) * 12 : 0;
          return (
            <div key={plan.name} className="flex flex-col items-start rounded-xl bg-black/[0.03] px-3 py-2">
              <span className="text-xs text-ink-300">{plan.name} · {BILLING_LABELS[plan.billing]}</span>
              <span className="text-sm font-semibold text-ink-0">{formatINR(plan.priceMonthly)}</span>
              {annualSavings > 0 && <span className="mt-0.5 text-[10px] font-medium text-nebula-500">Save {formatINR(annualSavings)}/yr</span>}
            </div>
          );
        })}
      </div>

      {sub.trialDays && (
        <div className="mt-2.5 flex items-center justify-between gap-3 rounded-xl border border-nebula-500/25 bg-nebula-500/[0.06] px-3 py-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <Gift size={15} className="shrink-0 text-nebula-500" />
            <span className="text-xs font-medium text-ink-100 truncate">Free trial available — {sub.trialDays} days</span>
          </div>
          {providerUrl && (
            <Button size="sm" variant="secondary" className="shrink-0" href={providerUrl} target="_blank" rel="noopener noreferrer">
              Start Free Trial
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
