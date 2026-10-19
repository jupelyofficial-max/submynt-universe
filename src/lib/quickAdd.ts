import { SUBSCRIPTIONS, SUBSCRIPTIONS_BY_ID } from "@/data/subscriptions";
import { BUNDLE_CATALOGUE, type BundleCatalogueEntry } from "@/data/bundleCatalogue";
import { AUTO_INCLUDE_BUNDLES, INDIA_POPULARITY_ORDER, QUICK_ADD_CHIPS } from "@/data/quickAdd";
import { monthlyEquivalent, planCycleAmount } from "@/lib/utils";
import { catalogPriceFor, type ServiceDetailsValue } from "@/components/onboarding/ServiceDetailsCard";
import type { BillingCycle, Subscription, SubscriptionPlan } from "@/types/subscription";

// ---------------------------------------------------------------- prices

/** The cheapest paid plan by monthly equivalent (a monthly plan wins a tie). */
export function cheapestPlan(sub: Subscription): SubscriptionPlan | null {
  const paid = sub.plans.filter((p) => p.priceMonthly > 0);
  if (paid.length === 0) return null;
  return paid.reduce((best, p) =>
    p.priceMonthly < best.priceMonthly || (p.priceMonthly === best.priceMonthly && p.billing === "monthly" && best.billing !== "monthly") ? p : best
  );
}

/** Same 30-day default the detailed flow uses when no renewal date is known. */
function defaultRenewal(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 10);
}

/** What a quick add writes for `sub` when the user doesn't change anything:
 * its cheapest plan at that plan's own per-cycle price. Null when the
 * catalogue lists no paid price at all (never invented). */
export function quickDefaultDetails(sub: Subscription): ServiceDetailsValue | null {
  const plan = cheapestPlan(sub);
  if (plan) {
    return { accessType: "direct", planName: plan.name, priceAmount: planCycleAmount(plan), billing: plan.billing, nextRenewal: defaultRenewal() };
  }
  const monthly = catalogPriceFor(sub, "monthly");
  if (monthly !== null && monthly > 0) {
    return { accessType: "direct", planName: sub.plans[0]?.name ?? "", priceAmount: monthly, billing: "monthly", nextRenewal: defaultRenewal() };
  }
  return null;
}

/** The tile's "from ₹X/mo": the cheapest plan's monthly equivalent. */
export function fromMonthly(sub: Subscription): number | null {
  const d = quickDefaultDetails(sub);
  return d && d.priceAmount !== null ? monthlyEquivalent(d.priceAmount, d.billing) : null;
}

/** Selecting a plan chip. */
export function applyPlan(value: ServiceDetailsValue, plan: SubscriptionPlan): ServiceDetailsValue {
  return { ...value, planName: plan.name, billing: plan.billing, priceAmount: planCycleAmount(plan) };
}

/** Short per-cycle suffix for compact chips and tiles ("mo", "yr"). */
export function shortCycle(billing: BillingCycle): string {
  return billing === "annual" ? "yr" : billing === "monthly" ? "mo" : billing === "quarterly" ? "qtr" : billing === "half-yearly" ? "6 mo" : "";
}

// ------------------------------------------------------------- ordering

const BY_POPULARITY = [...SUBSCRIPTIONS].sort((a, b) => b.popularity - a.popularity);

/** Every service the grid can add, in display order: the India list first,
 * then the rest by the catalogue's own popularity. */
export const QUICK_ORDER: Subscription[] = (() => {
  const seen = new Set<string>();
  const out: Subscription[] = [];
  for (const id of [...INDIA_POPULARITY_ORDER, ...BY_POPULARITY.map((s) => s.id)]) {
    const sub = SUBSCRIPTIONS_BY_ID[id];
    if (!sub || seen.has(id) || !quickDefaultDetails(sub)) continue;
    seen.add(id);
    out.push(sub);
  }
  return out;
})();

/** The grid for a category chip. A search overrides the chip and looks
 * through everything, so a typed name is never hidden by the filter. */
export function filterServices(chipId: string, query: string): Subscription[] {
  const q = query.trim().toLowerCase();
  if (q) {
    return QUICK_ORDER.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.provider.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.tags.some((t) => t.toLowerCase().includes(q))
    );
  }
  const chip = QUICK_ADD_CHIPS.find((c) => c.id === chipId);
  if (!chip || chip.categories.length === 0) return QUICK_ORDER;
  return QUICK_ORDER.filter((s) => chip.categories.includes(s.category));
}

// ----------------------------------------------------- smart inclusions

/** What the user explicitly chose for a service. Absent = no choice yet. */
export type QuickMode = "direct" | "bundled" | "none";
/** What the tile shows: "maybe" = a selected parent may include it. */
export type TileState = "direct" | "bundled" | "maybe" | "none";

export interface Coverage {
  parentId: string;
  bundle: BundleCatalogueEntry;
  /** True when the parent certainly includes it (no confirmation needed). */
  auto: boolean;
}

export interface Resolution {
  state: Record<string, TileState>;
  /** For each service a selected parent's bundle lists. */
  coverage: Record<string, Coverage>;
}

const PARENT_BUNDLES = BUNDLE_CATALOGUE.filter((b) => b.hasPresetList && b.plan);

/** Works out every tile's state from the user's explicit choices. A service
 * is a parent when it's the plan of a bundle in the bundle catalogue (Amazon
 * Prime, Jio, Airtel); picking one covers that bundle's listed services.
 * Already-tracked services are never touched. Runs a few passes because a
 * bundled service can itself be a parent (Prime included in an Airtel plan
 * → Prime Video included in Prime). */
export function resolveQuick(modes: Record<string, QuickMode>, trackedIds: ReadonlySet<string>): Resolution {
  let state: Record<string, TileState> = {};
  let coverage: Record<string, Coverage> = {};
  for (let pass = 0; pass < 4; pass++) {
    const active = new Set(Object.entries(state).filter(([, s]) => s === "direct" || s === "bundled").map(([id]) => id));
    if (pass === 0) for (const [id, m] of Object.entries(modes)) if (m === "direct" && !trackedIds.has(id)) active.add(id);

    const nextCoverage: Record<string, Coverage> = {};
    for (const bundle of PARENT_BUNDLES) {
      const parentId = bundle.plan!.serviceId;
      if (!active.has(parentId)) continue;
      for (const item of bundle.includedServices) {
        if (item.serviceId === parentId || nextCoverage[item.serviceId]) continue;
        nextCoverage[item.serviceId] = { parentId, bundle, auto: AUTO_INCLUDE_BUNDLES.includes(bundle.id) && (item.defaultOn ?? true) };
      }
    }

    const nextState: Record<string, TileState> = {};
    for (const id of new Set([...Object.keys(modes), ...Object.keys(nextCoverage)])) {
      if (trackedIds.has(id) || !SUBSCRIPTIONS_BY_ID[id]) continue;
      const mode = modes[id];
      const cov = nextCoverage[id];
      if (cov) nextState[id] = mode === "direct" ? "direct" : mode === "none" ? "none" : mode === "bundled" ? "bundled" : cov.auto ? "bundled" : "maybe";
      else nextState[id] = mode === "direct" ? "direct" : "none";
    }

    const settled = pass > 0 && JSON.stringify(nextState) === JSON.stringify(state);
    state = nextState;
    coverage = nextCoverage;
    if (settled) break;
  }
  return { state, coverage };
}

/** The explicit choice a tap produces (undefined = clear the choice).
 * Uncovered: add ↔ remove. Covered by a certain parent: included → pay
 * separately → not using → included. Covered by an uncertain parent:
 * maybe → confirmed included → pay separately → maybe. */
export function nextMode(res: Resolution, id: string): QuickMode | undefined {
  const cur = res.state[id] ?? "none";
  const cov = res.coverage[id];
  if (!cov) return cur === "direct" ? undefined : "direct";
  if (cov.auto) return cur === "bundled" ? "direct" : cur === "direct" ? "none" : "bundled";
  return cur === "maybe" ? "bundled" : cur === "bundled" ? "direct" : undefined;
}

/** "via Prime" / "via Jio" / "via Airtel". */
export function viaLabel(cov: Coverage): string {
  return `via ${(SUBSCRIPTIONS_BY_ID[cov.parentId]?.name ?? cov.bundle.name).replace(/^Amazon /, "")}`;
}

// ----------------------------------------------------------- the items

export interface QuickEdits {
  /** Screen-2 edits (plan / cycle / price), per directly-paid service. */
  details: Record<string, ServiceDetailsValue>;
  /** Renewal day-of-month (1–31), per directly-paid service. */
  renewDay: Record<string, number>;
}
export const NO_EDITS: QuickEdits = { details: {}, renewDay: {} };

export interface QuickItem {
  id: string;
  kind: "direct" | "bundled";
  value: ServiceDetailsValue;
  coverage?: Coverage;
  /** A renewal day was applied to this item. */
  withRenewal: boolean;
}

/** The next date (yyyy-mm-dd, local) whose day-of-month is `day`, today
 * included; a short month clamps to its last day (31 → 28 Feb). */
export function nextRenewalFromDay(day: number, now = new Date()): string {
  let y = now.getFullYear();
  let m = now.getMonth();
  if (day < now.getDate()) {
    m += 1;
    if (m > 11) {
      m = 0;
      y += 1;
    }
  }
  const d = Math.min(day, new Date(y, m + 1, 0).getDate());
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function bundledDetails(bundle: BundleCatalogueEntry): ServiceDetailsValue {
  return { accessType: "bundled", bundleProvider: bundle.bundleProvider, planName: "Bundled", priceAmount: 0, billing: "monthly", nextRenewal: defaultRenewal() };
}

/** Everything the quick add will write, in grid order: directly-paid
 * services at their (possibly edited) details, bundled ones at ₹0. */
export function buildItems(res: Resolution, edits: QuickEdits): QuickItem[] {
  const out: QuickItem[] = [];
  for (const sub of QUICK_ORDER) {
    const st = res.state[sub.id];
    if (st === "direct") {
      const base = edits.details[sub.id] ?? quickDefaultDetails(sub);
      if (!base) continue;
      // A day-of-month only means something for a monthly renewal.
      const day = base.billing === "monthly" ? edits.renewDay[sub.id] : undefined;
      out.push({ id: sub.id, kind: "direct", value: day ? { ...base, nextRenewal: nextRenewalFromDay(day) } : base, withRenewal: Boolean(day) });
    } else if (st === "bundled") {
      const coverage = res.coverage[sub.id];
      if (coverage) out.push({ id: sub.id, kind: "bundled", value: bundledDetails(coverage.bundle), coverage, withRenewal: false });
    }
  }
  return out;
}

/** What the user pays per month across the items (bundled ₹0 excluded). */
export function monthlyTotal(items: QuickItem[]): number {
  return items.reduce((sum, i) => (i.kind === "direct" ? sum + monthlyEquivalent(i.value.priceAmount ?? 0, i.value.billing) : sum), 0);
}

/** A directly-paid row still has no price (a cycle the catalogue doesn't price). */
export function hasMissingPrice(items: QuickItem[]): boolean {
  return items.some((i) => i.kind === "direct" && i.value.priceAmount === null);
}
