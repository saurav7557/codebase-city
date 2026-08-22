"use client";

import { getCityStats } from "@/lib/city-stats";

export function CityHUD() {
  const { districtCount, systemCount } = getCityStats();

  return (
    <aside
      className="pointer-events-none absolute top-24 left-4 sm:top-28 sm:left-6 z-10 select-none"
      aria-label="City status"
    >
      <dl className="flex flex-col gap-2 sm:gap-2.5">
        <HUDStat label="Districts" value={districtCount} />
        <HUDStat label="Systems" value={systemCount} />
        <div className="mt-1 flex items-center gap-2">
          <span className="status-dot" aria-hidden="true" />
          <dt className="sr-only">Status</dt>
          <dd className="font-mono text-[10px] tracking-[0.16em] text-[var(--foreground-muted)] uppercase">
            Status Online
          </dd>
        </div>
      </dl>
    </aside>
  );
}

function HUDStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-baseline gap-2">
      <dt className="font-mono text-[10px] tracking-[0.16em] text-[var(--foreground-muted)] uppercase">
        {label}
      </dt>
      <dd className="font-mono text-xs font-medium tracking-wider text-[var(--foreground)] tabular-nums">
        {String(value).padStart(2, "0")}
      </dd>
    </div>
  );
}
