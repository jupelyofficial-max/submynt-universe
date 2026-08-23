import { AlertCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn, formatINR } from "@/lib/utils";
import type { Subscription } from "@/types/subscription";

/** "Can I get something better or cheaper?" (part 1) — capability 3. Only
 * renders when a cheaper alternative exists in the catalogue. The numbers
 * are never hidden (item 13: don't delete working UI blindly), but the
 * styling and copy only ever assert a confident "Potential Saving" when
 * `verified` is true — otherwise it's the same math, visibly reframed as an
 * unverified estimate rather than a claim. Every record in today's
 * catalogue is unverified, so `verified` is false everywhere right now. */
export function SavingsSection({
  sub,
  alternative,
  monthlySavings,
  verified,
  onViewAlternative,
}: {
  sub: Subscription;
  alternative: Subscription;
  monthlySavings: number;
  verified: boolean;
  onViewAlternative: () => void;
}) {
  const annualSavings = monthlySavings * 12;

  return (
    <div
      className={cn(
        "mx-4 my-3 rounded-2xl border p-3.5",
        verified ? "border-gold-500/25 bg-gold-500/[0.06]" : "border-black/10 bg-black/[0.03]"
      )}
    >
      <div className={cn("flex items-center gap-2 text-xs font-semibold uppercase tracking-wider", verified ? "text-gold-400" : "text-ink-500")}>
        {verified ? <Sparkles size={14} /> : <AlertCircle size={14} />}
        {verified ? "Potential saving" : "Submynt Insight — Estimated (Unverified Pricing)"}
      </div>
      <div className="mt-2.5 flex items-center justify-between text-sm">
        <span className="text-ink-300">{sub.name}</span>
        <span className="font-semibold text-ink-0">{formatINR(sub.priceMonthly)}/mo</span>
      </div>
      <div className="mt-1 flex items-center justify-between text-sm">
        <span className="text-ink-300">{alternative.name}</span>
        <span className={cn("font-semibold", verified ? "text-nebula-500" : "text-ink-300")}>{formatINR(alternative.priceMonthly)}/mo</span>
      </div>
      <div className={cn("mt-2.5 grid grid-cols-2 gap-2 border-t pt-2.5", verified ? "border-gold-500/20" : "border-black/10")}>
        <div>
          <div className="text-[11px] text-ink-500">Monthly saving</div>
          <div className={cn("text-sm font-semibold", verified ? "text-gold-400" : "text-ink-100")}>~{formatINR(monthlySavings)}</div>
        </div>
        <div>
          <div className="text-[11px] text-ink-500">Annual saving</div>
          <div className={cn("text-sm font-semibold", verified ? "text-gold-400" : "text-ink-100")}>~{formatINR(annualSavings)}</div>
        </div>
      </div>
      {!verified && <p className="mt-2 text-[10px] text-ink-500">Based on Submynt&apos;s demo catalogue pricing, not independently verified.</p>}
      <Button size="sm" variant={verified ? "secondary" : "outline"} className="mt-3 w-full" onClick={onViewAlternative}>
        {verified ? "Explore cheaper alternatives" : "See similar options"}
      </Button>
    </div>
  );
}
