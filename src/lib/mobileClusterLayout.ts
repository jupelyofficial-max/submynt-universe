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
// sizes land real on-screen diameters at ~63px dominant / ~44px secondary /
// ~31px small for the worst case (a full 8-icon category); smaller
// categories end up with even bigger icons, never smaller.
const PRIMARY_SIZE = 60;
const SECONDARY_SIZE = 42;
const SMALL_SIZE = 30;

/** Small deterministic per-icon offset (seeded by id, not Math.random) so
 * the cluster reads as a curated, slightly irregular composition rather
 * than a mechanically perfect golden-angle ring — without ever being
 * random enough to drift icons apart or make the layout unstable between
 * renders. */
function jitter(id: string, amplitude: number): { dx: number; dy: number } {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 100000;
  const angle = (h / 100000) * Math.PI * 2;
  const mag = (((h * 7) % 100) / 100) * amplitude;
  return { dx: Math.cos(angle) * mag, dy: Math.sin(angle) * mag };
}

/** Same golden-angle circle-packing technique as the desktop Universe
 * (packCircles) — a dominant icon anchors the center, the rest pack outward
 * just far enough to clear it and each other — then a small per-icon jitter
 * breaks up the otherwise-too-regular spiral into something that reads as
 * curated rather than a mechanical radial diagram. */
export function computeMobileClusterLayout(subs: Subscription[]): MobileClusterLayout {
  const sorted = [...subs].sort((a, b) => b.popularity - a.popularity);
  const shown = sorted.slice(0, MAX_ICONS);
  const overflow = Math.max(0, sorted.length - MAX_ICONS);

  const radii = shown.map((_, i) => (i === 0 ? PRIMARY_SIZE : i <= 2 ? SECONDARY_SIZE : SMALL_SIZE) / 2);
  // Margin (4.5) is deliberately wider than plain non-jittered packing needs
  // — it has to safely absorb two adjacent icons each jittering up to 2 units
  // toward each other (worst case) without ever actually touching.
  const placed = packCircles(radii, 7, 4.5);

  const maxExtent = Math.max(...placed.map((p) => Math.hypot(p.x, p.y) + p.r));
  const boxSize = maxExtent * 2 + 12;

  const icons: MobileIconPlacement[] = shown.map((subscription, i) => {
    // The dominant icon stays dead center — jitter is only for everything
    // orbiting it, so the composition still has one clear anchor point.
    const { dx, dy } = i === 0 ? { dx: 0, dy: 0 } : jitter(subscription.id, 2);
    return {
      subscription,
      x: boxSize / 2 + placed[i].x + dx,
      y: boxSize / 2 + placed[i].y + dy,
      size: radii[i] * 2,
    };
  });

  return { icons, overflow, boxSize };
}
