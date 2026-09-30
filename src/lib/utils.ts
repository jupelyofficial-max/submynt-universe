import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { AccessType } from "@/types/subscription";

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

/** Days from now until `iso` (negative if already past). */
export function daysUntil(iso: string): number {
  return (new Date(iso).getTime() - Date.now()) / 86400000;
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(
    new Date(iso)
  );
}
