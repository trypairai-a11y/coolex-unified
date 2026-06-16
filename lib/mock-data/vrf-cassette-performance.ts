/**
 * VRF Indoor — Cassette (ICEF) catalogue.
 *
 * Transcribed from the COOLEX ceiling-cassette indoor performance table. Flat
 * spec table keyed by the marketing capacity class (kBTU/h), aligned with the
 * capacities offered for the `cassette` indoor type in the VRF wizard
 * (18 / 24 / 36 / 48).
 *
 * Gas AND liquid pipe diameters and coil rows vary by model (12.70 / 6.35 mm,
 * 2-row on the small sizes; 15.88 / 9.52 mm, 3-row on the large), so those live
 * on each spec. The catalogue lists only the decorative-panel weight (Net 5.5 /
 * Gross 8.0 kg, common to all sizes) — the unit body weight is not published in
 * this sheet — so there is no per-model body weight here.
 */

import type { VRFIndoorSpec, VRFIndoorCommon } from './vrf-indoor';

/** Specs shared by every model in the lineup. */
export const VRF_CASSETTE_COMMON: VRFIndoorCommon = {
  powerSupply: "220–240V / 50–60Hz / 1Ph",
  expansionDevice: "Electronic Expansion Valve",
  evaporatorCoil: "Blue Coated Aluminum Fins & IGT Copper Tubes",
  drainPipe: 'DN20 (R3/4")',
  controller: "Remote Controller",
  panelNetKg: 5.5,
  panelGrossKg: 8.0,
};

/** Capacity classes available for this lineup, ascending. */
export const VRF_CASSETTE_CAPACITIES = [18, 24, 36, 48] as const;

const GAS_SMALL = '12.70 mm (1/2")';
const GAS_LARGE = '15.88 mm (5/8")';
const LIQUID_SMALL = '6.35 mm (1/4")';
const LIQUID_LARGE = '9.52 mm (3/8")';

const SPECS: Record<number, VRFIndoorSpec> = {
  18: {
    nominalKbtuh: 18,
    modelNumber: "ICEF-00184DH",
    coolingCapacityKW: 5.3,
    coolingCapacityBtuh: 18000,
    heatingCapacityKW: 5.7,
    heatingCapacityBtuh: 19400,
    fanMotorWatts: 60,
    fanMotorWattsLabel: "60",
    airflowCFM: 720,
    coilRows: 2,
    gasPipe: GAS_SMALL,
    liquidPipe: LIQUID_SMALL,
  },
  24: {
    nominalKbtuh: 24,
    modelNumber: "ICEF-00244DH",
    coolingCapacityKW: 6.4,
    coolingCapacityBtuh: 24000,
    heatingCapacityKW: 7.6,
    heatingCapacityBtuh: 25900,
    fanMotorWatts: 60,
    fanMotorWattsLabel: "60",
    airflowCFM: 750,
    coilRows: 2,
    gasPipe: GAS_SMALL,
    liquidPipe: LIQUID_SMALL,
  },
  36: {
    nominalKbtuh: 36,
    modelNumber: "ICEF-00364DH",
    coolingCapacityKW: 10.6,
    coolingCapacityBtuh: 36000,
    heatingCapacityKW: 11.4,
    heatingCapacityBtuh: 38900,
    fanMotorWatts: 95,
    fanMotorWattsLabel: "95",
    airflowCFM: 1280,
    coilRows: 3,
    gasPipe: GAS_LARGE,
    liquidPipe: LIQUID_LARGE,
  },
  48: {
    nominalKbtuh: 48,
    modelNumber: "ICEF-00484DH",
    coolingCapacityKW: 14.1,
    coolingCapacityBtuh: 48000,
    heatingCapacityKW: 15.2,
    heatingCapacityBtuh: 51800,
    fanMotorWatts: 95,
    fanMotorWattsLabel: "95",
    airflowCFM: 1280,
    coilRows: 3,
    gasPipe: GAS_LARGE,
    liquidPipe: LIQUID_LARGE,
  },
};

/** All specs ascending by capacity — used as the performance-panel table rows. */
export const VRF_CASSETTE_SPECS: VRFIndoorSpec[] =
  VRF_CASSETTE_CAPACITIES.map((c) => SPECS[c]);

/** Look up the catalogue spec for a marketing capacity class (kBTU/h). */
export function getVRFCassetteSpec(nominalKbtuh: number): VRFIndoorSpec | undefined {
  return SPECS[nominalKbtuh];
}

/** Catalogue model number for a capacity class, or undefined if unlisted. */
export function getVRFCassetteModelNumber(nominalKbtuh: number): string | undefined {
  return SPECS[nominalKbtuh]?.modelNumber;
}
