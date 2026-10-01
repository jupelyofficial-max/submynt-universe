import type { BundleProvider, Category, OwnedSubscription, Subscription } from "@/types/subscription";

export interface OwnedItem {
  owned: OwnedSubscription;
  sub: Subscription;
}

/** Categories where two owned subscriptions genuinely compete for the same
 * job (two music players, two video libraries) — restricted on purpose.
 * Cloud is excluded (a user legitimately runs Google One for photos AND
 * Dropbox for work docs; category alone isn't a reliable overlap signal
 * there the way it is for a single-purpose category like Music). */
const DUPLICATE_ELIGIBLE_CATEGORIES: Category[] = ["Music", "Entertainment", "Reading", "Gaming", "Quick Commerce"];

export interface DuplicateGroup {
  category: Category;
  items: OwnedItem[];
}

/** 2+ owned subscriptions in the same eligible category, regardless of
 * access_type — a Direct Spotify and a Bundled JioSaavn are just as much a
 * potential overlap as two Direct ones. */
export function findDuplicateCategories(items: OwnedItem[]): DuplicateGroup[] {
  const groups = new Map<Category, OwnedItem[]>();
  for (const item of items) {
    if (!DUPLICATE_ELIGIBLE_CATEGORIES.includes(item.sub.category)) continue;
    const list = groups.get(item.sub.category) ?? [];
    list.push(item);
    groups.set(item.sub.category, list);
  }
  return [...groups.entries()]
    .filter(([, list]) => list.length >= 2)
    .map(([category, list]) => ({ category, items: list }));
}

export interface BundleProviderGroup {
  provider: BundleProvider;
  items: OwnedItem[];
}

/** Groups the user's own Bundled/Family entries by the bundle_provider they
 * themselves recorded at onboarding — purely reflecting data already on
 * file, not a claim about what that provider's bundle actually contains
 * (that mapping doesn't exist in this codebase; see findDuplicateCategories
 * and the module-level note in this file's history for what real data
 * would be needed to go further, e.g. "you may already have Netflix via
 * Airtel"). */
export function groupByBundleProvider(items: OwnedItem[]): BundleProviderGroup[] {
  const groups = new Map<BundleProvider, OwnedItem[]>();
  for (const item of items) {
    const accessType = item.owned.accessType ?? "direct";
    if ((accessType !== "bundled" && accessType !== "family") || !item.owned.bundleProvider) continue;
    const list = groups.get(item.owned.bundleProvider) ?? [];
    list.push(item);
    groups.set(item.owned.bundleProvider, list);
  }
  return [...groups.entries()]
    .filter(([, list]) => list.length >= 1)
    .map(([provider, list]) => ({ provider, items: list }))
    .sort((a, b) => b.items.length - a.items.length);
}
