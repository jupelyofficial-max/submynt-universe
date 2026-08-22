import * as THREE from "three";
import type { Subscription } from "@/types/subscription";
import { getLogoPath } from "@/lib/logos";

const cache = new Map<string, THREE.CanvasTexture>();

/** Soft drop shadow + hairline border shared by every tile, real logo or
 * lettermark — the "premium app icon on a tray" feel (tactile depth,
 * restrained) rather than a flat colored circle. Must run before anything
 * else is drawn on top; caller resets shadowBlur to 0 immediately after. */
function paintTile(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, fill: string | CanvasGradient) {
  ctx.save();
  ctx.shadowColor = "rgba(20,15,8,0.35)";
  ctx.shadowBlur = r * 0.16;
  ctx.shadowOffsetY = r * 0.07;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.restore();

  ctx.lineWidth = Math.max(1, r * 0.02);
  ctx.strokeStyle = "rgba(20,15,8,0.1)";
  ctx.stroke();
}

function drawLettermark(ctx: CanvasRenderingContext2D, size: number, sub: Pick<Subscription, "color" | "initials">) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 16; // extra margin (vs. a tight 3-5px) so the drop shadow never clips at the canvas edge

  ctx.clearRect(0, 0, size, size);

  // No real logo available — the flat brand color IS the identity signal
  // here, so it stays fairly saturated, just tactile rather than glossy.
  const gradient = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.35, r * 0.1, cx, cy, r);
  gradient.addColorStop(0, `${sub.color}f0`);
  gradient.addColorStop(1, `${sub.color}d8`);
  paintTile(ctx, cx, cy, r, gradient);

  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.font = `700 ${Math.round(size * 0.3)}px "Space Grotesk", ui-sans-serif, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(sub.initials, cx, cy + 1);
}

export function getLogoTexture(
  sub: Pick<Subscription, "id" | "color" | "initials">
): THREE.CanvasTexture {
  const cached = cache.get(sub.id);
  if (cached) return cached;

  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  drawLettermark(ctx, size, sub);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  cache.set(sub.id, texture);

  // Upgrade to the real logo once it loads — a clean near-white tile (like
  // a real app icon), not the saturated brand-color fill the lettermark
  // uses, so the actual logo artwork reads as the product itself rather
  // than a colored blob with a picture floating in it. A faint brand-color
  // wash keeps just enough identity to tint neighboring icons apart. Falls
  // back to the lettermark already drawn if there's no saved logo for this
  // subscription (or the local file somehow 404s).
  const logoPath = getLogoPath(sub.id);
  if (logoPath) {
    const img = new Image();
    img.onload = () => {
      const cx = size / 2;
      const cy = size / 2;
      const r = size / 2 - 16; // extra margin (vs. a tight 3-5px) so the drop shadow never clips at the canvas edge

      ctx.clearRect(0, 0, size, size);
      const tileGradient = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.35, r * 0.1, cx, cy, r);
      tileGradient.addColorStop(0, "#ffffff");
      tileGradient.addColorStop(1, `${sub.color}22`);
      paintTile(ctx, cx, cy, r, tileGradient);

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.clip();
      const inset = r * 2 * 0.11; // small margin only — the logo itself is the primary visual object, not its container
      const target = r * 2 - inset * 2;
      const scale = Math.min(target / img.width, target / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.drawImage(img, cx - w / 2, cy - h / 2, w, h);
      ctx.restore();
      texture.needsUpdate = true;
    };
    img.src = logoPath;
  }

  return texture;
}

export function getGlowTexture(): THREE.CanvasTexture {
  const key = "__glow__";
  const cached = cache.get(key);
  if (cached) return cached;

  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const cx = size / 2;
  const cy = size / 2;
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, size / 2);
  gradient.addColorStop(0, "rgba(255,255,255,0.9)");
  gradient.addColorStop(0.35, "rgba(255,255,255,0.35)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  cache.set(key, texture);
  return texture;
}
