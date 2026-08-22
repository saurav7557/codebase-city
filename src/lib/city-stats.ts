import { cityData } from "@/data/city";
import type { CityBuilding, CityDistrict } from "@/types/city";

export function getDistrictById(id: string): CityDistrict | undefined {
  return cityData.districts.find((d) => d.id === id);
}

export function getDistrictStats(districtId: string) {
  const buildings = cityData.buildings.filter((b) => b.district === districtId);
  const activeCount = buildings.filter((b) => b.status === "active").length;

  return {
    totalSystems: buildings.length,
    activeProjects: activeCount,
    buildings,
  };
}

export function getCityStats() {
  return {
    districtCount: cityData.districts.length,
    systemCount: cityData.buildings.length,
    activeCount: cityData.buildings.filter((b) => b.status === "active").length,
  };
}

export const TYPE_LABELS: Record<CityBuilding["type"], string> = {
  profile: "Profile",
  backend: "Backend / Distributed Systems",
  ai: "AI / Full Stack",
  blockchain: "Blockchain",
  "open-source": "Open Source",
  achievement: "Achievements",
  generic: "General",
};

export const STATUS_CONFIG: Record<
  CityBuilding["status"],
  { label: string; color: string }
> = {
  active: { label: "ACTIVE", color: "var(--status-active)" },
  building: { label: "UNDER CONSTRUCTION", color: "var(--status-building)" },
  planned: { label: "PLANNED", color: "var(--status-planned)" },
};
