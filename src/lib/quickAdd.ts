import { INCLUDED_ONLY_SUBSCRIPTIONS, SUBSCRIPTIONS, SUBSCRIPTIONS_BY_ID } from "@/data/subscriptions";
import { DEFAULT_ADD_LIST, INCLUDED_ONLY_IDS, LIST_EXCLUDED_CATEGORIES, MEMBER_PLANS, PARENT_SERVICES } from "@/data/quickAdd";
import { monthlyEquivalent, planCycleAmount } from "@/lib/utils";
import { catalogPriceFor, type ServiceDetailsValue } from "@/components/onboarding/ServiceDetailsCard";
import type { AccessType, BillingCycle, BundleProvider, Subscription, SubscriptionPlan } from "@/types/subscription";

// ---------------------------------------------------------------- prices

/** The cheapest paid plan by monthly equivalent (a monthly plan wins a tie),
 * optionally ignoring one plan by name. */
export function cheapestPlan(sub: Subscription, exceptPlan?: string): SubscriptionPlan | null {
  const paid = sub.plans.filter((p) => p.priceMonthly > 0 && p.name !== exceptPlan);
  if (paid.length === 0) return null;
  return paid.reduce((best, p) =>
    p.priceMonthly < best.priceMonthly || (p.priceMonthly === best.priceMonthly && p.billing === "monthly" && best.billing !== "monthly") ? p : best
  );
}

/** Same 30-day default the rest of the add flow uses when no renewal date is known. */
function defaultRenewal(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 10);
}

/** What an add writes for `sub` when the user doesn't change anything: its
 * cheapest plan at that plan's own per-cycle price. Null when the catalogue
 * lists no paid price at all (never invented). */
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

/** What an add writes for `sub` given what else is selected or tracked. Same
 * as quickDefaultDetails, except a service with a member rate (MEMBER_PLANS)
 * starts on the member plan when its parent service is selected, included
 * via a bundle or already tracked, and on its other cheapest plan otherwise
 * (the "from" price on the list still shows the member rate). */
export function defaultDetailsFor(sub: Subscription, res: Resolution, trackedIds: ReadonlySet<string>): ServiceDetailsValue | null {
  const base = quickDefaultDetails(sub);
  const rule = MEMBER_PLANS[sub.id];
  if (!base || !rule) return base;
  const member = trackedIds.has(rule.with) || (res.state[rule.with] ?? "none") !== "none";
  const plan = member ? sub.plans.find((p) => p.name === rule.plan) : cheapestPlan(sub, rule.plan);
  return plan ? { ...base, planName: plan.name, billing: plan.billing, priceAmount: planCycleAmount(plan) } : base;
}

/** The row's "from ₹X/mo": the cheapest plan's monthly equivalent. */
export function fromMonthly(sub: Subscription): number | null {
  const d = quickDefaultDetails(sub);
  return d && d.priceAmount !== null ? monthlyEquivalent(d.priceAmount, d.billing) : null;
}

/** Selecting a plan chip. */
export function applyPlan(value: ServiceDetailsValue, plan: SubscriptionPlan): ServiceDetailsValue {
  return { ...value, planName: plan.name, billing: plan.billing, priceAmount: planCycleAmount(plan) };
}

/** Short per-cycle suffix for compact chips ("mo", "yr"). */
export function shortCycle(billing: BillingCycle): string {
  return billing === "annual" ? "yr" : billing === "monthly" ? "mo" : billing === "quarterly" ? "qtr" : billing === "half-yearly" ? "6 mo" : "";
}

// ------------------------------------------------------------- ordering

const BY_POPULARITY = [...SUBSCRIPTIONS].sort((a, b) => b.popularity - a.popularity);

/** Every service the add flow can write, in display order: the curated
 * default list first, then the rest by the catalogue's own popularity. */
export const QUICK_ORDER: Subscription[] = (() => {
  const seen = new Set<string>();
  const out: Subscription[] = [];
  for (const id of [...DEFAULT_ADD_LIST, ...BY_POPULARITY.map((s) => s.id)]) {
    const sub = SUBSCRIPTIONS_BY_ID[id];
    if (!sub || seen.has(id) || !quickDefaultDetails(sub)) continue;
    seen.add(id);
    out.push(sub);
  }
  return out;
})();

/** What the list itself offers: everything but the excluded categories
 * (QUICK_ORDER stays complete so bundle-flow rows still resolve). */
export const LIST_ORDER: Subscription[] = QUICK_ORDER.filter((s) => !LIST_EXCLUDED_CATEGORIES.includes(s.category));

/** What the list shows with no search: the curated defaults, in order. */
export const DEFAULT_LIST: Subscription[] = DEFAULT_ADD_LIST.map((id) => LIST_ORDER.find((s) => s.id === id)).filter((s): s is Subscription => Boolean(s));

/** The list for a search query: no query = the curated defaults; a query
 * searches the whole catalogue minus the excluded categories. */
export function filterServices(query: string): Subscription[] {
  const q = query.trim().toLowerCase();
  if (!q) return DEFAULT_LIST;
  return LIST_ORDER.filter(
    (s) =>
      s.name.toLowerCase().includes(q) ||
      s.provider.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q) ||
      s.tags.some((t) => t.toLowerCase().includes(q))
  );
}

/** Included-only services (INCLUDED_ONLY_IDS): never listed, never a pick. */
export function isIncludedOnly(id: string): boolean {
  return INCLUDED_ONLY_IDS.includes(id);
}

/** "Includes YouTube Music" — for a service that is a parent, else null. */
export function includesText(id: string): string | null {
  const p = PARENT_SERVICES[id];
  return p ? `Includes ${p.includes}` : null;
}

// ----------------------------------------------------- smart inclusions

/** What a service is, given the selection. "bundled" = included with
 * something else the user picked (₹0, never double counted). */
export type TileState = "direct" | "bundled" | "none";

/** What includes a bundled service. */
export interface Coverage {
  /** The parent service row it nests under on the confirm screen ("" when
   * the bundle has no tracked plan row, e.g. Family). */
  parentId: string;
  provider: BundleProvider;
  accessType: Extract<AccessType, "bundled" | "family">;
  /** Shown as "via X" / "Included with X". */
  name: string;
  /** Set for services that came from the "Add from a bundle" sub-flow. */
  bundleId?: string;
}

/** The user's choices. */
export interface QuickSelection {
  /** Services the user picked themselves (paid for directly). */
  picks: string[];
  /** Included services the user says they pay for separately anyway. */
  separate: string[];
  /** Bundled regardless of any parent — from the bundle sub-flow. */
  fixed: Record<string, Coverage>;
}
export const EMPTY_SELECTION: QuickSelection = { picks: [], separate: [], fixed: {} };

export interface Resolution {
  state: Record<string, TileState>;
  /** For every service something selected includes. */
  coverage: Record<string, Coverage>;
}

/** "Prime" for Amazon Prime, else the service's own name. */
function shortName(id: string): string {
  return (SUBSCRIPTIONS_BY_ID[id]?.name ?? id).replace(/^Amazon /, "");
}

/** Works out every service's state from the user's choices. Picking a parent
 * (PARENT_SERVICES) makes its children bundled ₹0 — even ones picked earlier,
 * so nothing is counted twice — unless the user marked a child "I pay
 * separately". Already-tracked services are never touched. A few passes
 * because a bundled service can itself be a parent. */
export function resolveQuick(sel: QuickSelection, trackedIds: ReadonlySet<string>): Resolution {
  const picks = new Set(sel.picks);
  const separate = new Set(sel.separate);
  let state: Record<string, TileState> = {};
  let coverage: Record<string, Coverage> = {};

  for (let pass = 0; pass < 4; pass++) {
    const active = new Set<string>(pass === 0 ? [...picks].filter((id) => !trackedIds.has(id)) : Object.entries(state).filter(([, s]) => s !== "none").map(([id]) => id));

    const nextCoverage: Record<string, Coverage> = {};
    for (const [parentId, parent] of Object.entries(PARENT_SERVICES)) {
      if (!active.has(parentId)) continue;
      for (const childId of parent.children) {
        if (childId === parentId || nextCoverage[childId]) continue;
        nextCoverage[childId] = { parentId, provider: parent.provider, accessType: "bundled", name: shortName(parentId) };
      }
    }
    for (const [id, cov] of Object.entries(sel.fixed)) if (!nextCoverage[id]) nextCoverage[id] = cov;

    const nextState: Record<string, TileState> = {};
    for (const id of new Set([...picks, ...separate, ...Object.keys(nextCoverage)])) {
      if (trackedIds.has(id) || !SUBSCRIPTIONS_BY_ID[id]) continue;
      const covered = Boolean(nextCoverage[id]) && !separate.has(id);
      nextState[id] = covered ? "bundled" : picks.has(id) || separate.has(id) ? "direct" : "none";
    }

    const settled = pass > 0 && JSON.stringify(nextState) === JSON.stringify(state);
    state = nextState;
    coverage = nextCoverage;
    if (settled) break;
  }
  return { state, coverage };
}

/** Tap on a row: pick it or un-pick it. Included (bundled) rows don't respond. */
export function toggleSelection(sel: QuickSelection, res: Resolution, id: string): QuickSelection {
  const st = res.state[id] ?? "none";
  if (st === "bundled") return sel;
  if (st === "direct") {
    return { ...sel, picks: sel.picks.filter((x) => x !== id), separate: sel.separate.filter((x) => x !== id), fixed: omit(sel.fixed, id) };
  }
  return { ...sel, picks: [...sel.picks, id] };
}

/** "I pay separately" on an included row: it becomes its own direct row. */
export function paySeparately(sel: QuickSelection, id: string): QuickSelection {
  if (isIncludedOnly(id)) return sel;
  return {
    ...sel,
    picks: sel.picks.includes(id) ? sel.picks : [...sel.picks, id],
    separate: sel.separate.includes(id) ? sel.separate : [...sel.separate, id],
    fixed: omit(sel.fixed, id),
  };
}

function omit<T>(obj: Record<string, T>, key: string): Record<string, T> {
  const next = { ...obj };
  delete next[key];
  return next;
}

/** "via Prime" / "via Jio" / "via Family". */
export function viaLabel(cov: Coverage): string {
  return `via ${cov.name}`;
}

// ----------------------------------------------------------- the items

export interface QuickEdits {
  /** Confirm-screen edits (plan / cycle / price), per directly-paid service. */
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

/** Everything the add will write, in list order: directly-paid services at
 * their (possibly edited) details, bundled ones at ₹0. */
export function buildItems(res: Resolution, edits: QuickEdits, trackedIds: ReadonlySet<string> = new Set()): QuickItem[] {
  const out: QuickItem[] = [];
  for (const sub of [...QUICK_ORDER, ...INCLUDED_ONLY_SUBSCRIPTIONS]) {
    const st = res.state[sub.id];
    if (st === "direct") {
      const base = edits.details[sub.id] ?? defaultDetailsFor(sub, res, trackedIds);
      if (!base) continue;
      // A day-of-month only means something for a monthly renewal.
      const day = base.billing === "monthly" ? edits.renewDay[sub.id] : undefined;
      out.push({ id: sub.id, kind: "direct", value: day ? { ...base, nextRenewal: nextRenewalFromDay(day) } : base, withRenewal: Boolean(day) });
    } else if (st === "bundled") {
      const coverage = res.coverage[sub.id];
      if (!coverage) continue;
      const parentPlan = coverage.parentId ? (edits.details[coverage.parentId] ?? quickDefaultDetails(SUBSCRIPTIONS_BY_ID[coverage.parentId]))?.planName : undefined;
      const planName = (parentPlan && PARENT_SERVICES[coverage.parentId]?.childPlans?.[sub.id]?.[parentPlan]) || "Bundled";
      out.push({
        id: sub.id,
        kind: "bundled",
        value: { accessType: coverage.accessType, bundleProvider: coverage.provider, planName, priceAmount: 0, billing: "monthly", nextRenewal: defaultRenewal() },
        coverage,
        withRenewal: false,
      });
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
