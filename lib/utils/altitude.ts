// Altitude correction factors (capacity multiplier vs. altitude above sea level).
// Single source of truth — used by the selection form reference table and the
// submittal PDF. Source: COOLEX altitude correction chart.

export interface AltitudeFactor {
  /** Display label for the altitude (e.g. "Sea level" or "1000"). */
  altitude: string;
  /** Altitude in feet. */
  altitudeFt: number;
  /** Capacity multiplier at this altitude. */
  factor: number;
}

export const ALTITUDE_FACTORS: AltitudeFactor[] = [
  { altitude: "Sea level", altitudeFt: 0, factor: 1 },
  { altitude: "1000", altitudeFt: 1000, factor: 0.996 },
  { altitude: "2000", altitudeFt: 2000, factor: 0.99 },
  { altitude: "3000", altitudeFt: 3000, factor: 0.984 },
  { altitude: "4000", altitudeFt: 4000, factor: 0.98 },
  { altitude: "5000", altitudeFt: 5000, factor: 0.974 },
  { altitude: "6000", altitudeFt: 6000, factor: 0.965 },
  { altitude: "7000", altitudeFt: 7000, factor: 0.96 },
];

/**
 * Correction factor for an arbitrary altitude (ft), linearly interpolating
 * between table rows. Values at or below sea level return 1; values above the
 * last row are clamped to the last factor.
 */
export function altitudeCorrectionFactor(altitudeFt: number | null | undefined): number {
  if (altitudeFt == null || Number.isNaN(altitudeFt) || altitudeFt <= 0) return 1;

  const rows = ALTITUDE_FACTORS;
  const last = rows[rows.length - 1];
  if (altitudeFt >= last.altitudeFt) return last.factor;

  for (let i = 1; i < rows.length; i++) {
    const lo = rows[i - 1];
    const hi = rows[i];
    if (altitudeFt <= hi.altitudeFt) {
      const t = (altitudeFt - lo.altitudeFt) / (hi.altitudeFt - lo.altitudeFt);
      return lo.factor + t * (hi.factor - lo.factor);
    }
  }
  return 1;
}
