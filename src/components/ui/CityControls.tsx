"use client";

// ─────────────────────────────────────────────────────────────────────────────
// CityControls — Architectural camera control panel
//
// Camera integration: dispatches CustomEvents that CityCamera.tsx listens for.
// This keeps camera logic self-contained in the 3D layer and avoids threading
// refs through the component tree.
//
// Events dispatched:
//   citycamera:zoom   { detail: number }  — 0.8 = zoom in, 1.25 = zoom out
//   citycamera:reset                      — return to default isometric view
//   citycamera:fit                        — overview / fit entire city
//
// Handled by: CityCamera.tsx (wired in Stage 1)
// ─────────────────────────────────────────────────────────────────────────────

type ControlAction = "zoom-in" | "zoom-out" | "reset" | "fit";

const CONTROLS: Array<{ id: ControlAction; label: string; symbol: string }> = [
  { id: "zoom-in",  label: "Zoom In",    symbol: "+" },
  { id: "zoom-out", label: "Zoom Out",   symbol: "−" },
  { id: "reset",    label: "Reset view", symbol: "RESET" },
  { id: "fit",      label: "Fit city",   symbol: "FIT" },
];

function dispatchCameraEvent(action: ControlAction) {
  switch (action) {
    case "zoom-in":
      window.dispatchEvent(new CustomEvent("citycamera:zoom",  { detail: 0.8 }));
      break;
    case "zoom-out":
      window.dispatchEvent(new CustomEvent("citycamera:zoom",  { detail: 1.25 }));
      break;
    case "reset":
      window.dispatchEvent(new CustomEvent("citycamera:reset"));
      break;
    case "fit":
      window.dispatchEvent(new CustomEvent("citycamera:fit"));
      break;
  }
}

export function CityControls() {
  return (
    <div
      className="panel-rise pointer-events-auto border border-[var(--border)] bg-[var(--surface)] select-none"
      aria-label="City camera controls"
    >
      <div className="flex flex-col">
        {CONTROLS.map(({ id, label, symbol }) => (
          <button
            key={id}
            onClick={() => dispatchCameraEvent(id)}
            aria-label={label}
            className={[
              "px-3.5 py-2.5 text-left w-full",
              "font-mono tracking-[0.18em] text-[var(--foreground-muted)]",
              id === "zoom-in" || id === "zoom-out"
                ? "text-[13px] font-light"
                : "text-[8px] font-medium",
              "hover:text-[var(--foreground)] hover:bg-[var(--surface-muted)]",
              "transition-colors duration-100",
              "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[var(--accent)]",
              id === "reset" ? "border-t border-[var(--border-subtle)]" : "",
            ].join(" ")}
          >
            {symbol}
          </button>
        ))}
      </div>
    </div>
  );
}
