import type { Category } from "@/types/subscription";
import type { BundleId } from "./bundleCatalogue";

/**
 * Quick-add ("What do you pay for?") curation — edit freely, nothing else
 * depends on the exact contents. NEEDS MANUAL UPKEEP, like the bundle
 * catalogue: this is editorial judgement about India, not measured data.
 */

/** Tile order in the quick-add grid, most-paid-for first (subscription ids).
 * Anything not listed follows, in the catalogue's own `popularity` order.
 * Unknown ids are ignored, so a stale entry can't break the grid. */
export const INDIA_POPULARITY_ORDER: string[] = [
  "youtube-premium",
  "amazon-prime",
  "jiohotstar",
  "netflix",
  "spotify-premium",
  "jio",
  "airtel",
  "vi",
  "google-one",
  "youtube-music-premium",
  "amazon-prime-video",
  "apple-music",
  "icloud",
  "microsoft-365",
  "chatgpt-plus",
  "canva-pro",
  "duolingo-super",
];

export interface QuickAddChip {
  /** Stable id — also the `category` prop of the quick_add_category event. */
  id: string;
  label: string;
  /** Catalogue categories this chip shows. Empty = everything ("All"). A
   * category no chip lists (Education, Wellness, News, …) only appears
   * under All and in search. */
  categories: Category[];
}

export const QUICK_ADD_CHIPS: QuickAddChip[] = [
  { id: "all", label: "All", categories: [] },
  // Shopping is only Amazon Prime (video + delivery); Gaming sits with entertainment.
  { id: "entertainment", label: "Entertainment", categories: ["Entertainment", "Shopping", "Gaming"] },
  { id: "music", label: "Music", categories: ["Music"] },
  { id: "mobile_broadband", label: "Mobile & broadband", categories: ["Telecom"] },
  { id: "ai_tools", label: "AI tools", categories: ["AI Tools"] },
  { id: "work", label: "Work", categories: ["Productivity", "Business", "Creative", "Professional Networking"] },
  { id: "cloud", label: "Cloud", categories: ["Cloud"] },
];

/** Bundles whose included services are certain, so selecting the parent
 * marks them included straight away. Every other bundle (Jio, Airtel) is
 * plan-tier dependent: its services show "may be included" and need the
 * user's confirmation. Ids from bundleCatalogue.ts. */
export const AUTO_INCLUDE_BUNDLES: BundleId[] = ["amazon-prime"];
