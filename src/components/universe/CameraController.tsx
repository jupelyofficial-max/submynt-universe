"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { UniverseNode } from "@/types/subscription";
import { useUniverseStore } from "@/store/useUniverseStore";
import { trackDown, trackMove } from "@/lib/dragTracker";
import { WORLD_MAP_WORLD_HEIGHT, WORLD_MAP_WORLD_WIDTH } from "@/lib/geo";

export const MIN_ZOOM = 20;
export const MAX_ZOOM = 130;
export const DEFAULT_ZOOM = 92;

// Must match WorldMapBackground's mesh position and UniverseScene's camera fov.
const MAP_PLANE_Z = -18;
const CAMERA_FOV_DEG = 45;

/** Zoom (camera z) at which the map plane exactly covers the viewport — like
 * CSS `background-size: cover` — for the given canvas aspect ratio, so there's
 * no empty background showing around the map regardless of window shape. */
function computeFitZoom(width: number, height: number): number {
  if (!width || !height) return DEFAULT_ZOOM;
  const aspect = width / height;
  const fovRad = (CAMERA_FOV_DEG * Math.PI) / 180;
  const targetHeight = Math.min(WORLD_MAP_WORLD_HEIGHT, WORLD_MAP_WORLD_WIDTH / aspect);
  const distance = targetHeight / (2 * Math.tan(fovRad / 2));
  return THREE.MathUtils.clamp(distance + MAP_PLANE_Z, MIN_ZOOM, MAX_ZOOM);
}

interface Props {
  nodes: UniverseNode[];
  ownedIds: Set<string>;
}

export function CameraController({ nodes, ownedIds }: Props) {
  const { camera, gl, size } = useThree();
  const initialFitZoom = computeFitZoom(size.width, size.height);
  const fitZoom = useRef(initialFitZoom);
  const desired = useRef({ x: 0, y: 0, zoom: initialFitZoom });
  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });
  const pinchDist = useRef<number | null>(null);
  const pointerNorm = useRef({ x: 0, y: 0 });
  const idleT = useRef(0);

  useEffect(() => {
    fitZoom.current = computeFitZoom(size.width, size.height);
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
      const rect = el.getBoundingClientRect();
      pointerNorm.current = {
        x: ((e.clientX - rect.left) / rect.width) * 2 - 1,
        y: ((e.clientY - rect.top) / rect.height) * 2 - 1,
      };
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
      desired.current.zoom = THREE.MathUtils.clamp(desired.current.zoom + e.deltaY * 0.06, MIN_ZOOM, MAX_ZOOM);
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
        desired.current.zoom = THREE.MathUtils.clamp(desired.current.zoom + delta * 0.18, MIN_ZOOM, MAX_ZOOM);
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
      desired.current.zoom = THREE.MathUtils.clamp(desired.current.zoom * 0.55, MIN_ZOOM, MAX_ZOOM);
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
        desired.current.zoom = THREE.MathUtils.clamp(desired.current.zoom + cameraCommand.delta, MIN_ZOOM, MAX_ZOOM);
        break;
      case "reset":
        desired.current = { x: 0, y: 0, zoom: fitZoom.current };
        break;
      case "focus-node": {
        const node = nodes.find((n) => n.subscription.id === cameraCommand.id);
        if (node) desired.current = { x: node.position.x, y: node.position.y, zoom: MIN_ZOOM + 12 };
        break;
      }
      case "focus-mine": {
        const mine = nodes.filter((n) => ownedIds.has(n.subscription.id));
        if (mine.length) {
          const cx = mine.reduce((sum, n) => sum + n.position.x, 0) / mine.length;
          const cy = mine.reduce((sum, n) => sum + n.position.y, 0) / mine.length;
          desired.current = { x: cx, y: cy, zoom: Math.max(MIN_ZOOM + 8, 46) };
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
      desired.current.x = Math.sin(idleT.current) * 26;
      desired.current.y = Math.cos(idleT.current * 0.7) * 15;
    }
    const damp = 1 - Math.pow(0.0015, delta);
    const parallaxX = dragging.current ? 0 : pointerNorm.current.x * 2.4;
    const parallaxY = dragging.current ? 0 : -pointerNorm.current.y * 1.6;

    camera.position.x = THREE.MathUtils.lerp(camera.position.x, desired.current.x + parallaxX, damp);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, desired.current.y + parallaxY, damp);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, desired.current.zoom, damp);
    camera.lookAt(camera.position.x - parallaxX, camera.position.y - parallaxY, 0);
  });
  /* eslint-enable react-hooks/immutability */

  return null;
}
