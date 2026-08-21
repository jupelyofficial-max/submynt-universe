"use client";

import { useMemo } from "react";
import * as THREE from "three";
import type { ConstellationLink } from "@/lib/universeLayout";

export function ConstellationLines({ links }: { links: ConstellationLink[] }) {
  const geometry = useMemo(() => {
    const positions = new Float32Array(links.length * 6);
    links.forEach((link, i) => {
      positions[i * 6 + 0] = link.a.x;
      positions[i * 6 + 1] = link.a.y;
      positions[i * 6 + 2] = link.a.z;
      positions[i * 6 + 3] = link.b.x;
      positions[i * 6 + 4] = link.b.y;
      positions[i * 6 + 5] = link.b.z;
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [links]);

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color="#5c5140" transparent opacity={0.16} depthWrite={false} />
    </lineSegments>
  );
}
