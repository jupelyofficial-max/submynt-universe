"use client";

import { Sparkles, Stars } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type * as THREE from "three";

export function StarField() {
  const starsRef = useRef<THREE.Points>(null);
  const sparklesRef = useRef<THREE.Points>(null);

  useFrame((_, delta) => {
    if (starsRef.current) starsRef.current.rotation.z += delta * 0.0025;
    if (sparklesRef.current) sparklesRef.current.rotation.y += delta * 0.01;
  });

  return (
    <group>
      <Stars ref={starsRef} radius={220} depth={90} count={4200} factor={2.6} saturation={0} fade speed={0.35} />
      <Sparkles
        ref={sparklesRef}
        count={140}
        scale={[110, 70, 70]}
        size={2.2}
        speed={0.12}
        color="#e37d3d"
        opacity={0.4}
      />
      <Sparkles count={90} scale={[90, 55, 55]} size={1.4} speed={0.08} color="#45b79e" opacity={0.25} />
    </group>
  );
}
