import type { BundleProvider, Category } from "@/types/subscription";

/**
 * Add-flow curation — edit freely, nothing else depends on the exact
 * contents. NEEDS MANUAL UPKEEP, like the bundle catalogue: this is editorial
 * judgement about India, not measured data.
 */

/** The "What do you use?" list's default contents: exactly these services,
 * in this order (subscription ids). Everything else in the catalogue (minus
 * LIST_EXCLUDED_CATEGORIES) is reachable through the list's search box, which
 * lists these first, then the rest by the catalogue's own `popularity`.
 * Unknown ids are ignored, so a stale entry can't break the list. */
export const DEFAULT_ADD_LIST: string[] = [
  "youtube-premium",
  "amazon-prime",
  "netflix",
  "jiohotstar",
  "spotify-premium",
  "google-one",
  "icloud",
  "chatgpt-plus",
  "apple-one",
  "sonyliv",
  "zee5",
  "apple-music",
  "apple-tv",
  "jiosaavn-pro",
  "amazon-music-unlimited",
  "google-ai-pro",
  "claude-pro",
  "perplexity-pro",
  "microsoft-365",
  "linkedin-premium",
  "canva-pro",
  "duolingo-super",
  "udemy-personal-plan",
  "cult-fit",
  "healthifyme",
];

/** Categories kept out of the "What do you use?" list and its search: mobile
 * and broadband plans (they stay available in "Add from a bundle instead")
 * and gaming. Only the list is affected — the catalogue, Explore, ecosystem
 * pages, detail panels and anything already tracked are untouched, and a
 * hidden service can still arrive as an included child (e.g. Apple Arcade
 * with Apple One, see PARENT_SERVICES). */
export const LIST_EXCLUDED_CATEGORIES: Category[] = ["Telecom", "Gaming"];

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
