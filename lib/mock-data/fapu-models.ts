import type { Model } from '@/types/product';
import { FAPU_CFM_BY_MODEL, getFAPUPerformance } from './fapu-performance';

/**
 * FAPU (Fresh Air Package Unit) catalogue models, FAPU-048 … FAPU-600.
 *
 * The model-number suffix is the nominal capacity in MBH (e.g. FAPU-048 ≈ 48 000
 * Btu/h ≈ 4 tons). Each model's listed total/sensible/power are taken from the
 * performance matrix (fapu-performance.ts) at the catalogue rating point:
 *   • Entering air: 95 °F DB / 80 °F WB
 *   • Airflow: the model's middle (rated) CFM row
 *
 * At selection time applyFAPUDesignPoint (lib/mock-data/models.ts) overwrites
 * capacity / sensible / power by interpolating the matrix at the design airflow
 * and entering-air (ambient) temperature.
 */

const RATING_DB_F = 95;

// modelNumber → nominal capacity (MBH). Suffix == MBH for every FAPU size.
const FAPU_MODEL_NUMBERS = Object.keys(FAPU_CFM_BY_MODEL);

function buildFapuModel(modelNumber: string): Model {
  const cfms = FAPU_CFM_BY_MODEL[modelNumber];
  const ratedCFM = cfms[Math.floor(cfms.length / 2)]; // middle row = rated airflow
  const perf = getFAPUPerformance(modelNumber, ratedCFM, RATING_DB_F)!;

  const mbh = Number(modelNumber.split('-')[1]); // 048 → 48
  const nominalTons = Math.round((mbh / 12) * 10) / 10;
  const totalCapacityBtuh = Math.round(perf.totalCapacityBtuh);
  const sensibleCapacityBtuh = Math.round(perf.sensibleCapacityBtuh);
  const powerKW = Math.round(perf.kwInput * 10) / 10;
  const eer = Math.round((totalCapacityBtuh / (powerKW * 1000)) * 100) / 100;

  return {
    id: modelNumber,
    seriesId: 'fapu',
    modelNumber,
    totalCapacityBtuh,
    sensibleCapacityBtuh,
    powerKW,
    eer,
    airflowCFM: ratedCFM,
    leavingDBF: 57,
    leavingWBF: 56,
    compressorCount: nominalTons <= 10 ? 1 : nominalTons <= 30 ? 2 : nominalTons <= 50 ? 3 : 4,
    matchPercent: 100,
    nominalTons,
    weightLbs: Math.round(nominalTons * 45 + 150),
    lengthIn: Math.round(nominalTons * 3.2 + 30),
    widthIn: Math.round(nominalTons * 1.5 + 20),
    heightIn: Math.round(nominalTons * 0.8 + 36),
    refrigerant: 'R-410A',
    compressorType: 'Scroll',
  };
}

export const FAPU_MODELS: Model[] = FAPU_MODEL_NUMBERS.map(buildFapuModel);
