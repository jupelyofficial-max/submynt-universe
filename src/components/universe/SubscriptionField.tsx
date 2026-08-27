"use client";

import { Html } from "@react-three/drei";
import type { UniverseNode } from "@/types/subscription";
import { SubscriptionNode } from "./SubscriptionNode";
import { matchesFilters, matchesSearch } from "@/lib/filterSubscriptions";
import { potentialSavingsMonthly } from "@/data/subscriptions";
import { useUniverseStore } from "@/store/useUniverseStore";
import { formatINR } from "@/lib/utils";

interface Props {
  nodes: UniverseNode[];
  ownedIds: Set<string>;
}

export function SubscriptionField({ nodes, ownedIds }: Props) {
  const searchQuery = useUniverseStore((s) => s.searchQuery);
  const filters = useUniverseStore((s) => s.filters);
  const hoveredId = useUniverseStore((s) => s.hoveredId);
  const hoveredCategory = useUniverseStore((s) => s.hoveredCategory);

  const hasQuery = searchQuery.trim().length > 0;
  const hasFilters =
    filters.categories.length +
      filters.billing.length +
      filters.priceBands.length +
      filters.userStatus.length +
      filters.regions.length >
    0;

  const hoveredNode = hoveredId ? nodes.find((n) => n.subscription.id === hoveredId) : null;

  return (
    <group>
      {nodes.map((node) => {
        const owned = ownedIds.has(node.subscription.id);
        const matches =
          (!hasQuery || matchesSearch(node.subscription, searchQuery)) &&
          (!hasFilters || matchesFilters(node.subscription, filters, ownedIds));
        const dimmed = (hasQuery || hasFilters) && !matches;
        const categoryDimmed = Boolean(hoveredCategory) && node.subscription.category !== hoveredCategory;
        const hasSavings = owned && potentialSavingsMonthly(node.subscription) > 0;
        return (
          <SubscriptionNode
            key={node.subscription.id}
            node={node}
            isOwned={owned}
            dimmed={dimmed}
            categoryDimmed={categoryDimmed}
            hasSavings={hasSavings}
          />
        );
      })}
      {hoveredNode && (
        <Html
          position={[hoveredNode.position.x, hoveredNode.position.y + hoveredNode.radius * 2.4 + 1.4, hoveredNode.position.z]}
          center
          distanceFactor={30}
          zIndexRange={[20, 0]}
        >
          <div className="pointer-events-none whitespace-nowrap rounded-xl glass-panel px-3 py-1.5 text-center shadow-xl">
            <div className="text-xs font-semibold text-ink-0">{hoveredNode.subscription.name}</div>
            <div className="text-[11px] text-nebula-400">
              {formatINR(hoveredNode.subscription.priceMonthly)}
              {hoveredNode.subscription.priceMonthly > 0 ? "/mo" : ""}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}
