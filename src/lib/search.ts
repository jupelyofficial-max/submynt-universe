import { SUBSCRIPTIONS } from "@/data/subscriptions";
import type { Subscription } from "@/types/subscription";

/** Example queries offered as chips — each returns real results. */
export const SEARCH_EXAMPLES = ["Netflix", "AI Tools", "Music", "Gaming", "Cloud"];

/** Catalogue search: case-insensitive substring match on name, provider or
 * category, most popular first. Empty query → no results. */
export function searchCatalogue(query: string): Subscription[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return SUBSCRIPTIONS.filter(
    (s) => s.name.toLowerCase().includes(q) || s.provider.toLowerCase().includes(q) || s.category.toLowerCase().includes(q)
  ).sort((a, b) => b.popularity - a.popularity);
}
