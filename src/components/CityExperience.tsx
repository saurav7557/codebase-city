"use client";

import { useCallback, useEffect, useState } from "react";
import { CityScene } from "@/components/city/CityScene";
import type { NavMode } from "@/components/ui/SystemHeader";
import type { CityBuilding, EngineeringEvent } from "@/types/city";

// UI Shell — Stage 1
import { CityNavigation } from "@/components/ui/CityNavigation";
import { EngineeringLog } from "@/components/ui/EngineeringLog";
import { CityPlan } from "@/components/ui/CityPlan";
import { DistrictLegend } from "@/components/ui/DistrictLegend";
import { CityControls } from "@/components/ui/CityControls";
import { SystemStatus } from "@/components/ui/SystemStatus";

// Panels still in use
import { BuildingInfoPanel } from "@/components/ui/BuildingInfoPanel";
import { ModePlaceholder } from "@/components/ui/ModePlaceholder";
import { AIIntelligencePanel } from "@/components/ai/AIIntelligencePanel";
import { AskCityAI } from "@/components/ai/AskCityAI";
import { RecruiterMode } from "@/components/recruiter/RecruiterMode";
import { EngineeringJourney } from "@/components/journey/EngineeringJourney";

// ─────────────────────────────────────────────────────────────────────────────
// CityExperience — Root composition layer
//
// Layout:
//   ┌──────────────┬──────────────────────────┬─────────────────┐
//   │ CityNav      │  SystemStatus (top strip) │  EngineeringLog │
//   │  ~200px      │  CityScene (hero)         │  ~320px         │
//   │              │                           │  collapsible    │
//   │              ├─────────────┬─────────────┤                 │
//   │              │DistrictLgnd │  CityPlan + │                 │
//   │              │             │  Controls   │                 │
//   └──────────────┴─────────────┴─────────────┴─────────────────┘
//
// 3D engine (CityScene) is untouched — still receives selectedId + onSelect.
// All existing state handlers preserved as-is.
// ─────────────────────────────────────────────────────────────────────────────

export function CityExperience() {
  const [selectedBuilding, setSelectedBuilding] = useState<CityBuilding | null>(null);
  const [navMode, setNavMode] = useState<NavMode>("explore");
  const [syncTime, setSyncTime] = useState<string>("");
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [askAIPanelOpen, setAskAIPanelOpen] = useState(false);
  const [journeyOpen, setJourneyOpen] = useState(false);
  const [engineeringEvents, setEngineeringEvents] = useState<EngineeringEvent[] | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  // Live clock for the nav sync indicator
  useEffect(() => {
    function tick() {
      const now = new Date();
      setSyncTime(
        now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
      );
    }
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  // Fetch engineering events for the log
  useEffect(() => {
    async function fetchEvents() {
      try {
        const response = await fetch("/api/engineering-events");
        if (response.ok) {
          const data = await response.json();
          setEngineeringEvents(data.events || []);
        }
      } catch (error) {
        console.error("Failed to fetch engineering events:", error);
      }
    }
    fetchEvents();
  }, []);

  // Handle city sync
  const handleSyncCity = useCallback(async () => {
    setIsSyncing(true);
    setSyncStatus(null);
    try {
      const response = await fetch("/api/city/sync", { method: "POST" });
      if (response.ok) {
        const data = await response.json();
        setSyncStatus(`Synced: ${data.summary.buildingsCreated} new buildings`);
        // Refresh city data after sync
        window.location.reload();
      } else {
        setSyncStatus("Sync failed");
      }
    } catch (error) {
      console.error("City sync failed:", error);
      setSyncStatus("Sync error");
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // ── Existing handlers (unchanged) ──────────────────────────────
  const handleSelect = useCallback((building: CityBuilding | null) => {
    setSelectedBuilding(building);
    if (building) setNavMode("explore");
  }, []);

  const handleClosePanel = useCallback(() => {
    setSelectedBuilding(null);
  }, []);

  const handleModeChange = useCallback((mode: NavMode) => {
    setNavMode(mode);
    if (mode !== "explore") setSelectedBuilding(null);
    if (mode === "ai") setAiPanelOpen(true);
    else setAiPanelOpen(false);
    if (mode === "journey") setJourneyOpen(true);
    else setJourneyOpen(false);
  }, []);

  const handleCloseMode = useCallback(() => {
    setNavMode("explore");
    setAiPanelOpen(false);
  }, []);

  const handleExploreSystem = useCallback((building: CityBuilding) => {
    console.info("[Codebase City] Explore system:", building.id);
  }, []);

  const handleAskCityAI = useCallback((building: CityBuilding) => {
    console.info("[Codebase City] Ask City AI:", building.id);
    setAskAIPanelOpen(true);
  }, []);

  return (
    /*
     * Outermost: full-viewport flex row.
     * overflow-hidden keeps the 3D canvas contained.
     */
    <div className="flex h-full w-full overflow-hidden bg-[var(--background)]">

      {/* ── LEFT: Architectural Navigation ──────────────────────── */}
      <CityNavigation
        activeMode={navMode}
        onModeChange={handleModeChange}
        syncTime={syncTime}
      />

      {/* ── CENTER: City + overlays ──────────────────────────────── */}
      <div className="relative flex flex-1 flex-col min-w-0 overflow-hidden">

        {/* Top identity strip */}
        <div className="shrink-0 flex items-center border-b border-[var(--border)] bg-[var(--surface)] px-5 py-3">
          <SystemStatus
            showSync
            onSync={handleSyncCity}
            isSyncing={isSyncing}
            syncStatus={syncStatus}
          />
        </div>

        {/* 3D city — fills remaining space */}
        <div className="relative flex-1 min-h-0 blueprint-grid">
          <CityScene
            selectedId={selectedBuilding?.id ?? null}
            onSelect={handleSelect}
          />

          {/* ── BOTTOM overlay row ──────────────────────────────── */}
          <div className="pointer-events-none absolute inset-x-4 bottom-4 flex items-end justify-between gap-3 z-10">
            {/* Bottom-left: Legend */}
            <DistrictLegend />

            {/* Bottom-right: Plan + Controls */}
            <div className="pointer-events-auto flex items-end gap-2">
              <CityPlan commits={null} />
              <CityControls />
            </div>
          </div>

          {/* ── Building info panel (bottom-left, above legend) ─── */}
          {navMode === "explore" && (
            <BuildingInfoPanel
              building={selectedBuilding}
              onClose={handleClosePanel}
              onExploreSystem={handleExploreSystem}
              onAskCityAI={handleAskCityAI}
            />
          )}

          {/* ── Mode placeholder (Recruiter only) ───────────────── */}
          {navMode === "recruiter" && (
            <RecruiterMode isOpen={navMode === "recruiter"} onClose={handleCloseMode} />
          )}

          {/* ── Engineering Journey (Stage 8) ─────────────────────── */}
          <EngineeringJourney isOpen={journeyOpen} onClose={handleCloseMode} />
        </div>
      </div>

      {/* ── RIGHT: Engineering Log ──────────────────────────────── */}
      <EngineeringLog events={engineeringEvents} />

      {/* ── AI PANEL (Stage 2) ─────────────────────────────────── */}
      <AIIntelligencePanel
        isOpen={aiPanelOpen}
        onClose={() => setAiPanelOpen(false)}
        onOpenAskAI={() => setAskAIPanelOpen(true)}
      />

      {/* ── ASK THE CITY AI (Stage 6) ───────────────────────────── */}
      <AskCityAI isOpen={askAIPanelOpen} onClose={() => setAskAIPanelOpen(false)} />
    </div>
  );
}
