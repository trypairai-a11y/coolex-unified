import type { Model } from '@/types/product';
import { NGW_MODELS } from './ngw-models';
import { ACSC_MODELS } from './acsc-models';
import { ACC_BP_MODELS, getACCBPPerformance } from './acc-bp-models';
import { ACC_ST_MODELS, getACCSTPerformance } from './acc-st-models';
import { DHAC_MODELS, getDHACPerformance } from './dhac-models';
import { THAC_MODELS, getTHACPerformance } from './thac-models';
import { CCU_MODELS, getCCUPerformance } from './ccu-models';
import { fToC } from '@/lib/utils/unit-conversions';

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
  'pac-r': generateModels('pac-r', 'CPACR', [5, 7.5, 10, 12.5, 15, 20, 25, 30, 40, 50, 60, 70]),
  'pac-f': generateModels('pac-f', 'CPACF', [3, 5, 7.5, 10, 15, 20, 25, 30]),
  'pac-g': generateModels('pac-g', 'CPACG', [5, 7.5, 10, 15, 20, 25]),
  'split-cs': generateModels('split-cs', 'CCS', [1.5, 2, 2.5, 3, 4, 5, 7.5, 10, 12.5, 15, 20]),
  'split-ds': generateModels('split-ds', 'CDS', [2, 2.5, 3, 4, 5, 7.5, 10, 12.5, 15]),
  'ms-wall': generateModels('ms-wall', 'CMSW', [0.75, 1, 1.5, 2, 2.5, 3, 4]),
  'ms-cas': generateModels('ms-cas', 'CMSC', [1, 1.5, 2, 2.5, 3, 4, 5, 7.5, 10]),
  'ngw': NGW_MODELS,
  'acsc': ACSC_MODELS,
  'thac': THAC_MODELS,
  'dhac': DHAC_MODELS,
  'acc-bp': ACC_BP_MODELS,
  'acc-st': ACC_ST_MODELS,
  'dstc': generateModels('dstc', 'DSTC', [5, 6, 7.5, 8.5, 10]),
  'dstf': generateModels('dstf', 'DSTF', [5, 6, 7.5, 8.5, 10]),
  'ccu-std': CCU_MODELS,

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
  // Chiller-only: design-point lookup keys for tabulated performance matrices
  leavingWaterTempF?: number;
  ambientTempF?: number;
  // CCU-only: saturated suction temperature (°F)
  saturatedSuctionTempF?: number;
}

const BTUH_PER_KW = 3412.142;
const KW_PER_TON = 3.51685;

/**
 * For tabulated chiller series (ACC-BP, ACC-ST, DHAC, THAC), recompute capacity / power / EER
 * at the user's design point (LCWT + ambient) instead of the catalogue rating.
 * Performs bilinear interpolation across the matrix.
 *
 * ACC-BP / ACC-ST tables are indexed in °C; DHAC / THAC are indexed in °F
 * (matching their English-system catalogues), so the lookup gets the temps
 * in its native units.
 */
function applyChillerDesignPoint(
  seriesId: string,
  models: Model[],
  cond?: EvaporatorConditions,
): Model[] {
  if (seriesId === 'ccu-std') {
    return applyCCUDesignPoint(models, cond);
  }

  if (cond?.leavingWaterTempF == null || cond?.ambientTempF == null) return models;
  const lookup =
    seriesId === 'acc-bp' ? getACCBPPerformance :
    seriesId === 'acc-st' ? getACCSTPerformance :
    seriesId === 'dhac'   ? getDHACPerformance :
    seriesId === 'thac'   ? getTHACPerformance :
    null;
  if (!lookup) return models;

  const useFahrenheit = seriesId === 'dhac' || seriesId === 'thac';
  const lcwtArg = useFahrenheit ? cond.leavingWaterTempF : fToC(cond.leavingWaterTempF);
  const ambientArg = useFahrenheit ? cond.ambientTempF : fToC(cond.ambientTempF);

  return models.map(m => {
    const perf = lookup(m.modelNumber, lcwtArg, ambientArg);
    if (!perf) return m;
    const totalCapacityBtuh = Math.round(perf.capacityKW * BTUH_PER_KW);
    const compressorKW = Math.round(perf.compressorKW * 10) / 10;
    const eer = Math.round((totalCapacityBtuh / (compressorKW * 1000)) * 100) / 100;
    return {
      ...m,
      totalCapacityBtuh,
      sensibleCapacityBtuh: totalCapacityBtuh,
      powerKW: compressorKW,
      eer,
      nominalTons: Math.round((perf.capacityKW / KW_PER_TON) * 100) / 100,
      // L/s stored at 4-decimal precision so the round-trip to GPM preserves
      // catalog values exactly (1 L/s ≈ 15.85 GPM, so 2-decimal L/s loses 0.16 GPM).
      matrixWaterFlowLPS: Math.round(perf.waterFlowLPS * 10000) / 10000,
      matrixWaterPressureDropKPa: Math.round(perf.waterPressureDropKPa * 100) / 100,
    };
  });
}

/**
 * For tabulated condensing-unit series (CCU), recompute capacity / power / EER /
 * condensing temp at the user's design point (SST + ambient °F). Bilinearly
 * interpolated across the matrix.
 */
function applyCCUDesignPoint(models: Model[], cond?: EvaporatorConditions): Model[] {
  if (cond?.saturatedSuctionTempF == null || cond?.ambientTempF == null) return models;

  return models.map(m => {
    const perf = getCCUPerformance(m.modelNumber, cond.saturatedSuctionTempF!, cond.ambientTempF!);
    if (!perf) return m;
    const totalCapacityBtuh = Math.round(perf.totalCapacityBtuh);
    const powerKW = Math.round(perf.powerInputKW * 10) / 10;
    const eer = Math.round((totalCapacityBtuh / (powerKW * 1000)) * 100) / 100;
    return {
      ...m,
      totalCapacityBtuh,
      sensibleCapacityBtuh: totalCapacityBtuh,
      powerKW,
      eer,
      nominalTons: Math.round((totalCapacityBtuh / 12000) * 10) / 10,
      matrixCondensingTempF: Math.round(perf.condensingTempF * 10) / 10,
    };
  });
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
  const models = applyChillerDesignPoint(seriesId, getModelsForSeries(seriesId), conditions);
  if (models.length === 0) return [];

  // Chillers and CCUs are sized by water-side / refrigerant-side conditions
  // already baked into the design-point matrix — applying the airside (DB/WB/ESP)
  // correction here would double-count derating and push match% below 100% even
  // for an exact-tonnage request.
  const isMatrixSized =
    seriesId === 'acc-bp' || seriesId === 'acc-st' ||
    seriesId === 'dhac'   || seriesId === 'thac'   ||
    seriesId === 'acsc'   || seriesId === 'ccu-std';
  const corrFactor = isMatrixSized ? 1 : capacityCorrectionFactor(conditions ?? {});

  const withMatch = models.map(m => {
    // Apply correction factor to catalog capacity (non-chillers only — see above).
    const correctedCapacity = m.totalCapacityBtuh * corrFactor;

    // Match % = how well the model's capacity meets the request.
    // Asymmetric: oversized is acceptable (safety margin), undersized hurts more.
    const ratio = correctedCapacity / requestedBtuh;
    const condScore = ratio >= 1.0
      ? Math.max(0, 100 - (ratio - 1.0) * 80)
      : Math.max(0, 100 - (1.0 - ratio) * 150);

    const matchPercent = Math.max(0, Math.round(condScore));

    return { ...m, matchPercent };
  });

  // Sort by match%, then by EER as a tiebreaker so the most efficient
  // option wins among models with similar capacity fit.
  withMatch.sort((a, b) => b.matchPercent - a.matchPercent || b.eer - a.eer);
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

  const withMatch = models.map(m => {
    const correctedCFM = m.airflowCFM * espAirflowFactor;

    // Match % = how well delivered airflow meets the request.
    // Asymmetric: oversized airflow is fine, undersized hurts more.
    const ratio = correctedCFM / requestedCFM;
    const condScore = ratio >= 1.0
      ? Math.max(0, 100 - (ratio - 1.0) * 80)
      : Math.max(0, 100 - (1.0 - ratio) * 150);

    const matchPercent = Math.max(0, Math.round(condScore));

    return { ...m, matchPercent };
  });

  withMatch.sort((a, b) => b.matchPercent - a.matchPercent || b.eer - a.eer);
  return withMatch.slice(0, 6);
}
