"use client";

import { Html } from "@react-three/drei";
import type { CategoryCluster } from "@/lib/universeLayout";
import { useUniverseStore } from "@/store/useUniverseStore";

export function CategoryLabels({ clusters }: { clusters: CategoryCluster[] }) {
  const hoveredCategory = useUniverseStore((s) => s.hoveredCategory);
  const setHoveredCategory = useUniverseStore((s) => s.setHoveredCategory);

  return (
    <>
      {clusters.map((cluster) => (
        <Html
          key={cluster.name}
          // Anchored just above the cluster's top edge so it never sits over
          // the icons themselves, however the constellation is packed.
          position={[cluster.center.x, cluster.center.y + cluster.radius + 1, 3]}
          center
          distanceFactor={34}
          zIndexRange={[3, 0]}
          className="select-none"
        >
          <div
            onPointerEnter={() => setHoveredCategory(cluster.name)}
            onPointerLeave={() => setHoveredCategory(null)}
            className="flex cursor-default items-center gap-1.5 whitespace-nowrap transition-opacity"
            style={{ opacity: hoveredCategory && hoveredCategory !== cluster.name ? 0.55 : 1 }}
          >
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
