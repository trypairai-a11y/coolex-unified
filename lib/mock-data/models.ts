import type { Model } from '@/types/product';
import { NGW_MODELS } from './ngw-models';
import { ACSC_MODELS } from './acsc-models';
import { PNGC_MODELS } from './pngc-models';
import { NGCC_MODELS } from './ngcc-models';
import { CHCC_MODELS } from './chcc-models';
import { PNGF_MODELS } from './pngf-models';

// Helper to generate realistic mock models for a series
function generateModels(seriesId: string, prefix: string, capacities: number[]): Model[] {
  return capacities.map((tons, i) => {
    const btuh = Math.round(tons * 12000);
    const sensible = Math.round(btuh * 0.72);
    const eer = 9.5 + (i % 3) * 0.4;
    const powerKW = Math.round((btuh / (eer * 3412)) * 1000) / 10;
    const cfm = Math.round(tons * 400);
    const matchBase = 92 + Math.floor(Math.random() * 8);

    return {
      id: `${seriesId}-${prefix}${String(tons * 10).padStart(4, '0')}`,
      seriesId,
      modelNumber: `${prefix}${String(tons * 10).padStart(4, '0')}`,
      totalCapacityBtuh: btuh,
      sensibleCapacityBtuh: sensible,
      powerKW,
      eer: Math.round(eer * 10) / 10,
      airflowCFM: cfm,
      leavingDBF: 56 + i,
      leavingWBF: 51 + i,
      compressorCount: tons <= 10 ? 1 : tons <= 30 ? 2 : tons <= 60 ? 4 : 6,
      matchPercent: i === 1 ? 100 : Math.max(85, matchBase - i * 5),
      nominalTons: tons,
      weightLbs: Math.round(tons * 45 + 150),
      lengthIn: Math.round(tons * 3.2 + 30),
      widthIn: Math.round(tons * 1.5 + 20),
      heightIn: Math.round(tons * 0.8 + 36),
    };
  });
}

export const MOCK_MODELS: Record<string, Model[]> = {
  'pngf': PNGF_MODELS,
  'pac-r': generateModels('pac-r', 'CPACR', [5, 7.5, 10, 12.5, 15, 20, 25, 30, 40, 50, 60, 70]),
  'pac-f': generateModels('pac-f', 'CPACF', [3, 5, 7.5, 10, 15, 20, 25, 30]),
  'pac-g': generateModels('pac-g', 'CPACG', [5, 7.5, 10, 15, 20, 25]),
  'split-cs': generateModels('split-cs', 'CCS', [1.5, 2, 2.5, 3, 4, 5, 7.5, 10, 12.5, 15, 20]),
  'split-ds': generateModels('split-ds', 'CDS', [2, 2.5, 3, 4, 5, 7.5, 10, 12.5, 15]),
  'ms-wall': generateModels('ms-wall', 'CMSW', [0.75, 1, 1.5, 2, 2.5, 3, 4]),
  'ms-cas': generateModels('ms-cas', 'CMSC', [1, 1.5, 2, 2.5, 3, 4, 5, 7.5, 10]),
  'ngw': NGW_MODELS,
  'acsc': ACSC_MODELS,
  'thac': generateModels('thac', 'THAC', [3, 5, 7.5, 10, 15, 20, 25, 30, 40, 50]),
  'dhac': generateModels('dhac', 'DHAC', [20, 25, 30, 40, 50, 60, 70, 80, 100]),
  'acc-bp': generateModels('acc-bp', 'ACC', [3, 4, 5, 6, 7.5, 8, 10, 12, 15, 17]),
  'acc-st': generateModels('acc-st', 'ACC', [20, 25, 30, 40, 50, 60, 70, 80, 100]),
  'pngc': PNGC_MODELS,
  'ngcc': NGCC_MODELS,
  'ngcf': NGCC_MODELS,
  'chcc': CHCC_MODELS,
  'chcf': CHCC_MODELS,
  'ccu-std': generateModels('ccu-std', 'CCCU', [1, 1.5, 2, 3, 4, 5, 7.5, 10, 12.5, 15]),

  'phe': generateModels('phe', 'PHE', [3.5, 5, 7.5, 10, 12, 15]),
  'prec-dc': generateModels('prec-dc', 'CPDU', [5, 7.5, 10, 12.5, 15, 20, 25, 30]),
  'prec-tele': generateModels('prec-tele', 'CPTU', [1, 1.5, 2, 2.5, 3, 4, 5, 7.5, 10]),
  'fcu': generateModels('fcu', 'CFCU', [0.5, 0.75, 1, 1.5, 2, 2.5, 3, 4, 5]),
  'fcl': generateModels('fcl', 'FCL', [0.5, 1, 1.5, 2, 3, 5, 7.5, 10, 15, 20, 25, 30]),
  'rpuf': generateModels('rpuf', 'RPUF', [4, 5, 6, 7.5, 8, 10]),
  'rpuc': generateModels('rpuc', 'RPUC', [4, 5, 6, 7.5, 8, 10]),
  'spu': generateModels('spu', 'SPU', [35, 40, 50, 60, 70, 80, 100]),
};

export function getModelsForSeries(seriesId: string): Model[] {
  return MOCK_MODELS[seriesId] ?? [];
}

// Standard rating conditions for catalog data
const STD_EDB = 80;   // °F entering dry bulb
const STD_EWB = 67;   // °F entering wet bulb
const STD_ESP = 0.5;  // in. WG external static pressure

export interface EvaporatorConditions {
  enteringDBF?: number;
  enteringWBF?: number;
  espInWG?: number;
}

/**
 * Calculate a capacity correction factor based on evaporator conditions.
 *
 * - Entering DB: Higher DB → more sensible load on the coil → slight capacity reduction.
 *   ~0.5% per °F above standard.
 * - Entering WB: Lower WB → less latent load → reduced total capacity.
 *   ~1.2% per °F below standard (WB has the largest impact on total capacity).
 * - ESP: Higher ESP → more fan heat added to the airstream and potential airflow reduction.
 *   ~1% per 0.1 in. WG above standard.
 *
 * Returns a multiplier (e.g. 0.97 means 3% derating).
 */
function capacityCorrectionFactor(cond: EvaporatorConditions): number {
  const dbDelta = (cond.enteringDBF ?? STD_EDB) - STD_EDB;
  const wbDelta = (cond.enteringWBF ?? STD_EWB) - STD_EWB;
  const espDelta = (cond.espInWG ?? STD_ESP) - STD_ESP;

  // DB: higher = slight derating (sensible load increase)
  const dbFactor = 1 - Math.abs(dbDelta) * 0.005;
  // WB: lower = less latent, higher = more total — penalize deviation either way
  const wbFactor = 1 - Math.abs(wbDelta) * 0.012;
  // ESP: higher = airflow restriction, fan heat — penalize excess
  const espFactor = 1 - Math.max(0, espDelta) * (1 / 0.1) * 0.01;

  return Math.max(0.70, dbFactor * wbFactor * espFactor);
}

/**
 * Match models against a requested capacity (Btu/h).
 * Weights: capacity proximity 60%, EER 10%, power efficiency 10%, condition suitability 20%.
 */
export function getModelsMatchingCapacity(
  seriesId: string,
  requestedBtuh: number,
  conditions?: EvaporatorConditions,
): Model[] {
  const models = getModelsForSeries(seriesId);
  if (models.length === 0) return [];

  const corrFactor = capacityCorrectionFactor(conditions ?? {});
  const maxEER = Math.max(...models.map(m => m.eer));
  const bestPowerPerBtuh = Math.min(...models.map(m => m.powerKW / m.totalCapacityBtuh));

  const withMatch = models.map(m => {
    // Apply correction factor to catalog capacity for realistic comparison
    const correctedCapacity = m.totalCapacityBtuh * corrFactor;

    // Capacity proximity (0–100)
    const capDeviation = Math.abs(correctedCapacity - requestedBtuh) / requestedBtuh;
    const capScore = Math.max(0, 100 - capDeviation * 100);

    // EER score (0–100)
    const eerScore = maxEER > 0 ? (m.eer / maxEER) * 100 : 100;

    // Power efficiency score (0–100)
    const powerPerBtuh = m.powerKW / m.totalCapacityBtuh;
    const powerScore = bestPowerPerBtuh > 0 ? (bestPowerPerBtuh / powerPerBtuh) * 100 : 100;

    // Condition suitability: how well the corrected capacity still meets the request
    // Oversized is slightly better than undersized (safety margin)
    const ratio = correctedCapacity / requestedBtuh;
    const condScore = ratio >= 1.0
      ? Math.max(0, 100 - (ratio - 1.0) * 80)   // oversized: gentle penalty
      : Math.max(0, 100 - (1.0 - ratio) * 150);  // undersized: steeper penalty

    // Weighted: capacity 60%, conditions 20%, EER 10%, power 10%
    const matchPercent = Math.max(0, Math.round(
      capScore * 0.60 + condScore * 0.20 + eerScore * 0.10 + powerScore * 0.10
    ));

    return { ...m, matchPercent };
  });

  withMatch.sort((a, b) => b.matchPercent - a.matchPercent);
  return withMatch.slice(0, 6);
}

/**
 * Match models against a requested airflow (CFM).
 * Weights: airflow proximity 60%, EER 10%, power efficiency 10%, condition suitability 20%.
 */
export function getModelsMatchingAirflow(
  seriesId: string,
  requestedCFM: number,
  conditions?: EvaporatorConditions,
): Model[] {
  const models = getModelsForSeries(seriesId);
  if (models.length === 0) return [];

  // ESP affects achievable airflow — higher ESP reduces delivered CFM
  const espDelta = ((conditions?.espInWG ?? STD_ESP) - STD_ESP);
  const espAirflowFactor = Math.max(0.80, 1 - Math.max(0, espDelta) * (1 / 0.1) * 0.015);

  const maxEER = Math.max(...models.map(m => m.eer));
  const bestPowerPerCFM = Math.min(...models.map(m => m.powerKW / m.airflowCFM));

  const withMatch = models.map(m => {
    const correctedCFM = m.airflowCFM * espAirflowFactor;

    // Airflow proximity (0–100)
    const cfmDeviation = Math.abs(correctedCFM - requestedCFM) / requestedCFM;
    const cfmScore = Math.max(0, 100 - cfmDeviation * 100);

    // EER score (0–100)
    const eerScore = maxEER > 0 ? (m.eer / maxEER) * 100 : 100;

    // Power efficiency (0–100)
    const powerPerCFM = m.powerKW / m.airflowCFM;
    const powerScore = bestPowerPerCFM > 0 ? (bestPowerPerCFM / powerPerCFM) * 100 : 100;

    // Condition suitability: airflow margin
    const ratio = correctedCFM / requestedCFM;
    const condScore = ratio >= 1.0
      ? Math.max(0, 100 - (ratio - 1.0) * 80)
      : Math.max(0, 100 - (1.0 - ratio) * 150);

    const matchPercent = Math.max(0, Math.round(
      cfmScore * 0.60 + condScore * 0.20 + eerScore * 0.10 + powerScore * 0.10
    ));

    return { ...m, matchPercent };
  });

  withMatch.sort((a, b) => b.matchPercent - a.matchPercent);
  return withMatch.slice(0, 6);
}
