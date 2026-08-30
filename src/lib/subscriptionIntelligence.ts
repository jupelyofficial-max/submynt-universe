import { SUBSCRIPTIONS } from "@/data/subscriptions";
import { formatINR } from "@/lib/utils";
import type { Category, Subscription } from "@/types/subscription";

/**
 * Every number here is computed live from the real catalogue (price,
 * rating, popularity, category, trial) — nothing is a hardcoded per-service
 * claim. No "features" list exists because there's no factual basis for
 * specific product claims in this mock dataset; comparisons stick to
 * structured fields that actually exist.
 */

const CATEGORY_BEST_FOR: Record<Category, string[]> = {
  "AI Tools": ["Developers", "Professionals", "Creators"],
  Entertainment: ["Families", "Casual viewers"],
  Music: ["Everyday listeners", "Commuters"],
  Cloud: ["Professionals", "Families"],
  Creative: ["Creators", "Designers"],
  Education: ["Students", "Lifelong learners"],
  Wellness: ["Individuals", "Fitness enthusiasts"],
  News: ["Professionals", "Avid readers"],
  Gaming: ["Gamers", "Families"],
  Finance: ["Investors", "Professionals"],
  Shopping: ["Frequent shoppers", "Families"],
  "Quick Commerce": ["Busy households", "Last-minute shoppers"],
  Business: ["Teams", "Professionals"],
  Communication: ["Teams", "Communities"],
  Travel: ["Frequent travelers"],
  Security: ["Privacy-conscious users", "Professionals"],
  Reading: ["Avid readers", "Commuters"],
};

const categoryAvgCache = new Map<Category, number>();

/** Average price of PAID subscriptions in a category — free entries would
 * otherwise drag the baseline down and make every paid plan look "above
 * average" by default. */
export function categoryAveragePrice(category: Category): number {
  const cached = categoryAvgCache.get(category);
  if (cached !== undefined) return cached;
  const paid = SUBSCRIPTIONS.filter((s) => s.category === category && s.priceMonthly > 0);
  const avg = paid.length ? paid.reduce((sum, s) => sum + s.priceMonthly, 0) / paid.length : 0;
  categoryAvgCache.set(category, avg);
  return avg;
}

/** Weights for the Submynt Value Score — kept as one named, editable
 * constant rather than buried in the formula, so the methodology is a
 * single place to read or tune, not something to reverse-engineer. */
export const VALUE_SCORE_WEIGHTS = { rating: 0.5, popularity: 0.5 } as const;

/** 0–100, a normalized blend of popularity and rating — same two signals
 * `sortSubscriptions`'s "recommended" case already uses (popularity +
 * rating*10), just rescaled onto a 0–100 "value score" instead of an
 * unbounded sort key. This is Submynt's own computed signal, not a
 * provider-supplied rating — always surfaced as "Submynt Value Score". */
export function computeValueScore(sub: Subscription): number {
  const ratingComponent = (sub.rating / 5) * 100 * VALUE_SCORE_WEIGHTS.rating;
  const popularityComponent = sub.popularity * VALUE_SCORE_WEIGHTS.popularity;
  return Math.round(ratingComponent + popularityComponent);
}

/** Short audience tags — a category baseline plus a price-tier tag computed
 * against the category's own real average, so two subscriptions in the same
 * category can still end up with different tags. */
export function computeBestFor(sub: Subscription): string[] {
  const tags = [...CATEGORY_BEST_FOR[sub.category]];
  const avg = categoryAveragePrice(sub.category);
  if (sub.priceMonthly === 0) {
    tags.push("Free-tier users");
  } else if (avg > 0 && sub.priceMonthly < avg * 0.85) {
    tags.push("Budget-conscious users");
  } else if (avg > 0 && sub.priceMonthly > avg * 1.3) {
    tags.push("Power users");
  }
  if (sub.rating >= 4.6 && !tags.includes("Power users")) {
    tags.push("Quality-focused users");
  }
  return tags.slice(0, 3);
}

/** Real domain data (see DOMAIN_BY_NAME in data/subscriptions.ts, used to
 * fetch each logo) doubles as a legitimate basis for a "Visit Provider"
 * link — undefined (not a guessed URL) when no domain is on file. */
export function getProviderUrl(sub: Subscription): string | undefined {
  return sub.domain ? `https://${sub.domain}` : undefined;
}

export interface RankedAlternative {
  subscription: Subscription;
  reasons: string[];
}

/** Same-category candidates only — a cross-category "alternative" wouldn't
 * really be a substitute. Scored by a weighted blend of real deltas (price,
 * rating, popularity, region match); reasons are generated from those same
 * deltas, never invented. */
export function rankAlternatives(sub: Subscription, limit = 5): RankedAlternative[] {
  const subBestFor = computeBestFor(sub);
  const candidates = SUBSCRIPTIONS.filter((s) => s.id !== sub.id && s.category === sub.category);

  const scored = candidates.map((alt) => {
    const priceDelta = sub.priceMonthly - alt.priceMonthly;
    const priceScore = priceDelta > 0 ? Math.min(40, (priceDelta / Math.max(sub.priceMonthly, 1)) * 40) : 0;
    const ratingScore = (alt.rating - sub.rating) * 15;
    const popularityScore = (alt.popularity - sub.popularity) * 0.3;
    const regionScore = alt.region === sub.region ? 5 : 0;
    const score = priceScore + ratingScore + popularityScore + regionScore;

    const reasons: string[] = [];
    // "~" prefix — this is unverified catalogue pricing, not a confirmed
    // savings claim (see canClaimSavings in lib/verification/claims.ts).
    if (priceDelta > 0) reasons.push(`~${formatINR(priceDelta)}/month cheaper`);
    if (alt.rating - sub.rating >= 0.2) reasons.push(`Higher-rated (★${alt.rating.toFixed(1)})`);
    if (alt.popularity - sub.popularity >= 10) reasons.push("Popular alternative");
    const altBestFor = computeBestFor(alt);
    const distinctTag = altBestFor.find((t) => !subBestFor.includes(t) && !CATEGORY_BEST_FOR[sub.category].includes(t));
    if (distinctTag) reasons.push(`Better for ${distinctTag.toLowerCase()}`);
    if (reasons.length === 0) reasons.push(`Similar option in ${sub.category}`);

    return { subscription: alt, reasons: reasons.slice(0, 2), score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ subscription, reasons }) => ({ subscription, reasons }));
}
