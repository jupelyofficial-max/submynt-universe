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
  | "Elite Access"
  | "Dating"
  | "Research & Data";

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
  isNew?: boolean;
  /** Length of the free trial in days, if this plan offers one. */
  trialDays?: number;
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

export interface OwnedSubscription {
  ownedId: string;
  subscriptionId: string;
  planName: string;
  priceMonthly: number;
  billing: BillingCycle;
  nextRenewal: string;
  addedAt: string;
  /** User-confirmed intent to keep this subscription (the DetailPanel
   * "Keep" button) — optional/undefined for entries added before this
   * field existed, which reads the same as false. */
  kept?: boolean;
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
