"use client";

import { SystemButton } from "./SystemButton";

export type NavMode = "explore" | "ai" | "recruiter" | "journey";

interface SystemHeaderProps {
  activeMode: NavMode;
  onModeChange: (mode: NavMode) => void;
}

const NAV_ITEMS: { id: NavMode; label: string }[] = [
  { id: "explore", label: "Explore" },
  { id: "ai", label: "AI" },
  { id: "recruiter", label: "Recruiter" },
];

export function SystemHeader({ activeMode, onModeChange }: SystemHeaderProps) {
  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between p-4 sm:p-6">
      {/* Brand */}
      <div className="pointer-events-auto select-none">
        <p className="text-[10px] font-semibold tracking-[0.32em] text-[var(--foreground-muted)] uppercase">
          Codebase City
        </p>
        <h1 className="mt-0.5 text-sm font-bold tracking-[0.12em] text-[var(--foreground)] uppercase sm:text-base">
          Saurav Kumar
        </h1>
        <div className="mt-2 flex items-center gap-2">
          <span
            className="status-dot status-dot--pulse"
            aria-hidden="true"
          />
          <span className="font-mono text-[10px] tracking-[0.14em] text-[var(--foreground-muted)] uppercase">
            System Online
          </span>
        </div>
      </div>

      {/* Navigation controls */}
      <nav
        className="pointer-events-auto flex items-center gap-1 sm:gap-1.5"
        aria-label="City navigation"
      >
        {NAV_ITEMS.map(({ id, label }) => (
          <SystemButton
            key={id}
            active={activeMode === id}
            onClick={() => onModeChange(id)}
            aria-current={activeMode === id ? "page" : undefined}
            aria-label={`${label} mode`}
          >
            {label}
          </SystemButton>
        ))}
      </nav>
    </header>
  );
}
