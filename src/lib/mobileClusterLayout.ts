import type { Subscription } from "@/types/subscription";
import { packCircles } from "./universeLayout";

export interface MobileIconPlacement {
  subscription: Subscription;
  x: number;
  y: number;
  size: number;
}

export interface MobileClusterLayout {
  icons: MobileIconPlacement[];
  overflow: number;
  boxSize: number;
}

const MAX_ICONS = 8;
// Relative units, not literal px — MobileCategoryCard renders this whole
// layout as a percentage of its own (fixed-height) footprint, so only the
// RATIO between tiers and the packing tightness matter here. A moderate
// primary-to-small ratio: the hero icon still anchors the cluster, but
// doesn't balloon into one dominant circle that crowds everything else out.
const PRIMARY_SIZE = 46;
const SECONDARY_SIZE = 32;
const SMALL_SIZE = 22;

/** Same golden-angle circle-packing technique as the desktop Universe
 * (packCircles) — a hero icon anchors the center, the rest pack outward just
 * far enough to clear it and each other. Tight spacing/margin so the cluster
 * reads as one dense neighborhood rather than icons scattered apart. */
export function computeMobileClusterLayout(subs: Subscription[]): MobileClusterLayout {
  const sorted = [...subs].sort((a, b) => b.popularity - a.popularity);
  const shown = sorted.slice(0, MAX_ICONS);
  const overflow = Math.max(0, sorted.length - MAX_ICONS);

  const radii = shown.map((_, i) => (i === 0 ? PRIMARY_SIZE : i <= 2 ? SECONDARY_SIZE : SMALL_SIZE) / 2);
  const placed = packCircles(radii, 13, 2);

  const maxExtent = Math.max(...placed.map((p) => Math.hypot(p.x, p.y) + p.r));
  const boxSize = maxExtent * 2 + 12;

  const icons: MobileIconPlacement[] = shown.map((subscription, i) => ({
    subscription,
    x: boxSize / 2 + placed[i].x,
    y: boxSize / 2 + placed[i].y,
    size: radii[i] * 2,
  }));

  return { icons, overflow, boxSize };
}
