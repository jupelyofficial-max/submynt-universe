import { SUBSCRIPTIONS_BY_ID } from "@/data/subscriptions";
import type { Subscription } from "@/types/subscription";

export type EcosystemId = "google" | "microsoft" | "apple" | "adobe" | "amazon";

export interface Ecosystem {
  id: EcosystemId;
  name: string;
  /** Real logo asset in public/ecosystems/. */
  logo: string;
  /** Catalogue ids of this company's subscriptions. The catalogue has no
   * parent-company field (`provider` is the product's own name), so the
   * family is listed here explicitly. Ids not in the catalogue are dropped
   * (see ecosystemServices), so one can be listed before its entry exists. */
  serviceIds: string[];
}

export const ECOSYSTEMS: Ecosystem[] = [
  {
    id: "google",
    name: "Google",
    logo: "/ecosystems/google.png",
    serviceIds: ["google-one", "youtube-premium", "youtube-music-premium", "google-workspace", "google-ai-pro"],
  },
  {
    id: "microsoft",
    name: "Microsoft",
    logo: "/ecosystems/microsoft.png",
    serviceIds: ["microsoft-365", "xbox-game-pass", "microsoft-copilot-pro"],
  },
  {
    id: "apple",
    name: "Apple",
    logo: "/ecosystems/apple.png",
    serviceIds: ["apple-music", "apple-tv", "icloud", "apple-arcade"],
  },
  {
    // Only Creative Cloud is in the catalogue today, so Adobe stays hidden
    // (needs 2+) until more Adobe entries are added.
    id: "adobe",
    name: "Adobe",
    logo: "/ecosystems/adobe.png",
    serviceIds: ["adobe-creative-cloud"],
  },
  {
    id: "amazon",
    name: "Amazon",
    logo: "/ecosystems/amazon.png",
    serviceIds: ["amazon-prime", "amazon-prime-video", "amazon-music-unlimited"],
  },
];

/** The ecosystem's subscriptions that actually exist in the catalogue. */
export function ecosystemServices(ecosystem: Ecosystem): Subscription[] {
  return ecosystem.serviceIds.map((id) => SUBSCRIPTIONS_BY_ID[id]).filter((s): s is Subscription => Boolean(s));
}

/** Only brands with at least this many catalogue subscriptions are shown —
 * a "family" of one isn't an ecosystem. */
export const MIN_ECOSYSTEM_SERVICES = 2;

/** The ecosystems that are shown (and have a page), with their subscriptions. */
export function shownEcosystems(): (Ecosystem & { services: Subscription[] })[] {
  return ECOSYSTEMS.map((eco) => ({ ...eco, services: ecosystemServices(eco) })).filter(
    (eco) => eco.services.length >= MIN_ECOSYSTEM_SERVICES
  );
}
