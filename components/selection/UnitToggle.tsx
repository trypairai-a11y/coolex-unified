"use client";

import { useUnitStore } from "@/lib/stores/unit-store";

export function UnitToggle() {
  const { unitSystem, toggleUnitSystem } = useUnitStore();
  return (
    <button
      type="button"
      onClick={toggleUnitSystem}
      className="inline-flex items-center rounded-lg border bg-muted px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent shrink-0"
    >
      <span className={unitSystem === 'imperial' ? 'text-[#0057B8] font-semibold' : 'text-muted-foreground'}>
        Imperial
      </span>
      <span className="mx-1.5 text-muted-foreground/50">|</span>
      <span className={unitSystem === 'metric' ? 'text-[#0057B8] font-semibold' : 'text-muted-foreground'}>
        Metric
      </span>
    </button>
  );
}
