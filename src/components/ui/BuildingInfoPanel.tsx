"use client";

import { useEffect, useRef, useState } from "react";
import type { CityBuilding } from "@/types/city";
import {
  getDistrictById,
  STATUS_CONFIG,
  TYPE_LABELS,
} from "@/lib/city-stats";
import { SystemButton } from "./SystemButton";

interface ProjectData {
  name: string;
  slug: string;
  description: string;
  category: string;
  status: string;
  githubUrl?: string;
  liveUrl?: string;
  technologies: { technology: { name: string } }[];
  district: { name: string };
}

interface BuildingInfoPanelProps {
  building: CityBuilding | null;
  onClose: () => void;
  onExploreSystem?: (building: CityBuilding) => void;
  onAskCityAI?: (building: CityBuilding) => void;
}

export function BuildingInfoPanel({
  building,
  onClose,
  onExploreSystem,
  onAskCityAI,
}: BuildingInfoPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!building) return;

    closeButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [building, onClose]);

   useEffect(() => {
    if (!building) return;

    const buildingId = building.id;

    async function fetchProjectData() {
      setLoading(true);
      setError(null);

      try {
        // Try to find project by building ID first
        const response = await fetch(`/api/projects/by-building/${buildingId}`);

        if (response.ok) {
          const data = await response.json();
          setProjectData(data.project);
        } else {
          // Fallback to building data only
          setProjectData(null);
        }
      } catch (err) {
        console.error("Failed to fetch project data:", err);
        setError("Failed to load project data");
        setProjectData(null);
      } finally {
        setLoading(false);
      }
    }

    fetchProjectData();
  }, [building]);

  if (!building) return null;

  const district = getDistrictById(building.district);
  const status = STATUS_CONFIG[building.status];
  const districtName = district?.name ?? building.district.replace("-", " ");
  const displayData = projectData || {
    name: building.name,
    description: building.description,
    category: building.type,
    status: building.status,
    technologies: building.technologies?.map(t => ({ technology: { name: t } })) || [],
    district: { name: districtName },
    githubUrl: undefined,
    liveUrl: undefined,
  };

  const handleExplore = () => {
    onExploreSystem?.(building);
  };

  const handleAskAI = () => {
    onAskCityAI?.(building);
  };

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className="fixed inset-0 z-30 bg-black/10 sm:hidden panel-backdrop-enter"
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        ref={panelRef}
        className="panel-enter fixed inset-x-0 bottom-0 z-40 sm:absolute sm:inset-x-auto sm:bottom-auto sm:top-14 sm:left-4 sm:w-[22rem]"
        role="dialog"
        aria-labelledby="building-panel-title"
        aria-describedby="building-panel-desc"
      >
        <div
          className="border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-panel)] sm:rounded-sm overflow-hidden"
          style={{
            borderTopColor: building.color,
            borderTopWidth: "2px",
          }}
        >
          <div className="p-5 sm:p-5">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold tracking-[0.22em] text-[var(--foreground-muted)] uppercase">
                  {displayData.district.name}
                </p>
                <h2
                  id="building-panel-title"
                  className="mt-1 text-base font-bold tracking-[0.06em] text-[var(--foreground)] uppercase leading-snug sm:text-lg"
                >
                  {displayData.name}
                </h2>
                <p className="mt-1 font-mono text-[10px] tracking-[0.1em] text-[var(--foreground-muted)] uppercase">
                  {TYPE_LABELS[building.type] || displayData.category}
                </p>
              </div>
              <button
                ref={closeButtonRef}
                onClick={onClose}
                className="shrink-0 flex h-7 w-7 items-center justify-center border border-[var(--border)] text-[var(--foreground-muted)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                aria-label="Close building panel"
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>

            <div className="my-4 h-px bg-[var(--border)]" />

            {/* Loading state */}
            {loading && (
              <p className="font-mono text-[10px] text-[var(--foreground-muted)]">
                Loading project data...
              </p>
            )}

            {/* Error state */}
            {error && (
              <p className="font-mono text-[10px] text-[var(--status-building)]">
                {error}
              </p>
            )}

            {/* Description */}
            {!loading && !error && (
              <p
                id="building-panel-desc"
                className="text-sm leading-relaxed text-[var(--foreground-muted)]"
              >
                {displayData.description}
              </p>
            )}

            {/* Technology tags */}
            {!loading && !error && displayData.technologies && displayData.technologies.length > 0 && (
              <ul
                className="mt-4 flex flex-wrap gap-1.5"
                aria-label="Technologies"
              >
                {displayData.technologies.map((tech, index) => (
                  <li key={index}>
                    <span className="inline-block border border-[var(--border)] bg-[var(--surface-muted)] px-2 py-0.5 font-mono text-[10px] font-medium tracking-[0.08em] text-[var(--foreground)] uppercase">
                      {tech.technology.name}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {/* Links */}
            {!loading && !error && (displayData.githubUrl || displayData.liveUrl) && (
              <div className="mt-4 space-y-2">
                {displayData.githubUrl && (
                  <a
                    href={displayData.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block font-mono text-[10px] tracking-[0.08em] text-[var(--foreground)] hover:text-[var(--accent)] transition-colors"
                  >
                    GitHub Repository →
                  </a>
                )}
                {displayData.liveUrl && (
                  <a
                    href={displayData.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block font-mono text-[10px] tracking-[0.08em] text-[var(--foreground)] hover:text-[var(--accent)] transition-colors"
                  >
                    Live Site →
                  </a>
                )}
              </div>
            )}

            {/* Status */}
            {!loading && !error && (
              <div className="mt-4 flex items-center gap-2">
                <span
                  className="status-dot"
                  style={{ backgroundColor: status.color }}
                  aria-hidden="true"
                />
                <span
                  className="font-mono text-[10px] font-semibold tracking-[0.16em] uppercase"
                  style={{ color: status.color }}
                >
                  {status.label}
                </span>
              </div>
            )}

            {/* Actions */}
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <SystemButton
                variant="primary"
                className="flex-1"
                onClick={handleExplore}
                aria-label={`Explore ${displayData.name} system`}
              >
                Explore System
              </SystemButton>
              <SystemButton
                className="flex-1"
                onClick={handleAskAI}
                aria-label={`Ask City AI about ${displayData.name}`}
              >
                Ask City AI
              </SystemButton>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
