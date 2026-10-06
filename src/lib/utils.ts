import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { AccessType, BillingCycle, OwnedSubscription } from "@/types/subscription";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatINR(amount: number): string {
  if (amount === 0) return "Free";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCompactINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(amount);
}

/** Formats a possibly-unknown price for display — falls back to
 * `priceLabel` (default "Contact for pricing") when `amount` is null,
 * rather than ever showing a fabricated ₹0. */
export function formatPrice(amount: number | null, priceLabel?: string): string {
  if (amount === null) return priceLabel ?? "Contact for pricing";
  return formatINR(amount);
}

/** priceMonthly === 0 on a bundled/family/promotional owned row is
 * genuinely ₹0 but not the same thing as a "free" product (NFR-005,
 * Sprint 1) — formatINR's blanket 0 -> "Free" would misrepresent it right
 * next to an access-type badge that says otherwise. Only a row whose own
 * accessType is actually "free" gets the word "Free". */
export function formatOwnedPrice(priceMonthly: number, accessType: AccessType): string {
  if (priceMonthly > 0) return formatINR(priceMonthly);
  if (accessType === "free") return "Free";
  return "Included";
}

const CYCLE_MONTHS: Partial<Record<BillingCycle, number>> = { monthly: 1, quarterly: 3, "half-yearly": 6, annual: 12 };

/** Monthly equivalent of an amount charged per `billing` cycle (annual
 * ÷ 12, etc.) — what spend totals add up. One-off/free cycles count as 0. */
export function monthlyEquivalent(priceAmount: number, billing: BillingCycle): number {
  const months = CYCLE_MONTHS[billing];
  return months ? priceAmount / months : 0;
}

/** What a catalogue plan charges per its own cycle. The catalogue stores
 * every plan's price as a monthly equivalent (an "Annual" plan at 125 is
 * ₹1,500/year), so this recovers the catalogue's actual per-cycle price —
 * it never converts a user-entered amount. */
export function planCycleAmount(plan: { priceMonthly: number; billing: BillingCycle }): number {
  return plan.priceMonthly * (CYCLE_MONTHS[plan.billing] ?? 1);
}

/** An owned entry's per-cycle amount. A legacy entry without priceAmount
 * stored a monthly figure (the old field was labeled "₹/month") — same rule
 * as the SQL backfill. */
export function ownedPriceAmount(o: Pick<OwnedSubscription, "priceAmount" | "priceMonthly" | "billing">): number {
  return o.priceAmount ?? o.priceMonthly * (CYCLE_MONTHS[o.billing] ?? 1);
}

const CYCLE_SUFFIX: Record<BillingCycle, string> = {
  monthly: "/month",
  quarterly: "/quarter",
  "half-yearly": "/6 months",
  annual: "/year",
  lifetime: " one-time",
  free: "",
};

/** "/month", "/year", … — shown after a per-cycle amount. */
export function cycleSuffix(billing: BillingCycle): string {
  return CYCLE_SUFFIX[billing];
}

/** Days from now until `iso` (negative if already past). */
export function daysUntil(iso: string): number {
  return (new Date(iso).getTime() - Date.now()) / 86400000;
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(
    new Date(iso)
  );
}
