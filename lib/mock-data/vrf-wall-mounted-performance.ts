/**
 * VRF Indoor — Wall Mounted (IWEF) catalogue.
 *
 * Transcribed from the COOLEX wall-mounted indoor performance table. Like the
 * other indoor types this is a flat spec table keyed by the marketing capacity
 * class (kBTU/h), aligned with the capacities offered for the `wall-mounted`
 * indoor type in the VRF wizard (12 / 18 / 24 / 30).
 *
 * Unlike the low-static lineup, gas-pipe diameter and coil rows vary by model
 * (12.70 mm / 2-row on the small sizes, 15.88 mm / 3-row on the large), so those
 * live on each spec; liquid/drain/controller are common. Cooling is the rated
 * total — sensible is derived by the model builder from the type's ratio.
 */

export interface VRFWallMountedSpec {
  /** Marketing capacity class (kBTU/h) — matches the wizard capacity selector. */
  nominalKbtuh: number;
  /** Catalogue model number, e.g. IWEF-00124DH. */
  modelNumber: string;
  coolingCapacityKW: number;
  coolingCapacityBtuh: number;
  heatingCapacityKW: number;
  heatingCapacityBtuh: number;
  /** Indoor fan motor input (W). */
  fanMotorWatts: number;
  /** As printed in the catalogue. */
  fanMotorWattsLabel: string;
  airflowCFM: number;
  coilRows: number;
  bodyWeightKg: number;
  /** Connecting gas pipe diameter (per model). */
  gasPipe: string;
  /** Connecting liquid pipe diameter (per model). */
  liquidPipe: string;
}

/** Specs shared by every model in the lineup. */
export const VRF_WALL_MOUNTED_COMMON = {
  powerSupply: "220–240V / 50–60Hz / 1Ph",
  expansionDevice: "Electronic Expansion Valve",
  evaporatorCoil: "Blue Coated Aluminum Fins & IGT Copper Tubes",
  drainPipe: 'DN20 (R3/4")',
  controller: "Remote Controller",
} as const;

/** Capacity classes available for this lineup, ascending. */
export const VRF_WALL_MOUNTED_CAPACITIES = [12, 18, 24, 30] as const;

const GAS_SMALL = '12.70 mm (1/2")';
const GAS_LARGE = '15.88 mm (5/8")';
const LIQUID_PIPE = '6.35 mm (1/4")';

const SPECS: Record<number, VRFWallMountedSpec> = {
  12: {
    nominalKbtuh: 12,
    modelNumber: "IWEF-00124DH",
    coolingCapacityKW: 3.5,
    coolingCapacityBtuh: 12000,
    heatingCapacityKW: 3.8,
    heatingCapacityBtuh: 12900,
    fanMotorWatts: 30,
    fanMotorWattsLabel: "30",
    airflowCFM: 470,
    coilRows: 2,
    bodyWeightKg: 9.3,
    gasPipe: GAS_SMALL,
    liquidPipe: LIQUID_PIPE,
  },
  18: {
    nominalKbtuh: 18,
    modelNumber: "IWEF-00184DH",
    coolingCapacityKW: 5.3,
    coolingCapacityBtuh: 18000,
    heatingCapacityKW: 5.7,
    heatingCapacityBtuh: 19400,
    fanMotorWatts: 30,
    fanMotorWattsLabel: "30",
    airflowCFM: 650,
    coilRows: 2,
    bodyWeightKg: 11.0,
    gasPipe: GAS_SMALL,
    liquidPipe: LIQUID_PIPE,
  },
  24: {
    nominalKbtuh: 24,
    modelNumber: "IWEF-00244DH",
    coolingCapacityKW: 7.0,
    coolingCapacityBtuh: 24000,
    heatingCapacityKW: 7.6,
    heatingCapacityBtuh: 25900,
    fanMotorWatts: 57,
    fanMotorWattsLabel: "57",
    airflowCFM: 800,
    coilRows: 3,
    bodyWeightKg: 13.8,
    gasPipe: GAS_LARGE,
    liquidPipe: LIQUID_PIPE,
  },
  30: {
    nominalKbtuh: 30,
    modelNumber: "IWEF-00304DH",
    coolingCapacityKW: 8.8,
    coolingCapacityBtuh: 30000,
    heatingCapacityKW: 9.5,
    heatingCapacityBtuh: 32400,
    fanMotorWatts: 57,
    fanMotorWattsLabel: "57",
    airflowCFM: 800,
    coilRows: 3,
    bodyWeightKg: 14.2,
    gasPipe: GAS_LARGE,
    liquidPipe: LIQUID_PIPE,
  },
};

/** All specs ascending by capacity — used as the performance-panel table rows. */
export const VRF_WALL_MOUNTED_SPECS: VRFWallMountedSpec[] =
  VRF_WALL_MOUNTED_CAPACITIES.map((c) => SPECS[c]);

/** Look up the catalogue spec for a marketing capacity class (kBTU/h). */
export function getVRFWallMountedSpec(
  nominalKbtuh: number,
): VRFWallMountedSpec | undefined {
  return SPECS[nominalKbtuh];
}

/** Catalogue model number for a capacity class, or undefined if unlisted. */
export function getVRFWallMountedModelNumber(
  nominalKbtuh: number,
): string | undefined {
  return SPECS[nominalKbtuh]?.modelNumber;
}
