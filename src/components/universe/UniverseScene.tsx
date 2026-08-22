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

export function UniverseScene() {
  const { nodes, clusters } = useMemo(() => buildUniverse(SUBSCRIPTIONS), []);
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
      gl={{ alpha: true, antialias: true }}
      camera={{ position: [bounds.centerX, bounds.centerY, initialZoom], fov: 45, near: 1, far: 400 }}
      dpr={[1, 2]}
    >
      <ambientLight intensity={0.7} />
      <UniverseCanvasBackground clusters={clusters} />
      <CategoryLabels clusters={clusters} />
      <SubscriptionField nodes={nodes} ownedIds={ownedIds} />
      <CameraController nodes={nodes} ownedIds={ownedIds} bounds={bounds} />
    </Canvas>
  );
}
