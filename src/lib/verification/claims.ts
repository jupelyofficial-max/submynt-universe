import type { SubscriptionVerification } from "@/types/verification";

/**
 * The single choke point every savings/trial claim in the app routes
 * through. Both return false for the entire current catalogue — that's the
 * correct, honest answer today. Real sourced data flips exactly this one
 * place, not every call site that renders a claim.
 */
export function canClaimSavings(a: SubscriptionVerification, b: SubscriptionVerification): boolean {
  return (
    a.price.confidence !== "unverified" &&
    b.price.confidence !== "unverified" &&
    a.price.currency === b.price.currency &&
    a.price.country === b.price.country
  );
}

export function canClaimTrial(v: SubscriptionVerification): boolean {
  return v.trial.confidence !== "unverified";
}
