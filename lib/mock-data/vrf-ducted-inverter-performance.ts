/**
 * VRF Indoor — Ducted Split, INVERTER (IVHF) catalogue.
 *
 * Transcribed from the COOLEX ducted-split inverter indoor performance table.
 * Flat spec table keyed by the marketing capacity class (kBTU/h), aligned with
 * the capacities offered for the `ducted-split-inverter` indoor type in the VRF
 * wizard (16 / 18 / 24 / 30 / 36 / 42 / 48 / 60).
 *
 * Gas pipe, DC fan-motor input, coil rows and body weight vary by model;
 * liquid (9.52 mm) / drain (DN20) and the wired controller are common.
 */

import type { VRFIndoorSpec, VRFIndoorCommon } from './vrf-indoor';

/** Specs shared by every model in the lineup. */
export const VRF_DUCTED_INVERTER_COMMON: VRFIndoorCommon = {
  powerSupply: "220–240V / 50–60Hz / 1Ph",
  expansionDevice: "Electronic Expansion Valve",
  evaporatorCoil: "Blue Coated Aluminum Fins & IGT Copper Tubes",
  drainPipe: 'DN20 (R3/4")',
  controller: "Wired Controller",
};

/** Capacity classes available for this lineup, ascending. */
export const VRF_DUCTED_INVERTER_CAPACITIES = [16, 18, 24, 30, 36, 42, 48, 60] as const;

const GAS_SMALL = '15.88 mm (5/8")';
const GAS_LARGE = '19.05 mm (3/4")';
const LIQUID = '9.52 mm (3/8")';

const SPECS: Record<number, VRFIndoorSpec> = {
  16: {
    nominalKbtuh: 16,
    modelNumber: "IVHF-00164DH",
    coolingCapacityKW: 4.9,
    coolingCapacityBtuh: 16600,
    heatingCapacityKW: 5.3,
    heatingCapacityBtuh: 17900,
    fanMotorWatts: 245,
    fanMotorWattsLabel: "245",
    airflowCFM: 700,
    coilRows: 3,
    bodyWeightKg: 40,
    gasPipe: GAS_SMALL,
    liquidPipe: LIQUID,
  },
  18: {
    nominalKbtuh: 18,
    modelNumber: "IVHF-00184DH",
    coolingCapacityKW: 5.6,
    coolingCapacityBtuh: 19000,
    heatingCapacityKW: 6.0,
    heatingCapacityBtuh: 20500,
    fanMotorWatts: 245,
    fanMotorWattsLabel: "245",
    airflowCFM: 750,
    coilRows: 3,
    bodyWeightKg: 63,
    gasPipe: GAS_SMALL,
    liquidPipe: LIQUID,
  },
  24: {
    nominalKbtuh: 24,
    modelNumber: "IVHF-00244DH",
    coolingCapacityKW: 7.6,
    coolingCapacityBtuh: 26000,
    heatingCapacityKW: 8.3,
    heatingCapacityBtuh: 28100,
    fanMotorWatts: 245,
    fanMotorWattsLabel: "245",
    airflowCFM: 1000,
    coilRows: 3,
    bodyWeightKg: 63,
    gasPipe: GAS_SMALL,
    liquidPipe: LIQUID,
  },
  30: {
    nominalKbtuh: 30,
    modelNumber: "IVHF-00304DH",
    coolingCapacityKW: 9.4,
    coolingCapacityBtuh: 32000,
    heatingCapacityKW: 10.2,
    heatingCapacityBtuh: 34600,
    fanMotorWatts: 245,
    fanMotorWattsLabel: "245",
    airflowCFM: 1200,
    coilRows: 3,
    bodyWeightKg: 63,
    gasPipe: GAS_SMALL,
    liquidPipe: LIQUID,
  },
  36: {
    nominalKbtuh: 36,
    modelNumber: "IVHF-00364DH",
    coolingCapacityKW: 11.1,
    coolingCapacityBtuh: 38000,
    heatingCapacityKW: 11.9,
    heatingCapacityBtuh: 41000,
    fanMotorWatts: 245,
    fanMotorWattsLabel: "245",
    airflowCFM: 1400,
    coilRows: 3,
    bodyWeightKg: 71,
    gasPipe: GAS_SMALL,
    liquidPipe: LIQUID,
  },
  42: {
    nominalKbtuh: 42,
    modelNumber: "IVHF-00424DH",
    coolingCapacityKW: 12.9,
    coolingCapacityBtuh: 44000,
    heatingCapacityKW: 13.9,
    heatingCapacityBtuh: 47500,
    fanMotorWatts: 375,
    fanMotorWattsLabel: "375",
    airflowCFM: 1600,
    coilRows: 3,
    bodyWeightKg: 71,
    gasPipe: GAS_SMALL,
    liquidPipe: LIQUID,
  },
  48: {
    nominalKbtuh: 48,
    modelNumber: "IVHF-00484DH",
    coolingCapacityKW: 14.7,
    coolingCapacityBtuh: 50000,
    heatingCapacityKW: 15.9,
    heatingCapacityBtuh: 54000,
    fanMotorWatts: 552,
    fanMotorWattsLabel: "552",
    airflowCFM: 1800,
    coilRows: 4,
    bodyWeightKg: 78,
    gasPipe: GAS_LARGE,
    liquidPipe: LIQUID,
  },
  60: {
    nominalKbtuh: 60,
    modelNumber: "IVHF-00604DH",
    coolingCapacityKW: 18.2,
    coolingCapacityBtuh: 62000,
    heatingCapacityKW: 19.7,
    heatingCapacityBtuh: 66900,
    fanMotorWatts: 552,
    fanMotorWattsLabel: "552",
    airflowCFM: 2200,
    coilRows: 4,
    bodyWeightKg: 95,
    gasPipe: GAS_LARGE,
    liquidPipe: LIQUID,
  },
};

/** All specs ascending by capacity — used as the performance-panel table rows. */
export const VRF_DUCTED_INVERTER_SPECS: VRFIndoorSpec[] =
  VRF_DUCTED_INVERTER_CAPACITIES.map((c) => SPECS[c]);

/** Look up the catalogue spec for a marketing capacity class (kBTU/h). */
export function getVRFDuctedInverterSpec(nominalKbtuh: number): VRFIndoorSpec | undefined {
  return SPECS[nominalKbtuh];
}

/** Catalogue model number for a capacity class, or undefined if unlisted. */
export function getVRFDuctedInverterModelNumber(nominalKbtuh: number): string | undefined {
  return SPECS[nominalKbtuh]?.modelNumber;
}
