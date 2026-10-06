export type BillingCycle =
  | "monthly"
  | "quarterly"
  | "half-yearly"
  | "annual"
  | "lifetime"
  | "free";

export type Category =
  | "AI Tools"
  | "Entertainment"
  | "Music"
  | "Cloud"
  | "Creative"
  | "Education"
  | "Wellness"
  | "News"
  | "Gaming"
  | "Shopping"
  | "Quick Commerce"
  | "Business"
  | "Communication"
  | "Travel"
  | "Reading"
  | "Productivity"
  | "Professional Networking"
  | "Telecom";

export type Region = "India" | "Global" | "Available in India";

export interface SubscriptionPlan {
  name: string;
  priceMonthly: number;
  billing: BillingCycle;
}

export interface Subscription {
  id: string;
  name: string;
  provider: string;
  category: Category;
  tagline: string;
  color: string;
  initials: string;
  /** Company domain used to look up a real logo image; empty falls back to the initials badge. */
  domain: string;
  /** null for enterprise-sales-only products with no public price (e.g.
   * Gartner, PitchBook) — there is no real number to put here, and 0 would
   * collide with the existing "genuinely free" meaning used everywhere
   * else (price bands, recommendation scoring, etc). When null, render
   * `priceLabel` instead of a formatted price; `plans` is `[]` for these. */
  priceMonthly: number | null;
  /** Display string shown in place of a formatted price when priceMonthly
   * is null, e.g. "Contact for pricing". Ignored when priceMonthly is set. */
  priceLabel?: string;
  billing: BillingCycle[];
  plans: SubscriptionPlan[];
  popularity: number;
  rating: number;
  region: Region;
  tags: string[];
  /** ISO date this entry was actually added to the catalogue — only set
   * where the real addition date is known (from git history, not a
   * guess), currently the four Sept 2026 batches: Elite Access, Dating,
   * Research & Data, and the Music/Gaming/Cloud/Wellness restore. Left
   * undefined for the rest of the catalogue rather than backfilled with
   * a fabricated date. Drives the "New" badge — see isRecentlyAdded in
   * data/subscriptions.ts. */
  addedAt?: string;
  /** Length of the free trial in days, if this plan offers one. */
  trialDays?: number;
  /** Free-trial terms that aren't a simple day count — e.g. a fixed number
   * of free preview items, or eligibility-gated availability that varies
   * per user. Takes priority over trialDays for display when both would
   * otherwise apply; set instead of (not in addition to) trialDays. */
  trialNote?: string;
  /** Affiliate/deal URL, only set when a real deal relationship exists.
   * Distinct from the provider's own site (see getProviderUrl in
   * lib/subscriptionIntelligence.ts) — this is what "Get Deal →" links to. */
  dealUrl?: string;
}

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface UniverseNode {
  subscription: Subscription;
  position: Vec3;
  radius: number;
  /** Index of the origin-country cluster this node belongs to (for constellation links). */
  cluster: number;
}

export interface ListingSubmission {
  id: string;
  name: string;
  website: string;
  category: Category;
  tagline: string;
  priceMonthly: number;
  region: Region;
  contactEmail: string;
  submittedAt: string;
}

/** How the user gained access to an owned subscription — the field that
 * carries the "is this actually free" distinction, independent of
 * priceMonthly (NFR-005: a 'bundled'/'family' row with priceMonthly = 0
 * is expected and is NOT the same thing as 'free'; the price is 0
 * because it's bundled, not because the product itself is free). */
export type AccessType = "direct" | "bundled" | "promotional" | "family" | "free";

/** Only meaningful when accessType is 'bundled' or 'family' — not
 * enforced at the type level (Sprint 2's UI/forms own that rule), just a
 * plain optional field here. */
export type BundleProvider = "airtel" | "jio" | "amazon" | "apple" | "google" | "employer" | "family" | "other";

export type UsageFrequency = "daily" | "weekly" | "monthly" | "rarely" | "never";

export interface OwnedSubscription {
  ownedId: string;
  subscriptionId: string;
  planName: string;
  /** What's charged per `billing` cycle (per month for monthly, per year
   * for annual) — the source of truth. Absent only on a legacy local entry
   * saved before this field existed; read it via ownedPriceAmount(). */
  priceAmount?: number;
  /** ISO 4217; every entry is 'INR' today. */
  currency?: string;
  /** Monthly equivalent of priceAmount (annual ÷ 12), derived — what spend
   * totals sum. Never entered directly. */
  priceMonthly: number;
  billing: BillingCycle;
  nextRenewal: string;
  addedAt: string;
  /** User-confirmed intent to keep this subscription (the DetailPanel
   * "Keep" button) — optional/undefined for entries added before this
   * field existed, which reads the same as false. */
  kept?: boolean;
  /** Not nullable in the DB (defaults to 'direct' there and in
   * useMySubscriptionsStore's add()), so always present once a row has
   * round-tripped through Supabase. Can be momentarily absent on a
   * pre-Sprint-1 localStorage entry that hasn't synced yet. */
  accessType: AccessType;
  /** Undefined unless accessType is 'bundled' or 'family'. */
  bundleProvider?: BundleProvider;
  /** P1 — collected in the schema, nothing reads it yet. */
  usageFrequency?: UsageFrequency;
  /** Sprint 5 — only meaningful when accessType is 'promotional'. The date
   * a promotional discount/trial period ends, deliberately separate from
   * nextRenewal (the subscription's own billing-cycle renewal date) — a
   * promo ending is a different event from the subscription renewing at
   * full price, and the two can genuinely differ. */
  promoEndDate?: string;
}

export type UserStatusFilter =
  | "my-subscriptions"
  | "not-subscribed"
  | "recommended"
  | "alternatives"
  | "potential-savings";

export type SortOption =
  | "popular"
  | "price-low"
  | "price-high"
  | "savings"
  | "new"
  | "most-subscribed"
  | "recommended";

export interface FilterState {
  categories: Category[];
  billing: BillingCycle[];
  priceBands: string[];
  userStatus: UserStatusFilter[];
  regions: Region[];
  sort: SortOption;
}
