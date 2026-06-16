/**
 * VRF Indoor — Ducted Split, LOW STATIC (Ceiling Concealed) catalogue.
 *
 * Transcribed from the COOLEX "CEILING CONCEALED SPECIFICATIONS — LOW STATIC"
 * performance table for the IVLF ducted-split indoor units. Unlike the chilled-
 * water / packaged series there is no thermal matrix here: each model has a
 * single rated point, so this file is a flat spec table keyed by the marketing
 * capacity class (kBTU/h) — which lines up with the capacities offered for the
 * `ducted-split-low-static` indoor type in the VRF wizard (18 / 24 / 30 / 36).
 *
 * Cooling capacity is the rated total; the catalogue does not break out sensible
 * capacity, so the model builder derives it with the type's sensible ratio.
 * The fan motor is the indoor DC fan only — the compressor lives in the VRF
 * outdoor unit, so there is no per-indoor compressor power.
 */

export interface VRFDuctedLowStaticSpec {
  /** Marketing capacity class (kBTU/h) — matches the wizard capacity selector. */
  nominalKbtuh: number;
  /** Catalogue model number, e.g. IVLF-00184DH. */
  modelNumber: string;
  coolingCapacityKW: number;
  coolingCapacityBtuh: number;
  heatingCapacityKW: number;
  heatingCapacityBtuh: number;
  /** High-speed DC fan motor input (W). */
  fanMotorWatts: number;
  /** As printed in the catalogue ("90" or "50/90" for two-speed motors). */
  fanMotorWattsLabel: string;
  airflowCFM: number;
  coilRows: number;
  bodyWeightKg: number;
  /** Connecting gas pipe diameter (per model). */
  gasPipe: string;
  /** Connecting liquid pipe diameter (per model). */
  liquidPipe: string;
}

/** Specs shared by every model in the lineup (single value across all sizes). */
export const VRF_DUCTED_LOW_STATIC_COMMON = {
  powerSupply: "220–240V / 50–60Hz / 1Ph",
  expansionDevice: "Electronic Expansion Valve",
  evaporatorCoil: "Blue Coated Aluminum Fins & IGT Copper Tubes",
  drainPipe: 'DN20 (R3/4")',
  controller: "Wired Controller",
} as const;

const GAS_PIPE = '15.88 mm (5/8")';
const LIQUID_PIPE = '9.52 mm (3/8")';

/** Capacity classes available for this lineup, ascending. */
export const VRF_DUCTED_LOW_STATIC_CAPACITIES = [18, 24, 30, 36] as const;

const SPECS: Record<number, VRFDuctedLowStaticSpec> = {
  18: {
    nominalKbtuh: 18,
    modelNumber: "IVLF-00184DH",
    coolingCapacityKW: 5.0,
    coolingCapacityBtuh: 17000,
    heatingCapacityKW: 5.4,
    heatingCapacityBtuh: 18400,
    fanMotorWatts: 90,
    fanMotorWattsLabel: "90",
    airflowCFM: 550,
    coilRows: 3,
    bodyWeightKg: 20,
    gasPipe: GAS_PIPE,
    liquidPipe: LIQUID_PIPE,
  },
  24: {
    nominalKbtuh: 24,
    modelNumber: "IVLF-00244DH",
    coolingCapacityKW: 6.7,
    coolingCapacityBtuh: 23000,
    heatingCapacityKW: 7.3,
    heatingCapacityBtuh: 24800,
    fanMotorWatts: 90,
    fanMotorWattsLabel: "90",
    airflowCFM: 750,
    coilRows: 3,
    bodyWeightKg: 20,
    gasPipe: GAS_PIPE,
    liquidPipe: LIQUID_PIPE,
  },
  30: {
    nominalKbtuh: 30,
    modelNumber: "IVLF-00304DH",
    coolingCapacityKW: 8.5,
    coolingCapacityBtuh: 29000,
    heatingCapacityKW: 9.2,
    heatingCapacityBtuh: 31300,
    fanMotorWatts: 90,
    fanMotorWattsLabel: "50/90",
    airflowCFM: 950,
    coilRows: 3,
    bodyWeightKg: 33,
    gasPipe: GAS_PIPE,
    liquidPipe: LIQUID_PIPE,
  },
  36: {
    nominalKbtuh: 36,
    modelNumber: "IVLF-00364DH",
    coolingCapacityKW: 10.3,
    coolingCapacityBtuh: 35000,
    heatingCapacityKW: 11.1,
    heatingCapacityBtuh: 37800,
    fanMotorWatts: 90,
    fanMotorWattsLabel: "50/90",
    airflowCFM: 1100,
    coilRows: 3,
    bodyWeightKg: 33,
    gasPipe: GAS_PIPE,
    liquidPipe: LIQUID_PIPE,
  },
};

/** All specs ascending by capacity — used as the performance-panel table rows. */
export const VRF_DUCTED_LOW_STATIC_SPECS: VRFDuctedLowStaticSpec[] =
  VRF_DUCTED_LOW_STATIC_CAPACITIES.map((c) => SPECS[c]);

/** Look up the catalogue spec for a marketing capacity class (kBTU/h). */
export function getVRFDuctedLowStaticSpec(
  nominalKbtuh: number,
): VRFDuctedLowStaticSpec | undefined {
  return SPECS[nominalKbtuh];
}

/** Catalogue model number for a capacity class, or undefined if unlisted. */
export function getVRFDuctedLowStaticModelNumber(
  nominalKbtuh: number,
): string | undefined {
  return SPECS[nominalKbtuh]?.modelNumber;
}
