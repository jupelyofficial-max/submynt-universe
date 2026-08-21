import { COUNTRY_COORDS, projectLatLngToWorld } from "@/lib/geo";
import type { Subscription, UniverseNode, Vec3 } from "@/types/subscription";

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

/** Places every subscription at its origin country's coordinates on the world
 * map, fanning same-country services out around that point (golden-angle
 * spiral, most popular closest to the exact coordinate) so they don't stack. */
export function buildUniverse(subs: Subscription[]): UniverseNode[] {
  const rand = mulberry32(1337);
  const byCountry = new Map<string, Subscription[]>();
  subs.forEach((s) => {
    const arr = byCountry.get(s.originCountry) ?? [];
    arr.push(s);
    byCountry.set(s.originCountry, arr);
  });

  const nodes: UniverseNode[] = [];
  let clusterIndex = 0;

  byCountry.forEach((items, country) => {
    const coord = COUNTRY_COORDS[country];
    if (!coord) return;
    const center = projectLatLngToWorld(coord);
    const sorted = items.slice().sort((a, b) => b.popularity - a.popularity);

    sorted.forEach((sub, i) => {
      const angle = i * GOLDEN_ANGLE;
      const spreadRadius = Math.sqrt(i) * 1.5 + rand() * 0.5;
      const x = center.x + Math.cos(angle) * spreadRadius;
      const y = center.y + Math.sin(angle) * spreadRadius;
      const z = (rand() - 0.5) * 8 + 2;
      const size = 0.5 + (sub.popularity / 100) * 0.6;
      nodes.push({ subscription: sub, position: { x, y, z }, radius: size, cluster: clusterIndex });
    });

    clusterIndex += 1;
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

/** Faint links between nearby nodes within the same origin-country cluster. */
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
