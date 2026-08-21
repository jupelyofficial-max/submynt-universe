import * as THREE from "three";
import { UNIVERSE_WORLD_HEIGHT, UNIVERSE_WORLD_WIDTH } from "@/lib/universeLayout";

const TEXTURE_WIDTH = 1600;
const TEXTURE_HEIGHT = Math.round(TEXTURE_WIDTH * (UNIVERSE_WORLD_HEIGHT / UNIVERSE_WORLD_WIDTH));

let cached: THREE.CanvasTexture | null = null;

/** Abstract discovery-canvas backdrop — no real geography. A warm cream
 * surface with a faint cartographic grid and a few very soft radial washes
 * (evoking depth/regions without drawing literal continents), quiet enough
 * that the subscription clusters stay the visual focus. */
export function getUniverseCanvasTexture(): THREE.CanvasTexture {
  if (cached) return cached;

  const canvas = document.createElement("canvas");
  canvas.width = TEXTURE_WIDTH;
  canvas.height = TEXTURE_HEIGHT;
  const ctx = canvas.getContext("2d")!;

  // Base
  ctx.fillStyle = "#f7f2e6";
  ctx.fillRect(0, 0, TEXTURE_WIDTH, TEXTURE_HEIGHT);

  // A few large, very soft warm washes — abstract "regions," not landmasses.
  const washes: { x: number; y: number; r: number; color: string }[] = [
    { x: 0.28, y: 0.32, r: 0.42, color: "rgba(227,125,61,0.05)" },
    { x: 0.7, y: 0.62, r: 0.46, color: "rgba(69,183,158,0.05)" },
    { x: 0.5, y: 0.85, r: 0.38, color: "rgba(227,125,61,0.035)" },
  ];
  for (const w of washes) {
    const cx = w.x * TEXTURE_WIDTH;
    const cy = w.y * TEXTURE_HEIGHT;
    const r = w.r * TEXTURE_WIDTH;
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    gradient.addColorStop(0, w.color);
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, TEXTURE_WIDTH, TEXTURE_HEIGHT);
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

  // Faint concentric rings from center — a quiet nod to the spiral layout,
  // reads as abstract cartography (radar/orbit chart) rather than terrain.
  const cx = TEXTURE_WIDTH / 2;
  const cy = TEXTURE_HEIGHT / 2;
  ctx.strokeStyle = "rgba(28,21,13,0.05)";
  ctx.lineWidth = 1.4;
  const ringCount = 5;
  const maxRing = Math.min(TEXTURE_WIDTH, TEXTURE_HEIGHT) * 0.48;
  for (let i = 1; i <= ringCount; i++) {
    ctx.beginPath();
    ctx.arc(cx, cy, (maxRing / ringCount) * i, 0, Math.PI * 2);
    ctx.stroke();
  }

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
