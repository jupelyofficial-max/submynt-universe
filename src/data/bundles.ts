/** Lifestyle bundle banners (public/bundles/*.png, see chat) paired with
 * REAL catalog subscription ids only, cross-checked against
 * src/data/subscriptions.ts; an id with no real catalog match is left
 * out rather than fabricated (e.g. "Apple TV+" isn't in the catalog —
 * only Apple Music/Arcade are — so it's omitted from Family below).
 * The banners also have a "From ₹X/month · Save up to N%" block baked
 * into their pixels; no real bundle price exists behind those numbers, so
 * BundleBanner covers that block with the computed "bought separately"
 * total (lib/bundlePricing.ts) — see bakedPriceClaim below.
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
  /** The banner PNG has a hard-coded "From ₹X/month · Save up to N%" block
   * in its bottom-right corner, which BundleBanner covers. */
  bakedPriceClaim?: boolean;
}

export const LIFESTYLE_BUNDLES: LifestyleBundle[] = [
  {
    slug: "student-essentials",
    bakedPriceClaim: true,
    title: "Student Bundle",
    tagline: "Everything you need to study, learn, create and stay ahead.",
    image: "/bundles/student-bundle.png",
    subscriptionIds: ["chatgpt-plus", "youtube-premium", "spotify-premium", "microsoft-365", "canva-pro", "coursera-plus"],
  },
  {
    slug: "working-professional",
    bakedPriceClaim: true,
    title: "Working Professional Bundle",
    tagline: "Essential tools for productivity, communication, AI and career growth.",
    image: "/bundles/working-professional-bundle.png",
    subscriptionIds: ["chatgpt-plus", "microsoft-365", "linkedin-premium", "spotify-premium", "netflix", "amazon-prime"],
  },
  {
    slug: "family-bundle",
    bakedPriceClaim: true,
    title: "Family Bundle",
    tagline: "Entertainment, learning and everyday digital services for the whole family.",
    image: "/bundles/family-bundle.png",
    // Apple TV+ requested but dropped — not a real catalog entry (see
    // file header note).
    subscriptionIds: ["netflix", "amazon-prime", "jiohotstar", "youtube-premium", "spotify-premium", "canva-pro"],
  },
];

export const NOT_SURE_BUNDLE_IMAGE = "/bundles/find-your-bundle.png";

/** Pro Subscriptions banners — same convention as LIFESTYLE_BUNDLES above:
 * REAL catalog subscription ids only. Gen Z drops "Bumble Premium" and
 * Elite drops "Soho House"/"Indulge" — none of the three are real
 * catalog entries — rather than fabricating them. */
export const PRO_BUNDLES: LifestyleBundle[] = [
  {
    slug: "genz-bundle",
    bakedPriceClaim: true,
    title: "Gen Z Bundle",
    tagline: "All the apps you love, in one bundle for a smarter, brighter you.",
    image: "/bundles/genz-bundle.png",
    subscriptionIds: ["spotify-premium", "netflix", "canva-pro", "duolingo-super", "youtube-premium"],
  },
  {
    slug: "couple-bundle",
    bakedPriceClaim: true,
    title: "Couple Bundle",
    tagline: "All the apps you both love, in one bundle for a more connected you.",
    image: "/bundles/couple-bundle.png",
    subscriptionIds: ["netflix", "spotify-premium", "amazon-prime", "google-one", "youtube-premium", "jiohotstar"],
  },
  {
    slug: "elite-bundle",
    title: "Elite Bundle",
    tagline: "Exclusive memberships and premium services for India's modern elite.",
    image: "/bundles/elite-bundle.png",
    subscriptionIds: ["cult-fit", "whoop", "apple-music", "masterclass"],
  },
];

/** Combined lookup for the /bundles/[slug] detail route — Lifestyle and
 * Pro bundles share the same detail page template. */
export const ALL_BUNDLES: LifestyleBundle[] = [...LIFESTYLE_BUNDLES, ...PRO_BUNDLES];
