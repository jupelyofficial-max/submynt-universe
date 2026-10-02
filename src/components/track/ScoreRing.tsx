import { scoreBand } from "@/lib/trackPresentation";

/** Aggregate Submynt Score ring for the Track Subscriptions summary strip
 * — presentation only, score is the average of each owned item's already-
 * computed computeSubmyntScore result (no new scoring logic here). */
export function ScoreRing({ score, size = 72 }: { score: number; size?: number }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--ts-border)" strokeWidth={6} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--ts-mint-500)"
            strokeWidth={6}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="ts-tabular text-lg font-bold" style={{ color: "var(--ts-ink-0)" }}>
            {score}
          </span>
        </div>
      </div>
      <span className="text-[11px] font-medium" style={{ color: "var(--ts-mint-400)" }}>
        {scoreBand(score)}
      </span>
    </div>
  );
}
