import type { BadgeTone } from "@/components/ui/Badge";
import type { BundleProvider, OwnedSubscription } from "@/types/subscription";

/** Presentation-only helpers for the Track Subscriptions redesign — no
 * data-layer logic, just how existing fields (accessType, bundleProvider,
 * computeSubmyntScore's score) map to labels/colors. Shared between
 * my-subscriptions/page.tsx and DetailPanel so the two surfaces never
 * drift on wording or color. */

// Covers the current fixed enum (Airtel Black/Jio/Family/Employer/Others)
// plus legacy Amazon/Apple/Google values already stored for existing
// users — same backward-compat reasoning as BUNDLE_PROVIDER_LABELS
// before this redesign, just with a color per source added.
const SOURCE_BADGE: Record<string, { label: string; tone: BadgeTone }> = {
  airtel: { label: "via Airtel Black", tone: "coral" },
  jio: { label: "via Jio", tone: "violet" },
  family: { label: "via Family", tone: "nebula" },
  employer: { label: "via Employer", tone: "ocean" },
  other: { label: "via Others", tone: "neutral" },
  amazon: { label: "via Amazon", tone: "neutral" },
  apple: { label: "via Apple", tone: "neutral" },
  google: { label: "via Google", tone: "neutral" },
};

export function sourceBadgeFor(bundleProvider: BundleProvider): { label: string; tone: BadgeTone } {
  return SOURCE_BADGE[bundleProvider] ?? { label: `via ${bundleProvider}`, tone: "neutral" };
}

/** The single access/source chip shown on each card — "Paid directly" for
 * Direct, the colored source badge for Bundled/Family, and a plain label
 * for Promotional/Free (access types with no bundle-source concept). */
export function accessChipFor(owned: OwnedSubscription): { label: string; tone: BadgeTone } {
  const accessType = owned.accessType ?? "direct";
  if (accessType === "direct") return { label: "Paid directly", tone: "neutral" };
  if ((accessType === "bundled" || accessType === "family") && owned.bundleProvider) {
    return sourceBadgeFor(owned.bundleProvider);
  }
  if (accessType === "family") return { label: "via Family", tone: "nebula" };
  if (accessType === "promotional") return { label: "Promotional", tone: "gold" };
  if (accessType === "free") return { label: "Free", tone: "neutral" };
  return { label: "Bundled", tone: "nebula" }; // bundled with no provider recorded yet
}

// Same 70/40 split computeSubmyntScore itself uses (KEEP_THRESHOLD /
// OPTIMIZE_THRESHOLD in lib/submyntScore.ts) — mirrored here only as a
// one-word label for the aggregate ring, never re-deriving the score.
export function scoreBand(score: number): string {
  if (score >= 70) return "Good";
  if (score >= 40) return "Fair";
  return "Needs work";
}
