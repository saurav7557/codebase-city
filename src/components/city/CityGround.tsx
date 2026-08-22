"use client";

export function CityGround() {
  return (
    <group>
      {/* Main ground plane */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.01, 0]}
        receiveShadow
      >
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial
          color="#e8e4d9"
          roughness={0.95}
          metalness={0}
        />
      </mesh>

      {/* Subtle grid overlay for scale/reference */}
      <gridHelper
        args={[80, 40, "#c8c4b8", "#d8d4c8"]}
        position={[0, 0.001, 0]}
      />

      {/* City pad — slightly raised central area */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]} receiveShadow>
        <planeGeometry args={[36, 36]} />
        <meshStandardMaterial
          color="#f0ece0"
          roughness={0.9}
          metalness={0}
        />
      </mesh>
    </group>
  );
}
