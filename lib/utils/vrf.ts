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

/** Smallest outdoor unit that covers the total indoor load (kBTU/h). */
export function pickVRFOutdoorUnit(totalIndoorKbtuh: number): VRFOutdoorUnit {
  return (
    VRF_OUTDOOR_UNITS.find((u) => u.capacityKbtuh >= totalIndoorKbtuh) ??
    VRF_OUTDOOR_UNITS[VRF_OUTDOOR_UNITS.length - 1]
  );
}

export function synthesizeVRFOutdoorModel(unit: VRFOutdoorUnit): Model {
  const totalBtuh = unit.capacityKbtuh * 1000;
  const eer = 11.8;
  const powerKW = Math.round((totalBtuh / eer / 1000) * 100) / 100;
  const tons = unit.capacityKbtuh / 12;
  const airflow = Math.round(tons * 380);
  return {
    id: `vrf-odu-${unit.code}`,
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
