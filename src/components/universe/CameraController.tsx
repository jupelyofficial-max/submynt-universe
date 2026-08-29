"use client";

import { useFrame } from "@react-three/fiber";
import type { RefObject } from "react";

// Exported so UniverseScene's own width/distance math (see
// UniverseScene.tsx's computeDistance) uses the exact same FOV the camera
// actually renders with, instead of duplicating/guessing it — the two need
// to agree exactly or the layout targets the wrong scale.
export const CAMERA_FOV_DEG = 45;

interface Props {
  /** Fixed camera X (world units) — doesn't change; columns are already
   * spread to fill the available width, so there's nothing to pan to. */
  cameraX: number;
  /** Fixed camera distance (world units) — the Universe is no longer
   * fit-to-viewport (that compressed all rows into one screen); zoom is
   * instead derived once from the composition's WIDTH alone (see
   * UniverseScene's computeDistance), so it stays constant regardless of
   * row count — height is simply whatever it naturally is, scrolled into
   * view rather than squeezed to fit. */
  cameraZ: number;
  /** Current camera Y (world units), kept in sync with the page's own
   * scroll position by UniverseScene's scroll listener — reading it here
   * every frame is what makes "scroll down to see more rows" work, without
   * the camera itself needing any drag/wheel/pinch interaction of its own. */
  scrollWorldYRef: RefObject<number>;
}

export function CameraController({ cameraX, cameraZ, scrollWorldYRef }: Props) {
  // react-three-fiber's canonical pattern: useFrame runs in the render-loop,
  // outside React's render phase, so imperatively mutating three.js objects
  // here (rather than triggering re-renders) is the framework-recommended
  // approach, not a purity violation.
  useFrame(({ camera }) => {
    const y = scrollWorldYRef.current;
    camera.position.set(cameraX, y, cameraZ);
    camera.lookAt(cameraX, y, 0);
  });

  return null;
}
