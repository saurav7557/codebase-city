"use client";

import { useEffect, useRef } from "react";
import { OrbitControls } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

// ─────────────────────────────────────────────────────────────────────────────
// CityCamera — OrbitControls wrapper with CustomEvent integration
//
// CityControls.tsx dispatches these window events:
//   citycamera:zoom   { detail: factor }  — dolly in/out
//   citycamera:reset                      — return to initial position
//   citycamera:fit                        — overview / fit-all
//
// This component listens for those events and drives the OrbitControls ref.
// The DOM ↔ Three.js bridge is entirely contained here — no props threading.
// ─────────────────────────────────────────────────────────────────────────────

export function CityCamera() {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { camera } = useThree();

  // Initial camera position for reset
  const INITIAL_POSITION = { x: 16, y: 14, z: 16 } as const;
  const FIT_POSITION     = { x: 0,  y: 28, z: 28 } as const;

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    function handleZoom(e: Event) {
      const factor = (e as CustomEvent<number>).detail ?? 1;
      // Dolly by scaling the camera's distance from target
      const pos = camera.position;
      const target = controls!.target;
      pos.sub(target).multiplyScalar(factor).add(target);
      controls!.update();
    }

    function handleReset() {
      camera.position.set(INITIAL_POSITION.x, INITIAL_POSITION.y, INITIAL_POSITION.z);
      controls!.target.set(0, 0, 0);
      controls!.update();
    }

    function handleFit() {
      camera.position.set(FIT_POSITION.x, FIT_POSITION.y, FIT_POSITION.z);
      controls!.target.set(0, 0, 0);
      controls!.update();
    }

    window.addEventListener("citycamera:zoom",  handleZoom);
    window.addEventListener("citycamera:reset", handleReset);
    window.addEventListener("citycamera:fit",   handleFit);

    return () => {
      window.removeEventListener("citycamera:zoom",  handleZoom);
      window.removeEventListener("citycamera:reset", handleReset);
      window.removeEventListener("citycamera:fit",   handleFit);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera]);

  return (
    <OrbitControls
      ref={controlsRef}
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
