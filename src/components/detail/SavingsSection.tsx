import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatINR } from "@/lib/utils";
import type { Subscription } from "@/types/subscription";

/** "Can I get something better or cheaper?" (part 1) — capability 3. Only
 * renders when a real cheaper-and-comparable alternative exists in the
 * catalogue (see bestSavingsAlternative in data/subscriptions.ts); no
 * arbitrary savings number is ever shown. */
export function SavingsSection({
  sub,
  alternative,
  monthlySavings,
  onViewAlternative,
}: {
  sub: Subscription;
  alternative: Subscription;
  monthlySavings: number;
  onViewAlternative: () => void;
}) {
  const annualSavings = monthlySavings * 12;

  return (
    <div className="mx-4 my-3 rounded-2xl border border-gold-500/25 bg-gold-500/[0.06] p-3.5">
      <div className="flex items-center gap-2 text-gold-400 text-xs font-semibold uppercase tracking-wider">
        <Sparkles size={14} />
        Potential saving (estimate)
      </div>
      <div className="mt-2.5 flex items-center justify-between text-sm">
        <span className="text-ink-300">{sub.name}</span>
        <span className="font-semibold text-ink-0">{formatINR(sub.priceMonthly)}/mo</span>
      </div>
      <div className="mt-1 flex items-center justify-between text-sm">
        <span className="text-ink-300">{alternative.name}</span>
        <span className="font-semibold text-nebula-500">{formatINR(alternative.priceMonthly)}/mo</span>
      </div>
      <div className="mt-2.5 grid grid-cols-2 gap-2 border-t border-gold-500/20 pt-2.5">
        <div>
          <div className="text-[11px] text-ink-500">Monthly saving</div>
          <div className="text-sm font-semibold text-gold-400">{formatINR(monthlySavings)}</div>
        </div>
        <div>
          <div className="text-[11px] text-ink-500">Annual saving</div>
          <div className="text-sm font-semibold text-gold-400">{formatINR(annualSavings)}</div>
        </div>
      </div>
      <Button size="sm" variant="secondary" className="mt-3 w-full" onClick={onViewAlternative}>
        Explore cheaper alternatives
      </Button>
    </div>
  );
}
