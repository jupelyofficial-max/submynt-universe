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

const MAX_ICONS = 7;
// Diameters in real px — not world units scaled by a camera — so these are
// exactly what renders on screen, same spirit as the desktop tier hierarchy
// but calibrated for a small fixed card instead of a pannable/zoomable scene.
const PRIMARY_SIZE = 54;
const SECONDARY_SIZE = 36;
const SMALL_SIZE = 26;

/** Same golden-angle circle-packing technique as the desktop Universe
 * (packCircles), just run directly in pixel space for a small fixed-size
 * mobile card — a hero icon anchors the center, the rest pack outward just
 * far enough to clear it and each other. No WebGL, no camera, no scaling:
 * every icon renders at its real intended size. */
export function computeMobileClusterLayout(subs: Subscription[]): MobileClusterLayout {
  const sorted = [...subs].sort((a, b) => b.popularity - a.popularity);
  const shown = sorted.slice(0, MAX_ICONS);
  const overflow = Math.max(0, sorted.length - MAX_ICONS);

  const radii = shown.map((_, i) => (i === 0 ? PRIMARY_SIZE : i <= 2 ? SECONDARY_SIZE : SMALL_SIZE) / 2);
  const placed = packCircles(radii, 22, 6);

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
