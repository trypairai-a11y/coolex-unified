import type { Model } from '@/types/product';

export const VRF_OUTDOOR_SIZES = [8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 36, 40, 48] as const;

export function pickVRFOutdoorTons(totalIndoorKbtuh: number): number {
  const tons = totalIndoorKbtuh / 12;
  return VRF_OUTDOOR_SIZES.find((s) => s >= tons) ?? VRF_OUTDOOR_SIZES[VRF_OUTDOOR_SIZES.length - 1];
}

export function synthesizeVRFOutdoorModel(tons: number): Model {
  const totalBtuh = tons * 12000;
  const eer = 11.8;
  const powerKW = Math.round((totalBtuh / eer / 1000) * 100) / 100;
  const airflow = Math.round(tons * 380);
  return {
    id: `vrf-odu-${tons}`,
    seriesId: 'vrf',
    modelNumber: `VRF-OU-${String(tons).padStart(3, '0')}`,
    totalCapacityBtuh: totalBtuh,
    sensibleCapacityBtuh: Math.round(totalBtuh * 0.72),
    powerKW,
    eer,
    airflowCFM: airflow,
    leavingDBF: 58,
    leavingWBF: 56,
    compressorCount: tons >= 20 ? 2 : 1,
    matchPercent: 100,
    nominalTons: tons,
    weightLbs: Math.round(tons * 75),
    lengthIn: 60,
    widthIn: 36,
    heightIn: 64,
    refrigerant: 'R-410A',
    compressorType: 'Inverter Scroll',
  };
}
