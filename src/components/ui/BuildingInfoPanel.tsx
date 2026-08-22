"use client";

import { useEffect, useRef } from "react";
import type { CityBuilding } from "@/types/city";
import {
  getDistrictById,
  STATUS_CONFIG,
  TYPE_LABELS,
} from "@/lib/city-stats";
import { SystemButton } from "./SystemButton";

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

  useEffect(() => {
    if (!building) return;

    closeButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [building, onClose]);

  if (!building) return null;

  const district = getDistrictById(building.district);
  const status = STATUS_CONFIG[building.status];
  const districtName = district?.name ?? building.district.replace("-", " ");

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
        className="panel-enter fixed inset-x-0 bottom-0 z-40 sm:absolute sm:inset-x-auto sm:bottom-6 sm:left-6 sm:w-[22rem]"
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
                  {districtName}
                </p>
                <h2
                  id="building-panel-title"
                  className="mt-1 text-base font-bold tracking-[0.06em] text-[var(--foreground)] uppercase leading-snug sm:text-lg"
                >
                  {building.name}
                </h2>
                <p className="mt-1 font-mono text-[10px] tracking-[0.1em] text-[var(--foreground-muted)] uppercase">
                  {TYPE_LABELS[building.type]}
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

            {/* Description */}
            <p
              id="building-panel-desc"
              className="text-sm leading-relaxed text-[var(--foreground-muted)]"
            >
              {building.description}
            </p>

            {/* Technology tags */}
            {building.technologies && building.technologies.length > 0 && (
              <ul
                className="mt-4 flex flex-wrap gap-1.5"
                aria-label="Technologies"
              >
                {building.technologies.map((tech) => (
                  <li key={tech}>
                    <span className="inline-block border border-[var(--border)] bg-[var(--surface-muted)] px-2 py-0.5 font-mono text-[10px] font-medium tracking-[0.08em] text-[var(--foreground)] uppercase">
                      {tech}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {/* Status */}
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

            {/* Actions */}
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <SystemButton
                variant="primary"
                className="flex-1"
                onClick={handleExplore}
                aria-label={`Explore ${building.name} system`}
              >
                Explore System
              </SystemButton>
              <SystemButton
                className="flex-1"
                onClick={handleAskAI}
                aria-label={`Ask City AI about ${building.name}`}
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
