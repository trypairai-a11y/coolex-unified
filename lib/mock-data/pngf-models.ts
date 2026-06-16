import type { Model } from '@/types/product';
import { PNGF_CFM_BY_MODEL, getPNGFPerformance } from './pngf-performance';

/**
 * PNGF catalogue models for the RPUF rooftop-packaged series, PNGF-048C2 …
 * PNGF-350C2 (the model nomenclature printed on the "RPUF Performance Data"
 * pages). Listed total/sensible/power come from the performance matrix
 * (pngf-performance.ts) at the catalogue rating point:
 *   • Entering (indoor) air: 80 °F DB / 67 °F WB
 *   • Condenser ambient: 95 °F
 *   • Airflow: the model's middle (rated) CFM row
 *
 * At selection time applyPNGFDesignPoint (lib/mock-data/models.ts) overwrites
 * capacity / sensible / power by interpolating the matrix at the design airflow,
 * entering-air DB and condenser ambient temperature.
 */

const RATING_DB_F = 80;       // entering indoor air DB
const RATING_AMBIENT_F = 95;  // condenser ambient

const PNGF_MODEL_NUMBERS = Object.keys(PNGF_CFM_BY_MODEL);

function buildPngfModel(modelNumber: string): Model {
  const cfms = PNGF_CFM_BY_MODEL[modelNumber];
  const ratedCFM = cfms[Math.floor(cfms.length / 2)]; // middle row = rated airflow
  const perf = getPNGFPerformance(modelNumber, ratedCFM, RATING_DB_F, RATING_AMBIENT_F)!;

  const totalCapacityBtuh = Math.round(perf.totalCapacityBtuh);
  const sensibleCapacityBtuh = Math.round(perf.sensibleCapacityBtuh);
  const powerKW = Math.round(perf.kwInput * 10) / 10;
  const eer = Math.round((totalCapacityBtuh / (powerKW * 1000)) * 100) / 100;
  const nominalTons = Math.round((totalCapacityBtuh / 12000) * 10) / 10;

  return {
    id: `rpuf-${modelNumber}`,
    seriesId: 'rpuf',
    modelNumber,
    totalCapacityBtuh,
    sensibleCapacityBtuh,
    powerKW,
    eer,
    airflowCFM: ratedCFM,
    leavingDBF: 57,
    leavingWBF: 56,
    compressorCount: nominalTons <= 12 ? 1 : nominalTons <= 25 ? 2 : nominalTons <= 40 ? 3 : 4,
    matchPercent: 100,
    nominalTons,
    weightLbs: Math.round(nominalTons * 60 + 250),
    lengthIn: Math.round(nominalTons * 3.2 + 60),
    widthIn: Math.round(nominalTons * 1.4 + 40),
    heightIn: Math.round(nominalTons * 0.6 + 48),
    refrigerant: 'R-410A',
    compressorType: 'Scroll',
  };
}

export const PNGF_MODELS: Model[] = PNGF_MODEL_NUMBERS.map(buildPngfModel);
