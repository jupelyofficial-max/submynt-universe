"use client";

import { Canvas } from "@react-three/fiber";
import { useMemo, useSyncExternalStore } from "react";
import { UniverseCanvasBackground } from "./UniverseCanvasBackground";
import { SubscriptionField } from "./SubscriptionField";
import { CategoryLabels } from "./CategoryLabels";
import { CameraController, computeFitZoom, CAMERA_FOV_DEG, FIT_PADDING } from "./CameraController";
import { buildUniverse, computeUniverseBounds, type UniverseBounds } from "@/lib/universeLayout";
import { SUBSCRIPTIONS } from "@/data/subscriptions";
import { useMySubscriptionsStore } from "@/store/useMySubscriptionsStore";
import { useIsDesktop } from "@/hooks/useMediaQuery";

// Column count steps with viewport width: 3 in the tablet band
// (768–1023px, above the dedicated MobileUniverse breakpoint), 4 from
// 1024px up.
const TABLET_GRID_COLUMNS = 3;
const DESKTOP_GRID_COLUMNS = 4;

// Never spread columns apart enough to make the grid feel disconnected —
// this is a cap on how far computeColumnSpread (below) is allowed to
// stretch things at very wide/ultra-wide viewports.
const MAX_COLUMN_SPREAD = 3.5;

// EcosystemStats/"Get Free Subscriptions" (bottom-left) and LiveInsights
// "Top 5" (top-right) are fixed screen overlays that appear starting at the
// same >=1024px breakpoint the grid reaches its full column count at (see
// ExploreClient's `lg:` gating). Measured directly from the live DOM
// (getBoundingClientRect) rather than estimated: the left stack (promo
// button + stats card, both `w-60`-capped) is 211px wide + 24px margin =
// 235px; the Top 5 panel is a fixed `w-60` (240px) + 24px margin = 264px.
// A small buffer is added on top for breathing room, not zero-clearance.
const LEFT_OVERLAY_RESERVE_PX = 235 + 30;
const RIGHT_OVERLAY_RESERVE_PX = 264 + 30;
const SIDE_OVERLAY_RESERVE_PX = LEFT_OVERLAY_RESERVE_PX + RIGHT_OVERLAY_RESERVE_PX;

// How much of the viewport width the Universe should aim to fill — set
// deliberately higher than what's actually reachable once the overlay
// reserve above is subtracted, so the reserve (not this target) is what
// ends up binding at every desktop width, and the composition always reads
// as "as large as safely possible" rather than an arbitrarily-chosen
// percentage.
const TARGET_WIDTH_FILL = 0.85;

// useSyncExternalStore requires getSnapshot to return a referentially
// stable value when nothing has changed — a fresh object literal every call
// makes React think the snapshot changed on every render, which is an
// infinite update loop, not just a wasted render. Cached at module scope
// (window size is inherently global) and only replaced when the actual
// numbers differ.
let cachedViewportSize = { width: 1440, height: 900 };
function getViewportSize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  if (cachedViewportSize.width !== width || cachedViewportSize.height !== height) {
    cachedViewportSize = { width, height };
  }
  return cachedViewportSize;
}

function useViewportSize(): { width: number; height: number } {
  return useSyncExternalStore(
    (callback) => {
      window.addEventListener("resize", callback);
      return () => window.removeEventListener("resize", callback);
    },
    getViewportSize,
    () => cachedViewportSize
  );
}

function getViewportAspect() {
  return window.innerWidth / Math.max(1, window.innerHeight - 64);
}

/** computeFitZoom's camera fit is bound by height at essentially every
 * realistic desktop aspect ratio (the packed composition's own aspect is
 * close to square, viewports are landscape) — so without spreading columns
 * apart, extra viewport width beyond what height needs just becomes unused
 * margin, growing with viewport width.
 *
 * This computes the natural (unspread) fit distance for the composition's
 * own height — the same formula computeFitZoom uses for its height term —
 * then derives how much world width is actually visible at that distance
 * for the live viewport's aspect ratio, and how much of that should be
 * filled (TARGET_WIDTH_FILL, capped by the real overlay reserve in pixels).
 *
 * `widthAtSpread` is used to find the exact columnSpread that hits that
 * target width via binary search, rather than dividing target-width by
 * natural-width directly: columnSpread only scales each cluster's *center*
 * offset, not its own radius (see layoutCategoryGrid), so the resulting
 * bounds.width is a bit short of a naive linear estimate — small per
 * cluster, but compounding into a real, measurable shortfall (verified: a
 * naive estimate targeting 61% fill at 1440px actually rendered at 57%).
 * Binary search sidesteps re-deriving that offset by construction: it
 * always converges on whatever spread the real pipeline needs, exactly. */
function computeColumnSpread(
  naturalBounds: UniverseBounds,
  viewportWidthPx: number,
  viewportHeightPx: number,
  widthAtSpread: (spread: number) => number
): number {
  if (naturalBounds.width <= 0 || naturalBounds.height <= 0) return 1;
  const fovRad = (CAMERA_FOV_DEG * Math.PI) / 180;
  const heightPx = Math.max(1, viewportHeightPx - 64);
  const distance = (naturalBounds.height * FIT_PADDING) / (2 * Math.tan(fovRad / 2));
  const trueAspect = viewportWidthPx / heightPx;
  const visibleWorldWidth = 2 * distance * Math.tan(fovRad / 2) * trueAspect;

  const reservePx = viewportWidthPx >= 1024 ? SIDE_OVERLAY_RESERVE_PX : 0;
  const targetWidthPx = Math.min(TARGET_WIDTH_FILL * viewportWidthPx, viewportWidthPx - reservePx);
  const targetWorldWidth = (Math.max(0, targetWidthPx) / viewportWidthPx) * visibleWorldWidth;

  if (targetWorldWidth <= naturalBounds.width) return 1;
  if (widthAtSpread(MAX_COLUMN_SPREAD) <= targetWorldWidth) return MAX_COLUMN_SPREAD;

  let lo = 1;
  let hi = MAX_COLUMN_SPREAD;
  for (let i = 0; i < 12; i++) {
    const mid = (lo + hi) / 2;
    if (widthAtSpread(mid) < targetWorldWidth) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

export function UniverseScene() {
  const isDesktop = useIsDesktop();
  const columns = isDesktop ? DESKTOP_GRID_COLUMNS : TABLET_GRID_COLUMNS;
  const viewport = useViewportSize();

  // First pass at the natural (unspread) packed size, purely to measure it —
  // cheap given the catalogue's size (124 subscriptions, 16 categories).
  const naturalClusters = useMemo(() => buildUniverse(SUBSCRIPTIONS, columns).clusters, [columns]);
  const naturalBounds = useMemo(() => computeUniverseBounds(naturalClusters), [naturalClusters]);
  const columnSpread = useMemo(() => {
    const widthAtSpread = (spread: number) => computeUniverseBounds(buildUniverse(SUBSCRIPTIONS, columns, spread).clusters).width;
    return computeColumnSpread(naturalBounds, viewport.width, viewport.height, widthAtSpread);
  }, [naturalBounds, viewport.width, viewport.height, columns]);

  const { nodes, clusters } = useMemo(
    () => buildUniverse(SUBSCRIPTIONS, columns, columnSpread),
    [columns, columnSpread]
  );
  const bounds = useMemo(() => computeUniverseBounds(clusters), [clusters]);
  const owned = useMySubscriptionsStore((s) => s.owned);
  const ownedIds = useMemo(() => new Set(owned.map((o) => o.subscriptionId)), [owned]);

  // Best-effort initial camera position from the window's own dimensions —
  // CameraController's own mount effect immediately corrects this to the
  // r3f canvas's true measured size, this just avoids an initial frame at
  // the wrong zoom before that effect runs.
  const initialAspect = typeof window !== "undefined" ? getViewportAspect() : 16 / 9;
  const initialZoom = computeFitZoom(bounds, initialAspect, 1);

  return (
    <Canvas
      className="!touch-none"
      style={{ cursor: "grab" }}
      gl={{ alpha: true, antialias: true }}
      camera={{ position: [bounds.centerX, bounds.centerY, initialZoom], fov: 45, near: 1, far: 400 }}
      dpr={[1, 3]}
    >
      <ambientLight intensity={0.7} />
      <UniverseCanvasBackground clusters={clusters} />
      <CategoryLabels clusters={clusters} />
      <SubscriptionField nodes={nodes} ownedIds={ownedIds} />
      <CameraController nodes={nodes} ownedIds={ownedIds} bounds={bounds} />
    </Canvas>
  );
}
