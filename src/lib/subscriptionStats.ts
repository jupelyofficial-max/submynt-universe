import { potentialSavingsMonthly } from "@/data/subscriptions";
import type { AccessType, OwnedSubscription, Subscription } from "@/types/subscription";

export type OwnedItem = { owned: OwnedSubscription; sub: Subscription };

// Bundled/family/promotional read as "not a direct spend line" for Monthly
// spend (NFR-005: a bundled ₹0 item never inflates spend); "value" instead
// credits them at the catalogue's own price — the Sprint 3 spend-vs-value
// gap. Shared here (not duplicated) so the Sprint 6 Monthly Report reports
// the exact same numbers as the Sprint 3 dashboard.
const VALUE_ONLY_ACCESS_TYPES: AccessType[] = ["bundled", "family", "promotional"];

export function directItemsOf(items: OwnedItem[]): OwnedItem[] {
  return items.filter((x) => (x.owned.accessType ?? "direct") === "direct");
}

export function computeMonthlySpend(items: OwnedItem[]): number {
  return directItemsOf(items).reduce((sum, x) => sum + x.owned.priceMonthly, 0);
}

export function computeBundledFamilyValue(items: OwnedItem[]): number {
  return items
    .filter((x) => VALUE_ONLY_ACCESS_TYPES.includes(x.owned.accessType ?? "direct"))
    .reduce((sum, x) => sum + (x.sub.priceMonthly ?? 0), 0);
}

export function computeTotalValue(items: OwnedItem[]): number {
  return computeMonthlySpend(items) + computeBundledFamilyValue(items);
}

// Reuses bestSavingsAlternative/potentialSavingsMonthly (Sprint 3/4's own
// reuse of the pre-existing catalogue logic) — only over Direct items.
export function computePotentialAnnualSavings(items: OwnedItem[]): number {
  const monthly = directItemsOf(items).reduce((sum, x) => sum + potentialSavingsMonthly(x.sub), 0);
  return monthly * 12;
}
