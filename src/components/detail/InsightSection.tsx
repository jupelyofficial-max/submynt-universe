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
    <div className="px-4 py-3 border-b border-line-soft">
      <div className="flex items-center gap-1.5 mb-2">
        <Sparkle size={13} className="text-aurora-500" />
        <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-500">Submynt Insight</h4>
      </div>

      <div className="rounded-2xl border border-line-soft bg-black/[0.02] p-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-aurora-500/40 bg-aurora-500/10">
            <span className="font-display text-base font-semibold text-aurora-500">{score}</span>
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-ink-0">Submynt Value Score</div>
            <div className="text-xs text-ink-500">Blend of rating and Submynt Popularity, out of 100 — Submynt&apos;s own calculation, not a provider rating</div>
          </div>
        </div>

        {bestFor.length > 0 && (
          <div className="mt-3">
            <div className="mb-1 text-[11px] font-medium uppercase tracking-wider text-ink-500">Best for</div>
            <div className="flex flex-wrap gap-1.5">
              {bestFor.map((tag) => (
                <span key={tag} className="rounded-full border border-black/10 bg-void-950/60 px-2.5 py-0.5 text-[11px] font-medium text-ink-100">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {strengths.length > 0 && (
          <ul className="mt-3 flex flex-col gap-1">
            {strengths.map((s) => (
              <li key={s} className="flex items-start gap-1.5 text-xs text-ink-300">
                <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-nebula-500" />
                {s}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-3 flex flex-col gap-1.5 border-t border-line-soft pt-3">
          <p className="text-xs text-ink-300">
            <span className="font-medium text-ink-0">Consider it if:</span> {considerIf}
          </p>
          {skipIf && (
            <p className="text-xs text-ink-300">
              <span className="font-medium text-ink-0">May not need it if:</span> {skipIf}
            </p>
          )}
        </div>

        <p className="mt-3 text-[10px] text-ink-500">
          ✦ Submynt Intelligence — calculated from Submynt&apos;s demo catalogue data, not independently verified.
        </p>
      </div>
    </div>
  );
}
