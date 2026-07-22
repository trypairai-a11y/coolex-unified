import type { Model } from '@/types/product';

/**
 * PNGF (RPUF-series) air-cooled packaged DX unit performance matrix.
 *
 * ⚠️ DATA REMOVED: the RPUF performance figures were placeholder/dummy and have
 * been stripped (RAW_PNGF and PNGF_CFM_BY_MODEL are now empty). The lookup
 * machinery below is retained so real catalogue data can be dropped back in.
 * Until then the RPUF series card shows a "performance data coming soon" state.
 *
 * Transcribed from the COOLEX "RPUF Performance Data" catalogue pages
 * (models PNGF-048C2 … PNGF-350C2). Unlike the fresh-air FAPU units — where the
 * entering air IS the outdoor air — these are return-air packaged units, so the
 * indoor entering condition and the outdoor condenser ambient are INDEPENDENT
 * axes. Each model is therefore a 3-axis matrix:
 *   • Indoor air flow (CFM)             — 3 rows per model
 *   • Entering (indoor) air DB/WB (°F)  — 4 rows: 84.2/66.2, 80/67, 74/62, 68/57
 *   • Condenser ambient temp (°F)       — 4 cols: 95, 115, 118.4, 125
 *
 * Each cell stores: Total Capacity (Btu/h), Sensible Capacity (Btu/h) and
 * compressor + fan power kW Input.
 *
 * RATING BASIS: nominal capacities are quoted at 80/67 °F entering air and
 * 95 °F condenser ambient (the standard column). The entering-DB axis is keyed
 * by dry-bulb (WB tracks it per the table); the design lookup interpolates on
 * entering DB and condenser ambient independently.
 *
 * ──────────────────────────────────────────────────────────────────────────
 * DATA CONFIDENCE: hand-transcribed (per-image) from catalogue screenshots and
 * passed through scripts/gen-pngf.mjs, which validates: sensible ≤ total,
 * total ↓ & kW ↑ as ambient rises, and capacity ↑ with airflow. A few dense
 * cells on the largest models were near the legibility limit — verify against
 * the printed catalogue before using for a real quotation. Two known source
 * print glitches were normalised: PNGF-240C2 7302/84.2 @125 sensible
 * ("2077,28" → 207728) and a PNGF-350C2 118.4 total ("32,2791" → 322791).
 * ──────────────────────────────────────────────────────────────────────────
 */

export const PNGF_ENTERING_DB_F = [84.2, 80, 74, 68] as const;
export const PNGF_AMBIENT_F = [95, 115, 118.4, 125] as const;

/** Entering wet-bulb (°F) that pairs with each entering dry-bulb row. */
export const PNGF_WB_BY_DB: Record<string, number> = {
  '84.2': 66.2, '80': 67, '74': 62, '68': 57,
};

/** Catalogue footnote shown beneath the PNGF performance table. */
export const PNGF_RATING_NOTE =
  'Cooling capacities are based on 80/67 °F entering (indoor) air and 95 °F condenser ambient.';

// Indoor airflow rows available per model (3 each).
// NOTE: the RPUF performance data was placeholder/dummy and has been removed.
// The RPUF series card is retained but produces no selection results until real
// catalogue data is supplied here (and in RAW_PNGF below).
export const PNGF_CFM_BY_MODEL: Record<string, number[]> = {};

export interface PNGFPerfPoint {
  totalCapacityBtuh: number;
  sensibleCapacityBtuh: number;
  kwInput: number;
}

// Compact source form: [total, sensible, kW]. Each entering-DB key holds 4
// ambient cells in PNGF_AMBIENT_F order (95 → 115 → 118.4 → 125).
type Cell = [number, number, number];
type DbRows = Record<string, Cell[]>;   // dbKey -> 4 ambient cells
type CfmTable = Record<number, DbRows>; // cfm -> DbRows
type RawTable = Record<string, CfmTable>;

const RAW_PNGF: RawTable = {};

// ── Lookup / interpolation ──────────────────────────────────────────────────

function cellToPoint(c: Cell): PNGFPerfPoint {
  return { totalCapacityBtuh: c[0], sensibleCapacityBtuh: c[1], kwInput: c[2] };
}

function bracket(target: number, options: readonly number[]): { lo: number; hi: number; t: number } {
  const sorted = [...options].sort((a, b) => a - b);
  if (target <= sorted[0]) return { lo: sorted[0], hi: sorted[0], t: 0 };
  const last = sorted[sorted.length - 1];
  if (target >= last) return { lo: last, hi: last, t: 0 };
  for (let i = 0; i < sorted.length - 1; i++) {
    if (target >= sorted[i] && target <= sorted[i + 1]) {
      const lo = sorted[i];
      const hi = sorted[i + 1];
      return { lo, hi, t: hi === lo ? 0 : (target - lo) / (hi - lo) };
    }
  }
  return { lo: sorted[0], hi: sorted[0], t: 0 };
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Trilinear PNGF performance lookup on airflow (CFM) × entering-air DB (°F) ×
 * condenser ambient (°F). Values outside the tabulated ranges clamp to the
 * nearest edge.
 */
export function getPNGFPerformance(
  modelNumber: string,
  cfm: number,
  enteringDbF: number,
  ambientF: number,
): PNGFPerfPoint | undefined {
  const cfmTable = RAW_PNGF[modelNumber];
  if (!cfmTable) return undefined;

  const cfms = Object.keys(cfmTable).map(Number);
  const { lo: cfmLo, hi: cfmHi, t: tC } = bracket(cfm, cfms);
  const { lo: dbLo, hi: dbHi, t: tD } = bracket(enteringDbF, PNGF_ENTERING_DB_F);
  const { lo: ambLo, hi: ambHi, t: tA } = bracket(ambientF, PNGF_AMBIENT_F);

  const iAmbLo = PNGF_AMBIENT_F.indexOf(ambLo as (typeof PNGF_AMBIENT_F)[number]);
  const iAmbHi = PNGF_AMBIENT_F.indexOf(ambHi as (typeof PNGF_AMBIENT_F)[number]);
  if (iAmbLo < 0 || iAmbHi < 0) return undefined;

  // Fetch the 8 corner cells: [cfm][db][ambient].
  const at = (cfmKey: number, dbVal: number, iAmb: number): PNGFPerfPoint | undefined => {
    const dbRows = cfmTable[cfmKey];
    const cells = dbRows?.[String(dbVal)];
    return cells ? cellToPoint(cells[iAmb]) : undefined;
  };

  const c000 = at(cfmLo, dbLo, iAmbLo), c001 = at(cfmLo, dbLo, iAmbHi);
  const c010 = at(cfmLo, dbHi, iAmbLo), c011 = at(cfmLo, dbHi, iAmbHi);
  const c100 = at(cfmHi, dbLo, iAmbLo), c101 = at(cfmHi, dbLo, iAmbHi);
  const c110 = at(cfmHi, dbHi, iAmbLo), c111 = at(cfmHi, dbHi, iAmbHi);
  if (!c000 || !c001 || !c010 || !c011 || !c100 || !c101 || !c110 || !c111) return undefined;

  const blend = (k: keyof PNGFPerfPoint) => {
    // interpolate ambient, then DB, then CFM
    const loCfmLoDb = lerp(c000[k], c001[k], tA);
    const loCfmHiDb = lerp(c010[k], c011[k], tA);
    const hiCfmLoDb = lerp(c100[k], c101[k], tA);
    const hiCfmHiDb = lerp(c110[k], c111[k], tA);
    const loCfm = lerp(loCfmLoDb, loCfmHiDb, tD);
    const hiCfm = lerp(hiCfmLoDb, hiCfmHiDb, tD);
    return lerp(loCfm, hiCfm, tC);
  };

  return {
    totalCapacityBtuh: blend('totalCapacityBtuh'),
    sensibleCapacityBtuh: blend('sensibleCapacityBtuh'),
    kwInput: blend('kwInput'),
  };
}

/** CFM rows for a given PNGF model number (clamps the airflow-basis lookup). */
export function getPNGFCfmRows(modelNumber: string): number[] {
  return PNGF_CFM_BY_MODEL[modelNumber] ?? [];
}

// Re-export raw table for tooling (not used by the app at runtime).
export const __RAW_PNGF = RAW_PNGF;

export type { Model };
