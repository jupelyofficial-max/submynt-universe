"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { UniverseNode } from "@/types/subscription";
import { getGlowTexture, getLogoTexture } from "./logoTexture";
import { useUniverseStore } from "@/store/useUniverseStore";
import { trackDown, wasDrag } from "@/lib/dragTracker";

interface Props {
  node: UniverseNode;
  isOwned: boolean;
  dimmed: boolean;
  categoryDimmed?: boolean;
  hasSavings: boolean;
  seed: number;
}

export function SubscriptionNode({ node, isOwned, dimmed, categoryDimmed, hasSavings, seed }: Props) {
  const spriteRef = useRef<THREE.Sprite>(null);
  const glowRef = useRef<THREE.Sprite>(null);
  const badgeRef = useRef<THREE.Sprite>(null);
  const groupRef = useRef<THREE.Group>(null);
  const { gl } = useThree();
  // Plain ref, reassigned in an effect rather than read straight off `gl` in
  // the pointer handlers below — mutating a DOM property reached directly
  // through a hook's return value trips the react-hooks/immutability rule.
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    canvasRef.current = gl.domElement;
  }, [gl]);
  const texture = useMemo(() => getLogoTexture(node.subscription), [node.subscription]);
  const glowTexture = useMemo(() => getGlowTexture(), []);
  const id = node.subscription.id;

  const hovered = useUniverseStore((s) => s.hoveredId === id);
  const selected = useUniverseStore((s) => s.selectedId === id);
  const setHovered = useUniverseStore((s) => s.setHovered);
  const select = useUniverseStore((s) => s.select);
  const sendCameraCommand = useUniverseStore((s) => s.sendCameraCommand);

  const baseScale = node.radius * 2.8;

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (!groupRef.current) return;
    const floatY = Math.sin(t * 0.35 + seed) * 0.6;
    const floatX = Math.cos(t * 0.28 + seed * 1.7) * 0.35;
    groupRef.current.position.set(node.position.x + floatX, node.position.y + floatY, node.position.z);

    const targetScale = baseScale * (hovered ? 1.4 : selected ? 1.25 : 1) * (dimmed ? 0.8 : 1);
    if (spriteRef.current) {
      const s = THREE.MathUtils.lerp(spriteRef.current.scale.x || baseScale, targetScale, 0.15);
      spriteRef.current.scale.set(s, s, 1);
      const mat = spriteRef.current.material as THREE.SpriteMaterial;
      const opacityTarget = dimmed ? 0.25 : categoryDimmed ? 0.5 : 1;
      mat.opacity = THREE.MathUtils.lerp(mat.opacity, opacityTarget, 0.12);
    }
    if (glowRef.current) {
      // Idle scale/opacity trimmed down — with categories packed this
      // closely, every icon's own glow was overlapping its neighbors' too,
      // compounding into the same washed-out look as the background glow.
      // Hover/owned states stay prominent as genuine interaction feedback.
      const glowScale = targetScale * (hovered || isOwned ? 2.4 : 1.3);
      glowRef.current.scale.set(glowScale, glowScale, 1);
      const gmat = glowRef.current.material as THREE.SpriteMaterial;
      const targetOpacity = dimmed ? 0.03 : categoryDimmed ? 0.05 : hovered ? 0.5 : isOwned ? 0.28 : 0.07;
      gmat.opacity = THREE.MathUtils.lerp(gmat.opacity, targetOpacity, 0.12);
    }
    if (badgeRef.current) {
      const bs = targetScale * 0.4;
      badgeRef.current.scale.set(bs, bs, 1);
      badgeRef.current.position.set(targetScale * 0.32, targetScale * 0.32, 0.02);
    }
  });

  return (
    <group ref={groupRef}>
      <sprite ref={glowRef} renderOrder={0}>
        <spriteMaterial
          map={glowTexture}
          color={isOwned ? "#7fd9c4" : node.subscription.color}
          transparent
          depthWrite={false}
          opacity={0.13}
        />
      </sprite>
      <sprite
        ref={spriteRef}
        renderOrder={1}
        onPointerOver={(e) => {
          e.stopPropagation();
          // Standard arrow over a clickable icon — the canvas's own default
          // is "grab" (this whole area pans), so icons need an explicit
          // override to read as "click", not "drag", targets.
          if (canvasRef.current) canvasRef.current.style.cursor = "default";
          setHovered(id);
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          if (canvasRef.current) canvasRef.current.style.cursor = "grab";
          setHovered(null);
        }}
        onPointerDown={(e) => {
          e.stopPropagation();
          trackDown(e.clientX, e.clientY);
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (wasDrag()) return;
          select(id);
          sendCameraCommand({ type: "focus-node", id });
        }}
      >
        <spriteMaterial map={texture} transparent depthWrite={false} />
      </sprite>
      {hasSavings && (
        <sprite ref={badgeRef} renderOrder={2}>
          <spriteMaterial map={glowTexture} color="#e8a83c" transparent depthWrite={false} opacity={0.95} />
        </sprite>
      )}
    </group>
  );
}
