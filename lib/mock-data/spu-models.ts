import type { Model } from '@/types/product';
import { SPU_CFM_BY_MODEL, getSPUPerformance } from './spu-performance';

/**
 * SPU (Self-contained Packaged Unit) catalogue models.
 *
 * Each catalogue size exists in a 4-row and a 6-row coil variant, exposed as
 * separate selectable models: SPU-XXX-4R and SPU-XXX-6R. The model-number
 * suffix XXX is the nominal capacity in MBH (e.g. SPU-420 ≈ 420 000 Btu/h ≈
 * 35 tons). Listed total/sensible/power come from the performance matrix
 * (spu-performance.ts) at the catalogue rating point:
 *   • Entering air: 80/67 °F DB/WB
 *   • Condenser ambient: 95 °F
 *   • Airflow: the model's second (rated) CFM row
 *
 * Only sizes that have transcribed performance data are emitted, so the list
 * grows automatically as more models are added to spu-performance.ts.
 *
 * At selection time applySPUDesignPoint (lib/mock-data/models.ts) overwrites
 * capacity / sensible / power by interpolating the matrix at the design airflow,
 * entering DB and condenser ambient.
 */

const RATING_EDB_F = 80;
const RATING_AMBIENT_F = 95;

function buildSpuModel(base: string, rows: 4 | 6): Model | null {
  const modelNumber = `${base}-${rows}R`;
  const cfms = SPU_CFM_BY_MODEL[base];
  if (!cfms) return null;
  const ratedCFM = cfms[1] ?? cfms[0]; // second row = rated airflow
  const perf = getSPUPerformance(modelNumber, ratedCFM, RATING_EDB_F, RATING_AMBIENT_F);
  if (!perf) return null; // no transcribed data for this size yet

  const mbh = Number(base.split('-')[1]); // 420 → 420
  const nominalTons = Math.round((mbh / 12) * 10) / 10;
  const totalCapacityBtuh = Math.round(perf.totalCapacityBtuh);
  const sensibleCapacityBtuh = Math.round(perf.sensibleCapacityBtuh);
  const powerKW = Math.round(perf.kwInput * 10) / 10;
  const eer = Math.round((totalCapacityBtuh / (powerKW * 1000)) * 100) / 100;

  return {
    id: modelNumber,
    seriesId: 'spu',
    modelNumber,
    totalCapacityBtuh,
    sensibleCapacityBtuh,
    powerKW,
    eer,
    airflowCFM: ratedCFM,
    leavingDBF: 57,
    leavingWBF: 56,
    compressorCount: nominalTons <= 50 ? 4 : nominalTons <= 80 ? 6 : 8,
    matchPercent: 100,
    nominalTons,
    weightLbs: Math.round(nominalTons * 55 + 400),
    lengthIn: Math.round(nominalTons * 2.4 + 90),
    widthIn: Math.round(nominalTons * 0.9 + 48),
    heightIn: Math.round(nominalTons * 0.5 + 72),
    refrigerant: 'R-410A',
    compressorType: 'Scroll',
  };
}

export const SPU_MODELS: Model[] = Object.keys(SPU_CFM_BY_MODEL)
  .flatMap(base => [buildSpuModel(base, 4), buildSpuModel(base, 6)])
  .filter((m): m is Model => m !== null);
