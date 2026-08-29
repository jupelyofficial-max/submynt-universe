"use client";

import { Canvas } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { UniverseCanvasBackground } from "./UniverseCanvasBackground";
import { SubscriptionField } from "./SubscriptionField";
import { CategoryLabels } from "./CategoryLabels";
import { CameraController, CAMERA_FOV_DEG } from "./CameraController";
import { buildUniverse, computeUniverseBounds } from "@/lib/universeLayout";
import { SUBSCRIPTIONS } from "@/data/subscriptions";
import { useMySubscriptionsStore } from "@/store/useMySubscriptionsStore";
import { useUniverseStore } from "@/store/useUniverseStore";
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

// EcosystemStats/"Get Free Subscriptions" (bottom-left) is the ONE overlay
// still absolutely positioned on top of the canvas (see ExploreClient) — the
// Top 5 panel and Sponsored bar now get real, dedicated layout space instead
// (a sibling column and a sibling footer row respectively — see
// ExploreClient), so the canvas itself never extends underneath them at
// all, at any scroll position; there's nothing left for camera math to keep
// clear of on those two. Measured directly from the live DOM
// (getBoundingClientRect): the left stack (promo button + stats card, both
// `w-60`-capped) is 211px wide + 24px margin = 235px, plus a small buffer
// for breathing room, not zero-clearance. Only applies at the `lg` (isDesktop)
// breakpoint the CTA stack itself appears at.
const CTA_OVERLAY_RESERVE_PX = 235 + 30;

// How much of the container width the Universe should aim to fill — set
// deliberately higher than what's actually reachable once the overlay
// reserve above is subtracted, so the reserve (not this target) is what
// ends up binding at every desktop width, and the composition always reads
// as "as large as safely possible" rather than an arbitrarily-chosen
// percentage.
const TARGET_WIDTH_FILL = 0.85;

// Small cosmetic gap below the last row — purely breathing room now that
// the SponsoredStrip footer is a real sibling row below the canvas (not an
// overlay on top of it), so there's no overlap left to scroll clear of.
const BOTTOM_SCROLL_PADDING_PX = 24;

// World-unit clearance added above row 1's own computed top edge — verified
// necessary: without it, row 1 measured as rendering ~38px behind/above the
// header (drei Html labels project a little higher than the bare frustum
// math for boundsMaxY implies). Small and empirically checked, not derived.
const TOP_SAFETY_MARGIN = 2.0;

/** Measures the actual rendered size of `ref`'s element via ResizeObserver,
 * rather than reading `window.innerWidth`/`innerHeight` — the canvas no
 * longer spans the full browser viewport (it now sits beside the Top 5
 * column and above the Sponsored footer, both real layout siblings, see
 * ExploreClient), so window size and this container's own size are
 * different numbers. Measuring the container directly also means the
 * header's height no longer needs a hand-kept pixel constant to subtract —
 * this element is already laid out below it. */
function useContainerSize(ref: RefObject<HTMLElement | null>): { width: number; height: number } {
  const [size, setSize] = useState({ width: 1440, height: 900 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    function measure() {
      const rect = el!.getBoundingClientRect();
      setSize((prev) => (prev.width === rect.width && prev.height === rect.height ? prev : { width: rect.width, height: rect.height }));
    }
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return size;
}

/** How much world-width is visible across the full viewport at a given
 * camera distance/aspect — the shared building block behind the column
 * spread below. */
function visibleWorldWidthAt(distance: number, viewportWidthPx: number, viewportHeightPx: number): number {
  const fovRad = (CAMERA_FOV_DEG * Math.PI) / 180;
  const aspect = viewportWidthPx / viewportHeightPx;
  return 2 * distance * Math.tan(fovRad / 2) * aspect;
}

/** The camera's fixed distance, chosen so the NATURAL (unspread) width
 * takes up NATURAL_FILL_OF_TARGET of the reserve-capped target width —
 * deliberately less than 100%, leaving headroom for computeColumnSpread
 * (below) to widen the grid toward the target without the picture
 * requiring an ever-changing distance to do it. This is the piece that was
 * missing in an earlier pass: distance was picked to fill the FULL
 * viewport, which left no headroom for the side reserve at all — even
 * with zero spread applied, natural-width content already reached into
 * the Top 5 panel / promo card zones. */
const NATURAL_FILL_OF_TARGET = 0.95;

function computeDistance(naturalWidth: number, viewportWidthPx: number, viewportHeightPx: number, hasCtaOverlay: boolean): number {
  const reservePx = hasCtaOverlay ? CTA_OVERLAY_RESERVE_PX : 0;
  const targetWidthPx = Math.min(TARGET_WIDTH_FILL * viewportWidthPx, viewportWidthPx - reservePx);
  const desiredNaturalWidthPx = Math.max(1, targetWidthPx * NATURAL_FILL_OF_TARGET);
  const pixelsPerWorldUnitTarget = desiredNaturalWidthPx / naturalWidth;
  const visibleWorldWidthTarget = viewportWidthPx / pixelsPerWorldUnitTarget;
  const fovRad = (CAMERA_FOV_DEG * Math.PI) / 180;
  const aspect = viewportWidthPx / viewportHeightPx;
  return visibleWorldWidthTarget / (2 * Math.tan(fovRad / 2) * aspect);
}

/** Spreads category columns apart (via buildUniverse's columnSpread) to
 * fill TARGET_WIDTH_FILL of the container at the given (already
 * reserve-aware) camera distance, capped by the real CTA overlay reserve in
 * pixels so widening the grid never pushes a column back underneath the
 * promo cards. `widthAtSpread` finds the exact spread via binary search
 * rather than dividing target-width by natural-width directly: columnSpread
 * only scales each cluster's *center* offset, not its own radius, so the
 * resulting bounds.width is a bit short of a naive linear estimate. */
function computeColumnSpread(
  naturalWidth: number,
  distance: number,
  viewportWidthPx: number,
  viewportHeightPx: number,
  hasCtaOverlay: boolean,
  widthAtSpread: (spread: number) => number
): number {
  if (naturalWidth <= 0) return 1;
  const visibleWorldWidth = visibleWorldWidthAt(distance, viewportWidthPx, viewportHeightPx);
  const reservePx = hasCtaOverlay ? CTA_OVERLAY_RESERVE_PX : 0;
  const targetWidthPx = Math.min(TARGET_WIDTH_FILL * viewportWidthPx, viewportWidthPx - reservePx);
  const targetWorldWidth = (Math.max(0, targetWidthPx) / viewportWidthPx) * visibleWorldWidth;

  if (targetWorldWidth <= naturalWidth) return 1;
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
  // Declared here (not down by the scroll-sync effects below) because the
  // camera/layout math above needs the container's real measured size —
  // this ref is what useContainerSize observes.
  const scrollRef = useRef<HTMLDivElement>(null);
  const viewport = useContainerSize(scrollRef);
  const viewportHeightPx = Math.max(1, viewport.height);

  // First pass at the natural (unspread) packed size, purely to measure it —
  // cheap given the catalogue's size (124 subscriptions, 16 categories).
  const naturalClusters = useMemo(() => buildUniverse(SUBSCRIPTIONS, columns).clusters, [columns]);
  const naturalBounds = useMemo(() => computeUniverseBounds(naturalClusters), [naturalClusters]);

  // The camera's zoom is driven by WIDTH alone — never by the composition's
  // total height — which is the actual fix here: fitting height is exactly
  // what compressed 16 categories into one screen no matter how tight the
  // row spacing was tuned (verified in a previous pass: with height bound,
  // on-screen row spacing reduces to viewportHeight/rowCount, independent
  // of world-space spacing entirely). A width-only fit has no such
  // row-count dependency, so icon size stays constant regardless of how
  // many rows exist, and the composition is simply as tall as it is —
  // scrolled into view rather than squeezed to fit.
  //
  // Distance is computed ONCE, directly, from the natural (unspread) width
  // with NATURAL_FILL_OF_TARGET headroom built in (see computeDistance) —
  // deliberately not from the post-spread width, so it doesn't need a
  // second pass: spread only ever widens the composition toward the same
  // reserve-capped target this distance was already calibrated against.
  const distance = useMemo(
    () => computeDistance(naturalBounds.width, viewport.width, viewportHeightPx, isDesktop),
    [naturalBounds.width, viewport.width, viewportHeightPx, isDesktop]
  );

  const columnSpread = useMemo(() => {
    const widthAtSpread = (spread: number) => computeUniverseBounds(buildUniverse(SUBSCRIPTIONS, columns, spread).clusters).width;
    return computeColumnSpread(naturalBounds.width, distance, viewport.width, viewportHeightPx, isDesktop, widthAtSpread);
  }, [naturalBounds.width, distance, viewport.width, viewportHeightPx, isDesktop, columns]);

  const { nodes, clusters } = useMemo(
    () => buildUniverse(SUBSCRIPTIONS, columns, columnSpread),
    [columns, columnSpread]
  );
  const bounds = useMemo(() => computeUniverseBounds(clusters), [clusters]);
  const owned = useMySubscriptionsStore((s) => s.owned);
  const ownedIds = useMemo(() => new Set(owned.map((o) => o.subscriptionId)), [owned]);

  // Pixels-per-world-unit at the fixed distance — the single conversion
  // factor tying DOM scroll position to world-space Y, in both directions.
  const pixelsPerWorldUnit = useMemo(() => {
    const fovRad = (CAMERA_FOV_DEG * Math.PI) / 180;
    const visibleWorldHeight = 2 * distance * Math.tan(fovRad / 2);
    return viewportHeightPx / visibleWorldHeight;
  }, [distance, viewportHeightPx]);

  // World Y the camera looks at when scrollTop is 0 — the top of the
  // composition (including its label reserve), so row 1 is fully visible
  // without any initial scroll. UniverseBounds only carries center/height,
  // so the top edge is centerY + height/2. TOP_SAFETY_MARGIN adds real,
  // verified clearance beyond the bare math: row 1 measured as rendering
  // partially behind the header without it (a small, consistent
  // discrepancy between the computed frustum edge and where drei's Html
  // labels actually project on screen).
  const boundsMaxY = bounds.centerY + bounds.height / 2;
  const initialCameraY = boundsMaxY + TOP_SAFETY_MARGIN - viewportHeightPx / 2 / pixelsPerWorldUnit;

  const spacerHeightPx = bounds.height * pixelsPerWorldUnit + BOTTOM_SCROLL_PADDING_PX;

  const scrollWorldYRef = useRef(initialCameraY);

  // Keeps the camera's world-Y in step with the container's own scroll
  // position — this, not any drag/wheel handler on the canvas itself, is
  // what makes "scroll down to see more rows" work. Runs on every native
  // scroll event (user-driven or from a programmatic smooth-scroll below),
  // so CameraController just has to read the ref each frame. Also re-syncs
  // immediately whenever the scale itself changes (viewport resize), so a
  // resize never leaves the ref computed against a stale pixelsPerWorldUnit
  // until the next scroll event happens to fire.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    function sync() {
      scrollWorldYRef.current = initialCameraY - el!.scrollTop / pixelsPerWorldUnit;
    }
    sync();
    el.addEventListener("scroll", sync, { passive: true });
    return () => el.removeEventListener("scroll", sync);
  }, [initialCameraY, pixelsPerWorldUnit]);

  // "reset"/"focus-node"/"focus-mine" now scroll the container to the
  // target's position instead of moving a pannable camera — the camera
  // itself has no interactive pan/zoom left (see CameraController).
  const cameraCommand = useUniverseStore((s) => s.cameraCommand);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !cameraCommand) return;
    function scrollToWorldY(targetY: number) {
      const top = (initialCameraY - targetY) * pixelsPerWorldUnit;
      el!.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    }
    switch (cameraCommand.type) {
      case "reset":
        el.scrollTo({ top: 0, behavior: "smooth" });
        break;
      case "focus-node": {
        const node = nodes.find((n) => n.subscription.id === cameraCommand.id);
        if (node) scrollToWorldY(node.position.y);
        break;
      }
      case "focus-mine": {
        const mine = nodes.filter((n) => ownedIds.has(n.subscription.id));
        if (mine.length) {
          const cy = mine.reduce((sum, n) => sum + n.position.y, 0) / mine.length;
          scrollToWorldY(cy);
        }
        break;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraCommand?.nonce]);

  return (
    <div ref={scrollRef} className="relative flex-1 min-h-0 overflow-y-auto no-scrollbar">
      <div style={{ height: spacerHeightPx, position: "relative" }}>
        <div className="sticky top-0" style={{ height: viewportHeightPx }}>
          <Canvas
            className="!touch-none"
            gl={{ alpha: true, antialias: true }}
            camera={{ position: [bounds.centerX, initialCameraY, distance], fov: CAMERA_FOV_DEG, near: 1, far: 400 }}
            dpr={[1, 3]}
          >
            <ambientLight intensity={0.7} />
            <UniverseCanvasBackground clusters={clusters} />
            <CategoryLabels clusters={clusters} />
            <SubscriptionField nodes={nodes} ownedIds={ownedIds} />
            <CameraController cameraX={bounds.centerX} cameraZ={distance} scrollWorldYRef={scrollWorldYRef} />
          </Canvas>
        </div>
      </div>
    </div>
  );
}
