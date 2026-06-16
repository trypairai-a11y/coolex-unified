import type { Model } from '@/types/product';
import { getPNGVModelNumbers, getPNGVCfmRows, getPNGVPerformance } from './pngv-performance';

/**
 * PNGv catalogue models. The catalogue is published per power frequency:
 *   • 50 Hz — all countries except Saudi Arabia (default lineup)
 *   • 60 Hz — Saudi Arabia
 *
 * The two frequencies have different rated capacities and a slightly different
 * lineup (50 Hz lists PNGv-130, 60 Hz lists PNGv-120), so the model list is
 * built per frequency. `PNGV_MODELS` is the 50 Hz baseline used by the static
 * registry; at selection time applyPNGVDesignPoint (lib/mock-data/models.ts)
 * rebuilds the list for the active frequency (Saudi = 60 Hz) and interpolates
 * capacity / sensible / power at the design airflow and condenser ambient.
 */

const RATING_AMBIENT_F = 95; // condenser ambient

function buildPngvModel(modelNumber: string, is60Hz: boolean): Model {
  const cfms = getPNGVCfmRows(modelNumber, is60Hz);
  const ratedCFM = cfms[Math.floor(cfms.length / 2)]; // middle row = rated airflow
  const perf = getPNGVPerformance(modelNumber, ratedCFM, RATING_AMBIENT_F, is60Hz)!;

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

/** Build the PNGv lineup for a given power frequency (Saudi = 60 Hz). */
export function buildPNGVModels(is60Hz: boolean): Model[] {
  return getPNGVModelNumbers(is60Hz).map((m) => buildPngvModel(m, is60Hz));
}

/** 50 Hz baseline lineup (all countries except Saudi Arabia). */
export const PNGV_MODELS: Model[] = buildPNGVModels(false);
