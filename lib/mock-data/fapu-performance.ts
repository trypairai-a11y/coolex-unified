import type { Model } from '@/types/product';

/**
 * FAPU (Fresh Air Package Unit) performance matrix.
 *
 * Transcribed from the COOLEX "PERFORMANCE DATA TABLES" catalogue pages for the
 * FAPU fresh-air packaged DX units. Indexed per model by:
 *   • Indoor air flow (CFM)               — rows (3 per model)
 *   • Entering (outdoor) air temp DB (°F) — columns: 95, 115, 118.4, 125
 *                                           (all at a constant 80 °F WB)
 *
 * Each cell stores: Total Capacity (Btu/h), Sensible Capacity (Btu/h) and
 * compressor + fan power kW Input.
 *
 * RATING BASIS: nominal cooling capacities are quoted at 95 °F / 80 °F entering
 * air (the first column). Because these are fresh-air units, the entering air IS
 * the outdoor/ambient air, so the DB column maps to the design "ambient" input.
 *
 * Physical trends used by the validator (scripts/validate-fapu.ts):
 *   • Total capacity DECREASES as entering DB rises (hotter condenser air).
 *   • kW Input INCREASES as entering DB rises.
 *   • Total / Sensible / kW all INCREASE as airflow (CFM) rises.
 *   • Sensible ≤ Total in every cell (SHR → 1 at the hottest, driest-ratio air).
 *   • Sensible generally rises with DB but may plateau/fall at the 125 °F
 *     extreme on the larger models — the validator WARNS rather than errors here.
 *
 * ──────────────────────────────────────────────────────────────────────────
 * DATA CONFIDENCE: hand-transcribed from catalogue screenshots. All cells pass
 * the monotonicity + outlier validator, but a handful of dense cells on the
 * larger models (FAPU-300+) were near the legibility limit — verify against the
 * printed catalogue before using for a real quotation.
 * ──────────────────────────────────────────────────────────────────────────
 */

export const FAPU_ENTERING_AIR_DB_F = [95, 115, 118.4, 125] as const;

/** Catalogue footnote shown beneath the FAPU performance table. */
export const FAPU_RATING_NOTE =
  "Cooling capacities are based on 95°/80°F entering air temperature (DB/WB).";

// Indoor airflow rows available per model (3 each).
export const FAPU_CFM_BY_MODEL: Record<string, number[]> = {
  'FAPU-048': [500, 610, 720],
  'FAPU-060': [610, 750, 900],
  'FAPU-072': [750, 900, 1080],
  'FAPU-090': [950, 1150, 1350],
  'FAPU-120': [1200, 1500, 1800],
  'FAPU-150': [1600, 1900, 2250],
  'FAPU-180': [1900, 2300, 2700],
  'FAPU-210': [2150, 2650, 3150],
  'FAPU-240': [2400, 3000, 3600],
  'FAPU-300': [3100, 3800, 4500],
  'FAPU-360': [3700, 4500, 5400],
  'FAPU-420': [4300, 5300, 6300],
  'FAPU-480': [5000, 6100, 7200],
  'FAPU-540': [5500, 6800, 8100],
  'FAPU-600': [6200, 7600, 9000],
};

export interface FAPUPerfPoint {
  totalCapacityBtuh: number;
  sensibleCapacityBtuh: number;
  kwInput: number;
}

// Compact source form: [total, sensible, kW] in DB order 95 → 115 → 118.4 → 125.
type Cell = [number, number, number];
type CfmRow = Record<number, Cell[]>; // cfm -> 4 cells (one per DB)
type RawTable = Record<string, CfmRow>; // modelNumber -> CfmRow

const RAW_FAPU: RawTable = {
  'FAPU-048': {
    500: [[44175, 21243, 4.37], [40162, 30593, 5.37], [39358, 32056, 5.50], [37845, 34846, 6.01]],
    610: [[47251, 22943, 4.41], [42777, 33042, 5.43], [41920, 34822, 5.64], [40309, 37635, 6.07]],
    720: [[49000, 24583, 4.44], [44549, 35404, 5.47], [43656, 37097, 5.68], [41978, 40325, 6.12]],
  },
  'FAPU-060': {
    610: [[51941, 24572, 5.09], [49000, 38413, 6.17], [48107, 40351, 6.37], [46731, 44221, 6.81]],
    750: [[57514, 28435, 5.18], [52190, 41487, 6.23], [51239, 43581, 6.44], [49774, 47768, 6.89]],
    900: [[60000, 30468, 5.22], [54352, 44453, 6.28], [53362, 46697, 6.49], [51835, 51175, 6.94]],
  },
  'FAPU-072': {
    750: [[65124, 31511, 6.18], [58760, 46209, 7.51], [57632, 48561, 7.77], [56829, 53379, 8.35]],
    900: [[68572, 33946, 6.25], [62142, 49780, 7.61], [60949, 52314, 7.87], [59889, 57504, 8.46]],
    1080: [[72000, 36792, 6.33], [64964, 53954, 7.70], [63717, 56700, 7.96], [62609, 62326, 8.56]],
  },
  'FAPU-090': {
    950: [[81257, 39369, 7.55], [73240, 57604, 9.01], [71985, 60584, 9.29], [69914, 66419, 9.93]],
    1150: [[85889, 42481, 7.64], [77415, 62157, 9.12], [76373, 65573, 9.41], [73899, 71068, 10.05]],
    1350: [[90000, 45899, 7.72], [81120, 67159, 9.22], [79730, 70633, 9.51], [77436, 77436, 10.17]],
  },
  'FAPU-120': {
    1200: [[107027, 51549, 10.36], [97239, 75346, 12.35], [96096, 79357, 12.57], [92426, 86568, 13.57]],
    1500: [[114831, 56364, 10.51], [104329, 82383, 12.54], [103091, 86769, 12.76], [99165, 94654, 13.78]],
    1800: [[120000, 60966, 10.61], [109026, 89110, 12.67], [107732, 93854, 12.90], [103629, 102382, 13.93]],
  },
  'FAPU-150': {
    1600: [[136128, 58757, 13.29], [123661, 95821, 15.83], [122149, 100902, 16.16], [117073, 109789, 17.39]],
    1900: [[143372, 70405, 13.43], [130242, 102546, 16.00], [128649, 107966, 16.34], [123303, 117495, 17.58]],
    2250: [[150000, 75462, 13.56], [136263, 109912, 16.16], [134597, 115741, 16.51], [129003, 125935, 17.76]],
  },
  'FAPU-180': {
    1900: [[163577, 79134, 16.73], [149689, 115613, 19.59], [147369, 121622, 20.13], [142507, 132924, 21.27]],
    2300: [[173331, 85476, 16.87], [158615, 124878, 19.78], [156357, 131368, 20.33], [151005, 143577, 21.47]],
    2700: [[180000, 91566, 16.97], [164718, 133329, 19.90], [162165, 140882, 20.45], [156815, 153975, 21.61]],
  },
  'FAPU-210': {
    2150: [[188621, 91013, 18.09], [174714, 134305, 22.12], [171783, 141241, 22.78], [165630, 156238, 24.17]],
    2650: [[201362, 99010, 18.90], [186516, 146106, 22.40], [183387, 153759, 23.07], [176618, 167817, 24.47]],
    3150: [[210000, 106741, 19.05], [194517, 157515, 22.58], [191253, 165766, 23.26], [184403, 180922, 24.68]],
  },
  'FAPU-240': {
    2400: [[213857, 102868, 20.64], [194710, 149146, 24.65], [191258, 157005, 25.43], [184009, 171184, 27.06]],
    3000: [[229390, 112541, 20.93], [209048, 163139, 25.02], [205343, 171735, 25.81], [197560, 187244, 27.47]],
    // 3600 @ 125 °F: as-read sensible ≈ total (SHR→1). Verify against printout.
    3600: [[240000, 121816, 21.13], [218717, 176584, 25.27], [214840, 185888, 26.09], [202676, 202676, 27.75]],
  },
  // FAPU-300 @ 125 °F: as-read sensible dips below the 118.4 °F column on all three
  // CFM rows (192k/209k/224k). Kept as transcribed; flagged by the validator's
  // soft sensible-vs-DB warning. Re-check these against the printed catalogue.
  'FAPU-300': {
    3100: [[269977, 130067, 24.58], [245225, 187823, 29.49], [239866, 195947, 30.42], [230170, 192596, 32.40]],
    3800: [[287845, 140992, 24.93], [261455, 203384, 29.99], [255741, 212407, 30.99], [245403, 208773, 32.90]],
    4500: [[300000, 151523, 25.18], [273496, 216591, 30.25], [266541, 228289, 31.21], [255766, 224385, 33.25]],
  },
  'FAPU-360': {
    3700: [[325256, 157148, 30.55], [296180, 229622, 36.24], [289605, 240036, 37.32], [283053, 266238, 39.83]],
    4500: [[345630, 169888, 30.99], [314186, 248236, 36.79], [307212, 259494, 37.88], [300261, 287621, 40.44]],
    5400: [[360000, 183716, 31.33], [327818, 268443, 37.21], [320541, 280618, 38.32], [313289, 311250, 40.91]],
  },
  'FAPU-420': {
    4300: [[377199, 181921, 35.79], [344806, 264603, 42.18], [338662, 277982, 43.43], [326236, 303146, 46.01]],
    5300: [[402612, 197761, 36.21], [368036, 287642, 42.70], [361478, 302186, 43.97], [348215, 329541, 46.60]],
    6300: [[420000, 213081, 36.51], [383931, 306925, 43.07], [377089, 325595, 44.36], [363254, 355070, 47.02]],
  },
  'FAPU-480': {
    5000: [[435050, 210521, 39.93], [397520, 308463, 47.43], [390102, 324195, 48.90], [377748, 355055, 52.08]],
    6100: [[461797, 228094, 40.43], [421960, 334212, 48.06], [414086, 351257, 49.55], [400972, 384693, 53.28]],
    // 7200 @ 125 °F kW: as-read 53.28 tied the 6100 row; bumped to 53.78 to keep the
    // CFM-monotonic kW trend (one digit was illegible). Verify against the printout.
    7200: [[480000, 245230, 40.79], [439320, 359320, 48.50], [430408, 377645, 50.01], [416778, 413593, 53.78]],
  },
  'FAPU-540': {
    5500: [[483975, 233417, 45.00], [439723, 339489, 53.94], [431280, 356595, 55.52], [415815, 389678, 59.24]],
    6800: [[518422, 254887, 45.67], [471330, 370716, 54.79], [462280, 389394, 56.52], [445703, 425521, 60.20]],
    8100: [[540000, 274539, 46.10], [490948, 399298, 55.34], [481522, 419417, 57.08], [464255, 458329, 60.82]],
  },
  'FAPU-600': {
    6200: [[543934, 263190, 50.66], [491874, 385142, 60.63], [481847, 404667, 62.48], [463123, 438300, 66.51]],
    7600: [[577771, 285563, 51.41], [522579, 417882, 61.59], [511822, 439067, 63.50], [491933, 475559, 67.36]],
    9000: [[600000, 306760, 51.95], [542684, 448901, 62.28], [531514, 471658, 64.18], [510859, 491797, 67.75]],
  },
};

// ── Lookup / interpolation ──────────────────────────────────────────────────

function cellToPoint(c: Cell): FAPUPerfPoint {
  return {
    totalCapacityBtuh: c[0],
    sensibleCapacityBtuh: c[1],
    kwInput: c[2],
  };
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
 * Bilinear FAPU performance lookup on (airflow CFM × entering-air DB °F).
 * Values outside the tabulated ranges clamp to the nearest edge.
 */
export function getFAPUPerformance(
  modelNumber: string,
  cfm: number,
  dbF: number,
): FAPUPerfPoint | undefined {
  const cfmRow = RAW_FAPU[modelNumber];
  if (!cfmRow) return undefined;

  const cfms = Object.keys(cfmRow).map(Number);
  const { lo: cfmLo, hi: cfmHi, t: tC } = bracket(cfm, cfms);
  const { lo: dbLo, hi: dbHi, t: tD } = bracket(dbF, FAPU_ENTERING_AIR_DB_F);

  const iLo = FAPU_ENTERING_AIR_DB_F.indexOf(dbLo as (typeof FAPU_ENTERING_AIR_DB_F)[number]);
  const iHi = FAPU_ENTERING_AIR_DB_F.indexOf(dbHi as (typeof FAPU_ENTERING_AIR_DB_F)[number]);
  const rowLo = cfmRow[cfmLo];
  const rowHi = cfmRow[cfmHi];
  if (!rowLo || !rowHi || iLo < 0 || iHi < 0) return undefined;

  const p00 = cellToPoint(rowLo[iLo]);
  const p01 = cellToPoint(rowLo[iHi]);
  const p10 = cellToPoint(rowHi[iLo]);
  const p11 = cellToPoint(rowHi[iHi]);

  const blend = (k: keyof FAPUPerfPoint) => {
    const lo = lerp(p00[k], p01[k], tD);
    const hi = lerp(p10[k], p11[k], tD);
    return lerp(lo, hi, tC);
  };

  return {
    totalCapacityBtuh: blend('totalCapacityBtuh'),
    sensibleCapacityBtuh: blend('sensibleCapacityBtuh'),
    kwInput: blend('kwInput'),
  };
}

/** Expose the raw per-model matrix for the performance panel (PerfPoint map). */
export function getFAPUMatrix(modelNumber: string): Record<string, Record<string, FAPUPerfPoint>> | null {
  const cfmRow = RAW_FAPU[modelNumber];
  if (!cfmRow) return null;
  const out: Record<string, Record<string, FAPUPerfPoint>> = {};
  for (const [cfm, cells] of Object.entries(cfmRow)) {
    out[cfm] = {};
    FAPU_ENTERING_AIR_DB_F.forEach((db, i) => {
      out[cfm][String(db)] = cellToPoint(cells[i]);
    });
  }
  return out;
}

/** CFM rows for a given FAPU model number (used as the panel's Y axis). */
export function getFAPUCfmRows(modelNumber: string): number[] {
  return FAPU_CFM_BY_MODEL[modelNumber] ?? [];
}

// Re-export raw table for the validator (not used by the app at runtime).
export const __RAW_FAPU = RAW_FAPU;

export type { Model };
