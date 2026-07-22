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
import {
  getSPUFanPerformance,
  spuMotorHP,
  SPU_FAN_ESP_INWG,
} from './spu-fan-performance';
import { PNGF_MODELS } from './pngf-models';
import { getPNGFPerformance, getPNGFCfmRows } from './pngf-performance';
import { PNGV_MODELS, buildPNGVModels } from './pngv-models';
import { getPNGVPerformance, getPNGVCfmRows } from './pngv-performance';
import { VRF_DUCTED_LOW_STATIC_MODELS } from './vrf-ducted-low-static-models';
import { VRF_WALL_MOUNTED_MODELS } from './vrf-wall-mounted-models';
import { VRF_CASSETTE_MODELS } from './vrf-cassette-models';
import { VRF_DUCTED_INVERTER_MODELS } from './vrf-ducted-inverter-models';
import { VRF_DUCTED_HIGH_STATIC_MODELS } from './vrf-ducted-high-static-models';
import { DSSF_CDEF_MODELS } from './dssf-cdef-models';
import { getDSSFPerformance, getDSSFCfmRows } from './dssf-cdef-performance';
import { PHE_MODELS, pheCapacityFactor } from './phe-models';
import { fToC, gpmToLps, hpToKw } from '@/lib/utils/unit-conversions';
import { btuhToKW, isoMinExternalStaticInWG, isDuctedISO } from './iso13253-static-pressure';

const FTWG_TO_KPA = 2.98898;

/**
 * Capacity multiplier for running a ducted unit ABOVE its ISO 13253 rating-basis
 * ESP. The catalogue capacity is rated at the band minimum ESP; for every 0.1
 * in. WG of external static the customer requires beyond that minimum, the
 * supply fan loses airflow and the coil loses ~1% capacity. At or below the band
 * minimum the rated figure stands (factor = 1 — no capacity credit for an easier
 * duct). Floored at 0.70 to avoid runaway de-rating past the fan's usable range.
 *
 * NOTE: this is an engineering approximation. Replace with per-model fan-curve
 * (available-static vs airflow) data when the catalogue fan tables are digitized.
 */
function ductedESPFactor(totalCapacityBtuh: number, espInWG?: number): number {
  if (espInWG == null || totalCapacityBtuh <= 0) return 1;
  const basisInWG = isoMinExternalStaticInWG(btuhToKW(totalCapacityBtuh));
  const excess = Math.max(0, espInWG - basisInWG);
  return Math.max(0.70, 1 - excess * (1 / 0.1) * 0.01);
}

/**
 * De-rate a ducted series' delivered capacity for external static pressure
 * above the ISO 13253 band minimum, recomputing the derived figures (EER,
 * nominal tons) so results reflect the unit at the customer's design ESP. Power
 * input is unchanged. Mirrors applyAltitudeDerate; a no-op for non-ducted
 * series or when no static is supplied.
 */
function applyDuctedESPDerate(models: Model[], seriesId: string, espInWG?: number): Model[] {
  if (!isDuctedISO(seriesId) || espInWG == null) return models;
  return models.map(m => {
    const basisInWG = isoMinExternalStaticInWG(btuhToKW(m.totalCapacityBtuh));
    const factor = ductedESPFactor(m.totalCapacityBtuh, espInWG);
    if (factor >= 1) {
      // Design ESP is at/below the ISO band minimum — rated figures stand.
      return { ...m, espRatingBasisInWG: basisInWG, espDeratePercent: 0 };
    }
    const totalCapacityBtuh = Math.round(m.totalCapacityBtuh * factor);
    const sensibleCapacityBtuh = Math.round(m.sensibleCapacityBtuh * factor);
    const eer = m.powerKW > 0
      ? Math.round((totalCapacityBtuh / (m.powerKW * 1000)) * 100) / 100
      : m.eer;
    return {
      ...m,
      totalCapacityBtuh,
      sensibleCapacityBtuh,
      eer,
      nominalTons: Math.round((totalCapacityBtuh / 12000) * 100) / 100,
      espRatingBasisInWG: basisInWG,
      espDeratePercent: Math.round((1 - factor) * 1000) / 10,
    };
  });
}

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

  'phe': PHE_MODELS,
  'prec-dc': generateModels('prec-dc', 'CPDU', [5, 7.5, 10, 12.5, 15, 20, 25, 30]),
  'prec-tele': generateModels('prec-tele', 'CPTU', [1, 1.5, 2, 2.5, 3, 4, 5, 7.5, 10]),
  'fch': FCH_MODELS,
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
  // Installation altitude (ft) above sea level. De-rates total cooling capacity
  // via a correction factor (thinner air → lower condenser/coil capacity).
  // Applies to every series; 0/undefined = sea level = no de-rating.
  altitudeFt?: number;
  // Capacity-basis only: the required total cooling capacity (Btu/h). For
  // CFM-row units (SPU/DSSF/FAPU/PNGF/PNGV/NGW) the design-point scans every
  // catalogue airflow row and operates at the one whose capacity is closest to
  // this target, instead of pinning to the model's nominal rated row.
  requiredCapacityBtuh?: number;
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
  if (seriesId === 'phe') {
    return applyPHEDesignPoint(models, cond);
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
 * CRAC (PHCF-PHEF precision cooling): the catalogue cooling/sensible capacities
 * are rated at 48 °C ambient (T4). Air-cooled DX capacity rises as the outdoor
 * ambient falls, so scale each model's rated capacity by a linear slope relative
 * to the 48 °C basis (see phe-models.ts). At T4 the factor is 1.0 (catalogue);
 * at T1/T3 it is > 1. Power input is held constant, so EER tracks the capacity.
 * No-op when the design ambient is unknown.
 */
function applyPHEDesignPoint(models: Model[], cond?: EvaporatorConditions): Model[] {
  if (cond?.ambientTempF == null) return models;
  const factor = pheCapacityFactor(fToC(cond.ambientTempF));
  if (Math.abs(factor - 1) < 1e-9) return models;
  return models.map(m => {
    const totalCapacityBtuh = Math.round(m.totalCapacityBtuh * factor);
    const sensibleCapacityBtuh = Math.round(m.sensibleCapacityBtuh * factor);
    const eer = m.powerKW > 0
      ? Math.round((totalCapacityBtuh / (m.powerKW * 1000)) * 100) / 100
      : m.eer;
    return {
      ...m,
      totalCapacityBtuh,
      sensibleCapacityBtuh,
      eer,
      nominalTons: Math.round((totalCapacityBtuh / 12000) * 100) / 100,
    };
  });
}

/**
 * Pick the operating airflow for a CFM-row unit (SPU/DSSF/FAPU/PNGF/PNGV/NGW).
 *
 *  • Airflow basis (requestedCFM set): clamp the requested CFM into this model's
 *    catalogue range — every model is evaluated at the same delivered airflow.
 *  • Capacity basis (targetBtuh set): scan ALL catalogue CFM rows and return the
 *    one whose total capacity is closest to the required load, regardless of
 *    whether that is the lowest, the nominal/rated, or the maximum row.
 *  • Otherwise: fall back to the model's nominal rated airflow.
 *
 * `totalAt(cfm)` returns the model's interpolated total capacity (Btu/h) at the
 * given airflow and design thermal conditions, or null when there is no data.
 */
function selectOperatingCFM(
  rows: number[],
  ratedCFM: number,
  requestedCFM: number | undefined,
  targetBtuh: number | undefined,
  totalAt: (cfm: number) => number | null,
): number {
  if (rows.length === 0) return ratedCFM;
  if (requestedCFM != null && requestedCFM > 0) {
    return Math.min(Math.max(requestedCFM, rows[0]), rows[rows.length - 1]);
  }
  if (targetBtuh == null || targetBtuh <= 0) return ratedCFM;
  let bestCFM = ratedCFM;
  let bestDiff = Infinity;
  for (const cfm of rows) {
    const total = totalAt(cfm);
    if (total == null) continue;
    const diff = Math.abs(total - targetBtuh);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestCFM = cfm;
    }
  }
  return bestCFM;
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
  return models.map(m => {
    const rows = getFAPUCfmRows(m.modelNumber);
    const operatingCFM = selectOperatingCFM(
      rows, m.airflowCFM, cond?.requiredAirflowCFM, cond?.requiredCapacityBtuh,
      cfm => getFAPUPerformance(m.modelNumber, cfm, dbF)?.totalCapacityBtuh ?? null,
    );
    const perf = getFAPUPerformance(m.modelNumber, operatingCFM, dbF);
    if (!perf) return m;
    const totalCapacityBtuh = Math.round(perf.totalCapacityBtuh);
    const sensibleCapacityBtuh = Math.round(perf.sensibleCapacityBtuh);
    const powerKW = Math.round(perf.kwInput * 10) / 10;
    const eer = Math.round((totalCapacityBtuh / (powerKW * 1000)) * 100) / 100;
    return {
      ...m,
      airflowCFM: operatingCFM,
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
  return models.map(m => {
    const rows = getPNGFCfmRows(m.modelNumber);
    const operatingCFM = selectOperatingCFM(
      rows, m.airflowCFM, cond?.requiredAirflowCFM, cond?.requiredCapacityBtuh,
      cfm => getPNGFPerformance(m.modelNumber, cfm, dbF, ambientF)?.totalCapacityBtuh ?? null,
    );
    const perf = getPNGFPerformance(m.modelNumber, operatingCFM, dbF, ambientF);
    if (!perf) return m;
    const totalCapacityBtuh = Math.round(perf.totalCapacityBtuh);
    const sensibleCapacityBtuh = Math.round(perf.sensibleCapacityBtuh);
    const powerKW = Math.round(perf.kwInput * 10) / 10;
    const eer = Math.round((totalCapacityBtuh / (powerKW * 1000)) * 100) / 100;
    return {
      ...m,
      airflowCFM: operatingCFM,
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
 * PNGv is published per power frequency: Saudi Arabia uses the 60 Hz table, all
 * other countries use 50 Hz. The two frequencies have different rated capacities
 * and a slightly different lineup, so the model list itself is rebuilt for the
 * active frequency here (the static PNGV_MODELS registry holds the 50 Hz lineup).
 *
 * Capacity basis: each model is evaluated at its own rated airflow.
 * Airflow basis: every model is evaluated at the requested airflow.
 */
function applyPNGVDesignPoint(models: Model[], cond?: EvaporatorConditions): Model[] {
  // Catalogue rating point: 95 °F condenser ambient. Saudi = 60 Hz, else 50 Hz.
  const ambientF = cond?.ambientTempF ?? 95;
  const is60Hz = cond?.is60Hz === true;
  const lineup = is60Hz ? buildPNGVModels(true) : models;
  return lineup.map(m => {
    const rows = getPNGVCfmRows(m.modelNumber, is60Hz);
    const operatingCFM = selectOperatingCFM(
      rows, m.airflowCFM, cond?.requiredAirflowCFM, cond?.requiredCapacityBtuh,
      cfm => getPNGVPerformance(m.modelNumber, cfm, ambientF, is60Hz)?.totalCapacityBtuh ?? null,
    );
    const perf = getPNGVPerformance(m.modelNumber, operatingCFM, ambientF, is60Hz);
    if (!perf) return m;
    const totalCapacityBtuh = Math.round(perf.totalCapacityBtuh);
    const sensibleCapacityBtuh = Math.round(perf.sensibleCapacityBtuh);
    const powerKW = Math.round(perf.kwInput * 10) / 10;
    const eer = Math.round((totalCapacityBtuh / (powerKW * 1000)) * 100) / 100;
    return {
      ...m,
      airflowCFM: operatingCFM,
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
  // SPU supply-fan tables top out at 2.0 in. WG; clamp the design static there.
  const espFloor = SPU_FAN_ESP_INWG[0];
  const espCeil = SPU_FAN_ESP_INWG[SPU_FAN_ESP_INWG.length - 1];
  const espInWG = cond?.espInWG != null
    ? Math.min(Math.max(cond.espInWG, 0), espCeil)
    : null;
  return models.map(m => {
    const rows = getSPUCfmRows(m.modelNumber);
    const operatingCFM = selectOperatingCFM(
      rows, m.airflowCFM, cond?.requiredAirflowCFM, cond?.requiredCapacityBtuh,
      cfm => getSPUPerformance(m.modelNumber, cfm, edbF, ambientF)?.totalCapacityBtuh ?? null,
    );
    const perf = getSPUPerformance(m.modelNumber, operatingCFM, edbF, ambientF);
    if (!perf) return m;
    const totalCapacityBtuh = Math.round(perf.totalCapacityBtuh);
    const sensibleCapacityBtuh = Math.round(perf.sensibleCapacityBtuh);

    // Supply-fan power draw from the fan table. The cooling matrix's kwInput
    // bundles the fan at the table's minimum static (0.40 in. WG); for a design
    // ESP above that we add the INCREMENTAL absorbed power the blower now draws
    // (BHP → kW), so total consumption tracks the customer's duct static without
    // double-counting the baseline fan. At/below 0.40 in. WG nothing is added.
    let fanRpm: number | undefined;
    let fanBhp: number | undefined;
    let fanMotorHP: number | undefined;
    let designEspInWG: number | undefined;
    let addedFanKW = 0;
    if (espInWG != null) {
      const designEsp = Math.max(espInWG, espFloor);
      const fanDesign = getSPUFanPerformance(m.modelNumber, operatingCFM, designEsp);
      const fanBase = getSPUFanPerformance(m.modelNumber, operatingCFM, espFloor);
      if (fanDesign) {
        fanRpm = Math.round(fanDesign.rpm);
        fanBhp = Math.round(fanDesign.bhp * 100) / 100;
        fanMotorHP = Math.round(spuMotorHP(fanDesign.bhp) * 100) / 100;
        designEspInWG = espInWG;
        if (fanBase) addedFanKW = Math.max(0, hpToKw(fanDesign.bhp - fanBase.bhp));
      }
    }

    const powerKW = Math.round((perf.kwInput + addedFanKW) * 10) / 10;
    const eer = Math.round((totalCapacityBtuh / (powerKW * 1000)) * 100) / 100;
    return {
      ...m,
      airflowCFM: operatingCFM,
      totalCapacityBtuh,
      sensibleCapacityBtuh,
      powerKW,
      eer,
      nominalTons: Math.round((totalCapacityBtuh / 12000) * 10) / 10,
      fanRpm,
      fanBhp,
      fanMotorHP,
      designEspInWG,
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
  return models.map(m => {
    const rows = getDSSFCfmRows(m.modelNumber);
    const operatingCFM = selectOperatingCFM(
      rows, m.airflowCFM, cond?.requiredAirflowCFM, cond?.requiredCapacityBtuh,
      cfm => getDSSFPerformance(m.modelNumber, cfm, edbF, ambientF)?.totalCapacityBtuh ?? null,
    );
    const perf = getDSSFPerformance(m.modelNumber, operatingCFM, edbF, ambientF);
    if (!perf) return m;
    const totalCapacityBtuh = Math.round(perf.totalCapacityBtuh);
    const sensibleCapacityBtuh = Math.round(perf.sensibleCapacityBtuh);
    const powerKW = Math.round(perf.kwInput * 100) / 100;
    const eer = Math.round((totalCapacityBtuh / (powerKW * 1000)) * 100) / 100;
    return {
      ...m,
      airflowCFM: operatingCFM,
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
  return models.map(m => {
    const rows = getNGWCfmRows(m.modelNumber);
    // Operating airflow: on airflow basis the requested CFM clamped to this
    // coil's catalogue range; on capacity basis the row whose capacity is
    // closest to the load; otherwise the model's rated airflow.
    const operatingCFM = selectOperatingCFM(
      rows, m.airflowCFM, cond?.requiredAirflowCFM, cond?.requiredCapacityBtuh,
      cfm => getNGWPerformance(m.modelNumber, cfm, ewtF)?.totalCapacityBtuh ?? null,
    );
    const perf = getNGWPerformance(m.modelNumber, operatingCFM, ewtF);
    if (!perf) return m;
    const totalCapacityBtuh = Math.round(perf.totalCapacityBtuh);
    const sensibleCapacityBtuh = Math.round(perf.sensibleCapacityBtuh);
    return {
      ...m,
      // Reflect the operating airflow so matching ranks a coil by its selected
      // row, not by a fixed nominal point.
      airflowCFM: operatingCFM,
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
 *
 * External static pressure is NOT handled here — for ducted comfort ACs it is
 * applied separately against each unit's ISO 13253 band-minimum rating basis
 * (see ductedESPFactor / applyDuctedESPDerate), which varies by capacity.
 *
 * Returns a multiplier (e.g. 0.97 means 3% derating).
 */
function capacityCorrectionFactor(cond: EvaporatorConditions): number {
  const dbDelta = (cond.enteringDBF ?? STD_EDB) - STD_EDB;
  const wbDelta = (cond.enteringWBF ?? STD_EWB) - STD_EWB;

  // DB: higher = slight derating (sensible load increase)
  const dbFactor = 1 - Math.abs(dbDelta) * 0.005;
  // WB: lower = less latent, higher = more total — penalize deviation either way
  const wbFactor = 1 - Math.abs(wbDelta) * 0.012;

  return Math.max(0.70, dbFactor * wbFactor);
}

/**
 * Altitude correction factor for total cooling capacity, per the COOLEX
 * catalogue table (sea level → 1.0, de-rating ~4% by 7000 ft as thinner air
 * lowers condenser/coil capacity). Linearly interpolated between breakpoints;
 * clamped to 1.0 below sea level and to the 7000 ft value above it.
 */
const ALTITUDE_CORRECTION: ReadonlyArray<readonly [number, number]> = [
  [0, 1.0], [1000, 0.996], [2000, 0.990], [3000, 0.984],
  [4000, 0.980], [5000, 0.974], [6000, 0.965], [7000, 0.960],
];

export function altitudeCorrectionFactor(altitudeFt?: number): number {
  if (altitudeFt == null || altitudeFt <= 0) return 1;
  const last = ALTITUDE_CORRECTION[ALTITUDE_CORRECTION.length - 1];
  if (altitudeFt >= last[0]) return last[1];
  for (let i = 1; i < ALTITUDE_CORRECTION.length; i++) {
    const [a1, f1] = ALTITUDE_CORRECTION[i];
    if (altitudeFt <= a1) {
      const [a0, f0] = ALTITUDE_CORRECTION[i - 1];
      return f0 + (f1 - f0) * ((altitudeFt - a0) / (a1 - a0));
    }
  }
  return 1;
}

/**
 * Scale each model's delivered capacity by the altitude factor and recompute
 * the derived figures (EER, nominal tons) so results reflect the de-rated unit.
 * Power input is unchanged. A factor of 1 returns the models untouched.
 */
function applyAltitudeDerate(models: Model[], factor: number): Model[] {
  if (factor >= 1) return models;
  return models.map(m => {
    const totalCapacityBtuh = Math.round(m.totalCapacityBtuh * factor);
    const sensibleCapacityBtuh = Math.round(m.sensibleCapacityBtuh * factor);
    const eer = m.powerKW > 0
      ? Math.round((totalCapacityBtuh / (m.powerKW * 1000)) * 100) / 100
      : m.eer;
    return {
      ...m,
      totalCapacityBtuh,
      sensibleCapacityBtuh,
      eer,
      nominalTons: Math.round((totalCapacityBtuh / 12000) * 100) / 100,
    };
  });
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
    seriesId === 'split-ds' || seriesId === 'phe';
  const corrFactor = isMatrixSized ? 1 : capacityCorrectionFactor(conditions ?? {});
  // Altitude de-rates EVERY series (independent of the airside correction above),
  // so it is never zeroed out for matrix-sized units.
  const altFactor = altitudeCorrectionFactor(conditions?.altitudeFt);
  // External static pressure de-rates ducted comfort ACs against their ISO 13253
  // band-minimum rating basis (applies even to matrix-sized ducted units, whose
  // catalogue matrices have no ESP axis). Use the requested capacity's band to
  // size the design point; the per-model factor is applied below in the pipeline.
  const reqESPFactor = isDuctedISO(seriesId)
    ? ductedESPFactor(requestedBtuh, conditions?.espInWG)
    : 1;

  // Tell the CFM-row design-points (SPU/DSSF/FAPU/PNGF/PNGV/NGW) which capacity
  // to size for so they operate at the catalogue airflow row closest to the
  // load. Divide by all factors so the de-rated capacity (corrected =
  // matrix × corrFactor × altFactor × espFactor) lands closest to the request.
  const condForDesign: EvaporatorConditions = {
    ...conditions,
    requiredCapacityBtuh: requestedBtuh > 0
      ? requestedBtuh / (corrFactor * altFactor * reqESPFactor)
      : undefined,
  };
  const models = applyDuctedESPDerate(
    applyAltitudeDerate(
      applyChillerDesignPoint(seriesId, getModelsForSeries(seriesId), condForDesign),
      altFactor,
    ),
    seriesId,
    conditions?.espInWG,
  );
  if (models.length === 0) return [];

  const withMatch = models.map(m => {
    // Apply correction factor to catalog capacity (non-chillers only — see above).
    // ESP de-rating is already baked into m.totalCapacityBtuh by applyDuctedESPDerate.
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
  // capacity / flow / WPD reflect the requested airflow and entering water temp,
  // then de-rate the listed capacity for installation altitude.
  const models = applyDuctedESPDerate(
    applyAltitudeDerate(
      applyChillerDesignPoint(seriesId, getModelsForSeries(seriesId), conditions),
      altitudeCorrectionFactor(conditions?.altitudeFt),
    ),
    seriesId,
    conditions?.espInWG,
  );
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
