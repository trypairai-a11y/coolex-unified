import type { Model } from '@/types/product';
import type { VRFIndoorSpec } from './vrf-indoor';
import { VRF_CASSETTE_SPECS, VRF_CASSETTE_COMMON } from './vrf-cassette-performance';

/**
 * VRF ceiling-cassette indoor units (ICEF-00184DH … ICEF-00484DH).
 *
 * Built from the flat catalogue spec table (vrf-cassette-performance.ts). These
 * back the `cassette` indoor type in the VRF wizard; the outdoor unit is sized
 * separately from the total indoor load (see lib/utils/vrf.ts).
 *
 * Cooling total is from the catalogue; sensible is derived from the cassette
 * sensible ratio (0.74). `powerKW` is the indoor fan motor (the VRF compressor
 * lives in the outdoor unit) and `eer` is the lineup's nominal indoor efficiency.
 * The catalogue lists only the panel weight, so `weightLbs` is left at 0.
 */

const SENSIBLE_RATIO = 0.74;
const INDOOR_EER = 11.2;

function buildModel(spec: VRFIndoorSpec): Model {
  const totalCapacityBtuh = spec.coolingCapacityBtuh;
  const sensibleCapacityBtuh = Math.round(totalCapacityBtuh * SENSIBLE_RATIO);
  const powerKW = Math.round((spec.fanMotorWatts / 1000) * 100) / 100;

  return {
    id: spec.modelNumber,
    seriesId: 'vrf-cas',
    modelNumber: spec.modelNumber,
    totalCapacityBtuh,
    sensibleCapacityBtuh,
    powerKW,
    eer: INDOOR_EER,
    airflowCFM: spec.airflowCFM,
    leavingDBF: 57,
    leavingWBF: 55,
    compressorCount: 0,
    matchPercent: 100,
    nominalTons: Math.round((totalCapacityBtuh / 12000) * 10) / 10,
    weightLbs: 0,
    lengthIn: 0,
    widthIn: 0,
    heightIn: 0,
    refrigerant: 'R-410A',
    // VRF indoor catalogue extras
    heatingCapacityBtuh: spec.heatingCapacityBtuh,
    fanMotorWatts: spec.fanMotorWatts,
    coilRows: spec.coilRows,
    connectingGasPipe: spec.gasPipe,
    connectingLiquidPipe: spec.liquidPipe,
    connectingDrainPipe: VRF_CASSETTE_COMMON.drainPipe,
    expansionDevice: VRF_CASSETTE_COMMON.expansionDevice,
    evaporatorCoilType: VRF_CASSETTE_COMMON.evaporatorCoil,
    powerSupply: VRF_CASSETTE_COMMON.powerSupply,
    controllerType: VRF_CASSETTE_COMMON.controller,
  };
}

export const VRF_CASSETTE_MODELS: Model[] = VRF_CASSETTE_SPECS.map(buildModel);
