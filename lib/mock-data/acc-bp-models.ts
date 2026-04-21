import type { Model } from '@/types/product';

// ACC-BP (Air-Cooled Chiller, Brazed Plate HX) performance data
// Source: COOLEX ACC-BP Performance Data Tables — Metric System
// Refrigerant: R-407C, Power: 415V/3Ph/50Hz
//
// Performance matrix is indexed by [LCWT °C][Ambient °C] and contains:
//   capacityKW, compressorKW, waterFlowLPS, waterPressureDropKPa
//
// Standard rating (T1): Ambient 35°C, LCWT 7.8°C — used for nominal tons / EER.

export interface ACCBPPerformancePoint {
  capacityKW: number;
  compressorKW: number;
  waterFlowLPS: number;
  waterPressureDropKPa: number;
}

export type ACCBPPerformanceMatrix = Record<string, Record<string, ACCBPPerformancePoint>>;

export interface ACCBPModelSpec extends Model {
  refrigerant: string;
  compressorType: string;
  performance: ACCBPPerformanceMatrix;
}

export const ACC_BP_AMBIENT_TEMPS_C = [35, 40, 46, 48, 52] as const;
export const ACC_BP_LCWT_C = [7.8, 8.8, 10] as const;

// Performance data: [modelNumber][lcwt][ambient] → point
const RAW: Record<string, Record<string, Record<string, ACCBPPerformancePoint>>> = {
  'ACC-03': {
    '7.8': {
      '35': { capacityKW: 11.3, compressorKW: 2.8, waterFlowLPS: 0.5, waterPressureDropKPa: 20.0 },
      '40': { capacityKW: 10.7, compressorKW: 3.2, waterFlowLPS: 0.5, waterPressureDropKPa: 17.3 },
      '46': { capacityKW: 10.0, compressorKW: 3.7, waterFlowLPS: 0.4, waterPressureDropKPa: 16.6 },
      '48': { capacityKW: 10.0, compressorKW: 3.8, waterFlowLPS: 0.5, waterPressureDropKPa: 15.9 },
      '52': { capacityKW: 9.4,  compressorKW: 4.1, waterFlowLPS: 0.4, waterPressureDropKPa: 13.8 },
    },
    '8.8': {
      '35': { capacityKW: 11.7, compressorKW: 2.8, waterFlowLPS: 0.5, waterPressureDropKPa: 21.4 },
      '40': { capacityKW: 11.1, compressorKW: 3.2, waterFlowLPS: 0.5, waterPressureDropKPa: 18.0 },
      '46': { capacityKW: 10.4, compressorKW: 3.7, waterFlowLPS: 0.4, waterPressureDropKPa: 18.0 },
      '48': { capacityKW: 10.4, compressorKW: 3.8, waterFlowLPS: 0.5, waterPressureDropKPa: 17.3 },
      '52': { capacityKW: 9.7,  compressorKW: 4.2, waterFlowLPS: 0.4, waterPressureDropKPa: 14.5 },
    },
    '10': {
      '35': { capacityKW: 12.2, compressorKW: 2.8, waterFlowLPS: 0.5, waterPressureDropKPa: 22.8 },
      '40': { capacityKW: 11.5, compressorKW: 3.2, waterFlowLPS: 0.5, waterPressureDropKPa: 18.6 },
      '46': { capacityKW: 10.7, compressorKW: 3.7, waterFlowLPS: 0.5, waterPressureDropKPa: 19.3 },
      '48': { capacityKW: 10.8, compressorKW: 3.8, waterFlowLPS: 0.5, waterPressureDropKPa: 18.6 },
      '52': { capacityKW: 10.0, compressorKW: 4.2, waterFlowLPS: 0.5, waterPressureDropKPa: 15.2 },
    },
  },
  'ACC-04': {
    '7.8': {
      '35': { capacityKW: 14.6, compressorKW: 3.8, waterFlowLPS: 0.6, waterPressureDropKPa: 20.0 },
      '40': { capacityKW: 13.8, compressorKW: 4.3, waterFlowLPS: 0.6, waterPressureDropKPa: 17.3 },
      '46': { capacityKW: 13.1, compressorKW: 4.8, waterFlowLPS: 0.6, waterPressureDropKPa: 16.6 },
      '48': { capacityKW: 12.7, compressorKW: 5.0, waterFlowLPS: 0.5, waterPressureDropKPa: 15.2 },
      '52': { capacityKW: 12.1, compressorKW: 5.4, waterFlowLPS: 0.5, waterPressureDropKPa: 13.8 },
    },
    '8.8': {
      '35': { capacityKW: 15.1, compressorKW: 3.9, waterFlowLPS: 0.7, waterPressureDropKPa: 21.4 },
      '40': { capacityKW: 14.3, compressorKW: 4.4, waterFlowLPS: 0.6, waterPressureDropKPa: 18.0 },
      '46': { capacityKW: 13.6, compressorKW: 4.9, waterFlowLPS: 0.6, waterPressureDropKPa: 18.0 },
      '48': { capacityKW: 13.2, compressorKW: 5.1, waterFlowLPS: 0.6, waterPressureDropKPa: 15.9 },
      '52': { capacityKW: 12.5, compressorKW: 5.5, waterFlowLPS: 0.6, waterPressureDropKPa: 14.5 },
    },
    '10': {
      '35': { capacityKW: 15.7, compressorKW: 3.9, waterFlowLPS: 0.7, waterPressureDropKPa: 22.8 },
      '40': { capacityKW: 14.8, compressorKW: 4.4, waterFlowLPS: 0.6, waterPressureDropKPa: 18.6 },
      '46': { capacityKW: 14.1, compressorKW: 4.9, waterFlowLPS: 0.6, waterPressureDropKPa: 19.3 },
      '48': { capacityKW: 13.6, compressorKW: 5.1, waterFlowLPS: 0.6, waterPressureDropKPa: 16.6 },
      '52': { capacityKW: 12.8, compressorKW: 5.5, waterFlowLPS: 0.6, waterPressureDropKPa: 15.2 },
    },
  },
  'ACC-05': {
    '7.8': {
      '35': { capacityKW: 19.9, compressorKW: 4.7, waterFlowLPS: 0.9, waterPressureDropKPa: 32.5 },
      '40': { capacityKW: 17.4, compressorKW: 5.3, waterFlowLPS: 0.7, waterPressureDropKPa: 29.7 },
      '46': { capacityKW: 17.1, compressorKW: 6.0, waterFlowLPS: 0.7, waterPressureDropKPa: 26.2 },
      '48': { capacityKW: 16.7, compressorKW: 6.2, waterFlowLPS: 0.7, waterPressureDropKPa: 26.2 },
      '52': { capacityKW: 16.0, compressorKW: 6.7, waterFlowLPS: 0.7, waterPressureDropKPa: 23.5 },
    },
    '8.8': {
      '35': { capacityKW: 21.4, compressorKW: 4.7, waterFlowLPS: 0.9, waterPressureDropKPa: 34.5 },
      '40': { capacityKW: 18.0, compressorKW: 5.3, waterFlowLPS: 0.8, waterPressureDropKPa: 31.8 },
      '46': { capacityKW: 18.0, compressorKW: 6.0, waterFlowLPS: 0.8, waterPressureDropKPa: 27.6 },
      '48': { capacityKW: 17.6, compressorKW: 6.3, waterFlowLPS: 0.8, waterPressureDropKPa: 28.3 },
      '52': { capacityKW: 16.5, compressorKW: 6.7, waterFlowLPS: 0.7, waterPressureDropKPa: 24.9 },
    },
    '10': {
      '35': { capacityKW: 22.9, compressorKW: 4.7, waterFlowLPS: 1.0, waterPressureDropKPa: 36.6 },
      '40': { capacityKW: 18.5, compressorKW: 5.3, waterFlowLPS: 0.8, waterPressureDropKPa: 33.8 },
      '46': { capacityKW: 18.9, compressorKW: 6.0, waterFlowLPS: 0.8, waterPressureDropKPa: 29.0 },
      '48': { capacityKW: 18.5, compressorKW: 6.3, waterFlowLPS: 0.8, waterPressureDropKPa: 30.4 },
      '52': { capacityKW: 17.0, compressorKW: 6.7, waterFlowLPS: 0.7, waterPressureDropKPa: 26.2 },
    },
  },
  'ACC-07': {
    '7.8': {
      '35': { capacityKW: 25.8, compressorKW: 6.4, waterFlowLPS: 1.1, waterPressureDropKPa: 22.8 },
      '40': { capacityKW: 24.3, compressorKW: 7.2, waterFlowLPS: 1.0, waterPressureDropKPa: 20.7 },
      '46': { capacityKW: 22.9, compressorKW: 7.9, waterFlowLPS: 1.0, waterPressureDropKPa: 18.6 },
      '48': { capacityKW: 22.3, compressorKW: 8.3, waterFlowLPS: 1.0, waterPressureDropKPa: 18.0 },
      '52': { capacityKW: 21.0, compressorKW: 9.0, waterFlowLPS: 0.9, waterPressureDropKPa: 16.6 },
    },
    '8.8': {
      '35': { capacityKW: 26.8, compressorKW: 6.4, waterFlowLPS: 1.1, waterPressureDropKPa: 24.2 },
      '40': { capacityKW: 25.2, compressorKW: 7.2, waterFlowLPS: 1.1, waterPressureDropKPa: 22.1 },
      '46': { capacityKW: 23.8, compressorKW: 7.8, waterFlowLPS: 1.0, waterPressureDropKPa: 20.0 },
      '48': { capacityKW: 23.2, compressorKW: 8.4, waterFlowLPS: 1.0, waterPressureDropKPa: 19.3 },
      '52': { capacityKW: 21.6, compressorKW: 9.1, waterFlowLPS: 0.9, waterPressureDropKPa: 18.0 },
    },
    '10': {
      '35': { capacityKW: 27.8, compressorKW: 6.4, waterFlowLPS: 1.2, waterPressureDropKPa: 25.5 },
      '40': { capacityKW: 26.1, compressorKW: 7.2, waterFlowLPS: 1.1, waterPressureDropKPa: 23.5 },
      '46': { capacityKW: 24.7, compressorKW: 7.8, waterFlowLPS: 1.1, waterPressureDropKPa: 21.4 },
      '48': { capacityKW: 24.1, compressorKW: 8.4, waterFlowLPS: 1.0, waterPressureDropKPa: 20.7 },
      '52': { capacityKW: 22.3, compressorKW: 9.1, waterFlowLPS: 1.0, waterPressureDropKPa: 18.6 },
    },
  },
  'ACC-010': {
    '7.8': {
      '35': { capacityKW: 36.4, compressorKW: 8.9,  waterFlowLPS: 1.6, waterPressureDropKPa: 29.7 },
      '40': { capacityKW: 34.3, compressorKW: 10.0, waterFlowLPS: 1.5, waterPressureDropKPa: 26.9 },
      '46': { capacityKW: 30.8, compressorKW: 11.3, waterFlowLPS: 1.3, waterPressureDropKPa: 24.2 },
      '48': { capacityKW: 31.4, compressorKW: 11.8, waterFlowLPS: 1.4, waterPressureDropKPa: 22.1 },
      '52': { capacityKW: 30.0, compressorKW: 12.8, waterFlowLPS: 1.3, waterPressureDropKPa: 20.0 },
    },
    '8.8': {
      '35': { capacityKW: 37.7, compressorKW: 8.9,  waterFlowLPS: 1.6, waterPressureDropKPa: 31.8 },
      '40': { capacityKW: 35.6, compressorKW: 10.1, waterFlowLPS: 1.5, waterPressureDropKPa: 29.0 },
      '46': { capacityKW: 30.6, compressorKW: 11.4, waterFlowLPS: 1.3, waterPressureDropKPa: 26.2 },
      '48': { capacityKW: 32.5, compressorKW: 11.8, waterFlowLPS: 1.4, waterPressureDropKPa: 23.5 },
      '52': { capacityKW: 31.1, compressorKW: 12.9, waterFlowLPS: 1.3, waterPressureDropKPa: 21.4 },
    },
    '10': {
      '35': { capacityKW: 39.0, compressorKW: 8.9,  waterFlowLPS: 1.6, waterPressureDropKPa: 33.8 },
      '40': { capacityKW: 36.9, compressorKW: 10.1, waterFlowLPS: 1.6, waterPressureDropKPa: 31.1 },
      '46': { capacityKW: 30.4, compressorKW: 11.4, waterFlowLPS: 1.3, waterPressureDropKPa: 28.3 },
      '48': { capacityKW: 33.6, compressorKW: 11.8, waterFlowLPS: 1.4, waterPressureDropKPa: 24.9 },
      '52': { capacityKW: 32.3, compressorKW: 12.9, waterFlowLPS: 1.4, waterPressureDropKPa: 22.8 },
    },
  },
  'ACC-012': {
    '7.8': {
      '35': { capacityKW: 43.8, compressorKW: 11.1, waterFlowLPS: 1.9, waterPressureDropKPa: 51.1 },
      '40': { capacityKW: 42.7, compressorKW: 12.6, waterFlowLPS: 1.8, waterPressureDropKPa: 44.9 },
      '46': { capacityKW: 39.8, compressorKW: 14.2, waterFlowLPS: 1.7, waterPressureDropKPa: 39.4 },
      '48': { capacityKW: 40.5, compressorKW: 14.8, waterFlowLPS: 1.7, waterPressureDropKPa: 37.4 },
      '52': { capacityKW: 37.4, compressorKW: 16.0, waterFlowLPS: 1.6, waterPressureDropKPa: 33.1 },
    },
    '8.8': {
      '35': { capacityKW: 43.9, compressorKW: 11.2, waterFlowLPS: 1.9, waterPressureDropKPa: 54.5 },
      '40': { capacityKW: 44.1, compressorKW: 12.6, waterFlowLPS: 1.9, waterPressureDropKPa: 47.6 },
      '46': { capacityKW: 41.3, compressorKW: 14.3, waterFlowLPS: 1.8, waterPressureDropKPa: 42.1 },
      '48': { capacityKW: 42.7, compressorKW: 14.9, waterFlowLPS: 1.8, waterPressureDropKPa: 40.7 },
      '52': { capacityKW: 39.1, compressorKW: 16.1, waterFlowLPS: 1.7, waterPressureDropKPa: 35.2 },
    },
    '10': {
      '35': { capacityKW: 44.0, compressorKW: 11.2, waterFlowLPS: 1.9, waterPressureDropKPa: 58.0 },
      '40': { capacityKW: 45.5, compressorKW: 12.6, waterFlowLPS: 1.9, waterPressureDropKPa: 50.4 },
      '46': { capacityKW: 42.7, compressorKW: 14.3, waterFlowLPS: 1.8, waterPressureDropKPa: 44.9 },
      '48': { capacityKW: 44.9, compressorKW: 14.9, waterFlowLPS: 1.9, waterPressureDropKPa: 43.5 },
      '52': { capacityKW: 40.9, compressorKW: 16.1, waterFlowLPS: 1.8, waterPressureDropKPa: 37.3 },
    },
  },
  'ACC-015': {
    '7.8': {
      '35': { capacityKW: 54.7, compressorKW: 12.1, waterFlowLPS: 2.4, waterPressureDropKPa: 37.3 },
      '40': { capacityKW: 51.3, compressorKW: 13.5, waterFlowLPS: 2.2, waterPressureDropKPa: 33.8 },
      '46': { capacityKW: 48.0, compressorKW: 15.2, waterFlowLPS: 2.1, waterPressureDropKPa: 30.4 },
      '48': { capacityKW: 46.8, compressorKW: 15.8, waterFlowLPS: 2.0, waterPressureDropKPa: 28.3 },
      '52': { capacityKW: 46.7, compressorKW: 17.0, waterFlowLPS: 2.0, waterPressureDropKPa: 25.5 },
    },
    '8.8': {
      '35': { capacityKW: 56.9, compressorKW: 12.1, waterFlowLPS: 2.5, waterPressureDropKPa: 40.0 },
      '40': { capacityKW: 53.3, compressorKW: 13.6, waterFlowLPS: 2.3, waterPressureDropKPa: 36.6 },
      '46': { capacityKW: 49.7, compressorKW: 15.3, waterFlowLPS: 2.1, waterPressureDropKPa: 31.7 },
      '48': { capacityKW: 48.5, compressorKW: 15.9, waterFlowLPS: 2.1, waterPressureDropKPa: 30.4 },
      '52': { capacityKW: 48.3, compressorKW: 17.2, waterFlowLPS: 2.1, waterPressureDropKPa: 27.6 },
    },
    '10': {
      '35': { capacityKW: 59.2, compressorKW: 12.1, waterFlowLPS: 2.6, waterPressureDropKPa: 42.8 },
      '40': { capacityKW: 55.3, compressorKW: 13.5, waterFlowLPS: 2.4, waterPressureDropKPa: 39.4 },
      '46': { capacityKW: 51.5, compressorKW: 15.3, waterFlowLPS: 2.2, waterPressureDropKPa: 35.9 },
      '48': { capacityKW: 50.2, compressorKW: 15.9, waterFlowLPS: 2.2, waterPressureDropKPa: 32.5 },
      '52': { capacityKW: 49.8, compressorKW: 17.2, waterFlowLPS: 2.1, waterPressureDropKPa: 29.7 },
    },
  },
  'ACC-017': {
    '7.8': {
      '35': { capacityKW: 65.2, compressorKW: 14.5, waterFlowLPS: 2.8, waterPressureDropKPa: 47.6 },
      '40': { capacityKW: 56.1, compressorKW: 16.3, waterFlowLPS: 2.4, waterPressureDropKPa: 42.1 },
      '46': { capacityKW: 52.9, compressorKW: 18.4, waterFlowLPS: 2.3, waterPressureDropKPa: 37.3 },
      '48': { capacityKW: 51.1, compressorKW: 19.1, waterFlowLPS: 2.2, waterPressureDropKPa: 35.9 },
      '52': { capacityKW: 48.5, compressorKW: 20.8, waterFlowLPS: 2.1, waterPressureDropKPa: 31.8 },
    },
    '8.8': {
      '35': { capacityKW: 70.4, compressorKW: 14.6, waterFlowLPS: 3.0, waterPressureDropKPa: 51.1 },
      '40': { capacityKW: 58.2, compressorKW: 16.5, waterFlowLPS: 2.5, waterPressureDropKPa: 44.9 },
      '46': { capacityKW: 55.0, compressorKW: 18.6, waterFlowLPS: 2.4, waterPressureDropKPa: 40.0 },
      '48': { capacityKW: 53.0, compressorKW: 19.3, waterFlowLPS: 2.3, waterPressureDropKPa: 38.7 },
      '52': { capacityKW: 50.2, compressorKW: 21.0, waterFlowLPS: 2.2, waterPressureDropKPa: 33.1 },
    },
    '10': {
      '35': { capacityKW: 75.5, compressorKW: 14.6, waterFlowLPS: 3.3, waterPressureDropKPa: 54.5 },
      '40': { capacityKW: 60.4, compressorKW: 16.5, waterFlowLPS: 2.6, waterPressureDropKPa: 47.6 },
      '46': { capacityKW: 57.2, compressorKW: 18.6, waterFlowLPS: 2.5, waterPressureDropKPa: 42.1 },
      '48': { capacityKW: 55.0, compressorKW: 19.3, waterFlowLPS: 2.4, waterPressureDropKPa: 41.4 },
      '52': { capacityKW: 51.9, compressorKW: 21.0, waterFlowLPS: 2.2, waterPressureDropKPa: 35.9 },
    },
  },
};

const KW_PER_TON = 3.51685;
const BTUH_PER_KW = 3412.142;

function buildModel(modelNumber: string, perf: Record<string, Record<string, ACCBPPerformancePoint>>): ACCBPModelSpec {
  // Standard rating point: T1 — 35°C ambient, 7.8°C LCWT
  const rated = perf['7.8']['35'];
  const nominalTons = Math.round((rated.capacityKW / KW_PER_TON) * 100) / 100;
  const totalCapacityBtuh = Math.round(rated.capacityKW * BTUH_PER_KW);
  const eer = Math.round((totalCapacityBtuh / (rated.compressorKW * 1000)) * 100) / 100;

  // Structural / non-tabulated approximations scaled by nominal tons
  const lengthIn = Math.round(nominalTons * 6 + 50);
  const widthIn = Math.round(nominalTons * 1.8 + 32);
  const heightIn = Math.round(nominalTons * 1.2 + 48);
  const weightLbs = Math.round(nominalTons * 95 + 220);

  return {
    id: `acc-bp-${modelNumber}`,
    seriesId: 'acc-bp',
    modelNumber,
    nominalTons,
    totalCapacityBtuh,
    sensibleCapacityBtuh: totalCapacityBtuh,
    airflowCFM: Math.round(nominalTons * 350),
    powerKW: rated.compressorKW,
    eer,
    leavingDBF: 44,
    leavingWBF: 44,
    compressorCount: nominalTons <= 10 ? 1 : 2,
    matchPercent: 100,
    weightLbs,
    lengthIn,
    widthIn,
    heightIn,
    refrigerant: 'R-407C',
    compressorType: 'Scroll',
    performance: perf,
  };
}

export const ACC_BP_MODELS: ACCBPModelSpec[] = Object.entries(RAW).map(([modelNumber, perf]) =>
  buildModel(modelNumber, perf),
);

/**
 * Look up an ACC-BP performance point by leaving chilled water temp and ambient temp (°C).
 * Snaps to the closest tabulated condition in each axis.
 */
export function getACCBPPerformance(
  modelNumber: string,
  lcwtC: number,
  ambientC: number,
): ACCBPPerformancePoint | undefined {
  const model = ACC_BP_MODELS.find(m => m.modelNumber === modelNumber);
  if (!model) return undefined;

  const closest = (target: number, options: readonly number[]) =>
    options.reduce((best, v) => Math.abs(v - target) < Math.abs(best - target) ? v : best, options[0]);

  const lcwt = closest(lcwtC, ACC_BP_LCWT_C);
  const ambient = closest(ambientC, ACC_BP_AMBIENT_TEMPS_C);
  return model.performance[String(lcwt)]?.[String(ambient)];
}
