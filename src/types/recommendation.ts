import type { Subscription } from "./subscription";

/**
 * Optional fields default to "not provided," never a guessed value — a
 * budget or feature-preference input UI doesn't exist in this app yet, so
 * those factors simply contribute nothing to the score until real input
 * exists, rather than being inferred.
 */
export interface RecommendationContext {
  ownedSubscriptions: Subscription[];
  budgetMonthly?: number;
  desiredFeatures?: string[];
}

export interface RecommendationResult {
  subscription: Subscription;
  score: number;
  reasons: string[];
}
