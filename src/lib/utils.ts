import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

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

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(
    new Date(iso)
  );
}
