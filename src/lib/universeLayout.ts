import type { Subscription, UniverseNode, Vec3 } from "@/types/subscription";

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
const CATEGORY_SPACING = 9; // world units per sqrt(rank) step between category centers

/** Places every subscription within its category's cluster rather than by
 * any real-world geography — categories themselves fan out from the center
 * (golden-angle spiral, biggest category closest in) so the busiest,
 * densest part of the universe is the default view, and same-category
 * services fan out around their category's center the same way, most
 * popular closest to the middle so clusters read as organic, overlapping
 * blobs rather than a grid. */
export function buildUniverse(subs: Subscription[]): UniverseNode[] {
  const rand = mulberry32(1337);
  const byCategory = new Map<string, Subscription[]>();
  subs.forEach((s) => {
    const arr = byCategory.get(s.category) ?? [];
    arr.push(s);
    byCategory.set(s.category, arr);
  });

  const categoriesByCount = [...byCategory.entries()].sort((a, b) => b[1].length - a[1].length);

  const nodes: UniverseNode[] = [];

  categoriesByCount.forEach(([, items], catIndex) => {
    const angle = catIndex * GOLDEN_ANGLE;
    const catRadius = Math.sqrt(catIndex) * CATEGORY_SPACING;
    const centerX = Math.cos(angle) * catRadius;
    const centerY = Math.sin(angle) * catRadius;

    const sorted = items.slice().sort((a, b) => b.popularity - a.popularity);

    sorted.forEach((sub, i) => {
      const itemAngle = i * GOLDEN_ANGLE;
      const spreadRadius = Math.sqrt(i) * 1.5 + rand() * 0.5;
      const x = centerX + Math.cos(itemAngle) * spreadRadius;
      const y = centerY + Math.sin(itemAngle) * spreadRadius;
      const z = (rand() - 0.5) * 8 + 2;
      const size = 0.5 + (sub.popularity / 100) * 0.6;
      nodes.push({ subscription: sub, position: { x, y, z }, radius: size, cluster: catIndex });
    });
  });

  return nodes;
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
