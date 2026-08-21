"use client";

import { useMemo } from "react";
import { WORLD_MAP_WORLD_HEIGHT, WORLD_MAP_WORLD_WIDTH } from "@/lib/geo";
import { getWorldMapTexture } from "./worldMapTexture";

export function WorldMapBackground() {
  const texture = useMemo(() => getWorldMapTexture(), []);

  return (
    <mesh position={[0, 0, -18]}>
      <planeGeometry args={[WORLD_MAP_WORLD_WIDTH, WORLD_MAP_WORLD_HEIGHT]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  );
}
