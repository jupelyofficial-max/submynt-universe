"use client";

import { useMemo } from "react";
import { UNIVERSE_WORLD_HEIGHT, UNIVERSE_WORLD_WIDTH } from "@/lib/universeLayout";
import { getUniverseCanvasTexture } from "./universeCanvasTexture";

export function UniverseCanvasBackground() {
  const texture = useMemo(() => getUniverseCanvasTexture(), []);

  return (
    <mesh position={[0, 0, -18]}>
      <planeGeometry args={[UNIVERSE_WORLD_WIDTH, UNIVERSE_WORLD_HEIGHT]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  );
}
