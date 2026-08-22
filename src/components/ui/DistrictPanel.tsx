"use client";

import { getDistrictById, getDistrictStats } from "@/lib/city-stats";

interface DistrictPanelProps {
  districtId: string | null;
}

export function DistrictPanel({ districtId }: DistrictPanelProps) {
  if (!districtId) return null;

  const district = getDistrictById(districtId);
  if (!district) return null;

  const { totalSystems, activeProjects } = getDistrictStats(districtId);

  return (
    <aside
      className="panel-enter pointer-events-none absolute top-24 right-4 sm:top-28 sm:right-6 z-10 select-none"
      aria-label={`${district.name} information`}
    >
      <div className="pointer-events-auto border border-[var(--border)] bg-[var(--surface)] px-4 py-3 shadow-[var(--shadow-panel)]">
        <div
          className="mb-2 h-0.5 w-8"
          style={{ backgroundColor: district.color }}
          aria-hidden="true"
        />
        <p className="text-[10px] font-semibold tracking-[0.22em] text-[var(--foreground-muted)] uppercase">
          {district.name}
        </p>
        <dl className="mt-2.5 flex flex-col gap-1.5">
          <MetaRow label="Systems" value={String(totalSystems)} />
          <MetaRow
            label="Active Projects"
            value={String(activeProjects)}
          />
        </dl>
      </div>
    </aside>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="font-mono text-[10px] tracking-[0.12em] text-[var(--foreground-muted)] uppercase">
        {label}
      </dt>
      <dd className="font-mono text-[11px] font-medium text-[var(--foreground)] tabular-nums">
        {value}
      </dd>
    </div>
  );
}
