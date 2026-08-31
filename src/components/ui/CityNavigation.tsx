"use client";

import type { NavMode } from "@/components/ui/SystemHeader";

// ─────────────────────────────────────────────────────────────────────────────
// CityNavigation — Architectural drawing-index style left nav
// Replaces the top-bar SystemHeader in the Stage 1 layout.
// The NavMode type is re-used from SystemHeader for compatibility.
// ─────────────────────────────────────────────────────────────────────────────

interface NavItem {
  index: string;
  id: NavMode | "projects" | "systems" | "github" | "journey";
  label: string;
  available: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { index: "01", id: "explore",   label: "EXPLORE",   available: true  },
  { index: "02", id: "projects",  label: "PROJECTS",  available: false },
  { index: "03", id: "systems",   label: "SYSTEMS",   available: false },
  { index: "04", id: "github",    label: "GITHUB",    available: false },
  { index: "05", id: "journey",   label: "JOURNEY",   available: true  },
  { index: "06", id: "ai",        label: "AI",        available: true  },
  { index: "07", id: "recruiter", label: "RECRUITER", available: true  },
];

interface CityNavigationProps {
  activeMode: NavMode;
  onModeChange: (mode: NavMode) => void;
  syncTime?: string;
}

export function CityNavigation({
  activeMode,
  onModeChange,
  syncTime,
}: CityNavigationProps) {
  return (
    <nav
      className="nav-slide-in relative flex h-full flex-col bg-[var(--surface)] select-none"
      style={{ boxShadow: "var(--shadow-nav)", width: "var(--nav-width)" }}
      aria-label="City navigation"
    >
      {/* Top accent line — 2px graphite */}
      <span className="accent-line-top" aria-hidden="true" />

      {/* ── Wordmark ───────────────────────────────────────────────── */}
      <div className="border-b border-[var(--border)] px-5 pt-7 pb-5">
        {/* Drawing set metadata */}
        <p className="font-mono text-[8px] tracking-[0.26em] text-[var(--foreground-muted)] uppercase mb-3">
          SET 01 · REV C
        </p>

        {/* City name — primary wordmark */}
        <div className="leading-none mb-3">
          <p
            className="text-[13px] font-bold tracking-[0.32em] text-[var(--foreground)] uppercase"
            style={{ letterSpacing: "0.34em" }}
          >
            CODEBASE
          </p>
          <p
            className="text-[13px] font-bold tracking-[0.32em] text-[var(--foreground)] uppercase"
            style={{ letterSpacing: "0.34em" }}
          >
            CITY
          </p>
        </div>

        {/* Thin rule under wordmark */}
        <div className="mb-3 h-px bg-[var(--border-subtle)]" aria-hidden="true" />

        {/* Engineer metadata */}
        <p className="font-mono text-[8px] tracking-[0.16em] text-[var(--foreground-muted)]">
          S. KUMAR · PORTFOLIO
        </p>
      </div>

      {/* ── Nav items ─────────────────────────────────────────────── */}
      <ul className="flex-1 py-2" role="list">
        {NAV_ITEMS.map((item) => {
          // Only NavMode values are routable; others are future stubs
          const isRoutable =
            item.available && ["explore", "journey", "ai", "recruiter"].includes(item.id);
          const isActive = activeMode === item.id;

          return (
            <li key={item.id}>
              <button
                onClick={() => {
                  if (isRoutable) onModeChange(item.id as NavMode);
                }}
                disabled={!isRoutable}
                aria-current={isActive ? "page" : undefined}
                aria-label={`${item.label} mode`}
                className={[
                  "relative w-full flex items-center gap-3 px-5 py-2.5",
                  "text-left transition-colors duration-150",
                  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)] focus-visible:ring-inset",
                  isActive
                    ? "text-[var(--foreground)] bg-[var(--surface-muted)]"
                    : isRoutable
                    ? "text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-muted)]"
                    : "text-[var(--border-strong)] cursor-default",
                ].join(" ")}
              >
                {/* Active indicator bar */}
                {isActive && <span className="nav-active-bar" aria-hidden="true" />}

                {/* Index number */}
                <span
                  className="font-mono text-[8px] tracking-[0.12em] shrink-0 w-5 tabular-nums"
                  style={{ opacity: isActive ? 1 : isRoutable ? 0.6 : 0.35 }}
                >
                  {item.index}
                </span>

                {/* Label */}
                <span
                  className={[
                    "font-mono text-[10px] tracking-[0.22em] uppercase flex-1",
                    isActive ? "font-semibold" : "",
                  ].join(" ")}
                >
                  {item.label}
                </span>

                {/* State badge */}
                {!item.available && (
                  <span className="font-mono text-[7px] tracking-[0.14em] text-[var(--border-strong)] border border-[var(--border)] px-1 py-0.5 leading-none">
                    SOON
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      {/* ── Bottom status ──────────────────────────────────────────── */}
      <div className="border-t border-[var(--border)] px-5 py-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="status-dot status-dot--pulse" aria-hidden="true" />
          <span className="font-mono text-[9px] tracking-[0.22em] text-[var(--foreground-muted)] uppercase font-medium">
            LIVE
          </span>
        </div>
        <p className="font-mono text-[8px] tracking-[0.12em] text-[var(--border-strong)]">
          SYNC{" "}
          <span className="text-[var(--foreground-muted)]">
            {syncTime ?? "--:--"}
          </span>
        </p>
      </div>
    </nav>
  );
}
