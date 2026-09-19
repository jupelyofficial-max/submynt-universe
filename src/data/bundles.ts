/** Lifestyle bundle banners (public/bundles/*.png, see chat) paired with
 * REAL catalog subscription ids only — each id below was cross-checked
 * against the banner's own "Popular apps in this bundle" icons and
 * against src/data/subscriptions.ts; an icon with no real catalog match
 * (e.g. Notion, not in the catalog) is left out rather than fabricated.
 * Bundle pricing/savings copy lives on the banner image itself — this
 * file never restates or recomputes it. */
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
    image: "/bundles/student-essentials.png",
    subscriptionIds: ["chatgpt-plus", "canva-pro", "coursera-plus", "youtube-premium", "google-one"],
  },
  {
    slug: "working-professional",
    title: "Working Professional Bundle",
    tagline: "Essential tools for productivity, communication, AI and career growth.",
    image: "/bundles/working-professional.png",
    subscriptionIds: ["chatgpt-plus", "linkedin-premium", "grammarly-premium", "google-one"],
  },
  {
    slug: "family-bundle",
    title: "Family Bundle",
    tagline: "Entertainment, learning and everyday digital services for the whole family.",
    image: "/bundles/family-bundle.png",
    subscriptionIds: ["netflix", "amazon-prime-video", "jiohotstar", "youtube-premium", "spotify-premium", "google-one"],
  },
];

export const NOT_SURE_BUNDLE_IMAGE = "/bundles/not-sure-bundle.png";
