// All internal values are stored in Imperial units.
// These functions convert between Imperial (stored) and Metric (display).

// --- Temperature ---
export function fToC(f: number): number {
  return (f - 32) * 5 / 9;
}

export function cToF(c: number): number {
  return c * 9 / 5 + 32;
}

// --- Altitude ---
export function ftToM(ft: number): number {
  return ft * 0.3048;
}

export function mToFt(m: number): number {
  return m / 0.3048;
}

// --- Static Pressure ---
// in. WG → Pascal (1 in. WG = 249.089 Pa)
export function inWGToPa(inWG: number): number {
  return inWG * 249.089;
}

export function paToInWG(pa: number): number {
  return pa / 249.089;
}

// --- Flow Rate ---
// GPM → L/s (1 GPM = 0.0630902 L/s)
export function gpmToLps(gpm: number): number {
  return gpm * 0.0630902;
}

export function lpsToGpm(lps: number): number {
  return lps / 0.0630902;
}

// --- Airflow ---
// CFM → m³/h (1 CFM = 1.699 m³/h)
export function cfmToM3h(cfm: number): number {
  return cfm * 1.699;
}

export function m3hToCfm(m3h: number): number {
  return m3h / 1.699;
}

// --- Capacity ---
export const BTU_PER_KW = 3412.14;

export function btuhToKw(btuh: number): number {
  return btuh / BTU_PER_KW;
}

export function kwToBtuh(kw: number): number {
  return kw * BTU_PER_KW;
}

// --- Round helper ---
export function round(value: number, decimals: number = 1): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

// --- Bulk convert form values between systems ---
import type { UnitSystem } from '@/lib/stores/unit-store';

/** Convert a form value from imperial (stored) to the target unit system for display */
export function toDisplay(value: number, field: string, system: UnitSystem): number {
  if (system === 'imperial') return value;
  switch (field) {
    case 'enteringDBF':
    case 'enteringWBF':
    case 'enteringWaterTempF':
    case 'leavingWaterTempF':
    case 'ambientTempF':
    case 'freshAirDBF':
    case 'freshAirWBF':
      return round(fToC(value), 1);
    case 'altitudeFt':
      return round(ftToM(value), 0);
    case 'espInWG':
      return round(inWGToPa(value), 0);
    case 'waterFlowRateGPM':
      return round(gpmToLps(value), 2);
    case 'requiredCoolingCapacityBtuh':
      return round(btuhToKw(value), 2);
    case 'requiredAirflowCFM':
      return round(cfmToM3h(value), 0);
    default:
      return value;
  }
}

/** Convert a form value from the display unit system back to imperial for storage */
export function toImperial(value: number, field: string, system: UnitSystem): number {
  if (system === 'imperial') return value;
  switch (field) {
    case 'enteringDBF':
    case 'enteringWBF':
    case 'enteringWaterTempF':
    case 'leavingWaterTempF':
    case 'ambientTempF':
    case 'freshAirDBF':
    case 'freshAirWBF':
      return round(cToF(value), 1);
    case 'altitudeFt':
      return round(mToFt(value), 0);
    case 'espInWG':
      return round(paToInWG(value), 2);
    case 'waterFlowRateGPM':
      return round(lpsToGpm(value), 2);
    case 'requiredCoolingCapacityBtuh':
      return round(kwToBtuh(value), 0);
    case 'requiredAirflowCFM':
      return round(m3hToCfm(value), 0);
    default:
      return value;
  }
}

/** Get the display unit label for a field */
export function unitLabel(field: string, system: UnitSystem): string {
  const labels: Record<string, [string, string]> = {
    enteringDBF: ['°F', '°C'],
    enteringWBF: ['°F', '°C'],
    enteringWaterTempF: ['°F', '°C'],
    leavingWaterTempF: ['°F', '°C'],
    ambientTempF: ['°F', '°C'],
    altitudeFt: ['ft', 'm'],
    espInWG: ['in. WG', 'Pa'],
    waterFlowRateGPM: ['GPM', 'L/s'],
    requiredCoolingCapacityBtuh: ['Btu/h', 'kW'],
    requiredAirflowCFM: ['CFM', 'm³/h'],
    freshAirDBF: ['°F', '°C'],
    freshAirWBF: ['°F', '°C'],
  };
  const pair = labels[field];
  if (!pair) return '';
  return system === 'imperial' ? pair[0] : pair[1];
}
