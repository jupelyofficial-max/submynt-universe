/**
 * Vendor/monetization-ready architecture. Kept separate from `Subscription`
 * — this is the business relationship Submynt has (or could have) with the
 * provider, not the product's own facts.
 */

/** "sponsored"/"featured"/"promoted" are visibility labels only — see
 * lib/recommendations.ts's own comment: nothing here is ever read by the
 * organic recommendation scoring function. */
export type SponsorshipStatus = "none" | "sponsored" | "featured" | "promoted";

export interface VendorProfile {
  vendorId: string;
  officialWebsite?: string;
  /** ISO country codes this vendor's catalogue entry is known to serve.
   * Derived from the existing `region` field today — not independently
   * confirmed with the vendor (see verification.ts for that distinction). */
  countriesServed: string[];
  category: string;
  /** Whether this vendor is eligible to appear in organic recommendations
   * at all — a moderation/eligibility gate, independent of sponsorship. */
  recommendationEligible: boolean;
  affiliateUrl?: string;
  featuredEligible: boolean;
  sponsorshipStatus: SponsorshipStatus;
}
