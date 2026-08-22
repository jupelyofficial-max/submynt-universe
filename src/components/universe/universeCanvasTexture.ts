import * as THREE from "three";
import { UNIVERSE_WORLD_HEIGHT, UNIVERSE_WORLD_WIDTH, type CategoryCluster } from "@/lib/universeLayout";

const TEXTURE_WIDTH = 1600;
const TEXTURE_HEIGHT = Math.round(TEXTURE_WIDTH * (UNIVERSE_WORLD_HEIGHT / UNIVERSE_WORLD_WIDTH));

let cached: THREE.CanvasTexture | null = null;

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/** Maps a world-space (x, y) — origin at the canvas center, y-up — to a
 * pixel position on the texture, matching the plane's default UV mapping
 * (flipY): world +y (top) lands on texture row 0. */
function worldToPixel(x: number, y: number) {
  return {
    px: (x / UNIVERSE_WORLD_WIDTH + 0.5) * TEXTURE_WIDTH,
    py: (0.5 - y / UNIVERSE_WORLD_HEIGHT) * TEXTURE_HEIGHT,
  };
}

/** Abstract discovery-canvas backdrop — no real geography. A warm cream
 * surface with a soft colored glow "galaxy" under each category cluster
 * (evoking depth/regions without drawing literal continents), quiet enough
 * that the subscription clusters stay the visual focus. */
export function getUniverseCanvasTexture(clusters: CategoryCluster[]): THREE.CanvasTexture {
  if (cached) return cached;

  const canvas = document.createElement("canvas");
  canvas.width = TEXTURE_WIDTH;
  canvas.height = TEXTURE_HEIGHT;
  const ctx = canvas.getContext("2d")!;

  // Base
  ctx.fillStyle = "#f7f2e6";
  ctx.fillRect(0, 0, TEXTURE_WIDTH, TEXTURE_HEIGHT);

  // A soft colored glow under each category's real cluster position —
  // reads as a "galaxy" atmosphere behind its subscription icons — plus a pair of
  // hairline orbit rings and a few faint radial spokes per cluster, standing
  // in for real orbital geometry without ever competing with the logos.
  const pxPerWorldUnit = TEXTURE_WIDTH / UNIVERSE_WORLD_WIDTH;
  for (const cluster of clusters) {
    const { px, py } = worldToPixel(cluster.center.x, cluster.center.y);
    // Wide enough that neighboring clusters' atmospheres visibly overlap now
    // that clusters themselves sit close together — the universe should
    // read as one connected field of light, not isolated colored islands.
    const r = cluster.radius * pxPerWorldUnit * 2.6;
    const gradient = ctx.createRadialGradient(px, py, 0, px, py, r);
    gradient.addColorStop(0, hexToRgba(cluster.color, 0.14));
    gradient.addColorStop(0.5, hexToRgba(cluster.color, 0.06));
    gradient.addColorStop(1, hexToRgba(cluster.color, 0));
    ctx.fillStyle = gradient;
    ctx.fillRect(px - r, py - r, r * 2, r * 2);

    // Orbit rings/spokes — felt more than seen (opacity kept in the 0.04–0.09
    // range) so they read as atmosphere, never as a radar/technical overlay.
    const orbitR = cluster.radius * pxPerWorldUnit;
    ctx.strokeStyle = hexToRgba(cluster.color, 0.08);
    ctx.lineWidth = 1;
    for (const frac of [0.52, 0.9]) {
      ctx.beginPath();
      ctx.arc(px, py, orbitR * frac, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.strokeStyle = hexToRgba(cluster.color, 0.045);
    for (let s = 0; s < 6; s++) {
      const spokeAngle = (s / 6) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + Math.cos(spokeAngle) * orbitR * 0.92, py + Math.sin(spokeAngle) * orbitR * 0.92);
      ctx.stroke();
    }
  }

  // Faint fine grid — cartographic texture without being a literal map.
  ctx.strokeStyle = "rgba(28,21,13,0.045)";
  ctx.lineWidth = 1;
  const gridStep = TEXTURE_WIDTH / 40;
  for (let x = 0; x <= TEXTURE_WIDTH; x += gridStep) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, TEXTURE_HEIGHT);
    ctx.stroke();
  }
  for (let y = 0; y <= TEXTURE_HEIGHT; y += gridStep) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(TEXTURE_WIDTH, y);
    ctx.stroke();
  }

  // A light scatter of tiny particles across the whole canvas — deterministic
  // (fixed seed), extremely faint — just enough ambient texture that the
  // background reads as "space" rather than a flat fill.
  let seed = 42;
  function rand() {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  }
  ctx.fillStyle = "rgba(28,21,13,0.05)";
  for (let i = 0; i < 260; i++) {
    const x = rand() * TEXTURE_WIDTH;
    const y = rand() * TEXTURE_HEIGHT;
    const rad = 0.6 + rand() * 1.4;
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, Math.PI * 2);
    ctx.fill();
  }

  const cx = TEXTURE_WIDTH / 2;
  const cy = TEXTURE_HEIGHT / 2;

  // Soft vignette so edges recede.
  const vignette = ctx.createRadialGradient(cx, cy, TEXTURE_HEIGHT * 0.25, cx, cy, TEXTURE_WIDTH * 0.62);
  vignette.addColorStop(0, "rgba(120,105,75,0)");
  vignette.addColorStop(1, "rgba(120,105,75,0.14)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, TEXTURE_WIDTH, TEXTURE_HEIGHT);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  cached = texture;
  return texture;
}
