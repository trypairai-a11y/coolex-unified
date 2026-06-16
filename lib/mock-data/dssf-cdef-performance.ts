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

/** Indoor airflow rows available per model (3 each), as the panel's Y axis. */
export const DSSF_CFM_BY_MODEL: Record<string, number[]> = {
  'CHCF-024': [923, 954, 1107],
  'CHCF-030': [1028, 1064, 1202],
  'CHCF-036': [1150, 1180, 1202],
  'CHCF-042': [1311, 1359, 1404],
  'CHCF-048': [1450, 1526, 1583],
  'CHCF-060': [1548, 1674, 1993],
};

/** Full catalogue designation (outdoor / indoor) for each base model. */
export const DSSF_DESIGNATION: Record<string, string> = {
  'CHCF-024': 'CHCF-024 A7 / CHEF-024 A7',
  'CHCF-030': 'CHCF-030 A7 / CHEF-030 A7',
  'CHCF-036': 'CHCF-036 A2 / CHEF-036 A7',
  'CHCF-042': 'CHCF-042 A2 / CHEF-042 A7',
  'CHCF-048': 'CHCF-048 A2 / CHEF-048 A7',
  'CHCF-060': 'CHCF-060 A2 / CHEF-060 A7',
};

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

const RAW: RawTable = {
  'CHCF-024': {
    923: {
      84.2: [[23927, 20338, 2.06], [21144, 17972, 2.34], [20666, 17566, 2.39], [19631, 16687, 2.54]],
      80:   [[24415, 17184, 2.06], [21575, 16114, 2.34], [21088, 15931, 2.39], [20032, 15294, 2.54]],
      74:   [[21520, 15557, 1.94], [19017, 14588, 2.21], [18588, 14423, 2.25], [17657, 13846, 2.39]],
      68:   [[18701, 13900, 1.87], [16525, 13034, 2.11], [16152, 12886, 2.14], [15343, 12371, 2.29]],
    },
    954: {
      84.2: [[24330, 21654, 2.07], [21500, 19135, 2.36], [21015, 18703, 2.41], [19962, 17767, 2.56]],
      80:   [[24739, 17524, 2.07], [21861, 16433, 2.36], [21368, 16247, 2.41], [20298, 15597, 2.56]],
      74:   [[21804, 15880, 1.96], [19267, 14891, 2.24], [18833, 14722, 2.28], [17890, 14134, 2.43]],
      68:   [[18949, 14133, 1.88], [16744, 13253, 2.13], [16367, 13103, 2.17], [15547, 12579, 2.31]],
    },
    1107: {
      84.2: [[24803, 23562, 2.08], [21923, 20826, 2.38], [21712, 20626, 2.43], [20361, 19343, 2.58]],
      80:   [[25088, 17851, 2.09], [22173, 16744, 2.38], [21960, 17302, 2.43], [20594, 15894, 2.58]],
      74:   [[22109, 16155, 1.98], [19537, 15149, 2.26], [19096, 14978, 2.3], [18139, 14379, 2.45]],
      68:   [[19215, 14437, 1.89], [16980, 13538, 2.15], [16596, 13385, 2.19], [15765, 12850, 2.33]],
    },
  },
  'CHCF-030': {
    1028: {
      84.2: [[31510, 26783, 2.5], [27971, 23775, 3.02], [26283, 22340, 3.11], [25994, 22094, 3.3]],
      80:   [[32153, 21865, 2.5], [28542, 20552, 3.02], [26819, 21775, 3.11], [26524, 19515, 3.3]],
      74:   [[28340, 19795, 2.36], [25157, 18606, 2.86], [23508, 18623, 2.94], [23379, 17668, 3.12]],
      68:   [[24627, 17686, 2.29], [21861, 16624, 2.74], [20283, 15640, 2.8], [20316, 15786, 2.99]],
    },
    1064: {
      84.2: [[32041, 28517, 2.52], [28443, 25314, 3.04], [26739, 23798, 3.13], [26433, 23525, 3.32]],
      80:   [[32580, 22298, 2.52], [28921, 20958, 3.04], [27189, 22177, 3.13], [26877, 19902, 3.32]],
      74:   [[28714, 20206, 2.39], [25489, 18992, 2.89], [23833, 18948, 2.98], [23688, 18034, 3.16]],
      68:   [[24954, 17984, 2.3], [22152, 16903, 2.76], [20567, 15977, 2.84], [20586, 16051, 3.01]],
    },
    1202: {
      84.2: [[32666, 31032, 2.54], [29003, 27552, 3.07], [27288, 25924, 3.19], [26961, 25613, 3.35]],
      80:   [[33039, 22714, 2.54], [29334, 21356, 3.07], [27600, 22572, 3.19], [27269, 20280, 3.35]],
      74:   [[29116, 20556, 2.42], [25846, 19321, 2.92], [24181, 19296, 3.01], [24019, 18347, 3.19]],
      68:   [[25305, 18370, 2.31], [22463, 17267, 2.78], [20871, 16208, 2.86], [20875, 16396, 3.04]],
    },
  },
  'CHCF-036': {
    1150: {
      84.2: [[39125, 33256, 3.04], [35078, 29816, 3.78], [33024, 28070, 3.91], [32661, 27762, 4.14]],
      80:   [[39923, 26570, 3.04], [35794, 24935, 3.78], [33698, 23241, 3.91], [33328, 23671, 4.14]],
      74:   [[35189, 24054, 2.87], [31550, 22575, 3.57], [29538, 19809, 3.69], [29376, 21430, 3.91]],
      68:   [[30579, 21491, 2.77], [27416, 20170, 3.43], [25486, 16573, 3.52], [25527, 19147, 3.76]],
    },
    1180: {
      84.2: [[39784, 35408, 3.06], [35669, 31746, 3.8], [33599, 29903, 3.93], [33213, 29559, 4.17]],
      80:   [[40453, 27095, 3.06], [36269, 25429, 3.8], [34164, 23729, 3.93], [33771, 24140, 4.17]],
      74:   [[35653, 24553, 2.91], [31966, 23043, 3.62], [29946, 20203, 3.74], [29764, 21875, 3.97]],
      68:   [[30985, 21853, 2.8], [27780, 20509, 3.45], [25843, 15083, 3.56], [25866, 19469, 3.78]],
    },
    1202: {
      84.2: [[40560, 38532, 3.09], [36371, 34553, 3.84], [34288, 32574, 4.01], [33877, 32183, 4.21]],
      80:   [[41023, 27601, 3.09], [36787, 25911, 3.84], [34680, 24208, 4.01], [34264, 24599, 4.21]],
      74:   [[36152, 24979, 2.94], [32413, 23443, 3.66], [30384, 20627, 3.78], [30180, 22254, 4]],
      68:   [[31420, 22323, 2.8], [28170, 20950, 3.49], [26225, 17262, 3.6], [26230, 19888, 3.82]],
    },
  },
  'CHCF-042': {
    1311: {
      84.2: [[43538, 37008, 3.56], [38669, 32869, 4.06], [36338, 30888, 4.14], [35939, 30548, 4.39]],
      80:   [[44427, 31976, 3.56], [39458, 29911, 4.06], [37080, 25261, 4.14], [36672, 28377, 4.39]],
      74:   [[39159, 28948, 3.37], [34779, 27079, 3.84], [32502, 21468, 3.92], [32324, 25690, 4.15]],
      68:   [[34028, 25864, 3.28], [30222, 24194, 3.68], [28043, 17900, 3.73], [28089, 22954, 3.98]],
    },
    1359: {
      84.2: [[44273, 39403, 3.58], [39321, 34996, 4.1], [36970, 32904, 4.17], [36546, 32526, 4.42]],
      80:   [[45017, 32609, 3.58], [39982, 30503, 4.1], [37592, 25846, 4.17], [37160, 28939, 4.42]],
      74:   [[39676, 29549, 3.41], [35238, 27641, 3.89], [32951, 21940, 3.97], [32750, 26224, 4.21]],
      68:   [[34480, 26299, 3.26], [30624, 24601, 3.71], [28436, 18390, 3.78], [28462, 23340, 4.01]],
    },
    1404: {
      84.2: [[45135, 42879, 3.62], [40095, 38090, 4.12], [37729, 35842, 4.25], [37276, 35412, 4.46]],
      80:   [[45651, 33217, 3.62], [40553, 31081, 4.12], [38160, 26420, 4.25], [37702, 29489, 4.46]],
      74:   [[40230, 30061, 3.44], [35730, 28120, 3.92], [33433, 22448, 4.01], [33208, 26679, 4.25]],
      68:   [[34965, 26865, 3.29], [31054, 25130, 3.74], [28857, 18728, 3.81], [28861, 23842, 4.05]],
    },
  },
  'CHCF-048': {
    1450: {
      84.2: [[49550, 42117, 3.87], [46166, 39241, 4.82], [43766, 37201, 4.98], [43285, 36792, 5.28]],
      80:   [[50651, 34840, 3.87], [47108, 34162, 4.82], [44659, 28638, 4.98], [44168, 32685, 5.28]],
      74:   [[44645, 31541, 3.66], [41522, 30928, 4.55], [39146, 24326, 4.71], [38931, 29590, 4.99]],
      68:   [[38796, 28181, 3.56], [36082, 27633, 4.37], [33775, 20272, 4.48], [33830, 26438, 4.79]],
    },
    1526: {
      84.2: [[50475, 44923, 3.89], [46944, 41780, 4.85], [44527, 39629, 5.01], [44015, 39173, 5.31]],
      80:   [[51324, 35529, 3.89], [47733, 34838, 4.85], [45276, 29312, 5.01], [45155, 33332, 5.31]],
      74:   [[45234, 32195, 3.7], [42070, 31569, 4.61], [39686, 24869, 4.77], [39445, 30205, 5.06]],
      68:   [[39311, 28655, 3.54], [36561, 28098, 4.4], [34249, 20836, 4.54], [34279, 26883, 4.82]],
    },
    1583: {
      84.2: [[51459, 48886, 3.93], [47868, 45475, 4.9], [45441, 43169, 5.11], [44895, 42650, 5.36]],
      80:   [[52047, 36192, 3.93], [48415, 35499, 4.9], [45960, 29973, 5.11], [45408, 33966, 5.36]],
      74:   [[45866, 32754, 3.74], [42658, 32117, 4.66], [40267, 25456, 4.83], [39996, 30728, 5.1]],
      68:   [[39864, 29271, 3.57], [37075, 28702, 4.44], [34756, 21225, 4.58], [34761, 27461, 4.87]],
    },
  },
  'CHCF-060': {
    1548: {
      84.2: [[60994, 51845, 4.9], [56563, 48078, 5.92], [53523, 45494, 6.09], [53004, 45054, 6.46]],
      80:   [[62239, 45102, 4.9], [57717, 43713, 5.92], [54615, 39092, 6.09], [54086, 41738, 6.46]],
      74:   [[54859, 40832, 4.63], [50873, 39575, 5.59], [47864, 33269, 5.76], [47673, 37786, 6.1]],
      68:   [[47671, 36482, 4.48], [44208, 35359, 5.37], [41287, 27784, 5.49], [41427, 33761, 5.86]],
    },
    1674: {
      84.2: [[62022, 55200, 4.93], [57497, 51173, 5.96], [54456, 48465, 6.13], [53899, 47970, 6.5]],
      80:   [[63065, 45995, 4.93], [58484, 44578, 5.96], [55371, 39953, 6.13], [54805, 42564, 6.5]],
      74:   [[55583, 41679, 4.69], [51545, 40396, 5.67], [48526, 33964, 5.83], [48302, 38571, 6.18]],
      68:   [[48304, 37096, 4.51], [44795, 35954, 5.4], [41867, 28504, 5.56], [41977, 34329, 5.9]],
    },
    1993: {
      84.2: [[63232, 60070, 4.98], [58649, 55716, 6.01], [55573, 52794, 6.25], [54976, 52227, 6.58]],
      80:   [[63954, 46853, 4.98], [59319, 45424, 6.01], [56280, 40797, 6.25], [55604, 43374, 6.58]],
      74:   [[56359, 42402, 4.74], [52265, 41097, 5.72], [49236, 34710, 5.89], [48977, 39240, 6.24]],
      68:   [[48983, 37893, 4.53], [45424, 36727, 5.46], [42488, 29001, 5.61], [42566, 35067, 5.95]],
    },
  },
};

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
