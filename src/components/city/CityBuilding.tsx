"use client";

import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { CityBuilding as CityBuildingType } from "@/types/city";

interface CityBuildingProps {
  building: CityBuildingType;
  isSelected: boolean;
  onSelect: (building: CityBuildingType) => void;
}

export function CityBuilding({
  building,
  isSelected,
  onSelect,
}: CityBuildingProps) {
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);

  const { position, height, color, accentColor, status } = building;

  // Animate selected building — gentle float
  useFrame((_, delta) => {
    if (!groupRef.current) return;
    if (isSelected) {
      groupRef.current.position.y = Math.sin(Date.now() * 0.002) * 0.08;
    } else {
      groupRef.current.position.y = THREE.MathUtils.lerp(
        groupRef.current.position.y,
        0,
        delta * 4
      );
    }
  });

  // Construction animation for "building" status
  const isUnderConstruction = status === "building";

  const baseColor = hovered
    ? new THREE.Color(color).multiplyScalar(1.4)
    : isSelected
    ? new THREE.Color(color).multiplyScalar(1.6)
    : new THREE.Color(color);

  const emissiveIntensity = isSelected ? 0.3 : hovered ? 0.15 : 0;

  return (
    <group
      ref={groupRef}
      position={[position[0], position[1], position[2]]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(building);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = "auto";
      }}
    >
      {/* Building base / plinth */}
      <mesh position={[0, 0.08, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.4, 0.16, 1.4]} />
        <meshStandardMaterial color={accentColor} roughness={0.6} />
      </mesh>

      {/* Main tower body */}
      <mesh
        ref={meshRef}
        position={[0, height / 2 + 0.16, 0]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[1.1, height, 1.1]} />
        <meshStandardMaterial
          color={baseColor}
          emissive={baseColor}
          emissiveIntensity={emissiveIntensity}
          roughness={0.4}
          metalness={0.1}
        />
      </mesh>

      {/* Upper accent floor */}
      <mesh position={[0, height + 0.22, 0]} castShadow>
        <boxGeometry args={[1.2, 0.12, 1.2]} />
        <meshStandardMaterial color={accentColor} roughness={0.3} metalness={0.2} />
      </mesh>

      {/* Roof detail */}
      <mesh position={[0, height + 0.38, 0]}>
        <boxGeometry args={[0.6, 0.28, 0.6]} />
        <meshStandardMaterial color={accentColor} roughness={0.2} metalness={0.3} />
      </mesh>

      {/* Status indicator — blinking light on top */}
      {!isUnderConstruction && (
        <mesh position={[0, height + 0.56, 0]}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshStandardMaterial
            color={isSelected ? "#ffffff" : accentColor}
            emissive={accentColor}
            emissiveIntensity={isSelected ? 1.5 : 0.8}
          />
        </mesh>
      )}

      {/* Construction scaffolding for "building" status */}
      {isUnderConstruction && (
        <>
          {[[-0.55, 0.55], [0.55, -0.55], [-0.55, -0.55], [0.55, 0.55]].map(
            ([sx, sz], i) => (
              <mesh key={i} position={[sx, height / 2 + 0.16, sz]}>
                <boxGeometry args={[0.06, height + 0.4, 0.06]} />
                <meshStandardMaterial color="#94a3b8" roughness={0.8} />
              </mesh>
            )
          )}
          <mesh position={[0, height + 0.45, 0]}>
            <boxGeometry args={[1.25, 0.06, 1.25]} />
            <meshStandardMaterial color="#cbd5e1" roughness={0.8} />
          </mesh>
        </>
      )}

      {/* Selected ring */}
      {isSelected && (
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.85, 1.0, 32]} />
          <meshBasicMaterial color={accentColor} transparent opacity={0.7} />
        </mesh>
      )}
    </group>
  );
}
