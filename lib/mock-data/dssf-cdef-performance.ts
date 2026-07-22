import type { Model } from '@/types/product';

/**
 * DSSF-CDEF ducted split system performance matrix (R-410A).
 *
 * Hand-transcribed from the COOLEX "DSSF-CDEF Performance Data" catalogue
 * pages. Each catalogue size is a matched outdoor condensing unit (CHCF) + indoor
 * evaporator (CHEF) pair; the model number is the CHCF base (e.g. CHCF-024 ≈
 * 24 000 Btu/h ≈ 2 tons). Indexed by:
 *   • Model                  — CHCF-024 … CHCF-060
 *   • Indoor air flow (CFM)  — 3 rows per model
 *   • Air on evaporator (°F) — entering DB with the WB paired (see DSSF_WB_BY_DB):
 *                                84.2/66.2, 80/67, 74/62, 68/57
 *   • Condenser ambient (°F) — 95, 115, 118.4, 125
 *
 * Each cell stores: Total Capacity (Btu/h), Sensible Capacity (Btu/h) and
 * compressor + fan power kW Input.
 *
 * RATING BASIS: nominal capacities are quoted at 80/67 °F entering air and
 * 95 °F condenser ambient.
 *
 * Catalogue model designations (outdoor / indoor):
 *   CHCF-024 A7 / CHEF-024 A7   CHCF-030 A7 / CHEF-030 A7
 *   CHCF-036 A2 / CHEF-036 A7   CHCF-042 A2 / CHEF-042 A7
 *   CHCF-048 A2 / CHEF-048 A7   CHCF-060 A2 / CHEF-060 A7
 *
 * ──────────────────────────────────────────────────────────────────────────
 * NOTE ON SENSIBLE CAPACITY: the four entering-air conditions do NOT have a
 * monotonic wet-bulb (84.2 °F DB pairs with 66.2 °F WB, but 80 °F DB pairs with
 * the HIGHER 67 °F WB). Because a higher WB means more latent load, the 80/67
 * row legitimately shows a LOWER sensible than its DB neighbours. This is the
 * printed catalogue behaviour, not a transcription error — do not "correct" it.
 *
 * Total capacity and kW Input behave conventionally:
 *   • Total / Sensible / kW INCREASE as airflow (CFM) rises.
 *   • Total DECREASES and kW INCREASES as condenser ambient rises (95 → 125 °F).
 *
 * DATA CONFIDENCE: hand-transcribed from dense catalogue screenshots. Verify
 * against the printed catalogue before using for a real quotation.
 * ──────────────────────────────────────────────────────────────────────────
 */

export const DSSF_AMBIENT_F = [95, 115, 118.4, 125] as const;

/** Wet-bulb paired with each tabulated entering dry-bulb (°F). */
export const DSSF_WB_BY_DB: Record<number, number> = { 84.2: 66.2, 80: 67, 74: 62, 68: 57 };

/** Entering dry-bulb axis (°F), ascending — for interpolation. */
export const DSSF_EDB_F = [68, 74, 80, 84.2] as const;

/** Catalogue footnote shown beneath the DSSF-CDEF performance table. */
export const DSSF_RATING_NOTE =
  "Capacities are based on the entering air condition shown (DB/WB) and the listed condenser ambient. Nominal rating: 80/67 °F entering air, 95 °F ambient. Outdoor CHCF + indoor CHEF matched pair.";

// NOTE: the DSSF-CDEF performance data was placeholder/dummy and has been
// removed. The DSSF / CDEF series card is retained but produces no selection
// results until real catalogue data is supplied here (and in RAW below).

/** Indoor airflow rows available per model (3 each), as the panel's Y axis. */
export const DSSF_CFM_BY_MODEL: Record<string, number[]> = {};

/** Full catalogue designation (outdoor / indoor) for each base model. */
export const DSSF_DESIGNATION: Record<string, string> = {};

export interface DSSFPerfPoint {
  totalCapacityBtuh: number;
  sensibleCapacityBtuh: number;
  kwInput: number;
}

// Compact source form: [total, sensible, kW] in ambient order 95 → 115 → 118.4 → 125.
type Cell = [number, number, number];
type EdbRow = Record<number, Cell[]>; // entering-DB -> 4 cells (one per ambient)
type CfmRow = Record<number, EdbRow>; // cfm -> EdbRow
type RawTable = Record<string, CfmRow>; // model base -> CfmRow

const RAW: RawTable = {};

// ── Legacy model-number aliasing ─────────────────────────────────────────────
// Before this catalogue was wired in, split-ds used generated placeholder models
// numbered CDS#### (tons × 10, e.g. CDS0020 = 2 T). Saved projects/units may
// still carry those snapshots, so map a stale CDS#### number to the nearest
// CHCF model by nominal tonnage (out-of-range sizes clamp to the closest end).
const CHCF_TONS: Record<string, number> = {
  'CHCF-024': 2, 'CHCF-030': 2.5, 'CHCF-036': 3,
  'CHCF-042': 3.5, 'CHCF-048': 4, 'CHCF-060': 5,
};

/** Resolve a model number to a known CHCF base, aliasing legacy CDS#### sizes. */
export function normalizeDSSFModel(modelNumber: string): string {
  if (modelNumber in RAW) return modelNumber;
  const m = /^CDS0*(\d+)$/.exec(modelNumber);
  if (!m) return modelNumber;
  const tons = Number(m[1]) / 10;
  let best = modelNumber;
  let bestDiff = Infinity;
  for (const [base, t] of Object.entries(CHCF_TONS)) {
    const d = Math.abs(t - tons);
    if (d < bestDiff) {
      bestDiff = d;
      best = base;
    }
  }
  return best;
}

// ── Lookup / interpolation ──────────────────────────────────────────────────

function cellToPoint(c: Cell): DSSFPerfPoint {
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

/** Interpolate a single (cfm, edb) cell-array down to one ambient-indexed point. */
function pointAt(edbRow: EdbRow, edbF: number, ambIdx: number): DSSFPerfPoint | undefined {
  const { lo, hi, t } = bracket(edbF, DSSF_EDB_F);
  const cLo = edbRow[lo]?.[ambIdx];
  const cHi = edbRow[hi]?.[ambIdx];
  if (!cLo || !cHi) return undefined;
  const pLo = cellToPoint(cLo);
  const pHi = cellToPoint(cHi);
  return {
    totalCapacityBtuh: lerp(pLo.totalCapacityBtuh, pHi.totalCapacityBtuh, t),
    sensibleCapacityBtuh: lerp(pLo.sensibleCapacityBtuh, pHi.sensibleCapacityBtuh, t),
    kwInput: lerp(pLo.kwInput, pHi.kwInput, t),
  };
}

/** Is this a known DSSF-CDEF (CHCF) model number — including legacy CDS aliases? */
export function isDSSFModel(modelNumber: string): boolean {
  return normalizeDSSFModel(modelNumber) in RAW;
}

/**
 * Trilinear DSSF-CDEF performance lookup on (airflow CFM × entering air DB °F ×
 * condenser ambient °F). Values outside the tabulated ranges clamp to the
 * nearest edge.
 */
export function getDSSFPerformance(
  modelNumber: string,
  cfm: number,
  edbF: number,
  ambientF: number,
): DSSFPerfPoint | undefined {
  const cfmRow = RAW[normalizeDSSFModel(modelNumber)];
  if (!cfmRow) return undefined;

  const cfms = Object.keys(cfmRow).map(Number);
  const { lo: cfmLo, hi: cfmHi, t: tC } = bracket(cfm, cfms);
  const { lo: ambLo, hi: ambHi, t: tA } = bracket(ambientF, DSSF_AMBIENT_F);
  const iLo = DSSF_AMBIENT_F.indexOf(ambLo as (typeof DSSF_AMBIENT_F)[number]);
  const iHi = DSSF_AMBIENT_F.indexOf(ambHi as (typeof DSSF_AMBIENT_F)[number]);

  const rowLo = cfmRow[cfmLo];
  const rowHi = cfmRow[cfmHi];
  if (!rowLo || !rowHi || iLo < 0 || iHi < 0) return undefined;

  // Resolve the four (cfm × ambient) corners, each already edb-interpolated.
  const p00lo = pointAt(rowLo, edbF, iLo);
  const p00hi = pointAt(rowLo, edbF, iHi);
  const p10lo = pointAt(rowHi, edbF, iLo);
  const p10hi = pointAt(rowHi, edbF, iHi);
  if (!p00lo || !p00hi || !p10lo || !p10hi) return undefined;

  const blend = (k: keyof DSSFPerfPoint) => {
    const lo = lerp(p00lo[k], p00hi[k], tA);
    const hi = lerp(p10lo[k], p10hi[k], tA);
    return lerp(lo, hi, tC);
  };

  return {
    totalCapacityBtuh: blend('totalCapacityBtuh'),
    sensibleCapacityBtuh: blend('sensibleCapacityBtuh'),
    kwInput: blend('kwInput'),
  };
}

/**
 * Build the 2D panel matrix (CFM × condenser-ambient) at a fixed entering DB,
 * interpolating the DB axis. Used by the performance panel.
 */
export function getDSSFMatrix(
  modelNumber: string,
  edbF: number,
): Record<string, Record<string, DSSFPerfPoint>> | null {
  const cfmRow = RAW[normalizeDSSFModel(modelNumber)];
  if (!cfmRow) return null;

  const out: Record<string, Record<string, DSSFPerfPoint>> = {};
  for (const cfm of Object.keys(cfmRow).map(Number)) {
    out[cfm] = {};
    DSSF_AMBIENT_F.forEach((amb, i) => {
      const p = pointAt(cfmRow[cfm], edbF, i);
      if (p) out[cfm][String(amb)] = p;
    });
  }
  return out;
}

/** CFM rows for a given DSSF model number (used as the panel's Y axis). */
export function getDSSFCfmRows(modelNumber: string): number[] {
  return DSSF_CFM_BY_MODEL[normalizeDSSFModel(modelNumber)] ?? [];
}

// Re-export raw table for any validator (not used by the app at runtime).
export const __RAW = RAW;

export type { Model };
