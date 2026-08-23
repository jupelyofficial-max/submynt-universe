import { SUBSCRIPTIONS } from "./subscriptions";
import type { SubscriptionVerification, VerifiedField } from "@/types/verification";

/**
 * Every field in today's catalogue is generated (see mkSub in
 * subscriptions.ts — deterministic hashes, not sourced data), so every
 * record gets identical, honest provenance here. This is generated
 * programmatically, not hand-authored per subscription, because there's no
 * per-record variance to author: none of them have a real source.
 *
 * country/currency are set explicitly (INR/IN) because that's genuinely
 * what the mock prices model — not a fabricated claim, just making an
 * already-true assumption explicit per the country-awareness requirement.
 */
function unverified<T>(value: T): VerifiedField<T> {
  return {
    value,
    source: "Submynt demo catalogue (not sourced from provider)",
    sourceType: "unverified_demo_data",
    confidence: "unverified",
    country: "IN",
    currency: "INR",
  };
}

export const VERIFICATION_BY_ID: Record<string, SubscriptionVerification> = Object.fromEntries(
  SUBSCRIPTIONS.map((s) => [
    s.id,
    {
      price: unverified(s.priceMonthly),
      trial: unverified({ available: Boolean(s.trialDays), days: s.trialDays }),
    },
  ])
);
