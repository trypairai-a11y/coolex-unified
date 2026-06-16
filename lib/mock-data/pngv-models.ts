import type { Model } from '@/types/product';
import { PNGV_CFM_BY_MODEL, getPNGVPerformance } from './pngv-performance';

/**
 * PNGv catalogue models (PNGv_Performance_Data.xlsx). The catalogue's two rating
 * sheets are kept as separate selectable variants, suffixed "-S1" / "-S2" (see
 * pngv-performance.ts). Listed total/sensible/power come from the performance
 * matrix at the catalogue rating point:
 *   • Condenser ambient: 95 °F
 *   • Airflow: the variant's middle (rated) CFM row
 *
 * At selection time applyPNGVDesignPoint (lib/mock-data/models.ts) overwrites
 * capacity / sensible / power by interpolating the matrix at the design airflow
 * and condenser ambient temperature.
 */

const RATING_AMBIENT_F = 95; // condenser ambient

const PNGV_MODEL_NUMBERS = Object.keys(PNGV_CFM_BY_MODEL);

function buildPngvModel(modelNumber: string): Model {
  const cfms = PNGV_CFM_BY_MODEL[modelNumber];
  const ratedCFM = cfms[Math.floor(cfms.length / 2)]; // middle row = rated airflow
  const perf = getPNGVPerformance(modelNumber, ratedCFM, RATING_AMBIENT_F)!;

  const totalCapacityBtuh = Math.round(perf.totalCapacityBtuh);
  const sensibleCapacityBtuh = Math.round(perf.sensibleCapacityBtuh);
  const powerKW = Math.round(perf.kwInput * 10) / 10;
  const eer = Math.round((totalCapacityBtuh / (powerKW * 1000)) * 100) / 100;
  const nominalTons = Math.round((totalCapacityBtuh / 12000) * 10) / 10;

  return {
    id: `pngv-${modelNumber}`,
    seriesId: 'pngv',
    modelNumber,
    totalCapacityBtuh,
    sensibleCapacityBtuh,
    powerKW,
    eer,
    airflowCFM: ratedCFM,
    leavingDBF: 57,
    leavingWBF: 56,
    compressorCount: nominalTons <= 12 ? 1 : nominalTons <= 25 ? 2 : 3,
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

export const PNGV_MODELS: Model[] = PNGV_MODEL_NUMBERS.map(buildPngvModel);
