import { SUBSCRIPTIONS } from "./subscriptions";
import { getProviderUrl } from "@/lib/subscriptionIntelligence";
import type { Region } from "@/types/subscription";
import type { SponsorshipStatus, VendorProfile } from "@/types/vendor";

/**
 * Migrated from SponsoredStrip's previous hardcoded SPONSORED_IDS array —
 * now real structured data instead of a magic list. This is demo placement
 * data for the prototype, not a real vendor payment relationship; nothing
 * here is ever read by the recommendation scoring in lib/recommendations.ts.
 */
const SPONSORED_DEMO_IDS = new Set(["netflix", "spotify-premium", "adobe-creative-cloud", "notion-ai", "duolingo-super"]);

/** We only know the single region field already on each subscription —
 * "Global" doesn't imply we know which specific countries, so it's kept as
 * an honest sentinel rather than an invented list. */
function countriesFor(region: Region): string[] {
  if (region === "Global") return ["Global"];
  return ["IN"];
}

export const VENDOR_BY_ID: Record<string, VendorProfile> = Object.fromEntries(
  SUBSCRIPTIONS.map((s) => {
    const sponsorshipStatus: SponsorshipStatus = SPONSORED_DEMO_IDS.has(s.id) ? "sponsored" : "none";
    const vendor: VendorProfile = {
      vendorId: s.id,
      officialWebsite: getProviderUrl(s),
      countriesServed: countriesFor(s.region),
      category: s.category,
      recommendationEligible: true,
      affiliateUrl: s.dealUrl,
      featuredEligible: false,
      sponsorshipStatus,
    };
    return [s.id, vendor];
  })
);

export function getSponsoredSubscriptionIds(): string[] {
  return Object.values(VENDOR_BY_ID)
    .filter((v) => v.sponsorshipStatus !== "none")
    .map((v) => v.vendorId);
}
