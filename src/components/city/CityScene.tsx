"use client";

import { Suspense, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, AdaptiveDpr } from "@react-three/drei";

import { cityData } from "@/data/city";
import type { CityBuilding } from "@/types/city";

import { CityCamera } from "./CityCamera";
import { CityGround } from "./CityGround";
import { CityRoads } from "./CityRoads";
import { CityBuilding as CityBuildingMesh } from "./CityBuilding";
import { CityDistrict } from "./CityDistrict";

function SceneContent({
  selectedId,
  onSelect,
}: {
  selectedId: string | null;
  onSelect: (b: CityBuilding) => void;
}) {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.7} color="#f8f4ec" />
      <directionalLight
        position={[12, 20, 8]}
        intensity={1.4}
        color="#fff8f0"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={80}
        shadow-camera-left={-30}
        shadow-camera-right={-30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
      />
      <directionalLight
        position={[-8, 10, -6]}
        intensity={0.3}
        color="#e0e8ff"
      />

      {/* Environment */}
      <Environment preset="city" environmentIntensity={0.2} />

      {/* Ground */}
      <CityGround />

      {/* Roads */}
      <CityRoads />

      {/* Districts */}
      {cityData.districts.map((district) => (
        <CityDistrict key={district.id} district={district} />
      ))}

      {/* Buildings — data-driven */}
      {cityData.buildings.map((building) => (
        <CityBuildingMesh
          key={building.id}
          building={building}
          isSelected={selectedId === building.id}
          onSelect={onSelect}
        />
      ))}

      {/* Camera controls */}
      <CityCamera />
    </>
  );
}

interface CitySceneProps {
  selectedId: string | null;
  onSelect: (building: CityBuilding | null) => void;
}

export function CityScene({ selectedId, onSelect }: CitySceneProps) {
  const handleSelect = useCallback(
    (building: CityBuilding) => {
      onSelect(selectedId === building.id ? null : building);
    },
    [selectedId, onSelect]
  );

  const handleMiss = useCallback(() => {
    onSelect(null);
  }, [onSelect]);

  return (
    <div className="relative h-full w-full">
      <Canvas
        className="h-full w-full"
        camera={{
          position: [16, 14, 16],
          fov: 42,
          near: 0.1,
          far: 200,
        }}
        shadows="soft"
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
        }}
        onPointerMissed={handleMiss}
      >
        <color attach="background" args={["#f0ece0"]} />
        <fog attach="fog" args={["#f0ece0", 60, 90]} />

        <Suspense fallback={null}>
          <SceneContent selectedId={selectedId} onSelect={handleSelect} />
        </Suspense>

        <AdaptiveDpr pixelated />
      </Canvas>
    </div>
  );
}
