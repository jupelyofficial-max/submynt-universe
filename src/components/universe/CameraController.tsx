"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { UniverseNode } from "@/types/subscription";
import { useUniverseStore } from "@/store/useUniverseStore";
import { trackDown, trackMove } from "@/lib/dragTracker";
import { UNIVERSE_WORLD_HEIGHT, UNIVERSE_WORLD_WIDTH } from "@/lib/universeLayout";

export const MIN_ZOOM = 20;
// Absolute ceiling — the actual per-session cap is computed per aspect ratio
// (see computeMaxZoom) so panning/scrolling out never reveals background
// beyond the map plane's edges, but this bounds it in case that computation
// ever produces something unreasonable.
export const MAX_ZOOM = 130;
// Framed to fill the viewport with the primary central-category mass (the
// five core categories packed near the origin), not just a single cluster —
// the compact v3 layout is dense enough that this default already shows a
// rich composition. Users can still scroll out to computeMaxZoom's ceiling.
export const DEFAULT_ZOOM = 39;

// Must match UniverseCanvasBackground's mesh position and UniverseScene's camera fov.
const CANVAS_PLANE_Z = -18;
const CAMERA_FOV_DEG = 45;

/** Zoom (camera z) at which the abstract canvas plane exactly covers the
 * viewport — like CSS `background-size: cover` — for the given aspect
 * ratio. Used as the zoom-OUT ceiling, not the default: it guarantees
 * there's never empty background showing beyond the canvas, without
 * forcing the initial view to be a huge, sparse whole-universe shot. */
function computeMaxZoom(width: number, height: number): number {
  if (!width || !height) return MAX_ZOOM;
  const aspect = width / height;
  const fovRad = (CAMERA_FOV_DEG * Math.PI) / 180;
  const targetHeight = Math.min(UNIVERSE_WORLD_HEIGHT, UNIVERSE_WORLD_WIDTH / aspect);
  const distance = targetHeight / (2 * Math.tan(fovRad / 2));
  return THREE.MathUtils.clamp(distance + CANVAS_PLANE_Z, MIN_ZOOM, MAX_ZOOM);
}

/** Keeps the camera's look-at point far enough from the canvas plane's
 * edges that the visible frustum never spills past them — otherwise
 * panning close to an edge cluster (or being centered on one by default)
 * reveals empty background beyond the finite plane. */
function clampPanToCanvas(x: number, y: number, zoomZ: number, aspect: number) {
  const distance = zoomZ - CANVAS_PLANE_Z;
  const fovRad = (CAMERA_FOV_DEG * Math.PI) / 180;
  const halfHeight = distance * Math.tan(fovRad / 2);
  const halfWidth = halfHeight * aspect;
  const maxX = Math.max(0, UNIVERSE_WORLD_WIDTH / 2 - halfWidth);
  const maxY = Math.max(0, UNIVERSE_WORLD_HEIGHT / 2 - halfHeight);
  return {
    x: THREE.MathUtils.clamp(x, -maxX, maxX),
    y: THREE.MathUtils.clamp(y, -maxY, maxY),
  };
}

/** Centroid of the single largest category cluster — where the universe
 * opens by default, so the busiest, most recognizable logos are on screen
 * immediately instead of a view dominated by empty canvas. */
function computeDefaultFocus(nodes: UniverseNode[]): { x: number; y: number } {
  const byCluster = new Map<number, { sumX: number; sumY: number; count: number }>();
  for (const n of nodes) {
    const c = byCluster.get(n.cluster) ?? { sumX: 0, sumY: 0, count: 0 };
    c.sumX += n.position.x;
    c.sumY += n.position.y;
    c.count += 1;
    byCluster.set(n.cluster, c);
  }
  let biggest: { sumX: number; sumY: number; count: number } | null = null;
  for (const c of byCluster.values()) {
    if (!biggest || c.count > biggest.count) biggest = c;
  }
  if (!biggest) return { x: 0, y: 0 };
  return { x: biggest.sumX / biggest.count, y: biggest.sumY / biggest.count };
}

interface Props {
  nodes: UniverseNode[];
  ownedIds: Set<string>;
}

export function CameraController({ nodes, ownedIds }: Props) {
  const { camera, gl, size } = useThree();
  const defaultFocus = useMemo(() => computeDefaultFocus(nodes), [nodes]);
  const maxZoom = useRef(computeMaxZoom(size.width, size.height));
  const desired = useRef({ x: defaultFocus.x, y: defaultFocus.y, zoom: DEFAULT_ZOOM });
  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });
  const pinchDist = useRef<number | null>(null);
  const idleT = useRef(0);

  useEffect(() => {
    maxZoom.current = computeMaxZoom(size.width, size.height);
  }, [size.width, size.height]);

  const cameraCommand = useUniverseStore((s) => s.cameraCommand);
  const discoverMode = useUniverseStore((s) => s.discoverMode);
  const setDiscoverMode = useUniverseStore((s) => s.setDiscoverMode);

  useEffect(() => {
    const el = gl.domElement;

    function worldDelta(dxPx: number, dyPx: number) {
      const scale = (desired.current.zoom / size.height) * 1.35;
      return { dx: -dxPx * scale, dy: dyPx * scale };
    }

    function onPointerDown(e: PointerEvent) {
      dragging.current = true;
      last.current = { x: e.clientX, y: e.clientY };
      trackDown(e.clientX, e.clientY);
      if (discoverMode) setDiscoverMode(false);
    }
    function onPointerMove(e: PointerEvent) {
      if (!dragging.current) return;
      trackMove(e.clientX, e.clientY);
      const dxPx = e.clientX - last.current.x;
      const dyPx = e.clientY - last.current.y;
      last.current = { x: e.clientX, y: e.clientY };
      const { dx, dy } = worldDelta(dxPx, dyPx);
      desired.current.x += dx;
      desired.current.y += dy;
    }
    function onPointerUp() {
      dragging.current = false;
    }
    function onWheel(e: WheelEvent) {
      e.preventDefault();
      if (discoverMode) setDiscoverMode(false);
      desired.current.zoom = THREE.MathUtils.clamp(desired.current.zoom + e.deltaY * 0.06, MIN_ZOOM, maxZoom.current);
    }
    function touchDist(t: TouchList) {
      return Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
    }
    function onTouchStart(e: TouchEvent) {
      if (discoverMode) setDiscoverMode(false);
      if (e.touches.length === 2) {
        pinchDist.current = touchDist(e.touches);
      } else if (e.touches.length === 1) {
        dragging.current = true;
        last.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        trackDown(e.touches[0].clientX, e.touches[0].clientY);
      }
    }
    function onTouchMove(e: TouchEvent) {
      if (e.touches.length === 2 && pinchDist.current !== null) {
        const d = touchDist(e.touches);
        const delta = pinchDist.current - d;
        desired.current.zoom = THREE.MathUtils.clamp(desired.current.zoom + delta * 0.18, MIN_ZOOM, maxZoom.current);
        pinchDist.current = d;
      } else if (e.touches.length === 1 && dragging.current) {
        trackMove(e.touches[0].clientX, e.touches[0].clientY);
        const dxPx = e.touches[0].clientX - last.current.x;
        const dyPx = e.touches[0].clientY - last.current.y;
        last.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        const { dx, dy } = worldDelta(dxPx, dyPx);
        desired.current.x += dx;
        desired.current.y += dy;
      }
    }
    function onTouchEnd(e: TouchEvent) {
      if (e.touches.length < 2) pinchDist.current = null;
      if (e.touches.length === 0) dragging.current = false;
    }
    function onDoubleClick() {
      desired.current.zoom = THREE.MathUtils.clamp(desired.current.zoom * 0.55, MIN_ZOOM, maxZoom.current);
    }

    el.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: true });
    el.addEventListener("touchend", onTouchEnd);
    el.addEventListener("dblclick", onDoubleClick);

    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("dblclick", onDoubleClick);
    };
  }, [gl, size, discoverMode, setDiscoverMode]);

  useEffect(() => {
    if (!cameraCommand) return;
    switch (cameraCommand.type) {
      case "zoom":
        desired.current.zoom = THREE.MathUtils.clamp(desired.current.zoom + cameraCommand.delta, MIN_ZOOM, maxZoom.current);
        break;
      case "reset":
        desired.current = { x: defaultFocus.x, y: defaultFocus.y, zoom: DEFAULT_ZOOM };
        break;
      case "focus-node": {
        const node = nodes.find((n) => n.subscription.id === cameraCommand.id);
        if (node) desired.current = { x: node.position.x, y: node.position.y, zoom: MIN_ZOOM + 6 };
        break;
      }
      case "focus-mine": {
        const mine = nodes.filter((n) => ownedIds.has(n.subscription.id));
        if (mine.length) {
          const cx = mine.reduce((sum, n) => sum + n.position.x, 0) / mine.length;
          const cy = mine.reduce((sum, n) => sum + n.position.y, 0) / mine.length;
          desired.current = { x: cx, y: cy, zoom: Math.max(MIN_ZOOM + 8, 32) };
        }
        break;
      }
      case "discover":
        setDiscoverMode(true);
        break;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraCommand?.nonce]);

  // react-three-fiber's canonical pattern: useFrame runs in the render-loop, outside
  // React's render phase, so imperatively mutating three.js objects here (rather than
  // triggering re-renders) is the framework-recommended approach, not a purity violation.
  /* eslint-disable react-hooks/immutability */
  useFrame((_, delta) => {
    if (discoverMode && !dragging.current) {
      idleT.current += delta * 0.045;
      desired.current.x = defaultFocus.x + Math.sin(idleT.current) * 6;
      desired.current.y = defaultFocus.y + Math.cos(idleT.current * 0.7) * 4;
    }
    const clamped = clampPanToCanvas(desired.current.x, desired.current.y, desired.current.zoom, size.width / size.height);
    desired.current.x = clamped.x;
    desired.current.y = clamped.y;

    const damp = 1 - Math.pow(0.0015, delta);

    camera.position.x = THREE.MathUtils.lerp(camera.position.x, desired.current.x, damp);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, desired.current.y, damp);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, desired.current.zoom, damp);
    camera.lookAt(camera.position.x, camera.position.y, 0);
  });
  /* eslint-enable react-hooks/immutability */

  return null;
}
