"use client";

import { OrbitControls } from "@react-three/drei";

export function CityCamera() {
  return (
    <OrbitControls
      // Isometric-ish view constraints
      minPolarAngle={Math.PI / 6}   // ~30° — don't go too flat
      maxPolarAngle={Math.PI / 2.8} // ~64° — don't go straight down
      minDistance={8}
      maxDistance={38}
      // Start at a nice isometric angle
      target={[0, 0, 0]}
      enablePan={true}
      panSpeed={0.6}
      rotateSpeed={0.4}
      zoomSpeed={0.7}
      // Smooth damping
      enableDamping={true}
      dampingFactor={0.06}
    />
  );
}
