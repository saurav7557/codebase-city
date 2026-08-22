"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import type { CityDistrict as CityDistrictType } from "@/types/city";

interface CityDistrictProps {
  district: CityDistrictType;
}

export function CityDistrict({ district }: CityDistrictProps) {
  const ringRef = useRef<THREE.Mesh>(null);

  // Subtle pulse on the district ring
  useFrame(() => {
    if (!ringRef.current) return;
    const mat = ringRef.current.material as THREE.MeshBasicMaterial;
    mat.opacity = 0.12 + Math.sin(Date.now() * 0.001) * 0.04;
  });

  const { center, radius, color, name } = district;

  return (
    <group position={[center[0], 0, center[1]]}>
      {/* District boundary fill */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[radius - 0.3, radius, 64]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.15}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* District fill area */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <circleGeometry args={[radius - 0.3, 64]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.04}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* District label */}
      <Text
        position={[0, 0.05, radius - 0.8]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.28}
        color={color}
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.05}
        font={undefined}
      >
        {name.toUpperCase()}
      </Text>
    </group>
  );
}
