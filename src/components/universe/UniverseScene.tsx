"use client";

import { Canvas } from "@react-three/fiber";
import { useMemo } from "react";
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

export function UniverseScene() {
  const isDesktop = useIsDesktop();
  const columns = isDesktop ? undefined : TABLET_GRID_COLUMNS;
  const { nodes, clusters } = useMemo(() => buildUniverse(SUBSCRIPTIONS, columns), [columns]);
  const bounds = useMemo(() => computeUniverseBounds(clusters), [clusters]);
  const owned = useMySubscriptionsStore((s) => s.owned);
  const ownedIds = useMemo(() => new Set(owned.map((o) => o.subscriptionId)), [owned]);

  // Best-effort initial camera position from the window's own dimensions —
  // CameraController's own mount effect immediately corrects this to the
  // r3f canvas's true measured size, this just avoids an initial frame at
  // the wrong zoom before that effect runs.
  const initialAspect =
    typeof window !== "undefined" ? window.innerWidth / Math.max(1, window.innerHeight - 64) : 16 / 9;
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
