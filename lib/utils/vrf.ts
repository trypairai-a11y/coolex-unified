import type { Model } from '@/types/product';

export interface VRFOutdoorUnit {
  /** Capacity code as printed on the nameplate, e.g. "0086". */
  code: string;
  /** Full model number, e.g. "VRF-OU-0086". */
  modelNumber: string;
  /** Nominal cooling capacity in thousand BTU/h (kBTU/h). */
  capacityKbtuh: number;
  compressorCount: number;
}

// Real COOLEX VRF outdoor condensing units. The capacity code is the nominal
// cooling capacity expressed in thousand BTU/h (e.g. 0086 = 86 kBTU/h ≈ 25.2 kW).
export const VRF_OUTDOOR_UNITS: VRFOutdoorUnit[] = [
  { code: '0086', modelNumber: 'VRF-OU-0086', capacityKbtuh: 86, compressorCount: 1 },
  { code: '0095', modelNumber: 'VRF-OU-0095', capacityKbtuh: 95, compressorCount: 1 },
  { code: '0114', modelNumber: 'VRF-OU-0114', capacityKbtuh: 114, compressorCount: 1 },
  { code: '0136', modelNumber: 'VRF-OU-0136', capacityKbtuh: 136, compressorCount: 1 },
  { code: '0154', modelNumber: 'VRF-OU-0154', capacityKbtuh: 154, compressorCount: 2 },
  { code: '0172', modelNumber: 'VRF-OU-0172', capacityKbtuh: 172, compressorCount: 2 },
  { code: '0190', modelNumber: 'VRF-OU-0190', capacityKbtuh: 190, compressorCount: 2 },
  { code: '0210', modelNumber: 'VRF-OU-0210', capacityKbtuh: 210, compressorCount: 2 },
];

/** Capacities (kBTU/h) of all outdoor units, ascending. */
export const VRF_OUTDOOR_CAPACITIES = VRF_OUTDOOR_UNITS.map((u) => u.capacityKbtuh);

// A VRF system is only valid when the combination ratio (total indoor capacity
// divided by combined outdoor capacity) sits between these bounds.
export const MIN_COMBINATION_RATIO = 50;
export const MAX_COMBINATION_RATIO = 130;

/** Outdoor modules that can be manifolded into one refrigerant system. */
export const MAX_VRF_OUTDOOR_MODULES = 4;

export function findVRFOutdoorUnit(code: string): VRFOutdoorUnit | undefined {
  return VRF_OUTDOOR_UNITS.find((u) => u.code === code);
}

/** Resolve stored nameplate codes back to units, dropping any that no longer exist. */
export function vrfOutdoorUnitsFromCodes(codes: readonly string[]): VRFOutdoorUnit[] {
  return codes
    .map(findVRFOutdoorUnit)
    .filter((u): u is VRFOutdoorUnit => !!u)
    .slice(0, MAX_VRF_OUTDOOR_MODULES);
}

/** Combined nominal capacity of every module in the system (kBTU/h). */
export function vrfCombinedCapacityKbtuh(units: readonly VRFOutdoorUnit[]): number {
  return units.reduce((sum, u) => sum + u.capacityKbtuh, 0);
}

/** Total indoor load as a percentage of combined outdoor capacity. */
export function vrfCombinationRatio(
  totalIndoorKbtuh: number,
  units: readonly VRFOutdoorUnit[],
): number {
  const capacity = vrfCombinedCapacityKbtuh(units);
  return capacity > 0 ? (totalIndoorKbtuh / capacity) * 100 : 0;
}

export function isVRFCombinationRatioValid(ratio: number): boolean {
  return ratio >= MIN_COMBINATION_RATIO && ratio <= MAX_COMBINATION_RATIO;
}

/** Indoor load carried by each module, split in proportion to module capacity. */
export function vrfModuleLoadSplitKbtuh(
  totalIndoorKbtuh: number,
  units: readonly VRFOutdoorUnit[],
): number[] {
  const capacity = vrfCombinedCapacityKbtuh(units);
  if (capacity <= 0) return units.map(() => 0);
  return units.map((u) => (totalIndoorKbtuh * u.capacityKbtuh) / capacity);
}

/** Smallest outdoor unit that covers the total indoor load (kBTU/h). */
export function pickVRFOutdoorUnit(totalIndoorKbtuh: number): VRFOutdoorUnit {
  return (
    VRF_OUTDOOR_UNITS.find((u) => u.capacityKbtuh >= totalIndoorKbtuh) ??
    VRF_OUTDOOR_UNITS[VRF_OUTDOOR_UNITS.length - 1]
  );
}

/** Smallest set of modules that covers the total indoor load.
 *
 *  Fewer modules is always preferred: a single unit beats any pair, a pair beats
 *  any trio. Once the load outgrows what that many modules can carry, the only
 *  way back into the combination-ratio window is to manifold another module in,
 *  so step the count up to `MAX_VRF_OUTDOOR_MODULES` and, at the first count
 *  that reaches the load, take the combination with the least surplus capacity.
 *  Loads beyond four of the largest modules can't be covered at all — return the
 *  biggest bank available and let the caller flag the ratio. */
export function pickVRFOutdoorCombination(totalIndoorKbtuh: number): VRFOutdoorUnit[] {
  for (let count = 1; count <= MAX_VRF_OUTDOOR_MODULES; count++) {
    const covering: VRFOutdoorUnit[][] = [];
    // Walk every non-decreasing combination of `count` sizes (repeats allowed).
    const walk = (start: number, chosen: VRFOutdoorUnit[], capacity: number) => {
      if (chosen.length === count) {
        if (capacity >= totalIndoorKbtuh) covering.push(chosen);
        return;
      }
      for (let i = start; i < VRF_OUTDOOR_UNITS.length; i++) {
        const u = VRF_OUTDOOR_UNITS[i];
        walk(i, [...chosen, u], capacity + u.capacityKbtuh);
      }
    };
    walk(0, [], 0);
    if (covering.length === 0) continue;
    const best = covering.reduce((a, b) =>
      vrfCombinedCapacityKbtuh(b) < vrfCombinedCapacityKbtuh(a) ? b : a,
    );
    // Largest module first so the diagram reads big-to-small left to right.
    return [...best].reverse();
  }

  const largest = VRF_OUTDOOR_UNITS[VRF_OUTDOOR_UNITS.length - 1];
  return Array.from({ length: MAX_VRF_OUTDOOR_MODULES }, () => largest);
}

export function synthesizeVRFOutdoorModel(unit: VRFOutdoorUnit, moduleIndex = 0): Model {
  const totalBtuh = unit.capacityKbtuh * 1000;
  const eer = 11.8;
  const powerKW = Math.round((totalBtuh / eer / 1000) * 100) / 100;
  const tons = unit.capacityKbtuh / 12;
  const airflow = Math.round(tons * 380);
  return {
    // Two identical modules can be paired, so the id carries the module index to
    // stay unique within one system.
    id: moduleIndex === 0 ? `vrf-odu-${unit.code}` : `vrf-odu-${unit.code}-${moduleIndex + 1}`,
    seriesId: 'vrf',
    modelNumber: unit.modelNumber,
    totalCapacityBtuh: totalBtuh,
    sensibleCapacityBtuh: Math.round(totalBtuh * 0.72),
    powerKW,
    eer,
    airflowCFM: airflow,
    leavingDBF: 58,
    leavingWBF: 56,
    compressorCount: unit.compressorCount,
    matchPercent: 100,
    nominalTons: Math.round(tons * 10) / 10,
    weightLbs: Math.round(tons * 75),
    lengthIn: 60,
    widthIn: 36,
    heightIn: 64,
    refrigerant: 'R-410A',
    compressorType: 'Inverter Scroll',
  };
}

/** One outdoor model per module of the system. */
export function synthesizeVRFOutdoorModels(units: readonly VRFOutdoorUnit[]): Model[] {
  return units.map((u, i) => synthesizeVRFOutdoorModel(u, i));
}

/** Roll a manifolded bank up into the single system-level model the submittal
 *  documents: capacities and power add, the model number lists both modules. */
export function combineVRFOutdoorModels(models: readonly Model[]): Model {
  if (models.length === 1) return models[0];
  const totalBtuh = models.reduce((s, m) => s + m.totalCapacityBtuh, 0);
  const powerKW = Math.round(models.reduce((s, m) => s + m.powerKW, 0) * 100) / 100;
  const tons = totalBtuh / 12000;
  return {
    ...models[0],
    id: models.map((m) => m.id).join('+'),
    modelNumber: models.map((m) => m.modelNumber).join(' + '),
    totalCapacityBtuh: totalBtuh,
    sensibleCapacityBtuh: models.reduce((s, m) => s + m.sensibleCapacityBtuh, 0),
    powerKW,
    eer: powerKW > 0 ? Math.round((totalBtuh / (powerKW * 1000)) * 10) / 10 : models[0].eer,
    airflowCFM: models.reduce((s, m) => s + m.airflowCFM, 0),
    compressorCount: models.reduce((s, m) => s + (m.compressorCount ?? 0), 0),
    nominalTons: Math.round(tons * 10) / 10,
    weightLbs: models.reduce((s, m) => s + (m.weightLbs ?? 0), 0),
  };
}
