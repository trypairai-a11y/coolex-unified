import type { Model } from '@/types/product';
import {
  VRF_DUCTED_LOW_STATIC_SPECS,
  VRF_DUCTED_LOW_STATIC_COMMON,
  type VRFDuctedLowStaticSpec,
} from './vrf-ducted-low-static-performance';

/**
 * VRF ducted-split LOW-STATIC indoor units (IVLF-00184DH … IVLF-00364DH).
 *
 * Built from the flat catalogue spec table (vrf-ducted-low-static-performance.ts).
 * These are the real indoor units behind the `ducted-split-low-static` type in
 * the VRF wizard; the matching outdoor unit is sized separately from the total
 * indoor load (see lib/utils/vrf.ts).
 *
 * The catalogue lists cooling total only, so sensible is derived from the
 * low-static sensible ratio (0.75); `powerKW` is the indoor DC fan motor (the
 * VRF compressor lives in the outdoor unit) and `eer` is the lineup's nominal
 * indoor efficiency used for system-share estimates in the diagram.
 */

const SENSIBLE_RATIO = 0.75;
const INDOOR_EER = 11.5;

function buildModel(spec: VRFDuctedLowStaticSpec): Model {
  const totalCapacityBtuh = spec.coolingCapacityBtuh;
  const sensibleCapacityBtuh = Math.round(totalCapacityBtuh * SENSIBLE_RATIO);
  const powerKW = Math.round((spec.fanMotorWatts / 1000) * 100) / 100;

  return {
    id: spec.modelNumber,
    seriesId: 'vrf-dsl',
    modelNumber: spec.modelNumber,
    totalCapacityBtuh,
    sensibleCapacityBtuh,
    powerKW,
    eer: INDOOR_EER,
    airflowCFM: spec.airflowCFM,
    leavingDBF: 56,
    leavingWBF: 54,
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
    connectingDrainPipe: VRF_DUCTED_LOW_STATIC_COMMON.drainPipe,
    expansionDevice: VRF_DUCTED_LOW_STATIC_COMMON.expansionDevice,
    evaporatorCoilType: VRF_DUCTED_LOW_STATIC_COMMON.evaporatorCoil,
    powerSupply: VRF_DUCTED_LOW_STATIC_COMMON.powerSupply,
    controllerType: VRF_DUCTED_LOW_STATIC_COMMON.controller,
  };
}

export const VRF_DUCTED_LOW_STATIC_MODELS: Model[] =
  VRF_DUCTED_LOW_STATIC_SPECS.map(buildModel);
