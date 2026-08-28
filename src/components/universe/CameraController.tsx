"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { UniverseNode } from "@/types/subscription";
import { useUniverseStore } from "@/store/useUniverseStore";
import { trackDown, trackMove } from "@/lib/dragTracker";
import { UNIVERSE_WORLD_HEIGHT, UNIVERSE_WORLD_WIDTH, type UniverseBounds } from "@/lib/universeLayout";

export const MIN_ZOOM = 20;
// Absolute ceiling — the actual per-session cap is computed per aspect ratio
// (see computeMaxZoom) so panning/scrolling out never reveals background
// beyond the map plane's edges, but this bounds it in case that computation
// ever produces something unreasonable.
export const MAX_ZOOM = 130;

// Must match UniverseCanvasBackground's mesh position and UniverseScene's camera fov.
const CANVAS_PLANE_Z = -18;
// Exported so UniverseScene's own column-spread math (see
// computeColumnSpread in UniverseScene.tsx) can compute the actual visible
// world width at the real fit distance, instead of duplicating/guessing it —
// the two need to agree exactly or the spread targets the wrong scale.
export const CAMERA_FOV_DEG = 45;
// Subscription nodes sit near z ≈ 0–4 (see buildUniverse's position.z), not
// at the background plane's z — computeFitZoom needs its own reference
// depth so "fit the content" isn't measured from the wrong plane.
const CONTENT_Z = 2;
// Breathing room around the packed composition so no cluster sits flush
// against the viewport edge. Tightened from 1.17 — that value was tuned
// against a rougher (over-estimated) side-overlay reserve; with the reserve
// now measured precisely from the real DOM (see UniverseScene.tsx), this can
// run tighter and still leave the corners (EcosystemStats/"Get Free
// Subscriptions" bottom-left, LiveInsights "Top 5" top-right) clear —
// re-verified safe at 1024px, the narrowest width both are visible at
// alongside the full 4-column grid.
export const FIT_PADDING = 1.1;
// The default/auto-fit framing looks slightly right of the composition's
// true horizontal center, which shifts everything left on screen — giving
// the right column of categories clearance from the fixed LiveInsights
// panel (top-right) instead of landing right underneath it. Only applied to
// automatic framing (mount/resize/reset); a deliberate focus-node/focus-mine
// command still centers on the real target, unbiased.
const DEFAULT_X_BIAS = 2.2;

/** Zoom (camera z) at which the abstract canvas plane exactly covers the
 * viewport — like CSS `background-size: cover` — for the given aspect
 * ratio. Used as the zoom-OUT ceiling: panning/scrolling out never reveals
 * background beyond the canvas's finite plane. */
function computeMaxZoom(width: number, height: number): number {
  if (!width || !height) return MAX_ZOOM;
  const aspect = width / height;
  const fovRad = (CAMERA_FOV_DEG * Math.PI) / 180;
  const targetHeight = Math.min(UNIVERSE_WORLD_HEIGHT, UNIVERSE_WORLD_WIDTH / aspect);
  const distance = targetHeight / (2 * Math.tan(fovRad / 2));
  return THREE.MathUtils.clamp(distance + CANVAS_PLANE_Z, MIN_ZOOM, MAX_ZOOM);
}

/** Zoom (camera z) at which the ENTIRE packed universe — every category
 * cluster, not just the biggest one — fits inside the viewport with a
 * comfortable margin, for the given aspect ratio. This is what the default
 * view and "reset" now use, computed from the actual composition's bounds
 * rather than a hand-tuned constant, so it re-fits correctly however many
 * categories/subscriptions the catalogue holds and on every resize. */
export function computeFitZoom(bounds: UniverseBounds, width: number, height: number): number {
  if (!width || !height) return MAX_ZOOM;
  const aspect = width / height;
  const fovRad = (CAMERA_FOV_DEG * Math.PI) / 180;
  const targetWidth = bounds.width * FIT_PADDING;
  const targetHeight = bounds.height * FIT_PADDING;
  const distanceForHeight = targetHeight / (2 * Math.tan(fovRad / 2));
  const distanceForWidth = targetWidth / aspect / (2 * Math.tan(fovRad / 2));
  const distance = Math.max(distanceForHeight, distanceForWidth);
  return THREE.MathUtils.clamp(distance + CONTENT_Z, MIN_ZOOM, MAX_ZOOM);
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

interface Props {
  nodes: UniverseNode[];
  ownedIds: Set<string>;
  bounds: UniverseBounds;
}

export function CameraController({ nodes, ownedIds, bounds }: Props) {
  const { camera, gl, size } = useThree();
  const initialFitZoom = computeFitZoom(bounds, size.width, size.height);
  const maxZoom = useRef(computeMaxZoom(size.width, size.height));
  const fitZoom = useRef(initialFitZoom);
  const desired = useRef({ x: bounds.centerX + DEFAULT_X_BIAS, y: bounds.centerY, zoom: initialFitZoom });
  // Once the visitor drags/zooms/issues a camera command, a resize should no
  // longer yank their view back to the fitted default — it should just keep
  // the pan/zoom bounds in step with the new viewport. "Reset universe"
  // clears this, so resizing after a reset re-fits again.
  const hasInteracted = useRef(false);
  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });
  const pinchDist = useRef<number | null>(null);
  const idleT = useRef(0);

  useEffect(() => {
    maxZoom.current = computeMaxZoom(size.width, size.height);
    fitZoom.current = computeFitZoom(bounds, size.width, size.height);
    // Responsive fit-to-view: as long as the visitor hasn't taken control of
    // the camera yet, keep the default framing exactly fitted to the current
    // viewport (covers both the very first mount and later window resizes).
    if (!hasInteracted.current) {
      desired.current = { x: bounds.centerX + DEFAULT_X_BIAS, y: bounds.centerY, zoom: fitZoom.current };
    }
  }, [size.width, size.height, bounds]);

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
      hasInteracted.current = true;
      dragging.current = true;
      last.current = { x: e.clientX, y: e.clientY };
      trackDown(e.clientX, e.clientY);
      if (discoverMode) setDiscoverMode(false);
      el.style.cursor = "grabbing";
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
      el.style.cursor = "grab";
    }
    function onWheel(e: WheelEvent) {
      e.preventDefault();
      hasInteracted.current = true;
      if (discoverMode) setDiscoverMode(false);
      desired.current.zoom = THREE.MathUtils.clamp(desired.current.zoom + e.deltaY * 0.06, MIN_ZOOM, maxZoom.current);
    }
    function touchDist(t: TouchList) {
      return Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
    }
    function onTouchStart(e: TouchEvent) {
      hasInteracted.current = true;
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
      hasInteracted.current = true;
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
      case "reset":
        // Clears hasInteracted too, so a later window resize re-fits again
        // instead of leaving the camera pinned to this reset position.
        hasInteracted.current = false;
        desired.current = { x: bounds.centerX + DEFAULT_X_BIAS, y: bounds.centerY, zoom: fitZoom.current };
        break;
      case "focus-node": {
        hasInteracted.current = true;
        const node = nodes.find((n) => n.subscription.id === cameraCommand.id);
        if (node) desired.current = { x: node.position.x, y: node.position.y, zoom: MIN_ZOOM + 6 };
        break;
      }
      case "focus-mine": {
        hasInteracted.current = true;
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
      desired.current.x = bounds.centerX + DEFAULT_X_BIAS + Math.sin(idleT.current) * 6;
      desired.current.y = bounds.centerY + Math.cos(idleT.current * 0.7) * 4;
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
