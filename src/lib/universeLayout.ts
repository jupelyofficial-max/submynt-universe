import type { Subscription, UniverseNode } from "@/types/subscription";
import { CATEGORY_META } from "@/data/categories";

/** World-space size of the abstract universe canvas. Kept generous relative
 * to the packed composition's own extent — not to leave empty space at the
 * default view (that's computeFitZoom's job, driven by the real bounds), but
 * so the zoom-OUT ceiling (computeMaxZoom) sits well above the default,
 * leaving room to scroll out and see the whole universe instead of the
 * ceiling clamping almost immediately against the default framing. Wider
 * than tall to match the row-based composition below (see packCategoryRows). */
export const UNIVERSE_WORLD_WIDTH = 130;
export const UNIVERSE_WORLD_HEIGHT = 78;

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

const GOLDEN_ANGLE = 2.399963; // radians — even fan-out around a shared origin point, used for item-level packing within a category
const ROW_GAP = 0.5; // gap kept between category footprints, both across a row and between rows — leaves room for the "+N" overflow badge near each cluster's edge without it reaching the row below's label
// Caps how many icons a category actually renders — a dominant primary plus
// up to this many total reads as one clear hero + a curated set, matching
// the mobile Universe's own cap; anything past it collapses into a "+N"
// badge instead of crowding the cluster with same-ish small icons.
const DISPLAY_CAP = 9;
// A browser viewport reads roughly this wide relative to its height — the
// row layout below picks whatever row count makes the composition's own
// intrinsic width:height ratio land near this, so the categories spread
// across the screen's width instead of stacking into a tall column.
const TARGET_ROW_ASPECT = 1.85;

export interface CategoryCluster {
  name: string;
  center: { x: number; y: number };
  radius: number;
  count: number;
  color: string;
  /** Subscriptions in this category beyond the ones actually rendered (see
   * DISPLAY_CAP in buildUniverse) — shown as a "+N" badge near the cluster,
   * same pattern as the mobile Universe's per-card overflow indicator. */
  overflow: number;
}

export interface UniverseLayout {
  nodes: UniverseNode[];
  clusters: CategoryCluster[];
}

export interface UniverseBounds {
  centerX: number;
  centerY: number;
  width: number;
  height: number;
}

// CategoryLabels sits this far above each cluster's own icon footprint
// (0.3 offset + the label text block's own height) — computeUniverseBounds
// has to reserve this on the top edge too, or a tight FIT_PADDING has no
// slack left to absorb it and the top row's labels clip against the header.
const LABEL_RESERVE = 1.4;

/** Bounding box of the whole packed composition — the union of every
 * category cluster's circle (center ± its own radius, plus LABEL_RESERVE on
 * top for the floating category label). Used to fit the camera to the
 * actual content instead of a fixed zoom constant, so the default view
 * always shows the complete universe — including every label — regardless
 * of how many categories/subscriptions the catalogue ends up with. */
export function computeUniverseBounds(clusters: CategoryCluster[]): UniverseBounds {
  if (clusters.length === 0) return { centerX: 0, centerY: 0, width: 1, height: 1 };
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const c of clusters) {
    minX = Math.min(minX, c.center.x - c.radius);
    maxX = Math.max(maxX, c.center.x + c.radius);
    minY = Math.min(minY, c.center.y - c.radius);
    maxY = Math.max(maxY, c.center.y + c.radius + LABEL_RESERVE);
  }
  return {
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/** Rank-based icon-size tiers within a category — a primary anchor, a
 * handful of secondary services, then a supporting tier — so a category
 * reads as a gravitational center with its major service anchoring it,
 * rather than a field of same-sized icons. This is the LAYOUT radius: it
 * drives spacing/packing/composition only, and is deliberately left
 * unchanged by icon-only visual passes (see renderTierRadius below) so
 * retuning how big icons look on screen never reflows category positions. */
function tierRadius(rankInCategory: number, popularity: number): number {
  const base =
    rankInCategory === 0 ? 0.98 : rankInCategory <= 2 ? 0.74 : rankInCategory <= 5 ? 0.56 : 0.42;
  return base * (0.94 + (popularity / 100) * 0.12);
}

/** The RENDER radius — what actually determines each icon's on-screen size
 * (see SubscriptionNode's baseScale) — kept separate from the layout radius
 * above so retuning how big icons look is a purely visual change with zero
 * effect on cluster composition. Three tiers, as large as the layout's own
 * packing margins safely allow without icons touching: a Primary anchor per
 * category, a Secondary tier for its next few services, and a Supporting
 * tier for the rest — so even the busiest category's anchor (e.g. Netflix,
 * YouTube) reads as prominent without dominating the frame. Popularity only
 * nudges size within a tier, it never moves an item between tiers. */
function renderTierRadius(rankInCategory: number, popularity: number): number {
  const base = rankInCategory === 0 ? 1.0 : rankInCategory <= 2 ? 0.76 : 0.48;
  return base * (0.95 + (popularity / 100) * 0.1);
}

export interface PackedCircle {
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
export function packCircles(radii: number[], spacing: number, margin: number): PackedCircle[] {
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

interface RowBin<T> {
  items: T[];
  width: number;
}

/** Arranges category footprints into a compact, horizontally-balanced grid
 * of rows instead of a circular spiral — a spiral spreads roughly equally in
 * every direction, which on a wide browser viewport leaves the composition
 * needlessly tall (lots of unused width, categories stacking from the top
 * of the screen to the bottom). A shelf layout fixes that at the source.
 *
 * Row count is chosen dynamically: it tries every plausible row count and
 * keeps whichever one makes the composition's own width:height ratio land
 * closest to TARGET_ROW_ASPECT, so it stays balanced regardless of how many
 * categories the catalogue has. Within that row count, categories are
 * distributed with a longest-first greedy balance (each category goes into
 * whichever row is currently narrowest) rather than filled row-by-row, so
 * every row ends up a similar width instead of a sparse, lopsided last row —
 * and each row itself is then sorted largest-to-smallest, left to right, so
 * every category still reads by size within its row. */
function packCategoryRows<T extends { footprint: number }>(
  categories: T[],
  targetAspect: number,
  gap: number
): RowBin<T>[] {
  const bySize = categories.slice().sort((a, b) => b.footprint - a.footprint);
  const maxRows = Math.max(1, Math.min(categories.length, 6));

  let best: RowBin<T>[] = [{ items: bySize, width: 0 }];
  let bestDiff = Infinity;

  for (let numRows = 1; numRows <= maxRows; numRows++) {
    const rows: RowBin<T>[] = Array.from({ length: numRows }, () => ({ items: [], width: 0 }));
    for (const cat of bySize) {
      const span = cat.footprint * 2 + gap;
      const narrowest = rows.reduce((min, r) => (r.width < min.width ? r : min), rows[0]);
      narrowest.items.push(cat);
      narrowest.width += span;
    }
    const rowHeights = rows.map((r) => Math.max(...r.items.map((c) => c.footprint)) * 2 + gap);
    const totalHeight = rowHeights.reduce((sum, h) => sum + h, 0);
    const totalWidth = Math.max(...rows.map((r) => r.width - gap));
    const diff = Math.abs(totalWidth / totalHeight - targetAspect);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = rows;
    }
  }

  best.forEach((row) => row.items.sort((a, b) => b.footprint - a.footprint));
  return best;
}

/** Lays out rows returned by packCategoryRows into world positions, stacked
 * top to bottom and centered as a whole, each row itself centered
 * horizontally so shorter rows don't hug the left edge. */
function positionCategoryRows<T extends { category: string; footprint: number }>(
  rows: RowBin<T>[],
  gap: number
): Map<string, { x: number; y: number }> {
  const rowHeights = rows.map((r) => Math.max(...r.items.map((c) => c.footprint)) * 2 + gap);
  const totalHeight = rowHeights.reduce((sum, h) => sum + h, 0);

  const positions = new Map<string, { x: number; y: number }>();
  let y = totalHeight / 2;
  rows.forEach((row, i) => {
    y -= rowHeights[i] / 2;
    const rowWidth = row.items.reduce((sum, c) => sum + c.footprint * 2 + gap, 0) - gap;
    let x = -rowWidth / 2;
    row.items.forEach((c) => {
      x += c.footprint;
      positions.set(c.category, { x, y });
      x += c.footprint + gap;
    });
    y -= rowHeights[i] / 2;
  });
  return positions;
}

/** Places every subscription within its category's cluster rather than by
 * any real-world geography. Within a category, items are circle-packed
 * around a shared center — the popularity-ranked hero sits dead center,
 * everything else packs outward just far enough to clear it and each other,
 * so a much bigger hero never collides with its neighbors. Category centers
 * are then arranged into a compact, horizontally-balanced row grid (see
 * packCategoryRows) so the whole composition spreads across the viewport's
 * width instead of stretching from top to bottom. */
export function buildUniverse(subs: Subscription[]): UniverseLayout {
  const rand = mulberry32(1337);
  const byCategory = new Map<string, Subscription[]>();
  subs.forEach((s) => {
    const arr = byCategory.get(s.category) ?? [];
    arr.push(s);
    byCategory.set(s.category, arr);
  });

  const categoriesByCount = [...byCategory.entries()].map(([category, items]) => {
    const sorted = items.slice().sort((a, b) => b.popularity - a.popularity);
    // Only the top DISPLAY_CAP items are actually rendered — the footprint,
    // packing and every node below are all derived from this shown subset,
    // not the full category, so a 15-item category doesn't force a much
    // bigger/sparser cluster than an otherwise-identical 9-item one.
    const shown = sorted.slice(0, DISPLAY_CAP);
    const overflow = sorted.length - shown.length;
    const itemRadii = shown.map((sub, i) => tierRadius(i, sub.popularity));
    // Tight item spacing/margin — a category should read as one dense
    // ecosystem, not a loose scatter of icons. Margin (0.18, not tighter)
    // verified against real render sizes with an exhaustive pairwise check —
    // anything looser than this risks two icons visibly touching.
    const localItems = packCircles(itemRadii, 0.68, 0.18);
    const footprint = Math.max(...localItems.map((p) => Math.hypot(p.x, p.y) + p.r)) + 0.5;
    return { category, items: shown, totalCount: sorted.length, overflow, localItems, footprint };
  });

  const rows = packCategoryRows(categoriesByCount, TARGET_ROW_ASPECT, ROW_GAP);
  const centers = positionCategoryRows(rows, ROW_GAP);

  const clusters: CategoryCluster[] = [];
  const nodes: UniverseNode[] = [];

  categoriesByCount.forEach(({ category, items, totalCount, overflow, localItems, footprint }, catIndex) => {
    const { x: centerX, y: centerY } = centers.get(category)!;

    items.forEach((sub, i) => {
      const local = localItems[i];
      const z = (rand() - 0.5) * 4 + 2;
      nodes.push({
        subscription: sub,
        position: { x: centerX + local.x, y: centerY + local.y, z },
        radius: renderTierRadius(i, sub.popularity),
        cluster: catIndex,
      });
    });

    clusters.push({
      name: category,
      center: { x: centerX, y: centerY },
      radius: footprint,
      count: totalCount,
      overflow,
      color: CATEGORY_META[category as keyof typeof CATEGORY_META]?.color ?? "#A99C87",
    });
  });

  return { nodes, clusters };
}

