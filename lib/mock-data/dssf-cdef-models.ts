import type { Model } from '@/types/product';
import {
  DSSF_CFM_BY_MODEL,
  DSSF_DESIGNATION,
  getDSSFPerformance,
} from './dssf-cdef-performance';

/**
 * DSSF-CDEF ducted split system catalogue models (R-410A).
 *
 * Each model is a matched outdoor condensing unit (CHCF) + indoor evaporator
 * (CHEF) pair, exposed under the CHCF base model number (e.g. CHCF-024 ≈
 * 24 000 Btu/h ≈ 2 tons). Listed total/sensible/power come from the performance
 * matrix (dssf-cdef-performance.ts) at the catalogue rating point:
 *   • Entering air: 80/67 °F DB/WB
 *   • Condenser ambient: 95 °F
 *   • Airflow: the model's middle (rated) CFM row
 *
 * At selection time applyDSSFDesignPoint (lib/mock-data/models.ts) overwrites
 * capacity / sensible / power by interpolating the matrix at the design airflow,
 * entering DB and condenser ambient.
 */

const RATING_EDB_F = 80;
const RATING_AMBIENT_F = 95;

function buildDssfModel(base: string): Model | null {
  const cfms = DSSF_CFM_BY_MODEL[base];
  if (!cfms) return null;
  const ratedCFM = cfms[1] ?? cfms[0]; // middle row = rated airflow
  const perf = getDSSFPerformance(base, ratedCFM, RATING_EDB_F, RATING_AMBIENT_F);
  if (!perf) return null;

  const mbh = Number(base.split('-')[1]); // 024 → 24
  const nominalTons = Math.round((mbh / 12) * 10) / 10;
  const totalCapacityBtuh = Math.round(perf.totalCapacityBtuh);
  const sensibleCapacityBtuh = Math.round(perf.sensibleCapacityBtuh);
  const powerKW = Math.round(perf.kwInput * 100) / 100;
  const eer = Math.round((totalCapacityBtuh / (powerKW * 1000)) * 100) / 100;

  return {
    id: base,
    seriesId: 'split-ds',
    modelNumber: base,
    totalCapacityBtuh,
    sensibleCapacityBtuh,
    powerKW,
    eer,
    airflowCFM: ratedCFM,
    leavingDBF: 57,
    leavingWBF: 56,
    compressorCount: 1,
    matchPercent: 100,
    nominalTons,
    weightLbs: Math.round(nominalTons * 60 + 180),
    lengthIn: Math.round(nominalTons * 6 + 36),
    widthIn: Math.round(nominalTons * 3 + 28),
    heightIn: Math.round(nominalTons * 4 + 30),
    refrigerant: 'R-410A',
    compressorType: 'Scroll',
    // Full catalogue designation (outdoor / indoor) for submittals.
    modelDesignation: DSSF_DESIGNATION[base],
  };
}

export const DSSF_CDEF_MODELS: Model[] = Object.keys(DSSF_CFM_BY_MODEL)
  .map(buildDssfModel)
  .filter((m): m is Model => m !== null);
