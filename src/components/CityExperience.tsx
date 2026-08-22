"use client";

import { useCallback, useState } from "react";
import { CityScene } from "@/components/city/CityScene";
import { SystemHeader, type NavMode } from "@/components/ui/SystemHeader";
import { CityHUD } from "@/components/ui/CityHUD";
import { DistrictPanel } from "@/components/ui/DistrictPanel";
import { BuildingInfoPanel } from "@/components/ui/BuildingInfoPanel";
import { ModePlaceholder } from "@/components/ui/ModePlaceholder";
import { ControlsHint } from "@/components/ui/ControlsHint";
import type { CityBuilding } from "@/types/city";

export function CityExperience() {
  const [selectedBuilding, setSelectedBuilding] = useState<CityBuilding | null>(
    null
  );
  const [navMode, setNavMode] = useState<NavMode>("explore");

  const handleSelect = useCallback((building: CityBuilding | null) => {
    setSelectedBuilding(building);
    if (building) setNavMode("explore");
  }, []);

  const handleClosePanel = useCallback(() => {
    setSelectedBuilding(null);
  }, []);

  const handleModeChange = useCallback((mode: NavMode) => {
    setNavMode(mode);
    if (mode !== "explore") {
      setSelectedBuilding(null);
    }
  }, []);

  const handleCloseMode = useCallback(() => {
    setNavMode("explore");
  }, []);

  const handleExploreSystem = useCallback((building: CityBuilding) => {
    // Placeholder for future deep-link / project detail view
    console.info("[Codebase City] Explore system:", building.id);
  }, []);

  const handleAskCityAI = useCallback((building: CityBuilding) => {
    // Placeholder entry point for future AI integration
    console.info("[Codebase City] Ask City AI:", building.id);
    setNavMode("ai");
  }, []);

  return (
    <div className="relative h-full w-full">
      <CityScene
        selectedId={selectedBuilding?.id ?? null}
        onSelect={handleSelect}
      />

      <SystemHeader activeMode={navMode} onModeChange={handleModeChange} />
      <CityHUD />
      <DistrictPanel districtId={selectedBuilding?.district ?? null} />
      <ControlsHint />

      {navMode === "explore" && (
        <BuildingInfoPanel
          building={selectedBuilding}
          onClose={handleClosePanel}
          onExploreSystem={handleExploreSystem}
          onAskCityAI={handleAskCityAI}
        />
      )}

      {navMode !== "explore" && (
        <ModePlaceholder mode={navMode} onClose={handleCloseMode} />
      )}
    </div>
  );
}
