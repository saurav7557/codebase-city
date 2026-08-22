// ─────────────────────────────────────────────────────────────────────────────
// Codebase City — Core Types
// This type layer is the contract between the data sources (Phase 2+) and
// the 3D renderer. Nothing project-specific lives inside rendering components.
// ─────────────────────────────────────────────────────────────────────────────

export type BuildingStatus = "active" | "building" | "planned";

export type BuildingType =
  | "profile"
  | "backend"
  | "ai"
  | "blockchain"
  | "open-source"
  | "achievement"
  | "generic";

export interface CityBuilding {
  /** Stable unique identifier — used as React key and for future DB lookups */
  id: string;
  /** Display name shown in info panel and hover tooltip */
  name: string;
  /** Semantic category for grouping and future AI classification */
  type: BuildingType;
  /** Which district this building belongs to */
  district: string;
  /** Short description shown in the building info panel */
  description: string;
  /** Current status of the project / feature */
  status: BuildingStatus;
  /** World-space position [x, y, z]. y is typically 0 (ground level). */
  position: [number, number, number];
  /** Building height — drives the extrusion of the tower mesh */
  height: number;
  /** Base color of the building (hex string) */
  color: string;
  /** Accent / roof color */
  accentColor: string;
  /** Technology stack tags shown in the building info panel */
  technologies?: string[];
}

export interface CityDistrict {
  /** Stable unique identifier */
  id: string;
  /** Human-readable district name */
  name: string;
  /** District label color (hex) */
  color: string;
  /** World-space center of the district [x, z] */
  center: [number, number];
  /** Approximate district radius for the boundary ring */
  radius: number;
}

export interface CityData {
  buildings: CityBuilding[];
  districts: CityDistrict[];
}
