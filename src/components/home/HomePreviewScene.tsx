"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { getLogoTexture } from "@/components/universe/logoTexture";
import { buildUniverse } from "@/lib/universeLayout";
import { SUBSCRIPTIONS } from "@/data/subscriptions";
import type { UniverseNode } from "@/types/subscription";

function seedFromId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 100000;
  return (h / 100000) * Math.PI * 2;
}

function DriftSprite({ node }: { node: UniverseNode }) {
  const ref = useRef<THREE.Sprite>(null);
  const texture = useMemo(() => getLogoTexture(node.subscription), [node.subscription]);
  const seed = useMemo(() => seedFromId(node.subscription.id), [node.subscription.id]);
  const scale = node.radius * 2.5;

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.position.set(
      node.position.x * 0.95,
      node.position.y * 0.85 + Math.sin(t * 0.3 + seed) * 0.7,
      node.position.z * 0.4
    );
  });

  return (
    <sprite ref={ref} scale={[scale, scale, 1]}>
      <spriteMaterial map={texture} transparent depthWrite={false} opacity={0.55} />
    </sprite>
  );
}

function DriftingNodes() {
  const nodes = useMemo(() => {
    const top = [...SUBSCRIPTIONS].sort((a, b) => b.popularity - a.popularity).slice(0, 34);
    return buildUniverse(top);
  }, []);
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.z += delta * 0.012;
  });

  return (
    <group ref={groupRef}>
      {nodes.map((n) => (
        <DriftSprite key={n.subscription.id} node={n} />
      ))}
    </group>
  );
}

export function HomePreviewScene() {
  return (
    <Canvas camera={{ position: [0, 4, 70], fov: 50 }} gl={{ alpha: true }} dpr={[1, 1.6]}>
      <ambientLight intensity={0.8} />
      <DriftingNodes />
    </Canvas>
  );
}
