/**
 * VRF Indoor — Ducted Split, HIGH STATIC (IVEF) catalogue.
 *
 * Transcribed from the COOLEX ducted-split high-static indoor performance table.
 * Flat spec table keyed by the marketing capacity class (kBTU/h), aligned with
 * the capacities offered for the `ducted-split-high-static` indoor type in the
 * VRF wizard (16 / 18 / 24 / 30 / 36 / 42 / 48 / 60).
 *
 * Gas pipe, DC fan-motor input, coil rows and body weight vary by model;
 * liquid (9.52 mm) / drain (DN20) and the wired controller are common.
 */

import type { VRFIndoorSpec, VRFIndoorCommon } from './vrf-indoor';

/** Specs shared by every model in the lineup. */
export const VRF_DUCTED_HIGH_STATIC_COMMON: VRFIndoorCommon = {
  powerSupply: "220–240V / 50–60Hz / 1Ph",
  expansionDevice: "Electronic Expansion Valve",
  evaporatorCoil: "Blue Coated Aluminum Fins & IGT Copper Tubes",
  drainPipe: 'DN20 (R3/4")',
  controller: "Wired Controller",
};

/** Capacity classes available for this lineup, ascending. */
export const VRF_DUCTED_HIGH_STATIC_CAPACITIES = [16, 18, 24, 30, 36, 42, 48, 60] as const;

const GAS_SMALL = '15.88 mm (5/8")';
const GAS_LARGE = '19.05 mm (3/4")';
const LIQUID = '9.52 mm (3/8")';

const SPECS: Record<number, VRFIndoorSpec> = {
  16: {
    nominalKbtuh: 16,
    modelNumber: "IVEF-00164DH",
    coolingCapacityKW: 4.8,
    coolingCapacityBtuh: 16500,
    heatingCapacityKW: 5.2,
    heatingCapacityBtuh: 17800,
    fanMotorWatts: 245,
    fanMotorWattsLabel: "245",
    airflowCFM: 600,
    coilRows: 3,
    bodyWeightKg: 40,
    gasPipe: GAS_SMALL,
    liquidPipe: LIQUID,
  },
  18: {
    nominalKbtuh: 18,
    modelNumber: "IVEF-00184DH",
    coolingCapacityKW: 5.3,
    coolingCapacityBtuh: 18000,
    heatingCapacityKW: 5.7,
    heatingCapacityBtuh: 19400,
    fanMotorWatts: 245,
    fanMotorWattsLabel: "245",
    airflowCFM: 600,
    coilRows: 2,
    bodyWeightKg: 60,
    gasPipe: GAS_SMALL,
    liquidPipe: LIQUID,
  },
  24: {
    nominalKbtuh: 24,
    modelNumber: "IVEF-00244DH",
    coolingCapacityKW: 7.0,
    coolingCapacityBtuh: 24000,
    heatingCapacityKW: 7.6,
    heatingCapacityBtuh: 25900,
    fanMotorWatts: 245,
    fanMotorWattsLabel: "245",
    airflowCFM: 800,
    coilRows: 3,
    bodyWeightKg: 63,
    gasPipe: GAS_SMALL,
    liquidPipe: LIQUID,
  },
  30: {
    nominalKbtuh: 30,
    modelNumber: "IVEF-00304DH",
    coolingCapacityKW: 8.8,
    coolingCapacityBtuh: 30000,
    heatingCapacityKW: 9.5,
    heatingCapacityBtuh: 32400,
    fanMotorWatts: 245,
    fanMotorWattsLabel: "245",
    airflowCFM: 1000,
    coilRows: 3,
    bodyWeightKg: 63,
    gasPipe: GAS_SMALL,
    liquidPipe: LIQUID,
  },
  36: {
    nominalKbtuh: 36,
    modelNumber: "IVEF-00364DH",
    coolingCapacityKW: 10.6,
    coolingCapacityBtuh: 36000,
    heatingCapacityKW: 11.4,
    heatingCapacityBtuh: 38900,
    fanMotorWatts: 245,
    fanMotorWattsLabel: "245",
    airflowCFM: 1200,
    coilRows: 3,
    bodyWeightKg: 71,
    gasPipe: GAS_SMALL,
    liquidPipe: LIQUID,
  },
  42: {
    nominalKbtuh: 42,
    modelNumber: "IVEF-00424DH",
    coolingCapacityKW: 12.3,
    coolingCapacityBtuh: 42000,
    heatingCapacityKW: 13.4,
    heatingCapacityBtuh: 45400,
    fanMotorWatts: 375,
    fanMotorWattsLabel: "375",
    airflowCFM: 1400,
    coilRows: 3,
    bodyWeightKg: 71,
    gasPipe: GAS_SMALL,
    liquidPipe: LIQUID,
  },
  48: {
    nominalKbtuh: 48,
    modelNumber: "IVEF-00484DH",
    coolingCapacityKW: 14.1,
    coolingCapacityBtuh: 48000,
    heatingCapacityKW: 15.2,
    heatingCapacityBtuh: 51800,
    fanMotorWatts: 552,
    fanMotorWattsLabel: "552",
    airflowCFM: 1600,
    coilRows: 4,
    bodyWeightKg: 78,
    gasPipe: GAS_LARGE,
    liquidPipe: LIQUID,
  },
  60: {
    nominalKbtuh: 60,
    modelNumber: "IVEF-00604DH",
    coolingCapacityKW: 17.6,
    coolingCapacityBtuh: 60000,
    heatingCapacityKW: 19.1,
    heatingCapacityBtuh: 64800,
    fanMotorWatts: 552,
    fanMotorWattsLabel: "552",
    airflowCFM: 2000,
    coilRows: 3,
    bodyWeightKg: 91,
    gasPipe: GAS_LARGE,
    liquidPipe: LIQUID,
  },
};

/** All specs ascending by capacity — used as the performance-panel table rows. */
export const VRF_DUCTED_HIGH_STATIC_SPECS: VRFIndoorSpec[] =
  VRF_DUCTED_HIGH_STATIC_CAPACITIES.map((c) => SPECS[c]);

/** Look up the catalogue spec for a marketing capacity class (kBTU/h). */
export function getVRFDuctedHighStaticSpec(nominalKbtuh: number): VRFIndoorSpec | undefined {
  return SPECS[nominalKbtuh];
}

/** Catalogue model number for a capacity class, or undefined if unlisted. */
export function getVRFDuctedHighStaticModelNumber(nominalKbtuh: number): string | undefined {
  return SPECS[nominalKbtuh]?.modelNumber;
}
