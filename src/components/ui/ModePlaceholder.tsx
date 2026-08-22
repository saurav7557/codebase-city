"use client";

import { SystemButton } from "./SystemButton";
import type { NavMode } from "./SystemHeader";

interface ModePlaceholderProps {
  mode: NavMode;
  onClose: () => void;
}

const MODE_CONTENT: Record<
  Exclude<NavMode, "explore">,
  { title: string; description: string; status: string }
> = {
  ai: {
    title: "City AI",
    description:
      "Conversational interface for exploring systems, architecture decisions, and project context. Coming in a future phase.",
    status: "Module Pending",
  },
  recruiter: {
    title: "Recruiter Mode",
    description:
      "Structured view for hiring teams — role fit, project highlights, and interview scheduling. Coming in a future phase.",
    status: "Module Pending",
  },
};

export function ModePlaceholder({ mode, onClose }: ModePlaceholderProps) {
  if (mode === "explore") return null;

  const content = MODE_CONTENT[mode];

  return (
    <>
      <div
        className="fixed inset-0 z-30 bg-black/15 panel-backdrop-enter"
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className="panel-enter fixed inset-x-4 top-1/2 z-40 max-w-md -translate-y-1/2 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2"
        role="dialog"
        aria-labelledby="mode-placeholder-title"
        aria-describedby="mode-placeholder-desc"
      >
        <div className="border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-panel)]">
          <p className="font-mono text-[10px] tracking-[0.18em] text-[var(--foreground-muted)] uppercase">
            {content.status}
          </p>
          <h2
            id="mode-placeholder-title"
            className="mt-2 text-lg font-bold tracking-[0.08em] text-[var(--foreground)] uppercase"
          >
            {content.title}
          </h2>
          <p
            id="mode-placeholder-desc"
            className="mt-3 text-sm leading-relaxed text-[var(--foreground-muted)]"
          >
            {content.description}
          </p>
          <div className="mt-6">
            <SystemButton onClick={onClose} aria-label="Return to explore mode">
              Return to Explore
            </SystemButton>
          </div>
        </div>
      </aside>
    </>
  );
}
