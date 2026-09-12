import type { Subscription } from "@/types/subscription";

/**
 * Real catalogue, synced from Supabase (project dmczcxxiusxvtdsagnop) via
 * scripts/sync-catalogue-from-supabase.mjs -- do not hand-edit entries here,
 * edit them in Supabase and re-run the sync script instead. Prices are
 * still illustrative for most entries (see each brand's own row in Supabase
 * for confidence level), but the shape and IDs are the real source of truth
 * as of the last sync.
 */

export const SUBSCRIPTIONS: Subscription[] = [
  {
    id: "chatgpt-plus",
    name: "ChatGPT Plus",
    provider: "ChatGPT Plus",
    category: "AI Tools",
    tagline: "GPT-5 access, voice mode and advanced reasoning",
    color: "#10A37F",
    initials: "CP",
    domain: "openai.com",
    priceMonthly: 1999,
    billing: ["monthly", "annual"],
    plans: [
      { name: "Standard", priceMonthly: 1999, billing: "monthly" },
      { name: "Annual", priceMonthly: 1599, billing: "annual" },
    ],
    popularity: 96,
    rating: 4.7,
    region: "Available in India",
    tags: ["AI Tools"],
    trialDays: 7,
  },
  {
    id: "claude-pro",
    name: "Claude Pro",
    provider: "Claude Pro",
    category: "AI Tools",
    tagline: "Anthropic's assistant for deep, careful work",
    color: "#D97757",
    initials: "CP",
    domain: "claude.ai",
    priceMonthly: 1670,
    billing: ["monthly", "annual"],
    plans: [
      { name: "Standard", priceMonthly: 1670, billing: "monthly" },
      { name: "Annual", priceMonthly: 1336, billing: "annual" },
    ],
    popularity: 88,
    rating: 4.8,
    region: "Available in India",
    tags: ["AI Tools"],
    isNew: true,
  },
  {
    id: "adobe-creative-cloud",
    name: "Adobe Creative Cloud (All Apps)",
    provider: "Adobe Creative Cloud (All Apps)",
    category: "Creative",
    tagline: "Photoshop, Premiere, Illustrator and more",
    color: "#FF0000",
    initials: "AC",
    domain: "adobe.com",
    priceMonthly: 4230,
    billing: ["monthly", "annual"],
    plans: [
      { name: "Standard", priceMonthly: 4230, billing: "monthly" },
      { name: "Annual", priceMonthly: 3384, billing: "annual" },
    ],
    popularity: 85,
    rating: 4.5,
    region: "Available in India",
    tags: ["Creative"],
    trialDays: 30,
  },
  {
    id: "google-ai-pro",
    name: "Google AI Pro (Gemini)",
    provider: "Google AI Pro (Gemini)",
    category: "AI Tools",
    tagline: "Google's top-tier Gemini AI plan",
    color: "#886FBF",
    initials: "GA",
    domain: "gemini.google.com",
    priceMonthly: 1950,
    billing: ["monthly", "annual"],
    plans: [
      { name: "Standard", priceMonthly: 1950, billing: "monthly" },
      { name: "Annual", priceMonthly: 1560, billing: "annual" },
    ],
    popularity: 82,
    rating: 4.4,
    region: "Available in India",
    tags: ["AI Tools"],
    trialDays: 7,
  },
];

export const SUBSCRIPTIONS_BY_ID: Record<string, Subscription> =
  Object.fromEntries(SUBSCRIPTIONS.map((s) => [s.id, s]));

export function getAlternatives(sub: Subscription, limit = 4): Subscription[] {
  return SUBSCRIPTIONS.filter(
    (s) => s.id !== sub.id && s.category === sub.category,
  )
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, limit);
}

/** Cheapest comparable alternative (similar or better rating) priced lower than `sub`. */
export function bestSavingsAlternative(sub: Subscription): Subscription | null {
  const candidates = SUBSCRIPTIONS.filter(
    (s) =>
      s.id !== sub.id &&
      s.category === sub.category &&
      s.priceMonthly < sub.priceMonthly &&
      s.rating >= sub.rating - 0.6,
  ).sort((a, b) => a.priceMonthly - b.priceMonthly);
  return candidates[0] ?? null;
}

export function potentialSavingsMonthly(sub: Subscription): number {
  const alt = bestSavingsAlternative(sub);
  if (!alt) return 0;
  return Math.max(0, sub.priceMonthly - alt.priceMonthly);
}
