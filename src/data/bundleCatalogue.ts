import type { BundleProvider } from "@/types/subscription";

/**
 * Best-effort bundle-inclusion catalogue for the bundle-first add flow.
 * NEEDS MANUAL UPKEEP: real telecom/provider bundle contents change by
 * plan tier, region and time, and this is not synced from any live
 * source — treat every entry here as a starting point to be corrected,
 * not a verified fact (see Sprint 7's audit in bundleIntelligence.ts for
 * why this distinction matters). Bump BUNDLE_CATALOGUE_VERSION on any
 * content change so consumers can tell a stale cached copy apart.
 */
export const BUNDLE_CATALOGUE_VERSION = 2;

export type BundleId = "airtel-black" | "jio" | "amazon-prime" | "family" | "employer";

export interface BundleIncludedService {
  /** Must be a real id in SUBSCRIPTIONS_BY_ID. */
  serviceId: string;
  /** The catalog's own priceMonthly at seed time — an approximate label,
   * not re-verified independently; re-read from the catalog at render
   * time instead of trusting this field as current. */
  standalonePrice: number | null;
  /** Plan-tier/region caveat shown next to the toggle. */
  note?: string;
  /** false only where the inclusion is uncertain enough that defaulting
   * it "on" would overstate what the user actually has (e.g. premium-
   * tier-only inclusions). Defaults to true when omitted. */
  defaultOn?: boolean;
}

export interface BundleCatalogueEntry {
  id: BundleId;
  name: string;
  /** Existing BundleProvider enum value this bundle writes to owned
   * items via updateBundleProvider — no new provider values invented. */
  bundleProvider: BundleProvider;
  /** false for Family/Employer — there's no fixed inclusion list for
   * either, so the confirm step shows a service picker instead of a
   * preset toggle list. */
  hasPresetList: boolean;
  includedServices: BundleIncludedService[];
  /** The paid plan the bundle comes with — a real SUBSCRIPTIONS_BY_ID id,
   * tracked as a Direct row so the bundle's actual cost counts in spend
   * (the included services stay ₹0). prefillPrice is false where the
   * catalogue's price for that service isn't this bundle's price (the
   * "airtel" entry is a prepaid plan, not Airtel Black), so the user
   * must enter it. Absent for Family/Employer, which have no plan. */
  plan?: { serviceId: string; prefillPrice: boolean };
}

export const BUNDLE_CATALOGUE: BundleCatalogueEntry[] = [
  {
    id: "airtel-black",
    name: "Airtel Black",
    bundleProvider: "airtel",
    hasPresetList: true,
    plan: { serviceId: "airtel", prefillPrice: false },
    includedServices: [
      { serviceId: "jiohotstar", standalonePrice: 299 },
      { serviceId: "airtel-xstream", standalonePrice: 149, note: "Included on all Airtel Black tiers" },
      { serviceId: "amazon-prime", standalonePrice: 300, note: "Mid-tier plans and above" },
      { serviceId: "netflix", standalonePrice: 649, note: "Premium-tier plans only", defaultOn: false },
    ],
  },
  {
    id: "jio",
    name: "Jio",
    bundleProvider: "jio",
    hasPresetList: true,
    plan: { serviceId: "jio", prefillPrice: true },
    includedServices: [
      { serviceId: "jiohotstar", standalonePrice: 299, note: "Plan-dependent — verify against your current Jio plan" },
      { serviceId: "jiosaavn-pro", standalonePrice: 89, note: "Plan-dependent — verify against your current Jio plan" },
      { serviceId: "netflix", standalonePrice: 649, note: "Plan-dependent — only select high-value plans", defaultOn: false },
      { serviceId: "amazon-prime", standalonePrice: 300, note: "Plan-dependent — only select plans", defaultOn: false },
    ],
  },
  {
    id: "amazon-prime",
    name: "Amazon Prime",
    bundleProvider: "amazon",
    hasPresetList: true,
    plan: { serviceId: "amazon-prime", prefillPrice: true },
    includedServices: [
      { serviceId: "amazon-prime-video", standalonePrice: 299, note: "Included with every Amazon Prime membership" },
    ],
  },
  {
    id: "family",
    name: "Family",
    bundleProvider: "family",
    hasPresetList: false,
    includedServices: [],
  },
  {
    id: "employer",
    name: "Employer",
    bundleProvider: "employer",
    hasPresetList: false,
    includedServices: [],
  },
];

export const BUNDLE_CATALOGUE_BY_ID: Record<BundleId, BundleCatalogueEntry> = Object.fromEntries(
  BUNDLE_CATALOGUE.map((b) => [b.id, b])
) as Record<BundleId, BundleCatalogueEntry>;
