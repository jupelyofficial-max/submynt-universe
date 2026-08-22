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
// Relative units. MobileCategoryCard renders this layout as a full-width
// square on a 2-column mobile grid — verified (not eyeballed) with
// packCircles's actual output against a real 390px viewport, these tier
// sizes land real on-screen diameters at ~56px hero / ~38px secondary /
// ~27px small for the worst case (a full 8-icon category); smaller
// categories end up with even bigger icons, never smaller. A 3-column grid
// was tried first but the math doesn't work: there simply isn't enough
// column width on a real phone to fit these icon sizes at 3 columns without
// clipping/overlap, so 2 columns is what actually delivers the target sizes.
const PRIMARY_SIZE = 50;
const SECONDARY_SIZE = 34;
const SMALL_SIZE = 24;

/** Same golden-angle circle-packing technique as the desktop Universe
 * (packCircles) — a hero icon anchors the center, the rest pack outward just
 * far enough to clear it and each other. Tight spacing/margin so the cluster
 * reads as one dense neighborhood rather than icons scattered apart. */
export function computeMobileClusterLayout(subs: Subscription[]): MobileClusterLayout {
  const sorted = [...subs].sort((a, b) => b.popularity - a.popularity);
  const shown = sorted.slice(0, MAX_ICONS);
  const overflow = Math.max(0, sorted.length - MAX_ICONS);

  const radii = shown.map((_, i) => (i === 0 ? PRIMARY_SIZE : i <= 2 ? SECONDARY_SIZE : SMALL_SIZE) / 2);
  const placed = packCircles(radii, 8, 1.5);

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
