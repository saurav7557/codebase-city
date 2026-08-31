"use client";

import { useState } from "react";
import type { EngineeringEvent } from "@/types/city";

// ─────────────────────────────────────────────────────────────────────────────
// EngineeringLog — Right-side collapsible activity panel
//
// Data source: accepts `events` prop.
// When null/undefined → shows UI placeholder rows (Stage 1 state).
// When populated → renders real events from /api/engineering-events.
// Phase 2+: wire CityExperience to fetch /api/engineering-events and
// pass the result as the `events` prop.
// ─────────────────────────────────────────────────────────────────────────────

/** Placeholder rows shown before real API data is connected */
const PLACEHOLDER_EVENTS: Array<{ time: string; summary: string }> = [
  { time: "18:42", summary: "Repository updated" },
  { time: "18:31", summary: "Commit detected" },
  { time: "17:54", summary: "District activity increased" },
  { time: "16:07", summary: "Analysis recorded" },
  { time: "11:20", summary: "Construction advanced" },
];

interface EngineeringLogProps {
  /**
   * Real events from /api/engineering-events.
   * Pass null (or omit) to show placeholder rows until Phase 2 integration.
   */
  events?: EngineeringEvent[] | null;
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "--:--";
  }
}

export function EngineeringLog({ events }: EngineeringLogProps) {
  const [collapsed, setCollapsed] = useState(false);
  const hasRealData = events && events.length > 0;

  return (
    <aside
      className={[
        "log-slide-in log-collapse-transition relative flex flex-col bg-[var(--surface)]",
        collapsed ? "w-10" : "",
      ].join(" ")}
      style={
        collapsed
          ? { boxShadow: "var(--shadow-log)" }
          : { width: "var(--log-width)", boxShadow: "var(--shadow-log)" }
      }
      aria-label="Engineering Log"
    >
      {/* Top accent line — mirrors nav */}
      <span className="accent-line-top" aria-hidden="true" />

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div
        className={[
          "flex items-center border-b border-[var(--border)] shrink-0",
          collapsed ? "justify-center px-2 py-3.5" : "justify-between px-4 py-3.5",
        ].join(" ")}
      >
        {!collapsed && (
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${hasRealData ? 'activity-pulse' : ''}`}
              style={{ backgroundColor: hasRealData ? 'var(--status-active)' : 'var(--status-planned)' }}
              aria-hidden="true"
            />
            <span className="font-mono text-[10px] tracking-[0.26em] text-[var(--foreground)] uppercase font-semibold truncate">
              ENGINEERING LOG
            </span>
            {hasRealData && (
              <span className="font-mono text-[8px] tracking-[0.14em] text-[var(--status-active)] uppercase font-semibold">
                LIVE
              </span>
            )}
          </div>
        )}

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className={[
            "shrink-0 flex items-center justify-center w-6 h-6",
            "text-[var(--foreground-muted)] hover:text-[var(--foreground)]",
            "transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]",
            collapsed ? "" : "ml-2",
          ].join(" ")}
          aria-label={collapsed ? "Expand Engineering Log" : "Collapse Engineering Log"}
          aria-expanded={!collapsed}
        >
          {/* Chevron: points left (‹) when expanded, right (›) when collapsed */}
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            aria-hidden="true"
            className={`transition-transform duration-200 ${collapsed ? "rotate-180" : ""}`}
          >
            <path
              d="M7.5 2.5L4.5 6L7.5 9.5"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* ── Content ─────────────────────────────────────────────────── */}
      {!collapsed && (
        <div className="flex-1 overflow-y-auto min-h-0">
          {/* Section: TODAY */}
          <div className="px-4 pt-4 pb-1">
            <p className="font-mono text-[8px] tracking-[0.28em] text-[var(--foreground-muted)] uppercase">
              TODAY
            </p>
          </div>
          <hr className="rule-thin mx-4" />

          <ul className="py-1">
            {(events && events.length > 0)
              ? events.map((ev) => (
                  <LogRow
                    key={ev.id}
                    time={formatTime(ev.occurredAt)}
                    summary={ev.summary}
                    category={ev.category}
                  />
                ))
              : PLACEHOLDER_EVENTS.map((ev, i) => (
                  <LogRow
                    key={i}
                    time={ev.time}
                    summary={ev.summary}
                    isPlaceholder
                  />
                ))}
          </ul>

          {/* Phase 2 integration point marker */}
          {(!events || events.length === 0) && (
            <div className="mx-4 mt-2 mb-4 border border-dashed border-[var(--border)] px-3 py-2">
              <p className="font-mono text-[8px] tracking-[0.1em] text-[var(--border-strong)] uppercase leading-relaxed">
                {/* PHASE 2: fetch /api/engineering-events and pass result as `events` prop */}
                API PENDING · PLACEHOLDER DATA
              </p>
            </div>
          )}
        </div>
      )}

      {/* Collapsed vertical label */}
      {collapsed && (
        <div className="flex-1 flex items-center justify-center">
          <span
            className="font-mono text-[8px] tracking-[0.22em] text-[var(--foreground-muted)] uppercase select-none"
            style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
          >
            ENG LOG
          </span>
        </div>
      )}
    </aside>
  );
}

interface LogRowProps {
  time: string;
  summary: string;
  category?: string;
  isPlaceholder?: boolean;
}

function LogRow({ time, summary, category, isPlaceholder }: LogRowProps) {
  return (
    <li
      className="log-row flex items-start gap-3 px-4 py-2.5 cursor-default transition-colors duration-100"
      aria-label={`${time} — ${summary}`}
    >
      {/* Time */}
      <span
        className="font-mono text-[9px] tracking-[0.06em] text-[var(--border-strong)] tabular-nums shrink-0 mt-px"
        style={{ opacity: isPlaceholder ? 0.55 : 1 }}
      >
        {time}
      </span>

      {/* Square indicator — architectural checkbox style */}
      <span
        className="inline-block w-2.5 h-2.5 border border-[var(--border-strong)] shrink-0 mt-px"
        aria-hidden="true"
        style={{ opacity: isPlaceholder ? 0.4 : 0.8 }}
      />

      {/* Summary */}
      <div className="flex-1 min-w-0">
        <span
          className="font-mono text-[10px] tracking-[0.06em] text-[var(--foreground)] leading-snug block"
          style={{ opacity: isPlaceholder ? 0.6 : 1 }}
        >
          {summary}
        </span>
        {category && !isPlaceholder && (
          <span className="font-mono text-[8px] tracking-[0.1em] text-[var(--foreground-muted)] uppercase mt-0.5 block">
            {category}
          </span>
        )}
      </div>
    </li>
  );
}
