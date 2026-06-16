import type { Model } from '@/types/product';
import {
  VRF_WALL_MOUNTED_SPECS,
  VRF_WALL_MOUNTED_COMMON,
  type VRFWallMountedSpec,
} from './vrf-wall-mounted-performance';

/**
 * VRF wall-mounted indoor units (IWEF-00124DH … IWEF-00304DH).
 *
 * Built from the flat catalogue spec table (vrf-wall-mounted-performance.ts).
 * These back the `wall-mounted` indoor type in the VRF wizard; the outdoor unit
 * is sized separately from the total indoor load (see lib/utils/vrf.ts).
 *
 * Cooling total is from the catalogue; sensible is derived from the wall-mounted
 * sensible ratio (0.72). `powerKW` is the indoor fan motor (the VRF compressor
 * lives in the outdoor unit) and `eer` is the lineup's nominal indoor efficiency
 * used for system-share estimates in the diagram.
 */

const SENSIBLE_RATIO = 0.72;
const INDOOR_EER = 11.6;

function buildModel(spec: VRFWallMountedSpec): Model {
  const totalCapacityBtuh = spec.coolingCapacityBtuh;
  const sensibleCapacityBtuh = Math.round(totalCapacityBtuh * SENSIBLE_RATIO);
  const powerKW = Math.round((spec.fanMotorWatts / 1000) * 100) / 100;

  return {
    id: spec.modelNumber,
    seriesId: 'vrf-wm',
    modelNumber: spec.modelNumber,
    totalCapacityBtuh,
    sensibleCapacityBtuh,
    powerKW,
    eer: INDOOR_EER,
    airflowCFM: spec.airflowCFM,
    leavingDBF: 58,
    leavingWBF: 56,
    compressorCount: 0,
    matchPercent: 100,
    nominalTons: Math.round((totalCapacityBtuh / 12000) * 10) / 10,
    weightLbs: Math.round(spec.bodyWeightKg * 2.205),
    lengthIn: 0,
    widthIn: 0,
    heightIn: 0,
    refrigerant: 'R-410A',
    // VRF indoor catalogue extras
    heatingCapacityBtuh: spec.heatingCapacityBtuh,
    fanMotorWatts: spec.fanMotorWatts,
    coilRows: spec.coilRows,
    bodyWeight_kg: spec.bodyWeightKg,
    connectingGasPipe: spec.gasPipe,
    connectingLiquidPipe: spec.liquidPipe,
    connectingDrainPipe: VRF_WALL_MOUNTED_COMMON.drainPipe,
    expansionDevice: VRF_WALL_MOUNTED_COMMON.expansionDevice,
    evaporatorCoilType: VRF_WALL_MOUNTED_COMMON.evaporatorCoil,
    powerSupply: VRF_WALL_MOUNTED_COMMON.powerSupply,
    controllerType: VRF_WALL_MOUNTED_COMMON.controller,
  };
}

export const VRF_WALL_MOUNTED_MODELS: Model[] =
  VRF_WALL_MOUNTED_SPECS.map(buildModel);
