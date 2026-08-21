export type BillingCycle =
  | "monthly"
  | "quarterly"
  | "half-yearly"
  | "annual"
  | "lifetime"
  | "free";

export type Category =
  | "AI & Productivity"
  | "Entertainment"
  | "Music"
  | "Video & Streaming"
  | "Cloud Storage"
  | "Software & Creative"
  | "Education"
  | "Fitness & Wellness"
  | "News & Publications"
  | "Gaming"
  | "Finance"
  | "Shopping & Memberships"
  | "Professional & Business"
  | "Communication"
  | "Travel"
  | "Utilities"
  | "Other";

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
  priceMonthly: number;
  billing: BillingCycle[];
  plans: SubscriptionPlan[];
  popularity: number;
  rating: number;
  region: Region;
  /** Country the service originates from — drives its position on the world map. */
  originCountry: string;
  tags: string[];
  isNew?: boolean;
  /** Length of the free trial in days, if this plan offers one. */
  trialDays?: number;
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
