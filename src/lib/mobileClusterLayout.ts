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
// layout as a percentage of its own (responsive, grid-column-driven) width,
// so only the RATIO between tiers and the packing tightness matter here.
// A wide primary-to-small ratio so the hero icon stays clearly the star of
// the card even at a narrow 3-column width, rather than every icon shrinking
// toward the same illegible size.
const PRIMARY_SIZE = 62;
const SECONDARY_SIZE = 38;
const SMALL_SIZE = 26;

/** Same golden-angle circle-packing technique as the desktop Universe
 * (packCircles) — a hero icon anchors the center, the rest pack outward just
 * far enough to clear it and each other. Tight spacing/margin so the cluster
 * reads as one dense neighborhood rather than icons scattered apart. */
export function computeMobileClusterLayout(subs: Subscription[]): MobileClusterLayout {
  const sorted = [...subs].sort((a, b) => b.popularity - a.popularity);
  const shown = sorted.slice(0, MAX_ICONS);
  const overflow = Math.max(0, sorted.length - MAX_ICONS);

  const radii = shown.map((_, i) => (i === 0 ? PRIMARY_SIZE : i <= 2 ? SECONDARY_SIZE : SMALL_SIZE) / 2);
  const placed = packCircles(radii, 16, 3);

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
