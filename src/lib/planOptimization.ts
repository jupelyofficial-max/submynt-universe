import type { OwnedSubscription, Subscription, SubscriptionPlan } from "@/types/subscription";

export interface AnnualSwitchSuggestion {
  sub: Subscription;
  annualPlan: SubscriptionPlan;
  savingsMonthly: number;
}

/**
 * Direct/Promotional, currently billed monthly, where the subscription's
 * own catalog `plans` has a verified annual plan priced lower (monthly-
 * equivalent) than what's currently paid. No tier comparison — the
 * catalog has no feature-tier data (see Sprint 8 audit), only billing-
 * cycle variants, which is what this checks.
 */
export function annualSwitchSuggestion(owned: OwnedSubscription, sub: Subscription): AnnualSwitchSuggestion | null {
  const accessType = owned.accessType ?? "direct";
  if (accessType !== "direct" && accessType !== "promotional") return null;
  if (owned.billing !== "monthly") return null;

  const annualPlan = sub.plans.find((p) => p.billing === "annual");
  if (!annualPlan) return null;

  const savingsMonthly = owned.priceMonthly - annualPlan.priceMonthly;
  if (savingsMonthly <= 0) return null;

  return { sub, annualPlan, savingsMonthly };
}
