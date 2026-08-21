"use client";

import { Canvas } from "@react-three/fiber";
import { useMemo } from "react";
import { UniverseCanvasBackground } from "./UniverseCanvasBackground";
import { SubscriptionField } from "./SubscriptionField";
import { CameraController, DEFAULT_ZOOM } from "./CameraController";
import { buildUniverse } from "@/lib/universeLayout";
import { SUBSCRIPTIONS } from "@/data/subscriptions";
import { useMySubscriptionsStore } from "@/store/useMySubscriptionsStore";

export function UniverseScene() {
  const nodes = useMemo(() => buildUniverse(SUBSCRIPTIONS), []);
  const owned = useMySubscriptionsStore((s) => s.owned);
  const ownedIds = useMemo(() => new Set(owned.map((o) => o.subscriptionId)), [owned]);

  return (
    <Canvas
      className="!touch-none"
      gl={{ alpha: true, antialias: true }}
      camera={{ position: [0, 0, DEFAULT_ZOOM], fov: 45, near: 1, far: 400 }}
      dpr={[1, 2]}
    >
      <ambientLight intensity={0.7} />
      <UniverseCanvasBackground />
      <SubscriptionField nodes={nodes} ownedIds={ownedIds} />
      <CameraController nodes={nodes} ownedIds={ownedIds} />
    </Canvas>
  );
}
