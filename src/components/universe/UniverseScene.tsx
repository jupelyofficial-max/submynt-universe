"use client";

import { Canvas } from "@react-three/fiber";
import { useMemo, useSyncExternalStore } from "react";
import { UniverseCanvasBackground } from "./UniverseCanvasBackground";
import { SubscriptionField } from "./SubscriptionField";
import { CategoryLabels } from "./CategoryLabels";
import { CameraController, computeFitZoom } from "./CameraController";
import { buildUniverse, computeUniverseBounds } from "@/lib/universeLayout";
import { SUBSCRIPTIONS } from "@/data/subscriptions";
import { useMySubscriptionsStore } from "@/store/useMySubscriptionsStore";
import { useIsDesktop } from "@/hooks/useMediaQuery";

// The Universe grid is 4 columns wide at desktop (>=1024px, matching
// useIsDesktop) and 3 columns in the narrower tablet band above the
// dedicated MobileUniverse breakpoint (768–1023px) — same breakpoint-driven
// column-count idea the mobile Universe already uses, just a different
// column count for a wider, still-desktop viewport.
const TABLET_GRID_COLUMNS = 3;

// Never spread columns apart enough to make the grid feel disconnected —
// this is a cap on how far computeColumnSpread (below) is allowed to
// stretch things at very wide/ultra-wide viewports.
const MAX_COLUMN_SPREAD = 2.0;

function getViewportAspect() {
  return window.innerWidth / Math.max(1, window.innerHeight - 64);
}

// EcosystemStats/"Get Free Subscriptions" (bottom-left) and LiveInsights
// "Top 5" (top-right) are fixed screen overlays that appear starting at the
// same >=1024px breakpoint the grid reaches its full column count at (see
// ExploreClient's `lg:` gating) — roughly their combined width plus margin.
// Subtracted from the viewport width used to TARGET the column spread below
// (not from the camera's own fit, which already accounts for these via
// FIT_PADDING/reserves) so widening the grid to use available space never
// pushes a column back underneath either of them.
const SIDE_OVERLAY_RESERVE_PX = 620;

function getSpreadTargetAspect() {
  const width = window.innerWidth;
  const height = Math.max(1, window.innerHeight - 64);
  const reserve = width >= 1024 ? SIDE_OVERLAY_RESERVE_PX : 0;
  return Math.max(1, width - reserve) / height;
}

/** Live viewport aspect ratio, adjusted for the fixed corner overlays'
 * pixel footprint (see getSpreadTargetAspect) — reactive to resize, so the
 * column spread below stays matched to the actual window instead of only
 * the size at mount. */
function useSpreadTargetAspect(): number {
  return useSyncExternalStore(
    (callback) => {
      window.addEventListener("resize", callback);
      return () => window.removeEventListener("resize", callback);
    },
    getSpreadTargetAspect,
    () => 16 / 9
  );
}

/** computeFitZoom's camera fit is bound by height at essentially every
 * realistic desktop aspect ratio (the packed composition's own aspect is
 * close to square, viewports are landscape) — so without this, extra
 * viewport width beyond what height needs just becomes unused margin, and
 * that margin grows with viewport width. This computes how much to spread
 * the grid's column centers apart (via buildUniverse's columnSpread) so the
 * composition's own width matches the live viewport's aspect ratio instead,
 * using the available width rather than leaving it empty. Never spreads
 * below 1 (natural packed width) — only ever widens. */
function computeColumnSpread(naturalWidth: number, naturalHeight: number, viewportAspect: number): number {
  if (naturalWidth <= 0) return 1;
  const spread = (naturalHeight * viewportAspect) / naturalWidth;
  return Math.min(MAX_COLUMN_SPREAD, Math.max(1, spread));
}

export function UniverseScene() {
  const isDesktop = useIsDesktop();
  const columns = isDesktop ? undefined : TABLET_GRID_COLUMNS;
  const viewportAspect = useSpreadTargetAspect();

  // First pass at the natural (unspread) packed size, purely to measure it —
  // cheap given the catalogue's size (124 subscriptions, 16 categories).
  const naturalClusters = useMemo(() => buildUniverse(SUBSCRIPTIONS, columns).clusters, [columns]);
  const naturalBounds = useMemo(() => computeUniverseBounds(naturalClusters), [naturalClusters]);
  const columnSpread = useMemo(
    () => computeColumnSpread(naturalBounds.width, naturalBounds.height, viewportAspect),
    [naturalBounds.width, naturalBounds.height, viewportAspect]
  );

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
