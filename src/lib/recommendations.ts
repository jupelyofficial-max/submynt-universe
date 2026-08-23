import { VERIFICATION_BY_ID } from "@/data/verification";
import { computeValueScore } from "@/lib/subscriptionIntelligence";
import type { RecommendationContext, RecommendationResult } from "@/types/recommendation";
import type { Subscription } from "@/types/subscription";

/**
 * The Submynt personalized recommendation engine. Distinct from
 * rankAlternatives (subscriptionIntelligence.ts), which is comparison-
 * oriented (price/rating/popularity deltas against one specific
 * subscription) — this scores against a user's own context: what they
 * already own, and (when eventually collected) a stated budget or desired
 * features.
 *
 * INVARIANT — do not weaken this: neither `computeRecommendationScore` nor
 * `computeRecommendationReasons` takes a sponsorship/vendor parameter.
 * Sponsored placement (see data/vendors.ts, SponsoredStrip.tsx) is a
 * visibility concern handled entirely separately — a paid placement cannot
 * change these numbers because these functions have no way to see it.
 */
export const RECOMMENDATION_WEIGHTS = {
  valueScore: 0.3,
  categoryFit: 0.2,
  trialAvailability: 0.15,
  verifiedAvailability: 0.15,
  budgetMatch: 0.2,
} as const;

export function computeRecommendationScore(sub: Subscription, context: RecommendationContext): number {
  const verification = VERIFICATION_BY_ID[sub.id];
  const ownedCategories = new Set(context.ownedSubscriptions.map((o) => o.category));

  let weightedSum = 0;
  let applicableWeight = 0;

  weightedSum += computeValueScore(sub) * RECOMMENDATION_WEIGHTS.valueScore;
  applicableWeight += RECOMMENDATION_WEIGHTS.valueScore;

  const categoryFitScore = ownedCategories.has(sub.category) ? 100 : 0;
  weightedSum += categoryFitScore * RECOMMENDATION_WEIGHTS.categoryFit;
  applicableWeight += RECOMMENDATION_WEIGHTS.categoryFit;

  const trialScore = sub.trialDays ? 100 : 0;
  weightedSum += trialScore * RECOMMENDATION_WEIGHTS.trialAvailability;
  applicableWeight += RECOMMENDATION_WEIGHTS.trialAvailability;

  // Reads the real verification layer — today every record is UNVERIFIED,
  // so this component is always 0 until real sourced data exists.
  const verifiedScore = verification.price.confidence !== "unverified" ? 100 : 0;
  weightedSum += verifiedScore * RECOMMENDATION_WEIGHTS.verifiedAvailability;
  applicableWeight += RECOMMENDATION_WEIGHTS.verifiedAvailability;

  // Only counted when a real budget was provided — no budget-input UI
  // exists yet, so this factor is simply excluded (not zeroed) otherwise,
  // and the remaining weights are renormalized so its absence doesn't
  // unfairly drag every score down.
  if (context.budgetMonthly !== undefined && context.budgetMonthly > 0) {
    const overBudgetFraction = Math.max(0, (sub.priceMonthly - context.budgetMonthly) / context.budgetMonthly);
    const budgetScore = Math.max(0, 100 - overBudgetFraction * 100);
    weightedSum += budgetScore * RECOMMENDATION_WEIGHTS.budgetMatch;
    applicableWeight += RECOMMENDATION_WEIGHTS.budgetMatch;
  }

  return Math.round(weightedSum / applicableWeight);
}

/** Every reason is gated on a real, checkable signal. "Strong feature
 * match" has no path to ever appear today: Subscription has no `features`
 * field (no factual basis to claim specific product features — same call
 * as the detail-panel work last turn) and no UI collects desiredFeatures
 * yet. That gap is intentional and documented, not silently faked. */
export function computeRecommendationReasons(sub: Subscription, context: RecommendationContext): string[] {
  const reasons: string[] = [];

  if (sub.region === "India" || sub.region === "Available in India") {
    reasons.push("Available in India");
  }

  const monthlyPlan = sub.plans.find((p) => p.billing === "monthly") ?? sub.plans[0];
  const annualPlan = sub.plans.find((p) => p.billing === "annual");
  if (monthlyPlan && annualPlan && annualPlan.priceMonthly < monthlyPlan.priceMonthly) {
    reasons.push("Better annual value");
  }

  const ownedCategories = new Set(context.ownedSubscriptions.map((o) => o.category));
  const alreadyOwnsThis = context.ownedSubscriptions.some((o) => o.id === sub.id);
  if (ownedCategories.has(sub.category) && !alreadyOwnsThis) {
    reasons.push("Strong alternative to your current subscription");
  }

  if (context.budgetMonthly !== undefined && sub.priceMonthly <= context.budgetMonthly) {
    reasons.push("Fits your budget");
  }

  return reasons.slice(0, 3);
}

export function getRecommendation(sub: Subscription, context: RecommendationContext): RecommendationResult {
  return {
    subscription: sub,
    score: computeRecommendationScore(sub, context),
    reasons: computeRecommendationReasons(sub, context),
  };
}
