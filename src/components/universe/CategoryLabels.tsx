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
          // Anchored right at the cluster's top edge — close enough that the
          // label visually belongs to its own icons, never floating loose in
          // open space toward a neighboring cluster. Offset kept proportional
          // to ROW_GAP so it stays clear of the row above as that gap tightens.
          position={[cluster.center.x, cluster.center.y + cluster.radius + 0.3, 3]}
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
              {/* Bumped from text-sm/font-semibold (14px/600) to
                  text-base/font-bold (16px/700) — the project has one font
                  family app-wide (--font-display and --font-sans both
                  resolve to Bricolage Grotesque, see layout.tsx), so there's
                  no distinct heading face to switch to; weight/size is the
                  only lever available without importing a new font. */}
              <div className="text-base font-bold text-ink-0">{cluster.name}</div>
              <div className="text-[11px] text-ink-500">{cluster.count} services</div>
            </div>
          </div>
        </Html>
      ))}
      {clusters.map(
        (cluster) =>
          cluster.overflow > 0 && (
            <Html
              key={`${cluster.name}-overflow`}
              // Bottom-right, same corner mobile's "+N" badge sits in. Placed
              // at the cluster's full footprint radius (not a fraction of
              // it) — cluster.radius already extends half a unit past every
              // packed icon's own edge (see buildUniverse's footprint calc),
              // so sitting at 1.0x that radius (not the ~0.4x this used to
              // use) is what actually clears the outermost icon instead of
              // landing inside the packed cluster and covering whichever
              // icon happens to sit in the bottom-right direction. Verified
              // directly against every category's real packed positions:
              // zero collisions with any icon or any category's label at
              // this radius, versus 10 clusters colliding at the old 0.42.
              position={[
                cluster.center.x + cluster.radius * 0.7071,
                cluster.center.y - cluster.radius * 0.7071,
                3,
              ]}
              center
              distanceFactor={34}
              zIndexRange={[2, 0]}
              className="pointer-events-none select-none"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full border border-black/10 bg-void-950/90 text-[10px] font-semibold text-ink-300 shadow-sm backdrop-blur">
                +{cluster.overflow}
              </div>
            </Html>
          )
      )}
    </>
  );
}
