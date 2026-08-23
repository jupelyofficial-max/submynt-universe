import { Sparkle } from "lucide-react";
import { computeBestFor, computeConsiderIf, computeKeyStrengths, computeSkipIf, computeValueScore } from "@/lib/subscriptionIntelligence";
import type { Subscription } from "@/types/subscription";

/** "Is it right for me?" — capabilities 2 + 4. Every line here is computed
 * from real fields (see subscriptionIntelligence.ts); nothing is
 * hand-written per subscription. */
export function InsightSection({ sub }: { sub: Subscription }) {
  const score = computeValueScore(sub);
  const bestFor = computeBestFor(sub);
  const strengths = computeKeyStrengths(sub);
  const considerIf = computeConsiderIf(sub);
  const skipIf = computeSkipIf(sub);

  return (
    <div className="px-5 py-4 border-t border-[#E5E5E5]">
      <div className="flex items-center gap-1.5 mb-2.5">
        <Sparkle size={13} className="text-aurora-500" />
        <h4 className="text-xs font-semibold uppercase tracking-wider text-[#6B6B6B]">Submynt Insight</h4>
      </div>

      <div className="rounded-xl border border-[#E5E5E5] bg-white p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-aurora-500 bg-aurora-500/10">
            <span className="font-display text-sm font-semibold text-aurora-500">{score}</span>
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-black">Submynt Value Score</div>
            <div className="text-xs text-[#6B6B6B]">Blend of rating and Submynt Popularity, out of 100 — Submynt&apos;s own calculation, not a provider rating</div>
          </div>
        </div>

        {bestFor.length > 0 && (
          <div className="mt-3.5">
            <div className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-[#6B6B6B]">Best for</div>
            <div className="flex flex-wrap gap-1.5">
              {bestFor.map((tag) => (
                <span key={tag} className="rounded-full border border-[#E5E5E5] bg-white px-2.5 py-0.5 text-[11px] font-medium text-black">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {strengths.length > 0 && (
          <ul className="mt-3.5 flex flex-col gap-1">
            {strengths.map((s) => (
              <li key={s} className="flex items-start gap-1.5 text-xs text-[#6B6B6B]">
                <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-nebula-500" />
                {s}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-3.5 flex flex-col gap-1.5 border-t border-[#E5E5E5] pt-3.5">
          <p className="text-xs text-[#6B6B6B]">
            <span className="font-medium text-black">Consider it if:</span> {considerIf}
          </p>
          {skipIf && (
            <p className="text-xs text-[#6B6B6B]">
              <span className="font-medium text-black">May not need it if:</span> {skipIf}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
