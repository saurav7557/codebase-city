"use client";

import { getCityStats } from "@/lib/city-stats";

// ─────────────────────────────────────────────────────────────────────────────
// CityPlan — Architectural drawing sheet (bottom-right overlay)
//
// All static stats come from getCityStats() (city-stats.ts).
// `commits` and future live data will be passed as props from Phase 2+.
// Integration point: when GitHub API is live, pass `commits` from
// /api/github/commits (or equivalent) as a prop to CityExperience and
// thread it down here.
// ─────────────────────────────────────────────────────────────────────────────

interface CityPlanProps {
  /**
   * Total commit count from GitHub API.
   * Pass null until Phase 2 GitHub integration is live.
   */
  commits?: number | null;
}

interface DrawingRow {
  label: string;
  value: string;
  fill?: boolean;
}

export function CityPlan({ commits }: CityPlanProps) {
  const { districtCount, systemCount } = getCityStats();

  const rows: DrawingRow[] = [
    { label: "DRAWN BY", value: "S. KUMAR", fill: true },
    { label: "CONTEXT",  value: "FULL CITY", fill: true },
    { label: "DISTRICTS", value: String(districtCount).padStart(2, "0") },
    { label: "SYSTEMS",   value: String(systemCount).padStart(2, "0") },
    {
      label: "COMMITS",
      // Phase 2: replace "--" with real count from /api/github/commits
      value: commits != null ? String(commits) : "--",
    },
    { label: "GITHUB", value: "SAURAV7557" },
  ];

  return (
    <div
      className="panel-rise pointer-events-none border border-[var(--border)] bg-[var(--surface)] select-none"
      style={{ minWidth: 200 }}
      aria-label="City Plan drawing sheet"
    >
      {/* Drawing title bar */}
      <div className="flex items-baseline justify-between border-b border-[var(--border)] px-3 py-2">
        <span className="font-mono text-[9px] tracking-[0.22em] text-[var(--foreground)] uppercase font-semibold">
          CITY PLAN
        </span>
        <span className="font-mono text-[8px] tracking-[0.14em] text-[var(--foreground-muted)]">
          SH. 01
        </span>
      </div>

      {/* Drawing rows */}
      <dl className="px-3 py-2.5 flex flex-col gap-1">
        {rows.map(({ label, value, fill }) => (
          <div key={label} className="flex items-baseline gap-1.5">
            <dt className="font-mono text-[8px] tracking-[0.14em] text-[var(--foreground-muted)] uppercase shrink-0">
              {label}
            </dt>
            {fill && (
              <span
                className="flex-1 border-b border-dotted border-[var(--border)] mb-0.5"
                aria-hidden="true"
              />
            )}
            <dd className="font-mono text-[8px] tracking-[0.14em] text-[var(--foreground)] uppercase shrink-0">
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
