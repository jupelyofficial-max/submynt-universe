/**
 * Data-provenance types for the Verified Data & Subscription Intelligence
 * Engine. Kept entirely separate from `Subscription` (types/subscription.ts)
 * — this is metadata ABOUT a subscription's facts, not the facts
 * themselves, so adding it never touches the ~35 existing call sites that
 * read `Subscription` fields directly.
 */

export type SourceType =
  | "official_pricing_page"
  | "official_support_page"
  | "official_checkout_page"
  | "app_store_listing"
  | "verified_partner_feed"
  | "secondary_source"
  | "user_submitted"
  /** The honest label for every record in today's catalogue — a
   * deterministic mock value, not sourced from anywhere real. */
  | "unverified_demo_data";

export type ConfidenceLevel = "high" | "medium" | "low" | "unverified";

export type VerificationState = "VERIFIED" | "PARTIALLY_VERIFIED" | "UNVERIFIED" | "STALE";

export interface VerifiedField<T> {
  value: T;
  /** Human-readable source name, e.g. "Netflix pricing page" or "Submynt demo catalogue". */
  source: string;
  sourceType: SourceType;
  sourceUrl?: string;
  /** ISO date this value was last confirmed against its source. Absent means never verified. */
  verifiedAt?: string;
  confidence: ConfidenceLevel;
  country?: string;
  currency?: string;
  /** Whether `value` already includes local tax — unknown (undefined) unless a source says so explicitly. */
  taxIncluded?: boolean;
}

export interface SubscriptionVerification {
  price: VerifiedField<number>;
  trial: VerifiedField<{ available: boolean; days?: number }>;
}
