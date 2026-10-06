import { SUBSCRIPTIONS_BY_ID, getPriceForward } from "@/data/subscriptions";
import type { LifestyleBundle } from "@/data/bundles";
import { formatINR } from "@/lib/utils";

/** What a curated bundle's services cost if bought one by one: the sum of
 * each service's cheapest plan as a monthly equivalent (getPriceForward —
 * the same "From ₹X/mo" the service cards show). Services with no catalogue
 * price (or not in the catalogue) are counted separately, never as ₹0. */
export function bundleSeparateTotal(bundle: LifestyleBundle): { monthly: number; unpriced: number } {
  let monthly = 0;
  let unpriced = 0;
  for (const id of bundle.subscriptionIds) {
    const sub = SUBSCRIPTIONS_BY_ID[id];
    const price = sub ? getPriceForward(sub).fromPrice : null;
    if (price === null) unpriced += 1;
    else monthly += price;
  }
  return { monthly, unpriced };
}

/** "₹4,379/month", or "₹4,379/month + 2 services not priced". */
export function bundleSeparateLabel(bundle: LifestyleBundle): string {
  const { monthly, unpriced } = bundleSeparateTotal(bundle);
  const base = `${formatINR(monthly)}/month`;
  return unpriced > 0 ? `${base} + ${unpriced} service${unpriced === 1 ? "" : "s"} not priced` : base;
}
