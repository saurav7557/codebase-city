"use client";

import { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { CityBuilding as CityBuildingType } from "@/types/city";

// ─────────────────────────────────────────────────────────────────────────────
// CityBuilding — Refined Architectural Technology Campus
//
// Clean architectural master plan grid:
// - Unified campus orientation: ISOMETRIC_GRID_ROTATION (Math.PI / 4)
// - Every building's parent group shares this exact rotation
// - Every building's front facade and nameplate are aligned to local +Z
// - All nameplates are flush, centered on front facades, and face the default camera
// - Clean white concrete (#f8fafc) & crisp horizontal floor slabs (#ffffff)
// - Dark materials restricted strictly to intentional windows, glazing, and signs
// - Central Saurav HQ stands out as the definitive signature landmark tower
// - Preserves all building IDs, coordinates, selection state, and camera controls
// ─────────────────────────────────────────────────────────────────────────────

interface CityBuildingProps {
  building: CityBuildingType;
  isSelected: boolean;
  onSelect: (building: CityBuildingType) => void;
}

// Canonical campus grid orientation matching isometric camera [16, 14, 16]
const ISOMETRIC_GRID_ROTATION = Math.PI / 4; // 45 degrees

// ─────────────────────────────────────────────────────────────────────────────
// High-Resolution Nameplate Canvas Texture Generator
// 1024x280 retina resolution, bold pure white typography, district accent bar.
// ─────────────────────────────────────────────────────────────────────────────
function createNameplateTexture(
  title: string,
  accentColor: string,
  isHQ = false
): THREE.CanvasTexture {
  if (typeof document === "undefined") {
    const dummy = { width: 512, height: 140 };
    return new THREE.CanvasTexture(dummy as unknown as HTMLCanvasElement);
  }

  const width = 1024;
  const height = 280;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Deep dark navy/charcoal background
  ctx.fillStyle = "#090d16";
  ctx.fillRect(0, 0, width, height);

  // Subtle interior gradient
  const grad = ctx.createLinearGradient(0, 0, width, 0);
  grad.addColorStop(0, "rgba(15, 23, 42, 0.98)");
  grad.addColorStop(0.5, "rgba(30, 41, 59, 0.90)");
  grad.addColorStop(1, "rgba(15, 23, 42, 0.98)");
  ctx.fillStyle = grad;
  ctx.fillRect(6, 6, width - 12, height - 12);

  // Clean refined border
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = isHQ ? 8 : 6;
  ctx.strokeRect(6, 6, width - 12, height - 12);

  // High-contrast corner accents
  ctx.fillStyle = "#ffffff";
  const cornerSize = 12;
  ctx.fillRect(4, 4, cornerSize, cornerSize);
  ctx.fillRect(width - 4 - cornerSize, 4, cornerSize, cornerSize);
  ctx.fillRect(4, height - 4 - cornerSize, cornerSize, cornerSize);
  ctx.fillRect(width - 4 - cornerSize, height - 4 - cornerSize, cornerSize, cornerSize);

  // Left district accent indicator bar
  ctx.fillStyle = accentColor;
  ctx.fillRect(16, 20, 14, height - 40);

  // Top accent line
  ctx.fillRect(16, 12, width - 32, 4);

  // Typography: Clean, massive, bold, perfectly centered
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#ffffff";

  let fontSize = isHQ ? 118 : 105;
  if (title.length > 15) fontSize = 84;
  else if (title.length > 12) fontSize = 92;
  else if (title.length > 10) fontSize = 100;

  ctx.font = `900 ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif`;
  ctx.shadowColor = accentColor;
  ctx.shadowBlur = isHQ ? 20 : 12;

  // Text offset slightly to right to account for left accent bar
  ctx.fillText(title, width / 2 + 10, height / 2 + 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

// ─────────────────────────────────────────────────────────────────────────────
// Integrated Architectural Nameplate Mesh
// Mounted flush and centered on the building's front facade
// ─────────────────────────────────────────────────────────────────────────────
function BuildingSignagePlate({
  title,
  accentColor,
  width,
  height,
  position,
  isHQ = false,
}: {
  title: string;
  accentColor: string;
  width: number;
  height: number;
  position: [number, number, number];
  isHQ?: boolean;
}) {
  const texture = useMemo(
    () => createNameplateTexture(title, accentColor, isHQ),
    [title, accentColor, isHQ]
  );

  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: texture,
        emissive: new THREE.Color("#ffffff"),
        emissiveMap: texture,
        emissiveIntensity: 0.45,
        roughness: 0.2,
        metalness: 0.1,
      }),
    [texture]
  );

  const frameMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#0f172a",
        roughness: 0.5,
        metalness: 0.3,
      }),
    []
  );

  return (
    <group position={position}>
      {/* Sleek dark mounting frame */}
      <mesh position={[0, 0, -0.015]} material={frameMaterial} castShadow>
        <boxGeometry args={[width + 0.08, height + 0.08, 0.03]} />
      </mesh>
      {/* Backlit high-contrast canvas plate */}
      <mesh position={[0, 0, 0.01]} material={material}>
        <planeGeometry args={[width, height]} />
      </mesh>
    </group>
  );
}

export function CityBuilding({
  building,
  isSelected,
  onSelect,
}: CityBuildingProps) {
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef<THREE.Group>(null);

  const { id, type, position, height, color, accentColor, status } = building;

  // Gentle float oscillation on selected building
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

  const isUnderConstruction = status === "building";

  // Shared architectural material palette
  const materials = useMemo(() => {
    const baseCol = new THREE.Color(color);
    if (hovered) baseCol.multiplyScalar(1.2);
    else if (isSelected) baseCol.multiplyScalar(1.3);

    const emissiveIntensity = isSelected ? 0.3 : hovered ? 0.15 : 0.04;

    return {
      // Primary district architectural concrete/panel
      base: new THREE.MeshStandardMaterial({
        color: baseCol,
        emissive: baseCol,
        emissiveIntensity,
        roughness: 0.45,
        metalness: 0.1,
      }),
      // Warm, pristine white architectural concrete for main walls
      wall: new THREE.MeshStandardMaterial({
        color: "#f8fafc",
        roughness: 0.55,
        metalness: 0.02,
      }),
      // Crisp white horizontal floor slab plates
      slab: new THREE.MeshStandardMaterial({
        color: "#ffffff",
        roughness: 0.35,
        metalness: 0.06,
      }),
      // Light warm limestone plinth base
      plinth: new THREE.MeshStandardMaterial({
        color: "#e2ddd2",
        roughness: 0.75,
        metalness: 0.02,
      }),
      // District accent color
      accent: new THREE.MeshStandardMaterial({
        color: accentColor,
        roughness: 0.3,
        metalness: 0.2,
      }),
      // Intentional deep architectural tinted glass for windows only
      glass: new THREE.MeshStandardMaterial({
        color: "#111827",
        roughness: 0.15,
        metalness: 0.7,
      }),
      // Slender structural graphite columns
      frame: new THREE.MeshStandardMaterial({
        color: "#334155",
        roughness: 0.45,
        metalness: 0.5,
      }),
    };
  }, [color, accentColor, hovered, isSelected]);

  return (
    <group
      ref={groupRef}
      position={[position[0], position[1], position[2]]}
      rotation={[0, ISOMETRIC_GRID_ROTATION, 0]}
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
      {/* ── Typology Architecture ─────────────────────────────────── */}
      {id === "saurav-hq" ? (
        <SauravHQArchitecture mats={materials} accentColor={accentColor} height={height} />
      ) : id === "meshpay-tower" ? (
        <MeshPayArchitecture mats={materials} accentColor={accentColor} height={height} />
      ) : id === "groweasy-ai-lab" ? (
        <GrowEasyArchitecture mats={materials} accentColor={accentColor} height={height} />
      ) : id === "ai-ip-protection" ? (
        <IpProtectionArchitecture mats={materials} accentColor={accentColor} height={height} />
      ) : id === "blockchain-verification-hub" ? (
        <BlockchainHubArchitecture mats={materials} accentColor={accentColor} height={height} />
      ) : id === "open-source-hub" || isUnderConstruction ? (
        <OpenSourcePavilionArchitecture mats={materials} accentColor={accentColor} height={height} />
      ) : id === "achievement-center" || type === "achievement" ? (
        <AchievementArchitecture mats={materials} accentColor={accentColor} height={height} />
      ) : (
        <GenericPavilionArchitecture mats={materials} accentColor={accentColor} height={height} />
      )}

      {/* ── Architectural Blueprint Selection Brackets ────────────── */}
      {isSelected && (
        <SelectionFootprint accentColor={accentColor} />
      )}
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Architectural Materials Interface
// ─────────────────────────────────────────────────────────────────────────────
interface ArchMaterials {
  base: THREE.MeshStandardMaterial;
  wall: THREE.MeshStandardMaterial;
  slab: THREE.MeshStandardMaterial;
  plinth: THREE.MeshStandardMaterial;
  accent: THREE.MeshStandardMaterial;
  glass: THREE.MeshStandardMaterial;
  frame: THREE.MeshStandardMaterial;
}

// ─────────────────────────────────────────────────────────────────────────────
// 01. Saurav HQ — Signature Central Landmark Skyscraper
// Position: [0, 0, 0] -> Faces default camera head-on via parent rotation
// ─────────────────────────────────────────────────────────────────────────────
function SauravHQArchitecture({
  mats,
  accentColor,
}: {
  mats: ArchMaterials;
  accentColor: string;
  height: number;
}) {
  return (
    <group>
      {/* ── Stepped Foundation Plinth ── */}
      <mesh position={[0, 0.08, 0]} material={mats.plinth} castShadow receiveShadow>
        <boxGeometry args={[4.2, 0.16, 4.2]} />
      </mesh>
      <mesh position={[0, 0.18, 0]} material={mats.plinth} castShadow receiveShadow>
        <boxGeometry args={[3.6, 0.06, 3.6]} />
      </mesh>

      {/* ── Ground Lobby Pavilion (Dark Glass Entrance) ── */}
      <mesh position={[0, 0.75, 0]} material={mats.wall} castShadow receiveShadow>
        <boxGeometry args={[3.2, 1.1, 3.2]} />
      </mesh>
      {/* Dark Glass Lobby Envelope */}
      <mesh position={[0, 0.75, 0]} material={mats.glass}>
        <boxGeometry args={[3.24, 0.7, 3.24]} />
      </mesh>
      {/* Lobby Floor Slab */}
      <mesh position={[0, 1.34, 0]} material={mats.slab} castShadow>
        <boxGeometry args={[3.4, 0.08, 3.4]} />
      </mesh>

      {/* ── Main Tower Shaft (Tall, Sleek Architectural Core) ── */}
      <mesh position={[0, 3.2, 0]} material={mats.wall} castShadow receiveShadow>
        <boxGeometry args={[2.5, 3.6, 2.5]} />
      </mesh>

      {/* Horizontal Dark Window Bands */}
      {[2.1, 2.9, 3.7].map((wy, i) => (
        <mesh key={i} position={[0, wy, 0]} material={mats.glass}>
          <boxGeometry args={[2.54, 0.42, 2.54]} />
        </mesh>
      ))}

      {/* Crisp White Horizontal Floor Slabs */}
      {[2.45, 3.25, 4.05].map((sy, i) => (
        <mesh key={i} position={[0, sy, 0]} material={mats.slab} castShadow>
          <boxGeometry args={[2.7, 0.06, 2.7]} />
        </mesh>
      ))}

      {/* ── Executive Observation Penthouse ── */}
      <mesh position={[0, 5.2, 0]} material={mats.slab} castShadow>
        <boxGeometry args={[2.9, 0.1, 2.9]} />
      </mesh>
      <mesh position={[0, 5.6, 0]} material={mats.wall} castShadow receiveShadow>
        <boxGeometry args={[2.0, 0.7, 2.0]} />
      </mesh>
      {/* Penthouse Glass */}
      <mesh position={[0, 5.6, 0]} material={mats.glass}>
        <boxGeometry args={[2.04, 0.45, 2.04]} />
      </mesh>

      {/* Crown Roof Slab & Spire */}
      <mesh position={[0, 6.0, 0]} material={mats.slab} castShadow>
        <boxGeometry args={[2.2, 0.08, 2.2]} />
      </mesh>
      <mesh position={[0, 6.55, 0]} material={mats.accent} castShadow>
        <boxGeometry args={[0.08, 1.0, 0.08]} />
      </mesh>

      {/* ── Prominent Facade Nameplate (SAURAV HQ) ── */}
      {/* Mounted flush on the front facade wall */}
      <BuildingSignagePlate
        title="SAURAV HQ"
        accentColor={accentColor}
        width={3.4}
        height={1.05}
        position={[0, 2.35, 1.28]}
        isHQ
      />
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 02. MeshPay Tower — Modern Fintech Headquarters
// Position: [-9, 0, -6] in Backend District
// ─────────────────────────────────────────────────────────────────────────────
function MeshPayArchitecture({
  mats,
  accentColor,
}: {
  mats: ArchMaterials;
  accentColor: string;
  height: number;
}) {
  return (
    <group>
      {/* Plinth */}
      <mesh position={[0, 0.08, 0]} material={mats.plinth} castShadow receiveShadow>
        <boxGeometry args={[3.8, 0.16, 3.2]} />
      </mesh>

      {/* Main Corporate Wing */}
      <mesh position={[0, 1.8, 0]} material={mats.wall} castShadow receiveShadow>
        <boxGeometry args={[3.1, 3.3, 2.5]} />
      </mesh>

      {/* Intentional Horizontal Window Bands */}
      {[1.25, 2.25].map((wy, i) => (
        <mesh key={i} position={[0, wy, 0]} material={mats.glass}>
          <boxGeometry args={[3.14, 0.45, 2.54]} />
        </mesh>
      ))}

      {/* Horizontal White Floor Slabs */}
      {[1.6, 2.6, 3.5].map((sy, i) => (
        <mesh key={i} position={[0, sy, 0]} material={mats.slab} castShadow>
          <boxGeometry args={[3.3, 0.06, 2.7]} />
        </mesh>
      ))}

      {/* Rooftop Plant Box */}
      <mesh position={[0, 3.75, 0]} material={mats.frame} castShadow>
        <boxGeometry args={[1.5, 0.4, 1.1]} />
      </mesh>

      {/* ── Prominent Facade Nameplate (MESHPAY) ── */}
      <BuildingSignagePlate
        title="MESHPAY"
        accentColor={accentColor}
        width={2.8}
        height={0.85}
        position={[0, 1.95, 1.28]}
      />
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 03. GrowEasy AI Lab — Modernist AI Research Pavilion
// Position: [8.5, 0, -7.5] in AI District
// ─────────────────────────────────────────────────────────────────────────────
function GrowEasyArchitecture({
  mats,
  accentColor,
}: {
  mats: ArchMaterials;
  accentColor: string;
  height: number;
}) {
  return (
    <group>
      {/* Plinth */}
      <mesh position={[0, 0.08, 0]} material={mats.plinth} castShadow receiveShadow>
        <boxGeometry args={[3.4, 0.16, 3.0]} />
      </mesh>

      {/* Ground Floor Glass Lobby */}
      <mesh position={[0, 0.65, 0]} material={mats.glass} castShadow receiveShadow>
        <boxGeometry args={[2.7, 0.98, 2.3]} />
      </mesh>
      <mesh position={[0, 1.18, 0]} material={mats.slab} castShadow>
        <boxGeometry args={[3.0, 0.08, 2.6]} />
      </mesh>

      {/* Cantilevered Upper Laboratory Volume */}
      <mesh position={[0, 2.05, 0.15]} material={mats.wall} castShadow receiveShadow>
        <boxGeometry args={[2.7, 1.65, 2.5]} />
      </mesh>

      {/* Horizontal Window Band */}
      <mesh position={[0, 2.05, 0.15]} material={mats.glass}>
        <boxGeometry args={[2.74, 0.5, 2.54]} />
      </mesh>

      {/* Roof Slab */}
      <mesh position={[0, 2.92, 0.15]} material={mats.slab} castShadow>
        <boxGeometry args={[2.9, 0.08, 2.7]} />
      </mesh>

      {/* ── Prominent Facade Nameplate (GROWEASY AI) ── */}
      <BuildingSignagePlate
        title="GROWEASY AI"
        accentColor={accentColor}
        width={2.8}
        height={0.85}
        position={[0, 1.95, 1.43]}
      />
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 04. AI IP Protection — Computer Vision & Security Vault
// Position: [9.5, 0, -4.0] in AI District
// ─────────────────────────────────────────────────────────────────────────────
function IpProtectionArchitecture({
  mats,
  accentColor,
}: {
  mats: ArchMaterials;
  accentColor: string;
  height: number;
}) {
  return (
    <group>
      {/* Plinth */}
      <mesh position={[0, 0.08, 0]} material={mats.plinth} castShadow receiveShadow>
        <boxGeometry args={[3.0, 0.16, 2.8]} />
      </mesh>

      {/* Precision Cube Main Massing */}
      <mesh position={[0, 1.35, 0]} material={mats.wall} castShadow receiveShadow>
        <boxGeometry args={[2.5, 2.4, 2.3]} />
      </mesh>

      {/* Inset Vertical Window Slits */}
      {[-0.6, 0.6].map((sx, i) => (
        <mesh key={i} position={[sx, 1.35, 1.17]} material={mats.glass}>
          <boxGeometry args={[0.16, 1.4, 0.04]} />
        </mesh>
      ))}

      {/* Parapet Roof Slab */}
      <mesh position={[0, 2.6, 0]} material={mats.slab} castShadow>
        <boxGeometry args={[2.7, 0.08, 2.5]} />
      </mesh>

      {/* ── Prominent Facade Nameplate (AI IP PROTECTION) ── */}
      <BuildingSignagePlate
        title="AI IP PROTECTION"
        accentColor={accentColor}
        width={2.8}
        height={0.85}
        position={[0, 1.45, 1.18]}
      />
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 05. Blockchain Verification Hub — Decentralized Ledger Facility
// Position: [-9, 0, 6] in Blockchain District
// ─────────────────────────────────────────────────────────────────────────────
function BlockchainHubArchitecture({
  mats,
  accentColor,
}: {
  mats: ArchMaterials;
  accentColor: string;
  height: number;
}) {
  return (
    <group>
      {/* Plinth */}
      <mesh position={[0, 0.08, 0]} material={mats.plinth} castShadow receiveShadow>
        <boxGeometry args={[3.5, 0.16, 3.1]} />
      </mesh>

      {/* Main Geometric Volume */}
      <mesh position={[0, 1.55, 0]} material={mats.wall} castShadow receiveShadow>
        <boxGeometry args={[2.9, 2.8, 2.5]} />
      </mesh>

      {/* Amber/Gold Tinted Window Band */}
      <mesh position={[0, 1.4, 0]} material={mats.glass}>
        <boxGeometry args={[2.94, 0.5, 2.54]} />
      </mesh>

      {/* Cantilevered Roof Slab with Gold Parapet */}
      <mesh position={[0, 3.0, 0]} material={mats.slab} castShadow>
        <boxGeometry args={[3.1, 0.08, 2.7]} />
      </mesh>
      <mesh position={[0, 3.06, 0]} material={mats.accent} castShadow>
        <boxGeometry args={[3.16, 0.04, 2.76]} />
      </mesh>

      {/* ── Prominent Facade Nameplate (BLOCKCHAIN) ── */}
      <BuildingSignagePlate
        title="BLOCKCHAIN"
        accentColor={accentColor}
        width={2.8}
        height={0.85}
        position={[0, 1.75, 1.28]}
      />
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 06. Open Source Hub — Miesian Structural Steel & Glass Pavilion
// Position: [9, 0, 6] in Open Source District
// ─────────────────────────────────────────────────────────────────────────────
function OpenSourcePavilionArchitecture({
  mats,
  accentColor,
}: {
  mats: ArchMaterials;
  accentColor: string;
  height: number;
}) {
  return (
    <group>
      {/* Plinth */}
      <mesh position={[0, 0.08, 0]} material={mats.plinth} castShadow receiveShadow>
        <boxGeometry args={[3.7, 0.16, 3.3]} />
      </mesh>

      {/* Transparent Glass Pavilion Core */}
      <mesh position={[0, 0.9, 0]} material={mats.glass} castShadow receiveShadow>
        <boxGeometry args={[2.9, 1.5, 2.5]} />
      </mesh>

      {/* Slender Structural Steel Columns */}
      {[
        [-1.4, -1.2],
        [0, -1.2],
        [1.4, -1.2],
        [-1.4, 1.2],
        [0, 1.2],
        [1.4, 1.2],
      ].map(([cx, cz], i) => (
        <mesh key={i} position={[cx, 0.9, cz]} material={mats.frame} castShadow>
          <boxGeometry args={[0.07, 1.5, 0.07]} />
        </mesh>
      ))}

      {/* Floating Thin Roof Slab */}
      <mesh position={[0, 1.7, 0]} material={mats.slab} castShadow>
        <boxGeometry args={[3.3, 0.08, 2.9]} />
      </mesh>

      {/* Exposed Pergola Roof Joists */}
      {[-0.9, 0, 0.9].map((jx, i) => (
        <mesh key={i} position={[jx, 1.8, 0]} material={mats.accent} castShadow>
          <boxGeometry args={[0.06, 0.12, 3.0]} />
        </mesh>
      ))}

      {/* ── Prominent Facade Nameplate (OPEN SOURCE) ── */}
      <BuildingSignagePlate
        title="OPEN SOURCE"
        accentColor={accentColor}
        width={2.8}
        height={0.85}
        position={[0, 1.3, 1.32]}
      />
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 07. Achievement Center — Civic Exhibition Pavilion & Sweeping Canopy
// Position: [0, 0, -9.5] in Achievement District
// ─────────────────────────────────────────────────────────────────────────────
function AchievementArchitecture({
  mats,
  accentColor,
}: {
  mats: ArchMaterials;
  accentColor: string;
  height: number;
}) {
  return (
    <group>
      {/* Plinth */}
      <mesh position={[0, 0.08, 0]} material={mats.plinth} castShadow receiveShadow>
        <boxGeometry args={[3.7, 0.16, 3.1]} />
      </mesh>

      {/* Main Civic Gallery Volume */}
      <mesh position={[0, 1.25, 0]} material={mats.wall} castShadow receiveShadow>
        <boxGeometry args={[2.9, 2.2, 2.3]} />
      </mesh>

      {/* Exhibition Window Ribbon */}
      <mesh position={[0, 1.15, 0]} material={mats.glass}>
        <boxGeometry args={[2.94, 0.55, 2.34]} />
      </mesh>

      {/* Sweeping Crimson Canopy Wing */}
      <mesh position={[0, 2.4, 0]} material={mats.slab} castShadow>
        <boxGeometry args={[3.3, 0.08, 2.7]} />
      </mesh>
      <mesh position={[0, 2.46, 0]} material={mats.accent} castShadow>
        <boxGeometry args={[3.36, 0.04, 2.76]} />
      </mesh>

      {/* ── Prominent Facade Nameplate (ACHIEVEMENTS) ── */}
      <BuildingSignagePlate
        title="ACHIEVEMENTS"
        accentColor={accentColor}
        width={2.8}
        height={0.85}
        position={[0, 1.38, 1.18]}
      />
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Fallback Generic Pavilion
// ─────────────────────────────────────────────────────────────────────────────
function GenericPavilionArchitecture({
  mats,
  accentColor,
}: {
  mats: ArchMaterials;
  accentColor: string;
  height: number;
}) {
  return (
    <group>
      <mesh position={[0, 0.08, 0]} material={mats.plinth} castShadow receiveShadow>
        <boxGeometry args={[3.0, 0.16, 3.0]} />
      </mesh>
      <mesh position={[0, 1.1, 0]} material={mats.wall} castShadow receiveShadow>
        <boxGeometry args={[2.3, 1.9, 2.3]} />
      </mesh>
      <mesh position={[0, 2.1, 0]} material={mats.slab} castShadow>
        <boxGeometry args={[2.5, 0.08, 2.5]} />
      </mesh>
      <BuildingSignagePlate
        title="SYSTEM"
        accentColor={accentColor}
        width={2.2}
        height={0.7}
        position={[0, 1.2, 1.18]}
      />
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Selection Footprint — Technical Blueprint Ground Frame
// ─────────────────────────────────────────────────────────────────────────────
function SelectionFootprint({ accentColor }: { accentColor: string }) {
  const markerMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: accentColor,
        toneMapped: false,
      }),
    [accentColor]
  );

  const size = 3.8;
  const half = size / 2;
  const bracketLength = 0.55;
  const thickness = 0.04;
  const yPos = 0.02;

  const bracketConfigs = [
    { cx: -half, cz: -half, rx: 1, rz: 1 },
    { cx: half, cz: -half, rx: -1, rz: 1 },
    { cx: -half, cz: half, rx: 1, rz: -1 },
    { cx: half, cz: half, rx: -1, rz: -1 },
  ];

  return (
    <group position={[0, yPos, 0]}>
      {bracketConfigs.map(({ cx, cz, rx, rz }, i) => (
        <group key={i} position={[cx, 0, cz]}>
          <mesh
            position={[(rx * bracketLength) / 2, 0, 0]}
            material={markerMat}
          >
            <planeGeometry args={[bracketLength, thickness]} />
          </mesh>
          <mesh
            position={[0, 0, (rz * bracketLength) / 2]}
            material={markerMat}
          >
            <planeGeometry args={[thickness, bracketLength]} />
          </mesh>
        </group>
      ))}

      {/* Coordinate tick lines */}
      <mesh position={[0, 0, -half]} material={markerMat}>
        <planeGeometry args={[0.2, thickness]} />
      </mesh>
      <mesh position={[0, 0, half]} material={markerMat}>
        <planeGeometry args={[0.2, thickness]} />
      </mesh>
      <mesh position={[-half, 0, 0]} material={markerMat}>
        <planeGeometry args={[thickness, 0.2]} />
      </mesh>
      <mesh position={[half, 0, 0]} material={markerMat}>
        <planeGeometry args={[thickness, 0.2]} />
      </mesh>
    </group>
  );
}
