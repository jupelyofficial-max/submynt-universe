import * as THREE from "three";
import {
  WORLD_MAP_HEIGHT,
  WORLD_MAP_PATH,
  WORLD_MAP_WIDTH,
} from "@/data/worldMapPath";

let cached: THREE.CanvasTexture | null = null;

/** CARTO Positron-style light basemap: warm cream land fills on a near-white
 * ocean. Drawn once from the pre-generated country path data (see
 * scripts/gen-worldmap.mjs) and cached — every scene that shows the map
 * reuses the same texture. */
export function getWorldMapTexture(): THREE.CanvasTexture {
  if (cached) return cached;

  const canvas = document.createElement("canvas");
  canvas.width = WORLD_MAP_WIDTH;
  canvas.height = WORLD_MAP_HEIGHT;
  const ctx = canvas.getContext("2d")!;

  // Ocean
  ctx.fillStyle = "#f7f2e6";
  ctx.fillRect(0, 0, WORLD_MAP_WIDTH, WORLD_MAP_HEIGHT);

  // Subtle latitude/longitude graticule
  ctx.strokeStyle = "rgba(28,21,13,0.05)";
  ctx.lineWidth = 1;
  for (let x = 0; x <= WORLD_MAP_WIDTH; x += WORLD_MAP_WIDTH / 12) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, WORLD_MAP_HEIGHT);
    ctx.stroke();
  }
  for (let y = 0; y <= WORLD_MAP_HEIGHT; y += WORLD_MAP_HEIGHT / 6) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(WORLD_MAP_WIDTH, y);
    ctx.stroke();
  }

  // Land
  const land = new Path2D(WORLD_MAP_PATH);
  ctx.fillStyle = "#e6dcc3";
  ctx.fill(land);
  ctx.strokeStyle = "rgba(28,21,13,0.22)";
  ctx.lineWidth = 1.4;
  ctx.stroke(land);

  // Soft vignette so edges recede
  const vignette = ctx.createRadialGradient(
    WORLD_MAP_WIDTH / 2,
    WORLD_MAP_HEIGHT / 2,
    WORLD_MAP_HEIGHT * 0.3,
    WORLD_MAP_WIDTH / 2,
    WORLD_MAP_HEIGHT / 2,
    WORLD_MAP_WIDTH * 0.6
  );
  vignette.addColorStop(0, "rgba(120,105,75,0)");
  vignette.addColorStop(1, "rgba(120,105,75,0.16)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, WORLD_MAP_WIDTH, WORLD_MAP_HEIGHT);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  cached = texture;
  return texture;
}
