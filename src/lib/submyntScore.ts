import { bestSavingsAlternative, potentialSavingsMonthly } from "@/data/subscriptions";
import { categoryAveragePrice, computeValueScore } from "@/lib/subscriptionIntelligence";
import { formatINR } from "@/lib/utils";
import type { AccessType, Subscription, UsageFrequency } from "@/types/subscription";

/**
 * Rule-based, explainable scoring (NFR-012) — every input is a real,
 * inspectable field (usage_frequency, catalogue price/rating/popularity,
 * bestSavingsAlternative), never an LLM call. computeValueScore's raw
 * rating/popularity blend stays an internal signal here — it feeds the
 * price-value factor but is never surfaced to the user directly; reasons
 * are phrased in terms of usage, price/value and alternatives instead.
 */

export type Recommendation = "keep" | "optimize" | "reassess";

export interface SubmyntScoreResult {
  score: number;
  recommendation: Recommendation;
  reasons: string[];
}

const USAGE_SCORES: Record<UsageFrequency, number> = {
  daily: 100,
  weekly: 85,
  monthly: 60,
  rarely: 25,
  never: 0,
};

const KEEP_THRESHOLD = 70;
const OPTIMIZE_THRESHOLD = 40;

function toRecommendation(score: number): Recommendation {
  if (score >= KEEP_THRESHOLD) return "keep";
  if (score >= OPTIMIZE_THRESHOLD) return "optimize";
  return "reassess";
}

/** computeValueScore (rating+popularity) minus a penalty for being priced
 * above the category's own paid average — up to a 40-point penalty at 2x
 * the category average, none below it. categoryAveragePrice already
 * excludes free and no-public-price ("Contact for pricing") entries from
 * that average on its own. */
function priceValueScore(sub: Subscription): number {
  const quality = computeValueScore(sub);
  if (sub.priceMonthly === null || sub.priceMonthly <= 0) return quality;
  const avg = categoryAveragePrice(sub.category);
  if (avg <= 0) return quality;
  const penalty = Math.max(0, Math.min(40, (sub.priceMonthly / avg - 1) * 40));
  return Math.max(0, quality - penalty);
}

/** 100 when no cheaper same-category alternative exists; otherwise pulled
 * down proportional to the savings gap as a fraction of what's currently
 * paid — a cheaper alternative saving 50%+ zeroes this factor out. */
function alternativesFactorScore(sub: Subscription): number {
  if (sub.priceMonthly === null || sub.priceMonthly <= 0) return 100;
  const savings = potentialSavingsMonthly(sub);
  if (savings <= 0) return 100;
  const ratio = savings / sub.priceMonthly;
  return Math.max(0, 100 - ratio * 200);
}

function directScore(sub: Subscription, usage?: UsageFrequency): { score: number; pv: number; alt: number } {
  const pv = priceValueScore(sub);
  const alt = alternativesFactorScore(sub);
  const score = usage !== undefined ? 0.4 * USAGE_SCORES[usage] + 0.3 * pv + 0.3 * alt : 0.5 * pv + 0.5 * alt;
  return { score, pv, alt };
}

function directReasons(sub: Subscription, usage: UsageFrequency | undefined, pv: number, recommendation: Recommendation): string[] {
  const altSub = bestSavingsAlternative(sub);
  const savings = potentialSavingsMonthly(sub);
  const positives: string[] = [];
  const negatives: string[] = [];

  if (usage === "daily" || usage === "weekly") positives.push("used regularly");
  if (usage === "rarely") negatives.push("used rarely");
  if (usage === "never") negatives.push("not used");

  if (pv >= 80) positives.push("strong value for what you pay");
  if (pv < 55) negatives.push("priced above what similar subscriptions typically cost");

  if (altSub && savings > 0) {
    negatives.push(`${altSub.name} offers similar content for ${formatINR(savings)}/mo less`);
  } else {
    positives.push("no cheaper alternative found");
  }

  const picked = recommendation === "keep" ? positives : negatives;
  if (picked.length > 0) return picked.slice(0, 2);
  // Fall back to the other polarity rather than showing nothing — e.g. an
  // "optimize" score with no single dominant negative factor.
  return (recommendation === "keep" ? negatives : positives).slice(0, 2);
}

function bundledScore(sub: Subscription, usage?: UsageFrequency): { score: number } {
  const quality = computeValueScore(sub);
  if (usage === undefined) return { score: quality };
  return { score: 0.8 * USAGE_SCORES[usage] + 0.2 * quality };
}

function bundledReasons(usage: UsageFrequency | undefined): string[] {
  if (usage === undefined) return ["usage not recorded yet"];
  if (usage === "daily" || usage === "weekly") return ["used regularly, worth keeping even though it's bundled at no extra cost"];
  if (usage === "rarely") return ["used rarely, but costs nothing extra to keep"];
  if (usage === "never") return ["not used, even though it's bundled at no extra cost"];
  return ["bundled at no extra cost"];
}

/**
 * Direct/Promotional: usage 40% / price-value 30% / alternatives 30%
 * (usage's weight redistributes 50/50 across the other two when unknown —
 * missing data drops the term rather than guessing a value for it).
 *
 * Bundled/Family/Free: usage 80% / quality 20%, no alternatives factor at
 * all — a cheaper *direct-purchase* alternative is irrelevant when this
 * isn't being paid for directly. Quality here is computeValueScore's raw
 * rating/popularity blend, not price-penalized (there's no comparable
 * "price paid" to penalize). Unknown usage falls back to quality alone.
 *
 * Thresholds: score >= 70 Keep, 40-69 Optimize, < 40 Reassess.
 */
export function computeSubmyntScore(sub: Subscription, accessType: AccessType, usageFrequency?: UsageFrequency): SubmyntScoreResult {
  const isDirectFormula = accessType === "direct" || accessType === "promotional";

  if (isDirectFormula) {
    const { score: raw, pv } = directScore(sub, usageFrequency);
    const score = Math.round(Math.max(0, Math.min(100, raw)));
    const recommendation = toRecommendation(score);
    return { score, recommendation, reasons: directReasons(sub, usageFrequency, pv, recommendation) };
  }

  const { score: raw } = bundledScore(sub, usageFrequency);
  const score = Math.round(Math.max(0, Math.min(100, raw)));
  const recommendation = toRecommendation(score);
  return { score, recommendation, reasons: bundledReasons(usageFrequency) };
}
