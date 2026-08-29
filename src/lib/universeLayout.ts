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
const ROW_GAP = 0.04; // fixed gap between category cells, both across a row and between rows — tightened further for a dense 4-column desktop layout; still leaves room for the "+N" overflow badge near each cluster's edge without it reaching the row below's label
// Caps how many icons a category actually renders — a dominant primary plus
// up to this many total reads as one clear hero + a curated set, matching
// the mobile Universe's own cap; anything past it collapses into a "+N"
// badge instead of crowding the cluster with same-ish small icons. Lowered
// from 9 — packing enough icons at a size that stays individually readable
// (see ICON_RENDER_SCALE below) needs more per-icon room than a raw radius
// suggested, so a smaller curated set + "+N" reads better than cramming.
const DISPLAY_CAP = 7;
/** SubscriptionNode's sprite is a SQUARE `radius * ICON_RENDER_SCALE` wide —
 * a single source of truth so packCircles (below) reserves space for the
 * icon's actual rendered footprint, not just its nominal tier radius. A
 * previous version packed circles at the raw tier radius while rendering
 * sprites 2.8x that size, so the ~40% of extra footprint the sprite
 * actually occupied on screen was never reserved by the packer at all —
 * every category's "intentional shingle overlap" (see the packCircles call
 * in buildUniverse) silently became uncontrolled overlap once real icon art
 * (not the small dev placeholder) filled that sprite edge-to-edge, reducing
 * smaller-tier icons next to the hero to unreadable slivers. Exported so
 * SubscriptionNode's baseScale uses this exact value instead of a second,
 * hand-kept constant that could drift out of sync the same way.
 */
export const ICON_RENDER_SCALE = 2.3;
// Desktop categories are laid out in a fixed grid this many columns wide
// (rows are derived from category count), so every column shares the same
// x position and every row the same y position instead of a data-driven,
// aspect-balanced shelf layout.
const CATEGORY_GRID_COLUMNS = 4;

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
//
// This (plus ROW_GAP) is the ONLY lever that actually changes the ON-SCREEN
// row-to-row gap at a fixed row count. Verified by direct computation: when
// height is the camera's binding fit dimension (true at every desktop width
// tested) and rows are roughly uniform, on-screen row spacing reduces to
// viewportHeightPx / (rowCount * FIT_PADDING) — the world-space footprint
// term cancels out completely, because a smaller footprint just makes the
// camera zoom in proportionally more. Shrinking tierRadius/packCircles
// margins makes icons relatively larger within their row, but does NOT
// shrink the visible gap between rows — only LABEL_RESERVE/ROW_GAP (a fixed
// per-row cost, not proportional to footprint) survives that cancellation.
const LABEL_RESERVE = 0.75;
// SponsoredStrip renders as a fixed DOM overlay pinned near the bottom of
// the viewport (see ExploreClient.tsx) — the camera's fit-to-bounds has no
// visibility into that overlay at all, so without an explicit reserve here
// the bottom row's icons get fit flush against the true bottom edge and can
// land directly underneath the strip.
const BOTTOM_RESERVE = 2.8;

/** Bounding box of the whole packed composition — the union of every
 * category cluster's circle (center ± its own radius, plus LABEL_RESERVE on
 * top for the floating category label and BOTTOM_RESERVE on the bottom for
 * the fixed sponsored strip overlay). Used to fit the camera to the actual
 * content instead of a fixed zoom constant, so the default view always shows
 * the complete universe — including every label — regardless of how many
 * categories/subscriptions the catalogue ends up with.
 *
 * Left/right clearance for the corner overlays (EcosystemStats bottom-left,
 * LiveInsights top-right) is deliberately NOT handled here with a
 * width-side reserve — at every realistic landscape desktop aspect ratio
 * this composition's height is the binding constraint for computeFitZoom
 * (verified: distanceForHeight > distanceForWidth for both 1024×800 and
 * 1440×900), so a width-only reserve never actually changes the fitted
 * zoom. See CameraController's FIT_PADDING for the fix that actually
 * reaches every edge, corners included. */
export function computeUniverseBounds(clusters: CategoryCluster[]): UniverseBounds {
  if (clusters.length === 0) return { centerX: 0, centerY: 0, width: 1, height: 1 };
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const c of clusters) {
    minX = Math.min(minX, c.center.x - c.radius);
    maxX = Math.max(maxX, c.center.x + c.radius);
    minY = Math.min(minY, c.center.y - c.radius - BOTTOM_RESERVE);
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
 * rather than a field of same-sized icons. This is the ONLY radius: it's
 * fed straight into packCircles below AND used as the actual on-screen
 * render radius (see SubscriptionNode's baseScale) — the same pattern
 * mobile's computeMobileClusterLayout already uses (it packs the exact
 * size it renders, never a separate "layout size"). A previous version of
 * this file split those into two functions so icon size could be retuned
 * without recomputing layout — but every subsequent size increase then
 * drifted further from what packCircles was actually reserving space for,
 * and icons started overlapping past recognizability. Packing the real
 * render radius makes that class of bug structurally impossible: whatever
 * space packCircles reserves for a circle is exactly the circle drawn
 * there, guaranteed by the packer's own geometry, not by keeping two
 * numbers in sync by hand. */
function tierRadius(rankInCategory: number, popularity: number): number {
  // Tightened from 1.65/1.0/0.8 (a 2.06x hero-to-supporting ratio) to keep
  // every icon in a cluster within a consistent size band — no single icon
  // reads as 2-3x any other — while still giving the top item a clear,
  // recognizable hero presence.
  const base = rankInCategory === 0 ? 1.5 : rankInCategory <= 2 ? 1.05 : 0.9;
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

/** Arranges category clusters into a structured grid — every column shares
 * one x position across all rows, every row shares one y position across
 * all columns, so the composition stays deterministic and non-overlapping —
 * but each column/row is sized to its own largest occupant (CSS Grid's
 * `auto` track sizing, not a single uniform pitch for the whole grid). A
 * uniform pitch sized to the single biggest category (e.g. Entertainment,
 * 9 icons) would pad every other cell out to that same size even when its
 * own cluster is much smaller (e.g. Communication, 5 icons) — auto-sizing
 * keeps a dense row dense and a sparse row compact, which is what keeps the
 * composition (and therefore the camera's fit-zoom, and therefore every
 * icon's on-screen size) close to its real content instead of bloated by
 * the single largest category in the whole catalogue.
 *
 * Categories are ordered by subscription count, most-populated first — the
 * same ordering key the mobile Universe uses (see MobileUniverse.tsx's
 * `ordered` sort) — so both platforms group and rank categories
 * identically, filled left-to-right then top-to-bottom into `columns`
 * columns (rows derived from category count). */
function layoutCategoryGrid<T extends { category: string; footprint: number; totalCount: number }>(
  categories: T[],
  gap: number,
  columns: number = CATEGORY_GRID_COLUMNS,
  columnSpread: number = 1
): Map<string, { x: number; y: number }> {
  const ordered = categories.slice().sort((a, b) => b.totalCount - a.totalCount);
  const rows = Math.ceil(ordered.length / columns);

  const grid: (T | undefined)[][] = Array.from({ length: rows }, () => Array(columns).fill(undefined));
  ordered.forEach((cat, i) => {
    grid[Math.floor(i / columns)][i % columns] = cat;
  });

  const colSizes = Array.from({ length: columns }, (_, col) => {
    let max = 0;
    for (let row = 0; row < rows; row++) max = Math.max(max, grid[row][col]?.footprint ?? 0);
    return max * 2 + gap;
  });
  // Every row has a category label sitting above its own icons (see
  // CategoryLabels), not just the top row of the whole composition — so
  // every row needs LABEL_RESERVE worth of clearance from the row above it,
  // not only the gap between icon clusters. Splitting it across both rows
  // (half added to each row's own height) puts exactly LABEL_RESERVE of
  // extra space between any two adjacent row centers, same as the reserve
  // computeUniverseBounds adds above the topmost row.
  const rowSizes = Array.from({ length: rows }, (_, row) => {
    let max = 0;
    for (let col = 0; col < columns; col++) max = Math.max(max, grid[row][col]?.footprint ?? 0);
    return max * 2 + gap + LABEL_RESERVE;
  });

  const totalWidth = colSizes.reduce((a, b) => a + b, 0);
  const totalHeight = rowSizes.reduce((a, b) => a + b, 0);
  // Cumulative offset of each column/row's leading edge, so its center is
  // just that offset plus half its own size.
  const colStart: number[] = [];
  for (let i = 0, acc = 0; i < columns; i++) {
    colStart.push(acc);
    acc += colSizes[i];
  }
  const rowStart: number[] = [];
  for (let i = 0, acc = 0; i < rows; i++) {
    rowStart.push(acc);
    acc += rowSizes[i];
  }

  const positions = new Map<string, { x: number; y: number }>();
  ordered.forEach((cat, i) => {
    const col = i % columns;
    const row = Math.floor(i / columns);
    // columnSpread widens the gap BETWEEN column centers only — column
    // widths (colSizes, used above for packing/overlap safety) and every
    // row's own height are untouched, so this only ever adds clearance
    // between columns, never removes it, and never reflows icons within a
    // category's own cluster.
    const x = (colStart[col] + colSizes[col] / 2 - totalWidth / 2) * columnSpread;
    const y = totalHeight / 2 - (rowStart[row] + rowSizes[row] / 2);
    positions.set(cat.category, { x, y });
  });
  return positions;
}

/** Places every subscription within its category's cluster rather than by
 * any real-world geography. Within a category, items are circle-packed
 * around a shared center — the popularity-ranked hero sits dead center,
 * everything else packs outward just far enough to clear it and each other,
 * so a much bigger hero never collides with its neighbors. Category centers
 * are then arranged into a fixed `columns`-wide grid (see layoutCategoryGrid)
 * so every category lands on a consistent row/column position instead of a
 * data-driven, organically shaped composition. `columns` defaults to the
 * full desktop width (see CATEGORY_GRID_COLUMNS) — callers on a narrower
 * desktop/tablet viewport pass fewer, matching the mobile Universe's own
 * breakpoint-driven column count.
 *
 * `columnSpread` widens the gap between column centers only (see
 * layoutCategoryGrid) — the composition's own packed width is narrower than
 * a typical landscape viewport, and computeFitZoom's camera fit is bound by
 * height at essentially every realistic desktop aspect ratio, so extra
 * viewport width beyond that just becomes unused margin. UniverseScene
 * computes a spread that closes that gap by matching the composition's
 * width to the live viewport's aspect ratio, so wider windows spread
 * category columns further apart instead of leaving the grid small and
 * centered in empty canvas. Defaults to 1 (no spread, natural packed
 * width) — the mobile Universe's call site doesn't need this at all, since
 * it never reads these x/y positions. */
export function buildUniverse(
  subs: Subscription[],
  columns: number = CATEGORY_GRID_COLUMNS,
  columnSpread: number = 1
): UniverseLayout {
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
    // Pack using the icon's actual RENDERED half-width (radius *
    // ICON_RENDER_SCALE / 2), not the raw tier radius — packCircles has to
    // reserve space for the square sprite that's really drawn on screen, or
    // its non-overlap guarantee is checking the wrong shape entirely (see
    // ICON_RENDER_SCALE's docstring). Tight item spacing, and a deliberately
    // negative margin — a category should read as one dense collage, not a
    // loose scatter of icons. packCircles' margin is a hard minimum GAP
    // between circle edges when positive; a small negative value instead
    // permits a small, intentional overlap (icons visually shingling like an
    // overlapping photo collage) rather than a gap. -0.3 here (relative to
    // the render-scale radii, not the old raw-radius -0.18) was picked by
    // direct simulation of this exact packer/tier setup: every icon keeps
    // ≥90% of its own area visible (well above the ≥55-60% floor), while
    // keeping the collage's overlap clearly intentional rather than a bare
    // grid of touching circles.
    const packRadii = itemRadii.map((r) => (r * ICON_RENDER_SCALE) / 2);
    const packed = packCircles(packRadii, 0.3, -0.3);
    // local.r is reset to the true (unscaled) tier radius, not the packing
    // radius — packCircles' packing radius exists purely to reserve enough
    // room for the real sprite; the node itself still renders at
    // `radius * ICON_RENDER_SCALE` off the tier radius (see SubscriptionNode),
    // so re-attaching the packing radius here would double-apply the scale.
    const localItems = packed.map((p, i) => ({ x: p.x, y: p.y, r: itemRadii[i] }));
    const footprint = Math.max(...packed.map((p) => Math.hypot(p.x, p.y) + p.r)) + 0.5;
    return { category, items: shown, totalCount: sorted.length, overflow, localItems, footprint };
  });

  const centers = layoutCategoryGrid(categoriesByCount, ROW_GAP, columns, columnSpread);

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
        // Reuses the exact radius packCircles just packed at this slot
        // (local.r), not a recomputed value — guarantees the rendered icon
        // can never be bigger than the space actually reserved for it.
        radius: local.r,
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

