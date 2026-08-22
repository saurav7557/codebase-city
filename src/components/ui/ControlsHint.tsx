"use client";

export function ControlsHint() {
  return (
    <p
      className="pointer-events-none absolute bottom-4 right-4 sm:bottom-6 sm:right-6 z-10 select-none text-right font-mono text-[10px] tracking-[0.08em] text-[var(--foreground-muted)]"
      aria-hidden="true"
    >
      <span className="hidden sm:inline">
        Drag to orbit · Scroll to zoom · Click to explore
      </span>
      <span className="sm:hidden">
        Pinch to zoom · Tap to explore
      </span>
    </p>
  );
}
