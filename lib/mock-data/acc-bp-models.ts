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
export const ACC_BP_LCWT_C = [4.5, 5.6, 6.7, 7.8, 8.8, 10] as const;

// Performance data: [modelNumber][lcwt][ambient] → point
const RAW: Record<string, Record<string, Record<string, ACCBPPerformancePoint>>> = {
  'ACC-03': {
    '4.5': {
      '35': { capacityKW: 10.1, compressorKW: 2.8, waterFlowLPS: 0.4, waterPressureDropKPa: 15.9 },
      '40': { capacityKW: 9.5,  compressorKW: 3.2, waterFlowLPS: 0.4, waterPressureDropKPa: 15.2 },
      '46': { capacityKW: 8.9,  compressorKW: 3.6, waterFlowLPS: 0.4, waterPressureDropKPa: 12.4 },
      '48': { capacityKW: 8.7,  compressorKW: 3.7, waterFlowLPS: 0.5, waterPressureDropKPa: 11.7 },
      '52': { capacityKW: 8.4,  compressorKW: 4.0, waterFlowLPS: 0.4, waterPressureDropKPa: 11.7 },
    },
    '5.6': {
      '35': { capacityKW: 10.5, compressorKW: 2.8, waterFlowLPS: 0.4, waterPressureDropKPa: 17.3 },
      '40': { capacityKW: 9.9,  compressorKW: 3.2, waterFlowLPS: 0.4, waterPressureDropKPa: 15.9 },
      '46': { capacityKW: 9.3,  compressorKW: 3.6, waterFlowLPS: 0.4, waterPressureDropKPa: 13.8 },
      '48': { capacityKW: 9.1,  compressorKW: 3.8, waterFlowLPS: 0.4, waterPressureDropKPa: 13.1 },
      '52': { capacityKW: 8.7,  compressorKW: 4.1, waterFlowLPS: 0.4, waterPressureDropKPa: 12.4 },
    },
    '6.7': {
      '35': { capacityKW: 10.9, compressorKW: 2.8, waterFlowLPS: 0.5, waterPressureDropKPa: 18.6 },
      '40': { capacityKW: 10.3, compressorKW: 3.2, waterFlowLPS: 0.4, waterPressureDropKPa: 16.6 },
      '46': { capacityKW: 9.7,  compressorKW: 3.6, waterFlowLPS: 0.4, waterPressureDropKPa: 15.2 },
      '48': { capacityKW: 9.5,  compressorKW: 3.8, waterFlowLPS: 0.4, waterPressureDropKPa: 14.5 },
      '52': { capacityKW: 9.0,  compressorKW: 4.1, waterFlowLPS: 0.4, waterPressureDropKPa: 13.1 },
    },
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
    '4.5': {
      '35': { capacityKW: 13.1, compressorKW: 3.7, waterFlowLPS: 0.6, waterPressureDropKPa: 15.9 },
      '40': { capacityKW: 12.4, compressorKW: 4.2, waterFlowLPS: 0.5, waterPressureDropKPa: 15.2 },
      '46': { capacityKW: 11.6, compressorKW: 4.7, waterFlowLPS: 0.5, waterPressureDropKPa: 12.4 },
      '48': { capacityKW: 11.4, compressorKW: 4.9, waterFlowLPS: 0.5, waterPressureDropKPa: 13.1 },
      '52': { capacityKW: 11.0, compressorKW: 5.1, waterFlowLPS: 0.5, waterPressureDropKPa: 11.7 },
    },
    '5.6': {
      '35': { capacityKW: 13.6, compressorKW: 3.8, waterFlowLPS: 0.6, waterPressureDropKPa: 17.3 },
      '40': { capacityKW: 12.9, compressorKW: 4.2, waterFlowLPS: 0.6, waterPressureDropKPa: 15.9 },
      '46': { capacityKW: 12.1, compressorKW: 4.7, waterFlowLPS: 0.5, waterPressureDropKPa: 13.8 },
      '48': { capacityKW: 11.9, compressorKW: 4.8, waterFlowLPS: 0.5, waterPressureDropKPa: 13.8 },
      '52': { capacityKW: 11.4, compressorKW: 5.2, waterFlowLPS: 0.5, waterPressureDropKPa: 12.4 },
    },
    '6.7': {
      '35': { capacityKW: 14.1, compressorKW: 3.8, waterFlowLPS: 0.6, waterPressureDropKPa: 18.6 },
      '40': { capacityKW: 13.4, compressorKW: 4.3, waterFlowLPS: 0.6, waterPressureDropKPa: 16.6 },
      '46': { capacityKW: 12.6, compressorKW: 4.8, waterFlowLPS: 0.5, waterPressureDropKPa: 15.2 },
      '48': { capacityKW: 12.3, compressorKW: 5.0, waterFlowLPS: 0.5, waterPressureDropKPa: 14.5 },
      '52': { capacityKW: 11.7, compressorKW: 5.3, waterFlowLPS: 0.5, waterPressureDropKPa: 13.1 },
    },
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
    '4.5': {
      '35': { capacityKW: 15.5, compressorKW: 4.6, waterFlowLPS: 0.7, waterPressureDropKPa: 26.2 },
      '40': { capacityKW: 15.5, compressorKW: 5.2, waterFlowLPS: 0.7, waterPressureDropKPa: 23.5 },
      '46': { capacityKW: 14.3, compressorKW: 5.8, waterFlowLPS: 0.6, waterPressureDropKPa: 22.1 },
      '48': { capacityKW: 14.0, compressorKW: 6.0, waterFlowLPS: 0.6, waterPressureDropKPa: 20.0 },
      '52': { capacityKW: 14.5, compressorKW: 6.5, waterFlowLPS: 0.6, waterPressureDropKPa: 19.3 },
    },
    '5.6': {
      '35': { capacityKW: 17.0, compressorKW: 4.6, waterFlowLPS: 0.7, waterPressureDropKPa: 28.3 },
      '40': { capacityKW: 16.7, compressorKW: 5.3, waterFlowLPS: 0.7, waterPressureDropKPa: 25.5 },
      '46': { capacityKW: 15.5, compressorKW: 5.9, waterFlowLPS: 0.7, waterPressureDropKPa: 22.8 },
      '48': { capacityKW: 14.9, compressorKW: 6.1, waterFlowLPS: 0.6, waterPressureDropKPa: 22.1 },
      '52': { capacityKW: 15.0, compressorKW: 6.6, waterFlowLPS: 0.6, waterPressureDropKPa: 20.7 },
    },
    '6.7': {
      '35': { capacityKW: 18.5, compressorKW: 4.6, waterFlowLPS: 0.8, waterPressureDropKPa: 30.4 },
      '40': { capacityKW: 16.7, compressorKW: 5.2, waterFlowLPS: 0.7, waterPressureDropKPa: 27.6 },
      '46': { capacityKW: 16.1, compressorKW: 5.9, waterFlowLPS: 0.7, waterPressureDropKPa: 24.9 },
      '48': { capacityKW: 15.8, compressorKW: 6.2, waterFlowLPS: 0.7, waterPressureDropKPa: 24.2 },
      '52': { capacityKW: 15.5, compressorKW: 6.6, waterFlowLPS: 0.6, waterPressureDropKPa: 22.1 },
    },
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
    '4.5': {
      '35': { capacityKW: 22.6, compressorKW: 6.2, waterFlowLPS: 1.0, waterPressureDropKPa: 18.6 },
      '40': { capacityKW: 21.5, compressorKW: 7.0, waterFlowLPS: 0.9, waterPressureDropKPa: 16.6 },
      '46': { capacityKW: 20.1, compressorKW: 7.6, waterFlowLPS: 0.9, waterPressureDropKPa: 14.5 },
      '48': { capacityKW: 19.6, compressorKW: 8.1, waterFlowLPS: 0.9, waterPressureDropKPa: 13.8 },
      '52': { capacityKW: 19.0, compressorKW: 8.7, waterFlowLPS: 0.8, waterPressureDropKPa: 12.4 },
    },
    '5.6': {
      '35': { capacityKW: 23.7, compressorKW: 6.3, waterFlowLPS: 1.0, waterPressureDropKPa: 20.0 },
      '40': { capacityKW: 22.4, compressorKW: 7.0, waterFlowLPS: 1.0, waterPressureDropKPa: 18.0 },
      '46': { capacityKW: 21.0, compressorKW: 7.7, waterFlowLPS: 0.9, waterPressureDropKPa: 15.9 },
      '48': { capacityKW: 20.5, compressorKW: 8.2, waterFlowLPS: 0.9, waterPressureDropKPa: 15.2 },
      '52': { capacityKW: 19.7, compressorKW: 8.8, waterFlowLPS: 0.9, waterPressureDropKPa: 13.8 },
    },
    '6.7': {
      '35': { capacityKW: 24.7, compressorKW: 6.3, waterFlowLPS: 1.1, waterPressureDropKPa: 21.4 },
      '40': { capacityKW: 23.3, compressorKW: 7.1, waterFlowLPS: 1.0, waterPressureDropKPa: 19.3 },
      '46': { capacityKW: 21.9, compressorKW: 7.9, waterFlowLPS: 0.9, waterPressureDropKPa: 17.3 },
      '48': { capacityKW: 21.4, compressorKW: 8.2, waterFlowLPS: 0.9, waterPressureDropKPa: 15.9 },
      '52': { capacityKW: 20.3, compressorKW: 8.9, waterFlowLPS: 0.9, waterPressureDropKPa: 15.2 },
    },
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
    '4.5': {
      '35': { capacityKW: 32.5, compressorKW: 8.6,  waterFlowLPS: 1.4, waterPressureDropKPa: 25.5 },
      '40': { capacityKW: 30.6, compressorKW: 9.8,  waterFlowLPS: 1.3, waterPressureDropKPa: 20.7 },
      '46': { capacityKW: 31.5, compressorKW: 11.0, waterFlowLPS: 1.4, waterPressureDropKPa: 18.0 },
      '48': { capacityKW: 28.1, compressorKW: 11.5, waterFlowLPS: 1.2, waterPressureDropKPa: 18.0 },
      '52': { capacityKW: 26.6, compressorKW: 12.5, waterFlowLPS: 1.1, waterPressureDropKPa: 15.9 },
    },
    '5.6': {
      '35': { capacityKW: 33.8, compressorKW: 8.7,  waterFlowLPS: 1.4, waterPressureDropKPa: 25.5 },
      '40': { capacityKW: 31.8, compressorKW: 9.9,  waterFlowLPS: 1.4, waterPressureDropKPa: 22.8 },
      '46': { capacityKW: 31.2, compressorKW: 11.1, waterFlowLPS: 1.3, waterPressureDropKPa: 20.0 },
      '48': { capacityKW: 29.2, compressorKW: 11.6, waterFlowLPS: 1.3, waterPressureDropKPa: 19.3 },
      '52': { capacityKW: 27.7, compressorKW: 12.6, waterFlowLPS: 1.2, waterPressureDropKPa: 17.3 },
    },
    '6.7': {
      '35': { capacityKW: 35.1, compressorKW: 8.8,  waterFlowLPS: 1.5, waterPressureDropKPa: 27.6 },
      '40': { capacityKW: 33.1, compressorKW: 10.0, waterFlowLPS: 1.4, waterPressureDropKPa: 24.9 },
      '46': { capacityKW: 31.0, compressorKW: 11.2, waterFlowLPS: 1.3, waterPressureDropKPa: 22.1 },
      '48': { capacityKW: 30.3, compressorKW: 11.7, waterFlowLPS: 1.3, waterPressureDropKPa: 20.7 },
      '52': { capacityKW: 28.8, compressorKW: 12.7, waterFlowLPS: 1.2, waterPressureDropKPa: 18.6 },
    },
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
    '4.5': {
      '35': { capacityKW: 43.5, compressorKW: 10.9, waterFlowLPS: 1.9, waterPressureDropKPa: 40.7 },
      '40': { capacityKW: 38.5, compressorKW: 12.3, waterFlowLPS: 1.7, waterPressureDropKPa: 36.6 },
      '46': { capacityKW: 35.5, compressorKW: 13.9, waterFlowLPS: 1.5, waterPressureDropKPa: 31.1 },
      '48': { capacityKW: 33.9, compressorKW: 14.5, waterFlowLPS: 1.5, waterPressureDropKPa: 29.7 },
      '52': { capacityKW: 32.3, compressorKW: 15.7, waterFlowLPS: 1.4, waterPressureDropKPa: 26.9 },
    },
    '5.6': {
      '35': { capacityKW: 43.6, compressorKW: 11.0, waterFlowLPS: 1.9, waterPressureDropKPa: 44.2 },
      '40': { capacityKW: 39.8, compressorKW: 12.4, waterFlowLPS: 1.7, waterPressureDropKPa: 39.4 },
      '46': { capacityKW: 37.0, compressorKW: 14.0, waterFlowLPS: 1.6, waterPressureDropKPa: 33.8 },
      '48': { capacityKW: 36.1, compressorKW: 14.6, waterFlowLPS: 1.6, waterPressureDropKPa: 32.5 },
      '52': { capacityKW: 34.0, compressorKW: 15.8, waterFlowLPS: 1.5, waterPressureDropKPa: 29.0 },
    },
    '6.7': {
      '35': { capacityKW: 43.7, compressorKW: 11.0, waterFlowLPS: 1.9, waterPressureDropKPa: 47.6 },
      '40': { capacityKW: 41.2, compressorKW: 12.6, waterFlowLPS: 1.8, waterPressureDropKPa: 42.1 },
      '46': { capacityKW: 38.4, compressorKW: 14.1, waterFlowLPS: 1.6, waterPressureDropKPa: 37.6 },
      '48': { capacityKW: 38.3, compressorKW: 14.7, waterFlowLPS: 1.6, waterPressureDropKPa: 35.2 },
      '52': { capacityKW: 35.7, compressorKW: 15.9, waterFlowLPS: 1.5, waterPressureDropKPa: 31.1 },
    },
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
    '4.5': {
      '35': { capacityKW: 47.8, compressorKW: 11.8, waterFlowLPS: 2.1, waterPressureDropKPa: 29.0 },
      '40': { capacityKW: 45.2, compressorKW: 13.3, waterFlowLPS: 1.9, waterPressureDropKPa: 25.5 },
      '46': { capacityKW: 42.8, compressorKW: 14.9, waterFlowLPS: 1.8, waterPressureDropKPa: 22.1 },
      '48': { capacityKW: 41.7, compressorKW: 15.5, waterFlowLPS: 1.8, waterPressureDropKPa: 22.1 },
      '52': { capacityKW: 42.2, compressorKW: 16.7, waterFlowLPS: 1.8, waterPressureDropKPa: 19.3 },
    },
    '5.6': {
      '35': { capacityKW: 50.1, compressorKW: 11.9, waterFlowLPS: 2.2, waterPressureDropKPa: 31.8 },
      '40': { capacityKW: 47.2, compressorKW: 13.4, waterFlowLPS: 2.0, waterPressureDropKPa: 28.3 },
      '46': { capacityKW: 44.5, compressorKW: 15.0, waterFlowLPS: 1.9, waterPressureDropKPa: 24.2 },
      '48': { capacityKW: 43.4, compressorKW: 15.6, waterFlowLPS: 1.9, waterPressureDropKPa: 24.2 },
      '52': { capacityKW: 43.7, compressorKW: 16.7, waterFlowLPS: 1.9, waterPressureDropKPa: 21.4 },
    },
    '6.7': {
      '35': { capacityKW: 52.4, compressorKW: 12.0, waterFlowLPS: 2.3, waterPressureDropKPa: 34.5 },
      '40': { capacityKW: 49.2, compressorKW: 13.4, waterFlowLPS: 2.1, waterPressureDropKPa: 31.1 },
      '46': { capacityKW: 46.3, compressorKW: 15.1, waterFlowLPS: 2.0, waterPressureDropKPa: 27.6 },
      '48': { capacityKW: 45.1, compressorKW: 15.7, waterFlowLPS: 1.9, waterPressureDropKPa: 26.2 },
      '52': { capacityKW: 45.2, compressorKW: 16.9, waterFlowLPS: 1.9, waterPressureDropKPa: 23.5 },
    },
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
    '4.5': {
      '35': { capacityKW: 49.8, compressorKW: 14.1, waterFlowLPS: 2.1, waterPressureDropKPa: 37.3 },
      '40': { capacityKW: 49.5, compressorKW: 15.9, waterFlowLPS: 2.1, waterPressureDropKPa: 33.8 },
      '46': { capacityKW: 46.3, compressorKW: 17.9, waterFlowLPS: 2.0, waterPressureDropKPa: 29.0 },
      '48': { capacityKW: 45.3, compressorKW: 18.7, waterFlowLPS: 2.0, waterPressureDropKPa: 27.6 },
      '52': { capacityKW: 43.3, compressorKW: 20.2, waterFlowLPS: 1.9, waterPressureDropKPa: 25.5 },
    },
    '5.6': {
      '35': { capacityKW: 55.0, compressorKW: 14.2, waterFlowLPS: 2.4, waterPressureDropKPa: 40.7 },
      '40': { capacityKW: 51.7, compressorKW: 16.0, waterFlowLPS: 2.2, waterPressureDropKPa: 36.6 },
      '46': { capacityKW: 48.5, compressorKW: 18.1, waterFlowLPS: 2.1, waterPressureDropKPa: 31.8 },
      '48': { capacityKW: 47.2, compressorKW: 18.8, waterFlowLPS: 2.0, waterPressureDropKPa: 30.4 },
      '52': { capacityKW: 45.1, compressorKW: 20.4, waterFlowLPS: 1.9, waterPressureDropKPa: 27.6 },
    },
    '6.7': {
      '35': { capacityKW: 60.1, compressorKW: 14.3, waterFlowLPS: 2.6, waterPressureDropKPa: 44.2 },
      '40': { capacityKW: 53.9, compressorKW: 16.2, waterFlowLPS: 2.3, waterPressureDropKPa: 39.4 },
      '46': { capacityKW: 50.7, compressorKW: 18.2, waterFlowLPS: 2.2, waterPressureDropKPa: 34.5 },
      '48': { capacityKW: 49.2, compressorKW: 19.0, waterFlowLPS: 2.1, waterPressureDropKPa: 33.1 },
      '52': { capacityKW: 46.8, compressorKW: 20.6, waterFlowLPS: 2.0, waterPressureDropKPa: 29.7 },
    },
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
 * Find the two tabulated grid values that bracket a target. Clamps to the
 * range edges when the target is outside the table, so extrapolation reduces
 * to using the boundary value.
 */
function bracket(target: number, options: readonly number[]): { lo: number; hi: number; t: number } {
  const sorted = [...options].sort((a, b) => a - b);
  if (target <= sorted[0]) return { lo: sorted[0], hi: sorted[0], t: 0 };
  if (target >= sorted[sorted.length - 1]) {
    const last = sorted[sorted.length - 1];
    return { lo: last, hi: last, t: 0 };
  }
  for (let i = 0; i < sorted.length - 1; i++) {
    if (target >= sorted[i] && target <= sorted[i + 1]) {
      const lo = sorted[i];
      const hi = sorted[i + 1];
      const t = hi === lo ? 0 : (target - lo) / (hi - lo);
      return { lo, hi, t };
    }
  }
  return { lo: sorted[0], hi: sorted[0], t: 0 };
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Look up an ACC-BP performance point by leaving chilled water temp and ambient temp (°C).
 * Performs bilinear interpolation across the LCWT × ambient grid; values outside the
 * tabulated range are clamped to the nearest edge.
 */
export function getACCBPPerformance(
  modelNumber: string,
  lcwtC: number,
  ambientC: number,
): ACCBPPerformancePoint | undefined {
  const model = ACC_BP_MODELS.find(m => m.modelNumber === modelNumber);
  if (!model) return undefined;

  const { lo: lcwtLo, hi: lcwtHi, t: tL } = bracket(lcwtC, ACC_BP_LCWT_C);
  const { lo: ambLo, hi: ambHi, t: tA } = bracket(ambientC, ACC_BP_AMBIENT_TEMPS_C);

  const p00 = model.performance[String(lcwtLo)]?.[String(ambLo)];
  const p01 = model.performance[String(lcwtLo)]?.[String(ambHi)];
  const p10 = model.performance[String(lcwtHi)]?.[String(ambLo)];
  const p11 = model.performance[String(lcwtHi)]?.[String(ambHi)];
  if (!p00 || !p01 || !p10 || !p11) return undefined;

  const blend = (k: keyof ACCBPPerformancePoint) => {
    const lo = lerp(p00[k], p01[k], tA);
    const hi = lerp(p10[k], p11[k], tA);
    return lerp(lo, hi, tL);
  };

  return {
    capacityKW: blend('capacityKW'),
    compressorKW: blend('compressorKW'),
    waterFlowLPS: blend('waterFlowLPS'),
    waterPressureDropKPa: blend('waterPressureDropKPa'),
  };
}
