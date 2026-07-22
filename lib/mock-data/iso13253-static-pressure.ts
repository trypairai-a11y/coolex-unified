/**
 * ISO 13253 — Minimum external static pressure (ESP) for ducted comfort
 * air-conditioners.
 *
 * RATING BASIS: All COOLEX ducted-system performance data (split ducted DSSF/
 * DSSC/DSTF/DSTC, packaged RPU/SPU/PNGv, and FAPU) is published at the ISO 13253
 * minimum external static pressure for the unit's capacity band. The capacity
 * tables therefore represent the unit delivering rated airflow against this
 * minimum duct resistance.
 *
 * When a customer's design ESP is HIGHER than this minimum, the supply fan
 * operates further up its curve, delivers less airflow, and the coil delivers
 * less capacity — so the rated figures must be de-rated (see ductedESPFactor in
 * models.ts). At or below the band minimum the rated figures stand (we do not
 * credit extra capacity for an easier duct).
 *
 * Source: ISO 13253:2017, Table 1 — "Pressure requirement for comfort
 * air-conditioners". Capacity Q is the standard cooling capacity rating (kW).
 */

import { paToInWG } from '@/lib/utils/unit-conversions';

export interface ISO13253Band {
  /** Lower bound of the capacity band (kW), inclusive unless it is the first band. */
  minKW: number;
  /** Upper bound of the capacity band (kW), exclusive. Infinity for the last band. */
  maxKW: number;
  /** Minimum external static pressure for the band (Pa). */
  minESPPa: number;
}

/** ISO 13253:2017 Table 1 — minimum ESP by standard cooling capacity band (kW). */
export const ISO13253_TABLE: readonly ISO13253Band[] = [
  { minKW: 0,   maxKW: 8,        minESPPa: 25 },
  { minKW: 8,   maxKW: 12,       minESPPa: 37 },
  { minKW: 12,  maxKW: 20,       minESPPa: 50 },
  { minKW: 20,  maxKW: 30,       minESPPa: 62 },
  { minKW: 30,  maxKW: 45,       minESPPa: 75 },
  { minKW: 45,  maxKW: 82,       minESPPa: 100 },
  { minKW: 82,  maxKW: 117,      minESPPa: 125 },
  { minKW: 117, maxKW: 147,      minESPPa: 150 },
  { minKW: 147, maxKW: Infinity, minESPPa: 175 },
] as const;

/**
 * Per the Table 1 footnote: equipment tested WITHOUT an air filter installed
 * must have its minimum ESP increased by this amount.
 */
export const ISO13253_NO_FILTER_ADDER_PA = 10;

/**
 * Series whose performance data is published at the ISO 13253 minimum ESP for
 * the unit's capacity band (ducted split DX, packaged ducted, and fresh-air).
 * Shared by the selection engine (models.ts) and the design-conditions form so
 * the allowable-ESP guidance stays in sync with the de-rating logic.
 */
export const DUCTED_ISO_SERIES: ReadonlySet<string> = new Set<string>([
  // Split ducted DX (CHCF/CHEF matched pairs)
  'split-cs', 'split-ds', 'dstc', 'dstf',
  // Packaged ducted + fresh-air
  // NOTE: SPU is intentionally excluded — it has a digitized supply-fan table
  // (spu-fan-performance.ts) covering 0.40–2.0 in. WG, so external static is
  // modelled as an INCREASE in fan/motor power draw at constant airflow (see
  // applySPUDesignPoint), not as the generic ISO 13253 capacity de-rate.
  'rpui', 'rpuf', 'rpuc', 'pngv', 'fapu',
]);

/** True when the series is rated/de-rated on the ISO 13253 ESP basis. */
export function isDuctedISO(seriesId: string): boolean {
  return DUCTED_ISO_SERIES.has(seriesId);
}

const KW_PER_BTUH = 1 / 3412.142;

/** Convert a Btu/h cooling capacity to kW (for band lookup). */
export function btuhToKW(btuh: number): number {
  return btuh * KW_PER_BTUH;
}

/**
 * Minimum external static pressure (Pa) for a ducted comfort AC of the given
 * standard cooling capacity (kW). Pass `withoutFilter: true` to apply the
 * +10 Pa footnote adder for equipment tested without an air filter.
 */
export function isoMinExternalStaticPa(
  capacityKW: number,
  opts?: { withoutFilter?: boolean },
): number {
  const band =
    ISO13253_TABLE.find(b => capacityKW >= b.minKW && capacityKW < b.maxKW) ??
    ISO13253_TABLE[ISO13253_TABLE.length - 1];
  return band.minESPPa + (opts?.withoutFilter ? ISO13253_NO_FILTER_ADDER_PA : 0);
}

/** Minimum external static pressure (in. WG) for the given capacity (kW). */
export function isoMinExternalStaticInWG(
  capacityKW: number,
  opts?: { withoutFilter?: boolean },
): number {
  return paToInWG(isoMinExternalStaticPa(capacityKW, opts));
}
