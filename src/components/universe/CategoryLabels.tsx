"use client";

import { Html } from "@react-three/drei";
import type { CategoryCluster } from "@/lib/universeLayout";

export function CategoryLabels({ clusters }: { clusters: CategoryCluster[] }) {
  return (
    <>
      {clusters.map((cluster) => (
        <Html
          key={cluster.name}
          position={[cluster.center.x - cluster.radius * 0.35, cluster.center.y + cluster.radius * 0.95, 3]}
          distanceFactor={34}
          zIndexRange={[3, 0]}
          className="pointer-events-none select-none"
        >
          <div className="pointer-events-none flex items-center gap-1.5 whitespace-nowrap">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: cluster.color }} />
            <div>
              <div className="text-sm font-semibold text-ink-0">{cluster.name}</div>
              <div className="text-[11px] text-ink-500">{cluster.count} services</div>
            </div>
          </div>
        </Html>
      ))}
    </>
  );
}
