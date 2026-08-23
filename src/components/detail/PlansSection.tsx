import { BILLING_LABELS } from "@/data/categories";
import { formatINR } from "@/lib/utils";
import type { Subscription } from "@/types/subscription";

/** "What does it really cost?" — capability 5. A plan grid with an
 * effective-monthly-vs-annual-savings line (only computed against the same
 * subscription's own monthly plan, never a cross-subscription comparison). */
export function PlansSection({ sub }: { sub: Subscription }) {
  const monthlyPlan = sub.plans.find((p) => p.billing === "monthly") ?? sub.plans[0];

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
    </div>
  );
}
