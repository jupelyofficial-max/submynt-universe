import type { BundleProvider, Category } from "@/types/subscription";

/**
 * Add-flow curation — edit freely, nothing else depends on the exact
 * contents. NEEDS MANUAL UPKEEP, like the bundle catalogue: this is editorial
 * judgement about India, not measured data.
 */

/** Row order in the "What do you use?" list, most-paid-for first
 * (subscription ids). Anything not listed follows, in the catalogue's own
 * `popularity` order. Unknown ids are ignored, so a stale entry can't break
 * the list. */
export const INDIA_POPULARITY_ORDER: string[] = [
  "youtube-premium",
  "amazon-prime",
  "jiohotstar",
  "netflix",
  "spotify-premium",
  "google-one",
  "youtube-music-premium",
  "amazon-prime-video",
  "apple-music",
  "icloud",
  "apple-one",
  "microsoft-365",
  "chatgpt-plus",
  "canva-pro",
  "duolingo-super",
];

/** Categories kept out of the "What do you use?" list (mobile and broadband
 * plans). They stay available — and keep working as bundle plans — in the
 * "Add from a bundle instead" flow. */
export const LIST_EXCLUDED_CATEGORIES: Category[] = ["Telecom"];

export interface ParentService {
  /** Catalogue ids this service includes. Selecting the parent adds each as
   * a bundled ₹0 row; with no parent selected they're ordinary services. */
  children: string[];
  /** Written as the children's bundleProvider (an existing BundleProvider). */
  provider: BundleProvider;
  /** The parent row's "Includes …" subtitle. */
  includes: string;
  /** Optional plan label for a child, by the parent's plan name — e.g. the
   * iCloud+ size that comes with each Apple One plan. */
  childPlans?: Record<string, Record<string, string>>;
}

/** Parent → children. Keys and children are subscription ids.
 *
 * Note (Apple India, Sept 2026): Apple says Apple TV and Apple Arcade are now
 * included with any paid iCloud+ and no longer sold on their own, and that
 * Apple One is closed to new subscribers. If you want iCloud+ to cover them
 * here too, add:
 *   icloud: { children: ["apple-tv", "apple-arcade"], provider: "apple", includes: "TV+, Arcade" },
 */
export const PARENT_SERVICES: Record<string, ParentService> = {
  "youtube-premium": { children: ["youtube-music-premium"], provider: "google", includes: "YouTube Music" },
  "amazon-prime": { children: ["amazon-prime-video"], provider: "amazon", includes: "Prime Video" },
  "apple-one": {
    children: ["apple-music", "apple-tv", "apple-arcade", "icloud"],
    provider: "apple",
    includes: "Music, TV+, Arcade, iCloud+",
    childPlans: { icloud: { Individual: "50 GB", Family: "200 GB" } },
  },
};
