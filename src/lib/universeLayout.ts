import type { Subscription, UniverseNode, Vec3 } from "@/types/subscription";
import { CATEGORY_META } from "@/data/categories";

/** World-space size of the abstract universe canvas — generous enough to
 * hold every category cluster (see buildUniverse) with margin, at whatever
 * aspect the camera ends up needing to cover. */
export const UNIVERSE_WORLD_WIDTH = 120;
export const UNIVERSE_WORLD_HEIGHT = 110;

/** Deterministic PRNG so node placement is stable across renders/sessions. */
function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const GOLDEN_ANGLE = 2.399963; // radians — even fan-out around a shared origin point
const CATEGORY_SPACING = 6; // base world-unit step used while walking the packing spiral
const CLUSTER_MARGIN = 2.2; // minimum gap kept between any two cluster circles

export interface CategoryCluster {
  name: string;
  center: { x: number; y: number };
  radius: number;
  count: number;
  color: string;
}

export interface UniverseLayout {
  nodes: UniverseNode[];
  clusters: CategoryCluster[];
}

/** Rank-based icon-size tiers within a category — a hero, a handful of
 * "important" services, a supporting tier, then long-tail — so a category
 * reads as a gravitational center with major services anchoring it, rather
 * than a field of same-sized bubbles. Popularity only nudges size within a
 * tier, it never moves an item between tiers. */
function tierRadius(rankInCategory: number, popularity: number): number {
  const base =
    rankInCategory === 0 ? 1.4 : rankInCategory <= 2 ? 0.84 : rankInCategory <= 5 ? 0.58 : 0.42;
  return base * (0.92 + (popularity / 100) * 0.16);
}

interface PackedCircle {
  x: number;
  y: number;
  r: number;
}

/** Packs circles of arbitrary, uneven radii along a golden-angle spiral: each
 * new circle walks outward until it clears every circle already placed by
 * `margin`. Used at both the item level (within a category) and the category
 * level (within the whole universe) — same technique, two scales — so a much
 * bigger hero icon (or a much bigger category) simply pushes its neighbors
 * out exactly as far as it needs to, instead of a fixed radial step that
 * only works when everything is roughly the same size. */
function packCircles(radii: number[], spacing: number, margin: number): PackedCircle[] {
  const placed: PackedCircle[] = [];
  let t = 0;
  radii.forEach((r, i) => {
    if (i === 0) {
      placed.push({ x: 0, y: 0, r });
      return;
    }
    let x = 0;
    let y = 0;
    let fits = false;
    while (!fits) {
      t += 1;
      const angle = t * GOLDEN_ANGLE;
      const spiralRadius = Math.sqrt(t) * spacing;
      x = Math.cos(angle) * spiralRadius;
      y = Math.sin(angle) * spiralRadius;
      fits = placed.every((p) => Math.hypot(p.x - x, p.y - y) > p.r + r + margin);
    }
    placed.push({ x, y, r });
  });
  return placed;
}

/** Places every subscription within its category's cluster rather than by
 * any real-world geography. Within a category, items are circle-packed
 * around a shared center — the popularity-ranked hero sits dead center,
 * everything else packs outward just far enough to clear it and each other,
 * so a much bigger hero never collides with its neighbors. Category centers
 * are then circle-packed the same way at the universe scale — biggest
 * category near the middle, every category keeping its own clear territory,
 * no two constellations touching. */
export function buildUniverse(subs: Subscription[]): UniverseLayout {
  const rand = mulberry32(1337);
  const byCategory = new Map<string, Subscription[]>();
  subs.forEach((s) => {
    const arr = byCategory.get(s.category) ?? [];
    arr.push(s);
    byCategory.set(s.category, arr);
  });

  const categoriesByCount = [...byCategory.entries()]
    .map(([category, items]) => {
      const sorted = items.slice().sort((a, b) => b.popularity - a.popularity);
      const itemRadii = sorted.map((sub, i) => tierRadius(i, sub.popularity));
      const localItems = packCircles(itemRadii, 1.15, 0.28);
      const footprint = Math.max(...localItems.map((p) => Math.hypot(p.x, p.y) + p.r)) + 1.6;
      return { category, items: sorted, localItems, footprint };
    })
    .sort((a, b) => b.items.length - a.items.length);

  const packedClusters = packCircles(
    categoriesByCount.map((c) => c.footprint),
    CATEGORY_SPACING,
    CLUSTER_MARGIN
  );

  const clusters: CategoryCluster[] = [];
  const nodes: UniverseNode[] = [];

  categoriesByCount.forEach(({ category, items, localItems, footprint }, catIndex) => {
    const { x: centerX, y: centerY } = packedClusters[catIndex];

    items.forEach((sub, i) => {
      const local = localItems[i];
      const z = (rand() - 0.5) * 4 + 2;
      nodes.push({
        subscription: sub,
        position: { x: centerX + local.x, y: centerY + local.y, z },
        radius: local.r,
        cluster: catIndex,
      });
    });

    clusters.push({
      name: category,
      center: { x: centerX, y: centerY },
      radius: footprint,
      count: items.length,
      color: CATEGORY_META[category as keyof typeof CATEGORY_META]?.color ?? "#A99C87",
    });
  });

  return { nodes, clusters };
}

export interface ConstellationLink {
  a: Vec3;
  b: Vec3;
  strength: number;
}

function dist(a: Vec3, b: Vec3) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2);
}

/** Faint links between nearby nodes within the same category cluster. */
export function buildConstellationLinks(
  nodes: UniverseNode[],
  maxPerNode = 2,
  maxDistance = 7
): ConstellationLink[] {
  const links: ConstellationLink[] = [];
  const byCluster = new Map<number, UniverseNode[]>();
  nodes.forEach((n) => {
    const arr = byCluster.get(n.cluster) ?? [];
    arr.push(n);
    byCluster.set(n.cluster, arr);
  });

  byCluster.forEach((group) => {
    group.forEach((node, i) => {
      const nearest = group
        .map((other, j) => ({ other, j, d: dist(node.position, other.position) }))
        .filter((x) => x.j !== i && x.d < maxDistance && x.j > i)
        .sort((a, b) => a.d - b.d)
        .slice(0, maxPerNode);
      nearest.forEach(({ other, d }) => {
        links.push({ a: node.position, b: other.position, strength: 1 - d / maxDistance });
      });
    });
  });

  return links;
}
