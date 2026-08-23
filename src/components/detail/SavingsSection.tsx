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
    <div className="px-5 py-4 border-t border-[#E5E5E5]">
      <div
        className={cn("rounded-xl border bg-white p-4", verified ? "border-nebula-500/40" : "border-gold-500/40")}
      >
        <div className={cn("flex items-center gap-2 text-xs font-semibold uppercase tracking-wider", verified ? "text-nebula-500" : "text-gold-500")}>
          {verified ? <Sparkles size={14} /> : <AlertCircle size={14} />}
          {verified ? "Potential saving" : "Estimated saving — unverified pricing"}
        </div>
        <div className="mt-2.5 flex items-center justify-between text-sm">
          <span className="text-[#6B6B6B]">{sub.name}</span>
          <span className="font-semibold text-black">{formatINR(sub.priceMonthly)}/mo</span>
        </div>
        <div className="mt-1 flex items-center justify-between text-sm">
          <span className="text-[#6B6B6B]">{alternative.name}</span>
          <span className={cn("font-semibold", verified ? "text-nebula-500" : "text-black")}>{formatINR(alternative.priceMonthly)}/mo</span>
        </div>
        <div className="mt-2.5 grid grid-cols-2 gap-2 border-t border-[#E5E5E5] pt-2.5">
          <div>
            <div className="text-[11px] text-[#6B6B6B]">Monthly saving</div>
            <div className={cn("text-sm font-semibold", verified ? "text-nebula-500" : "text-gold-500")}>~{formatINR(monthlySavings)}</div>
          </div>
          <div>
            <div className="text-[11px] text-[#6B6B6B]">Annual saving</div>
            <div className={cn("text-sm font-semibold", verified ? "text-nebula-500" : "text-gold-500")}>~{formatINR(annualSavings)}</div>
          </div>
        </div>
        {!verified && <p className="mt-2 text-[10px] text-[#999999]">Based on Submynt&apos;s demo catalogue pricing, not independently verified.</p>}
        <Button size="sm" variant="outline" className="mt-3 w-full" onClick={onViewAlternative}>
          {verified ? "Explore cheaper alternatives" : "See similar options"}
        </Button>
      </div>
    </div>
  );
}
