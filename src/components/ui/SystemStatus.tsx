"use client";

// ─────────────────────────────────────────────────────────────────────────────
// SystemStatus — Top identity strip (center area above city)
// Minimal — city name + engineer name + online status
// ─────────────────────────────────────────────────────────────────────────────

interface SystemStatusProps {
  /** Override the online message — default: "SYSTEM ONLINE" */
  statusLabel?: string;
  /** Show sync button for city state evolution */
  showSync?: boolean;
  /** Callback when sync is triggered */
  onSync?: () => void;
  /** Whether sync is currently in progress */
  isSyncing?: boolean;
  /** Sync status message */
  syncStatus?: string | null;
}

export function SystemStatus({
  statusLabel = "SYSTEM ONLINE",
  showSync = false,
  onSync,
  isSyncing = false,
  syncStatus,
}: SystemStatusProps) {
  return (
    <div
      className="flex items-center gap-3"
      aria-label="System identity"
    >
      <div className="pointer-events-none select-none">
        <p className="font-mono text-[9px] tracking-[0.28em] text-[var(--foreground-muted)] uppercase leading-none">
          CODEBASE CITY
        </p>
        <p className="mt-0.5 text-[11px] font-bold tracking-[0.14em] text-[var(--foreground)] uppercase leading-none">
          Saurav Kumar
        </p>
      </div>
      <div className="h-6 w-px bg-[var(--border)]" aria-hidden="true" />
      <div className="flex items-center gap-1.5">
        <span className="status-dot status-dot--pulse" aria-hidden="true" />
        <span className="font-mono text-[9px] tracking-[0.18em] text-[var(--foreground-muted)] uppercase">
          {statusLabel}
        </span>
      </div>

      {showSync && (
        <>
          <div className="h-6 w-px bg-[var(--border)]" aria-hidden="true" />
          <button
            onClick={onSync}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3 py-1 border border-[var(--border)] bg-[var(--surface-muted)] hover:bg-[var(--border-subtle)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            aria-label="Sync city state"
          >
            <span
              className={`status-dot ${isSyncing ? 'status-dot--pulse' : ''}`}
              style={{ backgroundColor: isSyncing ? 'var(--status-building)' : 'var(--status-active)' }}
              aria-hidden="true"
            />
            <span className="font-mono text-[9px] tracking-[0.18em] text-[var(--foreground)] uppercase">
              {isSyncing ? "SYNCING..." : "SYNC CITY"}
            </span>
          </button>
          {syncStatus && (
            <span className="font-mono text-[8px] tracking-[0.14em] text-[var(--foreground-muted)] uppercase">
              {syncStatus}
            </span>
          )}
        </>
      )}
    </div>
  );
}
