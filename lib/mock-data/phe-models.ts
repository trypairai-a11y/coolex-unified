import type { Model } from '@/types/product';

/**
 * CRAC — PHCF-PHEF Precision Cooling Unit catalogue performance data.
 *
 * SOURCE OF TRUTH: manufacturer "General Data" table (PHEF indoor / PHCF outdoor
 * matched pairs). Cooling and sensible capacities are CATALOGUE-RATED at:
 *
 *     24 °C DB / 19.4 °C WB entering air  AND  48 °C ambient (= T4)
 *
 * The unit operates between 18.3 °C (min) and 55 °C (max) ambient.
 *
 * IMPORTANT — T1 and T3 are NOT catalogue points. Air-cooled DX capacity rises
 * as the outdoor ambient falls (lower condensing temperature), so the cooler T1
 * (35 °C) and T3 (46.1 °C) conditions deliver MORE than the 48 °C / T4 rating.
 * Those columns are CALCULATED from the T4 rating using a linear derating slope
 * (see PHE_AMBIENT_SLOPE_PER_C). Replace with manufacturer correction curves if
 * they are published.
 */

// ── Ambient derating model ──────────────────────────────────────────────────

/** Catalogue rating ambient (°C). The 48 °C column is T4 — the published basis. */
export const PHE_RATING_AMBIENT_C = 48;

/**
 * Linear capacity slope: fraction of the T4 (48 °C) nominal capacity gained or
 * lost per °C of ambient change. ~1.15 %/°C is a standard air-cooled R410A DX
 * figure. Capacity rises below 48 °C and falls above it.
 */
export const PHE_AMBIENT_SLOPE_PER_C = 0.0115;

/**
 * Assumed coefficient of performance at the T4 (48 °C) rating, used only to
 * derive an indicative total input power / EER for the selection engine (the
 * catalogue lists fan motor kW but not compressor input). Replace with measured
 * input power when available.
 */
export const PHE_COP_AT_T4 = 2.9;

const BTUH_PER_KW = 3412.142;
const KW_PER_TON = 3.51685;
const CMH_PER_CFM = 1.69901; // 1 CFM = 1.69901 m³/h
const MM_PER_IN = 25.4;
const LB_PER_KG = 2.20462;

export interface PHEAmbientPoint {
  label: 'T1' | 'T3' | 'T4';
  ambientC: number;
  ambientF: number;
  /** True for the catalogue rating point (T4); the others are calculated. */
  catalogue?: boolean;
}

/** Standard ambient test conditions, aligned with the design-conditions form. */
export const PHE_AMBIENT_POINTS: readonly PHEAmbientPoint[] = [
  { label: 'T1', ambientC: 35.0, ambientF: 95 },
  { label: 'T3', ambientC: 46.11, ambientF: 115 },
  { label: 'T4', ambientC: 48.0, ambientF: 118.4, catalogue: true },
] as const;

/** Capacity correction factor relative to the T4 (48 °C) catalogue rating. */
export function pheCapacityFactor(ambientC: number): number {
  return 1 + PHE_AMBIENT_SLOPE_PER_C * (PHE_RATING_AMBIENT_C - ambientC);
}

// ── Catalogue general data ──────────────────────────────────────────────────

export interface PHECatalogueModel {
  size: '042' | '076' | '130' | '175';
  indoorModel: string;   // PHEF…
  outdoorModel: string;  // PHCF…
  designation: string;   // "PHEF042/PHCF042"
  /** Cooling capacity at 48 °C / T4 (kW). */
  coolingKW: number;
  /** Sensible capacity at 48 °C / T4 (kW). */
  sensibleKW: number;
  powerSupply: string;   // Volt/Phase/Hz
  piping: { suctionMM: number | null; dischargeMM: number | null; liquidMM: number };
  refrigerant: string;
  indoor: {
    blowerType: string;
    blowerQty: number;
    blowerNominalKW: string;
    airflowCMH: number;
    coilType: string;
    coilRows: number;
    coilAreaSqM: number;
    compressorCount: number;
    dimsMM: string;  // H x W x D
  };
  outdoor: {
    condenserFanType: string;
    condenserFanQty: number;
    condenserFanKW: string;
    coilType: string;
    coilRows: number;
    coilAreaSqM: number;
    dimsMM: string;  // H x W x D
    weightKg: number;
  };
}

export const PHE_CATALOGUE: readonly PHECatalogueModel[] = [
  {
    size: '042',
    indoorModel: 'PHEF042',
    outdoorModel: 'PHCF042',
    designation: 'PHEF042/PHCF042',
    coolingKW: 10.5,
    sensibleKW: 7.6,
    powerSupply: '240/1/50',
    piping: { suctionMM: 22.2, dischargeMM: null, liquidMM: 9.5 },
    refrigerant: 'R-410A',
    indoor: {
      blowerType: 'EC Axial',
      blowerQty: 4,
      blowerNominalKW: '4 × 0.083',
      airflowCMH: 4535,
      coilType: 'Enhanced Fins and Tubes',
      coilRows: 3,
      coilAreaSqM: 0.39,
      compressorCount: 1,
      dimsMM: '1990 × 1000 × 400',
    },
    outdoor: {
      condenserFanType: 'Propeller',
      condenserFanQty: 2,
      condenserFanKW: '0.37',
      coilType: 'Enhanced Fins and Tubes',
      coilRows: 2,
      coilAreaSqM: 0.95,
      dimsMM: '1260 × 875 × 335',
      weightKg: 89,
    },
  },
  {
    size: '076',
    indoorModel: 'PHEF076',
    outdoorModel: 'PHCF076',
    designation: 'PHEF076/PHCF076',
    coolingKW: 17.6,
    sensibleKW: 12.7,
    powerSupply: '415/3/50',
    piping: { suctionMM: null, dischargeMM: 12.7, liquidMM: 12.7 },
    refrigerant: 'R-410A',
    indoor: {
      blowerType: 'EC Centrifugal Backward Curve',
      blowerQty: 1,
      blowerNominalKW: '3.35',
      airflowCMH: 6122,
      coilType: 'Enhanced Fins and Tubes',
      coilRows: 2,
      coilAreaSqM: 0.92,
      compressorCount: 1,
      dimsMM: '1990 × 1105 × 900',
    },
    outdoor: {
      condenserFanType: 'Propeller',
      condenserFanQty: 1,
      condenserFanKW: '0.56',
      coilType: 'Enhanced Fins and Tubes',
      coilRows: 2,
      coilAreaSqM: 1.69,
      dimsMM: '900 × 925 × 925',
      weightKg: 163,
    },
  },
  {
    size: '130',
    indoorModel: 'PHEF130',
    outdoorModel: 'PHCF130',
    designation: 'PHEF130/PHCF130',
    coolingKW: 35.2,
    sensibleKW: 25.3,
    powerSupply: '415/3/50',
    piping: { suctionMM: 28.6, dischargeMM: 12.7, liquidMM: 15.8 },
    refrigerant: 'R-410A',
    indoor: {
      blowerType: 'EC Centrifugal Backward Curve',
      blowerQty: 1,
      blowerNominalKW: '3.35',
      airflowCMH: 9507,
      coilType: 'Enhanced Fins and Tubes',
      coilRows: 3,
      coilAreaSqM: 1.23,
      compressorCount: 1,
      dimsMM: '1990 × 1405 × 900',
    },
    outdoor: {
      condenserFanType: 'Propeller',
      condenserFanQty: 2,
      condenserFanKW: '2 × 0.56',
      coilType: 'Enhanced Fins and Tubes',
      coilRows: 3,
      coilAreaSqM: 2.94,
      dimsMM: '1160 × 1880 × 1100',
      weightKg: 275,
    },
  },
  {
    size: '175',
    indoorModel: 'PHEF175',
    outdoorModel: 'PHCF175',
    designation: 'PHEF175/PHCF175',
    coolingKW: 52.7,
    sensibleKW: 38.0,
    powerSupply: '415/3/50',
    piping: { suctionMM: 34.9, dischargeMM: 15.8, liquidMM: 22.2 },
    refrigerant: 'R-410A',
    indoor: {
      blowerType: 'EC Centrifugal Backward Curve',
      blowerQty: 2,
      blowerNominalKW: '2 × 3.35',
      airflowCMH: 14815,
      coilType: 'Enhanced Fins and Tubes',
      coilRows: 3,
      coilAreaSqM: 1.82,
      compressorCount: 2,
      dimsMM: '1990 × 2065 × 900',
    },
    outdoor: {
      condenserFanType: 'Propeller',
      condenserFanQty: 2,
      condenserFanKW: '2 × 1.2',
      coilType: 'Enhanced Fins and Tubes',
      coilRows: 2,
      coilAreaSqM: 3.59,
      dimsMM: '1155 × 2185 × 1230',
      weightKg: 550,
    },
  },
] as const;

// ── Per-ambient performance (for the performance panel) ─────────────────────

export interface PHEPerfRow {
  label: 'T1' | 'T3' | 'T4';
  ambientC: number;
  ambientF: number;
  catalogue: boolean;
  coolingKW: number;
  sensibleKW: number;
  /** % of capacity relative to the T4 catalogue rating. */
  factor: number;
}

/** Cooling/sensible at each ambient point, derived from the T4 rating + slope. */
export function getPHEAmbientPerformance(spec: PHECatalogueModel): PHEPerfRow[] {
  return PHE_AMBIENT_POINTS.map((pt) => {
    const factor = pheCapacityFactor(pt.ambientC);
    return {
      label: pt.label,
      ambientC: pt.ambientC,
      ambientF: pt.ambientF,
      catalogue: pt.catalogue === true,
      coolingKW: Math.round(spec.coolingKW * factor * 10) / 10,
      sensibleKW: Math.round(spec.sensibleKW * factor * 10) / 10,
      factor,
    };
  });
}

// ── Selection-engine models (rated at T4 / 48 °C) ───────────────────────────

const dimsToInches = (dimsMM: string) => {
  const [h, w, d] = dimsMM.split('×').map((s) => Number(s.trim()));
  return {
    heightIn: Math.round(h / MM_PER_IN),
    widthIn: Math.round(w / MM_PER_IN),
    lengthIn: Math.round(d / MM_PER_IN),
  };
};

function buildPHEModels(): Model[] {
  return PHE_CATALOGUE.map((spec) => {
    // Nominal figures are the catalogue 48 °C / T4 rating; the selection engine
    // scales them up for cooler ambient via applyPHEDesignPoint (slope above).
    const totalCapacityBtuh = Math.round(spec.coolingKW * BTUH_PER_KW);
    const sensibleCapacityBtuh = Math.round(spec.sensibleKW * BTUH_PER_KW);
    const powerKW = Math.round((spec.coolingKW / PHE_COP_AT_T4) * 10) / 10;
    const eer = Math.round((totalCapacityBtuh / (powerKW * 1000)) * 100) / 100;
    const { heightIn, widthIn, lengthIn } = dimsToInches(spec.indoor.dimsMM);

    // T1 (35 °C) and T3 (46.1 °C) cooling capacities for quick reference on the
    // model (Btu/h), computed from the same ambient slope as the panel.
    const tF = (ambientC: number) =>
      Math.round(spec.coolingKW * pheCapacityFactor(ambientC) * BTUH_PER_KW);

    return {
      id: `phe-${spec.indoorModel}`,
      seriesId: 'phe',
      modelNumber: spec.indoorModel,
      modelDesignation: spec.designation,
      totalCapacityBtuh,
      sensibleCapacityBtuh,
      powerKW,
      eer,
      airflowCFM: Math.round(spec.indoor.airflowCMH / CMH_PER_CFM),
      leavingDBF: 55,
      leavingWBF: 53,
      compressorCount: spec.indoor.compressorCount,
      matchPercent: 0,
      nominalTons: Math.round((spec.coolingKW / KW_PER_TON) * 100) / 100,
      weightLbs: Math.round(spec.outdoor.weightKg * LB_PER_KG),
      lengthIn,
      widthIn,
      heightIn,
      refrigerant: spec.refrigerant,
      compressorType: 'Hermetically Sealed',
      operatingWeight_kg: spec.outdoor.weightKg,
      outdoorWeight_kg: spec.outdoor.weightKg,
      capacity_at95F: tF(35.0),    // T1
      capacity_at115F: tF(46.11),  // T3
    } satisfies Model;
  });
}

export const PHE_MODELS: Model[] = buildPHEModels();

/** Look up the catalogue spec backing a selection model (by indoor model no.). */
export function getPHECatalogue(modelNumber: string): PHECatalogueModel | undefined {
  return PHE_CATALOGUE.find((s) => s.indoorModel === modelNumber);
}
