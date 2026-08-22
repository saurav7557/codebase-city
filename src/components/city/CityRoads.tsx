"use client";

// Road segments connecting the core district to each outer district.
// Each segment is a flat box laid on the ground plane.
// Positions are derived from the district layout in city.ts.

const roads: Array<{
  position: [number, number, number];
  rotation: [number, number, number];
  length: number;
}> = [
  // Core → Backend (West-Southwest)
  { position: [-4.5, 0.005, -3], rotation: [0, Math.atan2(-6, -9) + Math.PI / 2, 0], length: 10.8 },
  // Core → AI (East-Southeast)
  { position: [4.5, 0.005, -3], rotation: [0, Math.atan2(-6, 9) - Math.PI / 2, 0], length: 10.8 },
  // Core → Blockchain (West-Northwest)
  { position: [-4.5, 0.005, 3], rotation: [0, Math.atan2(6, -9) + Math.PI / 2, 0], length: 10.8 },
  // Core → Open Source (East-Northeast)
  { position: [4.5, 0.005, 3], rotation: [0, Math.atan2(6, 9) - Math.PI / 2, 0], length: 10.8 },
  // Core → Achievements (South)
  { position: [0, 0.005, -5], rotation: [0, 0, 0], length: 10 },
];

export function CityRoads() {
  return (
    <group>
      {roads.map((road, i) => (
        <mesh
          key={i}
          position={road.position}
          rotation={road.rotation}
          receiveShadow
        >
          <boxGeometry args={[0.55, 0.01, road.length]} />
          <meshStandardMaterial
            color="#d0ccbf"
            roughness={0.95}
            metalness={0}
          />
        </mesh>
      ))}

      {/* Road center-line markings */}
      {roads.map((road, i) => (
        <mesh
          key={`line-${i}`}
          position={[road.position[0], road.position[1] + 0.006, road.position[2]]}
          rotation={road.rotation}
        >
          <boxGeometry args={[0.04, 0.005, road.length]} />
          <meshStandardMaterial
            color="#b8b4a8"
            roughness={1}
            metalness={0}
          />
        </mesh>
      ))}
    </group>
  );
}
