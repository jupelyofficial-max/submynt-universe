import { PRICE_BANDS } from "@/data/categories";
import { potentialSavingsMonthly } from "@/data/subscriptions";
import type { FilterState, Subscription } from "@/types/subscription";

export function matchesSearch(sub: Subscription, query: string): boolean {
  if (!query.trim()) return true;
  const q = query.trim().toLowerCase();

  const priceUnderMatch = q.match(/under\s*₹?\s*(\d+)/);
  if (priceUnderMatch) {
    return sub.priceMonthly < Number(priceUnderMatch[1]);
  }
  if (q.includes("annual") || q.includes("yearly")) {
    return sub.billing.includes("annual");
  }
  if (q.includes("free")) {
    return sub.priceMonthly === 0;
  }

  const haystack = [sub.name, sub.provider, sub.category, sub.tagline, ...sub.tags]
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

export function matchesFilters(
  sub: Subscription,
  filters: FilterState,
  ownedIds: Set<string>
): boolean {
  if (filters.categories.length && !filters.categories.includes(sub.category)) return false;
  if (filters.regions.length && !filters.regions.includes(sub.region)) return false;
  if (filters.billing.length && !filters.billing.some((b) => sub.billing.includes(b))) return false;

  if (filters.priceBands.length) {
    const inBand = filters.priceBands.some((id) => {
      const band = PRICE_BANDS.find((b) => b.id === id);
      if (!band) return false;
      if (band.max === null) return sub.priceMonthly >= band.min;
      if (band.id === "free") return sub.priceMonthly === 0;
      return sub.priceMonthly >= band.min && sub.priceMonthly <= band.max;
    });
    if (!inBand) return false;
  }

  if (filters.userStatus.length) {
    const owned = ownedIds.has(sub.id);
    const matchesStatus = filters.userStatus.some((status) => {
      if (status === "my-subscriptions") return owned;
      if (status === "not-subscribed") return !owned;
      if (status === "recommended") return sub.popularity >= 65 && !owned;
      if (status === "potential-savings") return potentialSavingsMonthly(sub) > 0 && owned;
      if (status === "alternatives") return !owned && potentialSavingsMonthly(sub) === 0 && sub.popularity < 65;
      return true;
    });
    if (!matchesStatus) return false;
  }

  return true;
}

export function sortSubscriptions(
  subs: Subscription[],
  sort: FilterState["sort"],
  ownedIds: Set<string>
): Subscription[] {
  const copy = [...subs];
  switch (sort) {
    case "price-low":
      return copy.sort((a, b) => a.priceMonthly - b.priceMonthly);
    case "price-high":
      return copy.sort((a, b) => b.priceMonthly - a.priceMonthly);
    case "savings":
      return copy.sort((a, b) => potentialSavingsMonthly(b) - potentialSavingsMonthly(a));
    case "new":
      return copy.sort((a, b) => Number(b.isNew ?? false) - Number(a.isNew ?? false) || b.popularity - a.popularity);
    case "most-subscribed":
      return copy.sort((a, b) => Number(ownedIds.has(b.id)) - Number(ownedIds.has(a.id)) || b.popularity - a.popularity);
    case "recommended":
      return copy.sort((a, b) => (b.popularity + b.rating * 10) - (a.popularity + a.rating * 10));
    case "popular":
    default:
      return copy.sort((a, b) => b.popularity - a.popularity);
  }
}
