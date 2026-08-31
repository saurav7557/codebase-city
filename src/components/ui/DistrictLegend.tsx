"use client";

import { cityData } from "@/data/city";

// ─────────────────────────────────────────────────────────────────────────────
// DistrictLegend — Bottom-left city systems legend
// Reads district colors directly from cityData so it stays in sync with
// the 3D scene automatically.
//
// Display names are overridden here for the UI layer to match the approved
// design spec without touching the underlying data/city.ts ids or names
// (which are used by the 3D engine and type system).
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Map from cityData district id → approved UI display label.
 * Add entries here as new districts are added to city.ts.
 */
const DISTRICT_DISPLAY_NAMES: Record<string, string> = {
  "core":          "CORE",
  "backend":       "BACKEND SYSTEMS",
  "ai":            "AI & INTELLIGENCE",
  "blockchain":    "DISTRIBUTED LEDGER",
  "open-source":   "OPEN SOURCE",
  "achievements":  "RECORD & MILESTONES",
};

const STATUS_LEGEND = [
  { color: "var(--status-active)",   label: "OPERATIONAL" },
  { color: "var(--status-building)", label: "UNDER CONSTRUCTION" },
  { color: "var(--status-planned)",  label: "PLANNED" },
] as const;

export function DistrictLegend() {
  return (
    <div
      className="panel-rise pointer-events-none border border-[var(--border)] bg-[var(--surface)] select-none"
      aria-label="City district legend"
    >
      {/* Header */}
      <div className="border-b border-[var(--border)] px-3 py-2">
        <p className="font-mono text-[9px] tracking-[0.26em] text-[var(--foreground)] uppercase font-semibold">
          CITY SYSTEMS
        </p>
      </div>

      <div className="px-3 py-2.5 flex flex-col gap-2.5">
        {/* District list */}
        <ul className="flex flex-col gap-1.5" aria-label="Districts">
          {cityData.districts.map((d) => (
            <li key={d.id} className="flex items-center gap-2">
              {/* Filled square — matches the building color swatch in the 3D scene */}
              <span
                className="shrink-0 w-2 h-2"
                style={{ backgroundColor: d.color }}
                aria-hidden="true"
              />
              <span className="font-mono text-[8px] tracking-[0.14em] text-[var(--foreground-muted)] uppercase">
                {DISTRICT_DISPLAY_NAMES[d.id] ?? d.name.toUpperCase()}
              </span>
            </li>
          ))}
        </ul>

        <hr className="rule-thin" />

        {/* Status legend */}
        <ul className="flex flex-col gap-1" aria-label="Status key">
          {STATUS_LEGEND.map(({ color, label }) => (
            <li key={label} className="flex items-center gap-2">
              <span
                className="status-dot shrink-0"
                style={{ backgroundColor: color }}
                aria-hidden="true"
              />
              <span className="font-mono text-[8px] tracking-[0.1em] text-[var(--foreground-muted)] uppercase">
                {label}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
