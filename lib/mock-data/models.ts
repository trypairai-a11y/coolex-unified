import type { Model } from '@/types/product';
import { NGW_MODELS } from './ngw-models';
import { ACSC_MODELS } from './acsc-models';
import { getACSC60HzPerformance } from './acsc-60hz-performance';
import { getACSC50HzPerformance } from './acsc-50hz-performance';
import { ACC_BP_MODELS, getACCBPPerformance } from './acc-bp-models';
import { ACC_ST_MODELS, getACCSTPerformance } from './acc-st-models';
import { DHAC_MODELS, getDHACPerformance } from './dhac-models';
import { THAC_MODELS, getTHACPerformance } from './thac-models';
import { CCU_MODELS, getCCUPerformance } from './ccu-models';
import { FCH_MODELS, getFCHPerformance } from './fch-models';
import { FCL_MODELS, getFCLPerfPoint } from './fcl-performance';
import { getNGWPerformance, getNGWCfmRows } from './ngw-performance';
import { FAPU_MODELS } from './fapu-models';
import { getFAPUPerformance, getFAPUCfmRows } from './fapu-performance';
import { SPU_MODELS } from './spu-models';
import { getSPUPerformance, getSPUCfmRows } from './spu-performance';
import { PNGF_MODELS } from './pngf-models';
import { getPNGFPerformance, getPNGFCfmRows } from './pngf-performance';
import { PNGV_MODELS } from './pngv-models';
import { getPNGVPerformance, getPNGVCfmRows } from './pngv-performance';
import { VRF_DUCTED_LOW_STATIC_MODELS } from './vrf-ducted-low-static-models';
import { VRF_WALL_MOUNTED_MODELS } from './vrf-wall-mounted-models';
import { VRF_CASSETTE_MODELS } from './vrf-cassette-models';
import { VRF_DUCTED_INVERTER_MODELS } from './vrf-ducted-inverter-models';
import { VRF_DUCTED_HIGH_STATIC_MODELS } from './vrf-ducted-high-static-models';
import { DSSF_CDEF_MODELS } from './dssf-cdef-models';
import { getDSSFPerformance, getDSSFCfmRows } from './dssf-cdef-performance';
import { fToC, gpmToLps } from '@/lib/utils/unit-conversions';

const FTWG_TO_KPA = 2.98898;

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
  'split-ds': DSSF_CDEF_MODELS,
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
  'fch': FCH_MODELS,
  'fcu': generateModels('fcu', 'CFCU', [0.5, 0.75, 1, 1.5, 2, 2.5, 3, 4, 5]),
  'fcl': FCL_MODELS,
  'rpuf': PNGF_MODELS,
  'pngv': PNGV_MODELS,
  'rpuc': generateModels('rpuc', 'RPUC', [4, 5, 6, 7.5, 8, 10]),
  'fapu': FAPU_MODELS,
  'spu': SPU_MODELS,
  'vrf-dsl': VRF_DUCTED_LOW_STATIC_MODELS,
  'vrf-wm': VRF_WALL_MOUNTED_MODELS,
  'vrf-cas': VRF_CASSETTE_MODELS,
  'vrf-dsi': VRF_DUCTED_INVERTER_MODELS,
  'vrf-dsh': VRF_DUCTED_HIGH_STATIC_MODELS,
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
  // Chiller-only: leaving (supply) chilled-water temp — the cold LCWT axis.
  leavingWaterTempF?: number;
  ambientTempF?: number;
  // CCU-only: saturated suction temperature (°F)
  saturatedSuctionTempF?: number;
  // NGW-only: entering chilled-water temp — the COLD supply entering the coil
  // (~44°F), i.e. the catalogue "entering water temp" axis (42–48°F).
  enteringWaterTempF?: number;
  // NGW-only: design airflow used to interpolate the coil performance curve.
  requiredAirflowCFM?: number;
  // ACSC-only: selects the 60 Hz vs 50 Hz performance matrix.
  is60Hz?: boolean;
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
  if (seriesId === 'ngw') {
    return applyNGWDesignPoint(models, cond);
  }
  if (seriesId === 'fch') {
    return applyFCHDesignPoint(models, cond);
  }
  if (seriesId === 'fcl') {
    return applyFCLDesignPoint(models, cond);
  }
  if (seriesId === 'fapu') {
    return applyFAPUDesignPoint(models, cond);
  }
  if (seriesId === 'rpuf') {
    return applyPNGFDesignPoint(models, cond);
  }
  if (seriesId === 'pngv') {
    return applyPNGVDesignPoint(models, cond);
  }
  if (seriesId === 'spu') {
    return applySPUDesignPoint(models, cond);
  }
  if (seriesId === 'split-ds') {
    return applyDSSFDesignPoint(models, cond);
  }
  if (seriesId === 'acsc') {
    return applyACSCDesignPoint(models, cond);
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
 * For FCH chilled-water fan coils, recompute total / sensible capacity, water
 * flow and water pressure drop at the user's design point by linearly
 * interpolating the catalogue matrix on external static pressure (in. WG) at
 * the rated HI fan speed. The matrix is at a single thermal condition (80/67 °F
 * air, 45/55 °F water), so only the ESP axis is design-dependent.
 */
function applyFCHDesignPoint(models: Model[], cond?: EvaporatorConditions): Model[] {
  const espInWG = cond?.espInWG ?? 0;
  return models.map(m => {
    const perf = getFCHPerformance(m.modelNumber, espInWG, 'HI');
    if (!perf) return m;
    const totalCapacityBtuh = Math.round(perf.totalCapacityBtuh);
    const sensibleCapacityBtuh = Math.round(perf.sensibleCapacityBtuh);
    return {
      ...m,
      totalCapacityBtuh,
      sensibleCapacityBtuh,
      nominalTons: Math.round((totalCapacityBtuh / 12000) * 100) / 100,
      matrixWaterFlowGPM: Math.round(perf.waterFlowGPM * 100) / 100,
      matrixWaterPressureDropFtH2O: Math.round(perf.waterPressureDropFtH2O * 100) / 100,
    };
  });
}

/**
 * For FCL chilled-water fan coils, recompute total / sensible capacity, water
 * flow and water pressure drop at the user's design external static pressure.
 * The catalogue is tabulated by fan speed × ESP (0 / 0.1 / 0.2 in.WG); the
 * rating point is HI speed, so the model card reflects HI at the design ESP
 * (the per-speed grid is shown in the FCL performance panel).
 */
function applyFCLDesignPoint(models: Model[], cond?: EvaporatorConditions): Model[] {
  const espInWG = cond?.espInWG ?? 0;
  return models.map(m => {
    const perf = getFCLPerfPoint(m.modelNumber, 'HI', espInWG);
    if (!perf) return m;
    const totalCapacityBtuh = Math.round(perf.totalCapacityBtuh);
    const sensibleCapacityBtuh = Math.round(perf.sensibleCapacityBtuh);
    return {
      ...m,
      totalCapacityBtuh,
      sensibleCapacityBtuh,
      nominalTons: Math.round((totalCapacityBtuh / 12000) * 100) / 100,
      matrixWaterFlowGPM: Math.round(perf.waterFlowGPM * 100) / 100,
      matrixWaterPressureDropFtH2O: Math.round(perf.waterPressureDropFtH2O * 100) / 100,
    };
  });
}

/**
 * For FAPU fresh-air packaged DX units, recompute total / sensible capacity and
 * power at the user's design point by bilinearly interpolating the catalogue
 * matrix on airflow (CFM) × entering-air dry-bulb (°F). Because these are
 * fresh-air units, the entering-air DB axis is the outdoor/ambient temperature,
 * so it reads from the design ambient field (defaulting to the 95 °F rating).
 *
 * Capacity basis: each model is evaluated at its own rated airflow.
 * Airflow basis: every model is evaluated at the requested airflow.
 */
function applyFAPUDesignPoint(models: Model[], cond?: EvaporatorConditions): Model[] {
  // 95 °F entering air is the catalogue rating point (95/80 °F DB/WB).
  const dbF = cond?.ambientTempF ?? 95;
  const requested = cond?.requiredAirflowCFM;
  const onAirflowBasis = requested != null && requested > 0;
  return models.map(m => {
    const rows = getFAPUCfmRows(m.modelNumber);
    const operatingCFM = onAirflowBasis && rows.length
      ? Math.min(Math.max(requested!, rows[0]), rows[rows.length - 1])
      : m.airflowCFM;
    const perf = getFAPUPerformance(m.modelNumber, operatingCFM, dbF);
    if (!perf) return m;
    const totalCapacityBtuh = Math.round(perf.totalCapacityBtuh);
    const sensibleCapacityBtuh = Math.round(perf.sensibleCapacityBtuh);
    const powerKW = Math.round(perf.kwInput * 10) / 10;
    const eer = Math.round((totalCapacityBtuh / (powerKW * 1000)) * 100) / 100;
    return {
      ...m,
      airflowCFM: onAirflowBasis ? operatingCFM : m.airflowCFM,
      totalCapacityBtuh,
      sensibleCapacityBtuh,
      powerKW,
      eer,
      nominalTons: Math.round((totalCapacityBtuh / 12000) * 10) / 10,
    };
  });
}

/**
 * For PNGF (RPUF-series) air-cooled packaged DX units, recompute total /
 * sensible capacity and power at the user's design point by trilinearly
 * interpolating the catalogue matrix on airflow (CFM) × entering-air DB (°F) ×
 * condenser ambient (°F). Unlike the fresh-air FAPU units, the indoor entering
 * air and the outdoor condenser ambient are independent inputs here.
 *
 * Capacity basis: each model is evaluated at its own rated airflow.
 * Airflow basis: every model is evaluated at the requested airflow.
 */
function applyPNGFDesignPoint(models: Model[], cond?: EvaporatorConditions): Model[] {
  // Catalogue rating point: 80 °F entering air DB, 95 °F condenser ambient.
  const dbF = cond?.enteringDBF ?? 80;
  const ambientF = cond?.ambientTempF ?? 95;
  const requested = cond?.requiredAirflowCFM;
  const onAirflowBasis = requested != null && requested > 0;
  return models.map(m => {
    const rows = getPNGFCfmRows(m.modelNumber);
    const operatingCFM = onAirflowBasis && rows.length
      ? Math.min(Math.max(requested!, rows[0]), rows[rows.length - 1])
      : m.airflowCFM;
    const perf = getPNGFPerformance(m.modelNumber, operatingCFM, dbF, ambientF);
    if (!perf) return m;
    const totalCapacityBtuh = Math.round(perf.totalCapacityBtuh);
    const sensibleCapacityBtuh = Math.round(perf.sensibleCapacityBtuh);
    const powerKW = Math.round(perf.kwInput * 10) / 10;
    const eer = Math.round((totalCapacityBtuh / (powerKW * 1000)) * 100) / 100;
    return {
      ...m,
      airflowCFM: onAirflowBasis ? operatingCFM : m.airflowCFM,
      totalCapacityBtuh,
      sensibleCapacityBtuh,
      powerKW,
      eer,
      nominalTons: Math.round((totalCapacityBtuh / 12000) * 10) / 10,
    };
  });
}

/**
 * For PNGv air-cooled packaged DX units, recompute total / sensible capacity and
 * power at the user's design point by bilinearly interpolating the catalogue
 * matrix on airflow (CFM) × condenser ambient (°F). The catalogue has no
 * separate entering-air axis, so only airflow and ambient are design-dependent.
 *
 * Capacity basis: each model is evaluated at its own rated airflow.
 * Airflow basis: every model is evaluated at the requested airflow.
 */
function applyPNGVDesignPoint(models: Model[], cond?: EvaporatorConditions): Model[] {
  // Catalogue rating point: 95 °F condenser ambient.
  const ambientF = cond?.ambientTempF ?? 95;
  const requested = cond?.requiredAirflowCFM;
  const onAirflowBasis = requested != null && requested > 0;
  return models.map(m => {
    const rows = getPNGVCfmRows(m.modelNumber);
    const operatingCFM = onAirflowBasis && rows.length
      ? Math.min(Math.max(requested!, rows[0]), rows[rows.length - 1])
      : m.airflowCFM;
    const perf = getPNGVPerformance(m.modelNumber, operatingCFM, ambientF);
    if (!perf) return m;
    const totalCapacityBtuh = Math.round(perf.totalCapacityBtuh);
    const sensibleCapacityBtuh = Math.round(perf.sensibleCapacityBtuh);
    const powerKW = Math.round(perf.kwInput * 10) / 10;
    const eer = Math.round((totalCapacityBtuh / (powerKW * 1000)) * 100) / 100;
    return {
      ...m,
      airflowCFM: onAirflowBasis ? operatingCFM : m.airflowCFM,
      totalCapacityBtuh,
      sensibleCapacityBtuh,
      powerKW,
      eer,
      nominalTons: Math.round((totalCapacityBtuh / 12000) * 10) / 10,
    };
  });
}

/**
 * For SPU self-contained packaged units, recompute total / sensible capacity and
 * power at the user's design point by trilinearly interpolating the catalogue
 * matrix on airflow (CFM) × entering-air DB (°F) × condenser ambient (°F), for
 * the model's coil-row variant (encoded in the -4R / -6R model number).
 *
 * Capacity basis: each model is evaluated at its own rated airflow.
 * Airflow basis: every model is evaluated at the requested airflow.
 */
function applySPUDesignPoint(models: Model[], cond?: EvaporatorConditions): Model[] {
  // Catalogue rating point: 80/67 °F entering air, 95 °F condenser ambient.
  const edbF = cond?.enteringDBF ?? 80;
  const ambientF = cond?.ambientTempF ?? 95;
  const requested = cond?.requiredAirflowCFM;
  const onAirflowBasis = requested != null && requested > 0;
  return models.map(m => {
    const rows = getSPUCfmRows(m.modelNumber);
    const operatingCFM = onAirflowBasis && rows.length
      ? Math.min(Math.max(requested!, rows[0]), rows[rows.length - 1])
      : m.airflowCFM;
    const perf = getSPUPerformance(m.modelNumber, operatingCFM, edbF, ambientF);
    if (!perf) return m;
    const totalCapacityBtuh = Math.round(perf.totalCapacityBtuh);
    const sensibleCapacityBtuh = Math.round(perf.sensibleCapacityBtuh);
    const powerKW = Math.round(perf.kwInput * 10) / 10;
    const eer = Math.round((totalCapacityBtuh / (powerKW * 1000)) * 100) / 100;
    return {
      ...m,
      airflowCFM: onAirflowBasis ? operatingCFM : m.airflowCFM,
      totalCapacityBtuh,
      sensibleCapacityBtuh,
      powerKW,
      eer,
      nominalTons: Math.round((totalCapacityBtuh / 12000) * 10) / 10,
    };
  });
}

/**
 * For DSSF-CDEF ducted split DX systems, recompute total / sensible capacity and
 * power at the user's design point by trilinearly interpolating the catalogue
 * matrix on airflow (CFM) × entering-air DB (°F) × condenser ambient (°F).
 *
 * Capacity basis: each model is evaluated at its own rated airflow.
 * Airflow basis: every model is evaluated at the requested airflow.
 */
function applyDSSFDesignPoint(models: Model[], cond?: EvaporatorConditions): Model[] {
  // Catalogue rating point: 80/67 °F entering air, 95 °F condenser ambient.
  const edbF = cond?.enteringDBF ?? 80;
  const ambientF = cond?.ambientTempF ?? 95;
  const requested = cond?.requiredAirflowCFM;
  const onAirflowBasis = requested != null && requested > 0;
  return models.map(m => {
    const rows = getDSSFCfmRows(m.modelNumber);
    const operatingCFM = onAirflowBasis && rows.length
      ? Math.min(Math.max(requested!, rows[0]), rows[rows.length - 1])
      : m.airflowCFM;
    const perf = getDSSFPerformance(m.modelNumber, operatingCFM, edbF, ambientF);
    if (!perf) return m;
    const totalCapacityBtuh = Math.round(perf.totalCapacityBtuh);
    const sensibleCapacityBtuh = Math.round(perf.sensibleCapacityBtuh);
    const powerKW = Math.round(perf.kwInput * 100) / 100;
    const eer = Math.round((totalCapacityBtuh / (powerKW * 1000)) * 100) / 100;
    return {
      ...m,
      airflowCFM: onAirflowBasis ? operatingCFM : m.airflowCFM,
      totalCapacityBtuh,
      sensibleCapacityBtuh,
      powerKW,
      eer,
      nominalTons: Math.round((totalCapacityBtuh / 12000) * 10) / 10,
    };
  });
}

/**
 * For ACSC air-cooled screw chillers, recompute capacity / power / EER / water
 * flow / WPD at the user's design point by bilinearly interpolating the
 * catalogue matrix on leaving chilled-water temp (LCWT °F) × ambient (°F).
 * The 60 Hz vs 50 Hz table is chosen from the design power supply. Values
 * between tabulated points follow the matrix slope (linear on each axis).
 */
function applyACSCDesignPoint(models: Model[], cond?: EvaporatorConditions): Model[] {
  if (cond?.leavingWaterTempF == null || cond?.ambientTempF == null) return models;
  // Default to the 60 Hz table when the supply frequency is unknown.
  const lookup = cond.is60Hz === false ? getACSC50HzPerformance : getACSC60HzPerformance;

  return models.map(m => {
    const perf = lookup(m.modelNumber, cond.leavingWaterTempF!, cond.ambientTempF!);
    if (!perf) return m;
    const totalCapacityBtuh = Math.round(perf.capacityTons * 12000);
    const powerKW = Math.round(perf.compressorKW * 10) / 10;
    const eer = Math.round((totalCapacityBtuh / (powerKW * 1000)) * 100) / 100;
    return {
      ...m,
      totalCapacityBtuh,
      sensibleCapacityBtuh: totalCapacityBtuh,
      powerKW,
      eer,
      nominalTons: Math.round(perf.capacityTons * 10) / 10,
      // Store metric flow/WPD so the chiller results table renders them like the
      // other chiller series (GPM/ft.wg are recovered for imperial display).
      matrixWaterFlowLPS: Math.round(gpmToLps(perf.waterFlowGPM) * 10000) / 10000,
      matrixWaterPressureDropKPa: Math.round(perf.waterPressureDropFtWg * FTWG_TO_KPA * 100) / 100,
    };
  });
}

/**
 * For NGW chilled-water fan coils, recompute total / sensible capacity, water
 * flow and water pressure drop at the user's design point by bilinearly
 * interpolating the catalogue matrix on airflow (CFM) × entering chilled-water
 * temp (°F). The "entering water temp" axis is the cold supply entering the
 * coil (~44°F), stored in the design form as enteringWaterTempF.
 *
 * Capacity basis: each model is evaluated at its own rated airflow.
 * Airflow basis: every model is evaluated at the requested airflow.
 */
function applyNGWDesignPoint(models: Model[], cond?: EvaporatorConditions): Model[] {
  // 44°F is the catalogue rating point (80/67°F entering air, 44/54°F water).
  const ewtF = cond?.enteringWaterTempF ?? 44;
  const requested = cond?.requiredAirflowCFM;
  const onAirflowBasis = requested != null && requested > 0;
  return models.map(m => {
    const rows = getNGWCfmRows(m.modelNumber);
    // Operating airflow: the requested CFM clamped to this coil's catalogue
    // range (airflow basis), otherwise the model's rated airflow.
    const operatingCFM = onAirflowBasis && rows.length
      ? Math.min(Math.max(requested!, rows[0]), rows[rows.length - 1])
      : m.airflowCFM;
    const perf = getNGWPerformance(m.modelNumber, operatingCFM, ewtF);
    if (!perf) return m;
    const totalCapacityBtuh = Math.round(perf.totalCapacityBtuh);
    const sensibleCapacityBtuh = Math.round(perf.sensibleCapacityBtuh);
    return {
      ...m,
      // Reflect the operating airflow so airflow-basis matching ranks a coil by
      // whether the request lands in its range, not by a fixed nominal point.
      airflowCFM: onAirflowBasis ? operatingCFM : m.airflowCFM,
      totalCapacityBtuh,
      sensibleCapacityBtuh,
      nominalTons: Math.round((totalCapacityBtuh / 12000) * 10) / 10,
      matrixWaterFlowGPM: Math.round(perf.waterFlowGPM * 100) / 100,
      matrixWaterPressureDropFtH2O: Math.round(perf.waterPressureDropFtH2O * 100) / 100,
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
    seriesId === 'acsc'   || seriesId === 'ccu-std' ||
    seriesId === 'fch'    || seriesId === 'fapu'    ||
    seriesId === 'rpuf'   || seriesId === 'spu'     ||
    seriesId === 'split-ds';
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
  // Apply tabulated design-point interpolation (NGW fan coils) so the listed
  // capacity / flow / WPD reflect the requested airflow and entering water temp.
  const models = applyChillerDesignPoint(seriesId, getModelsForSeries(seriesId), conditions);
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
