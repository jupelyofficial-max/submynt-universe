/** Lifestyle bundle banners (public/bundles/*.png, see chat) paired with
 * REAL catalog subscription ids only, cross-checked against
 * src/data/subscriptions.ts; an id with no real catalog match is left
 * out rather than fabricated (e.g. "Apple TV+" isn't in the catalog —
 * only Apple Music/Arcade are — so it's omitted from Family below).
 * Bundle pricing/savings copy lives on the banner image itself — this
 * file never restates or recomputes it.
 *
 * NOTE: as of the 2026-09-19 update, these ids intentionally no longer
 * match the icon row baked into each banner PNG's pixels (the images
 * predate this data change and can't be edited/regenerated here) —
 * they drive the real, live subscription grid on each bundle's own
 * detail page (/bundles/[slug]) instead. */
export interface LifestyleBundle {
  slug: string;
  title: string;
  tagline: string;
  image: string;
  /** Real SUBSCRIPTIONS_BY_ID keys, verified against the banner artwork. */
  subscriptionIds: string[];
}

export const LIFESTYLE_BUNDLES: LifestyleBundle[] = [
  {
    slug: "student-essentials",
    title: "Student Bundle",
    tagline: "Everything you need to study, learn, create and stay ahead.",
    image: "/bundles/student-bundle.png",
    subscriptionIds: ["chatgpt-plus", "youtube-premium", "spotify-premium", "microsoft-365", "canva-pro", "coursera-plus"],
  },
  {
    slug: "working-professional",
    title: "Working Professional Bundle",
    tagline: "Essential tools for productivity, communication, AI and career growth.",
    image: "/bundles/working-professional-bundle.png",
    subscriptionIds: ["chatgpt-plus", "microsoft-365", "linkedin-premium", "spotify-premium", "netflix", "amazon-prime"],
  },
  {
    slug: "family-bundle",
    title: "Family Bundle",
    tagline: "Entertainment, learning and everyday digital services for the whole family.",
    image: "/bundles/family-bundle.png",
    // Apple TV+ requested but dropped — not a real catalog entry (see
    // file header note).
    subscriptionIds: ["netflix", "amazon-prime", "jiohotstar", "youtube-premium", "spotify-premium", "canva-pro"],
  },
];

export const NOT_SURE_BUNDLE_IMAGE = "/bundles/find-your-bundle.png";
