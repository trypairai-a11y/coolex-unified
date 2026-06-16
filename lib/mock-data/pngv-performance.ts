import type { Model } from '@/types/product';

/**
 * PNGv air-cooled packaged DX unit performance matrix.
 *
 * Transcribed from the COOLEX "PNGv Performance Data" catalogue, which publishes
 * the range on two power-frequency sheets:
 *   • 50 Hz — used for ALL countries EXCEPT Saudi Arabia
 *       (PNGv_Performance_Data_50Hz.xlsx)
 *   • 60 Hz — used for Saudi Arabia
 *       (PNGv_Performance_Data_60Hz_Saudi.xlsx)
 *
 * The two sheets are NOT a single continuous airflow curve — at the same airflow
 * they report different capacities, and the lineup differs at the third size
 * (50 Hz lists PNGv-130, 60 Hz lists PNGv-120). They are therefore kept as two
 * independent tables and the active one is selected by frequency (i.e. country):
 * every lookup below takes an `is60Hz` flag, which the selection pipeline sets to
 * `true` only for Saudi Arabia.
 *
 * Each table is indexed by:
 *   • Indoor air flow (CFM)        — 3 rows per model
 *   • Condenser ambient temp (°F)  — 3 cols: 95, 115, 125
 *
 * Each cell stores: Total Capacity (Btu/h), Sensible Capacity (Btu/h) and
 * compressor + fan power kW Input.
 *
 * RATING BASIS: nominal capacities are quoted at 95 °F condenser ambient (the
 * standard column). The design lookup interpolates on airflow and condenser
 * ambient independently.
 */

export const PNGV_AMBIENT_F = [95, 115, 125] as const;

/** Catalogue footnote shown beneath the PNGv performance table (frequency-aware). */
export function getPNGVRatingNote(is60Hz: boolean): string {
  return is60Hz
    ? 'Cooling capacities are based on 95 °F condenser ambient. 60 Hz performance data — Saudi Arabia.'
    : 'Cooling capacities are based on 95 °F condenser ambient. 50 Hz performance data — all countries except Saudi Arabia.';
}

// CFM rows per model, per frequency.
const PNGV_CFM_50: Record<string, number[]> = {
  'PNGv-076': [2200, 2350, 2500],
  'PNGv-090': [2600, 2800, 3000],
  'PNGv-130': [4000, 4400, 4800],
  'PNGv-180': [5100, 5700, 6300],
  'PNGv-240': [6800, 7000, 7300],
  'PNGv-300': [9000, 9200, 9500],
};

const PNGV_CFM_60: Record<string, number[]> = {
  'PNGv-076': [2000, 2600, 3000],
  'PNGv-090': [2500, 3000, 3400],
  'PNGv-120': [3500, 4000, 4800],
  'PNGv-180': [5200, 6000, 6800],
  'PNGv-240': [6750, 7500, 8200],
  'PNGv-300': [7600, 8500, 9500],
};

export interface PNGVPerfPoint {
  totalCapacityBtuh: number;
  sensibleCapacityBtuh: number;
  kwInput: number;
}

// Compact source form: [total Btu/h, sensible Btu/h, kW input].
type Cell = [number, number, number];
// Each CFM row holds one Cell per ambient, in PNGV_AMBIENT_F order (95, 115, 125).
type CfmRow = Record<number, Cell[]>;
type RawTable = Record<string, CfmRow>;

// 50 Hz — all countries except Saudi Arabia.
const RAW_PNGV_50: RawTable = {
  'PNGv-076': {
    2200: [[68607, 48664, 6.04], [61050, 45948, 7.49], [57182, 44585, 8.4]],
    2350: [[71722, 55277, 6.11], [63822, 52193, 7.62], [59778, 50644, 8.46]],
    2500: [[72568, 59204, 6.15], [64575, 55901, 7.68], [60484, 54243, 8.5]],
  },
  'PNGv-090': {
    2600: [[83107, 59718, 7.59], [74904, 56681, 9.59], [70526, 55090, 10.67]],
    2800: [[85332, 65202, 7.65], [76910, 61886, 9.66], [72415, 60148, 10.76]],
    3000: [[86653, 69406, 7.69], [78100, 65877, 9.71], [73535, 64027, 10.84]],
  },
  'PNGv-130': {
    4000: [[135614, 96854, 11.07], [122671, 91985, 13.89], [115202, 89227, 15.63]],
    4400: [[138035, 103123, 11.12], [124861, 97938, 13.96], [117259, 95002, 15.71]],
    4800: [[140952, 112825, 11.19], [127500, 107152, 14.04], [119737, 103941, 15.8]],
  },
  'PNGv-180': {
    5100: [[157822, 112237, 13.9], [140582, 106244, 17.99], [134141, 104159, 20.3]],
    5700: [[162048, 122543, 14.51], [144346, 116000, 18.22], [137734, 113723, 20.4]],
    6300: [[164556, 130445, 14.92], [146580, 123481, 18.32], [139865, 121057, 20.54]],
  },
  'PNGv-240': {
    6800: [[232496, 161876, 20.87], [211531, 153659, 26.2], [199689, 149109, 29.39]],
    7000: [[236234, 169751, 20.95], [214932, 161134, 26.3], [202899, 156363, 29.5]],
    7300: [[239677, 177969, 21.02], [218064, 168935, 26.38], [205856, 163933, 29.6]],
  },
  'PNGv-300': {
    9000: [[264026, 181015, 22.3], [238631, 170972, 28.12], [224283, 165421, 31.58]],
    9200: [[268682, 190217, 22.38], [242839, 179664, 28.23], [228239, 173830, 31.7]],
    9500: [[273010, 200167, 22.46], [246750, 189062, 28.33], [231914, 182923, 31.85]],
  },
};

// 60 Hz — Saudi Arabia.
const RAW_PNGV_60: RawTable = {
  'PNGv-076': {
    2000: [[71071, 50411, 6.49], [63243, 47598, 7.69], [59236, 46186, 8.44]],
    2600: [[74298, 57262, 6.55], [66114, 54067, 7.8], [61925, 52463, 8.49]],
    3000: [[75174, 61330, 6.58], [66894, 57908, 7.84], [62656, 56190, 8.52]],
  },
  'PNGv-090': {
    2500: [[87408, 62809, 8.02], [78781, 59615, 9.49], [74176, 57941, 10.27]],
    3000: [[89749, 68576, 8.07], [80890, 65089, 9.53], [76163, 63261, 10.33]],
    3400: [[91138, 72998, 8.1], [82142, 69286, 9.57], [77341, 67341, 10.39]],
  },
  'PNGv-120': {
    3500: [[122721, 87646, 11.12], [111008, 83239, 13.22], [104250, 80744, 14.51]],
    4000: [[124912, 93319, 11.16], [112991, 88626, 13.27], [106111, 85970, 14.57]],
    4800: [[127552, 102099, 11.21], [115378, 96965, 13.33], [108354, 94059, 14.63]],
  },
  'PNGv-180': {
    5200: [[174063, 123786, 14.95], [155048, 117178, 18.25], [147945, 114878, 20.12]],
    6000: [[178724, 135153, 15.44], [159201, 127937, 18.44], [151907, 125426, 20.2]],
    6800: [[181490, 143869, 15.77], [161664, 136188, 18.52], [154258, 133515, 20.31]],
  },
  'PNGv-240': {
    6750: [[233258, 162406, 21.39], [212224, 154162, 25.25], [200343, 149597, 27.56]],
    7500: [[237008, 170307, 21.45], [215636, 161662, 25.32], [203564, 156875, 27.64]],
    8200: [[240462, 178552, 21.5], [218779, 169488, 25.39], [206531, 164470, 27.71]],
  },
  'PNGv-300': {
    7600: [[285139, 195489, 25.97], [257713, 184644, 30.81], [242218, 178648, 33.68]],
    8500: [[290167, 205427, 26.04], [262257, 194030, 30.9], [246489, 187730, 33.78]],
    9500: [[294840, 216173, 26.11], [266481, 204180, 30.98], [250459, 197550, 33.83]],
  },
};

function rawTable(is60Hz: boolean): RawTable {
  return is60Hz ? RAW_PNGV_60 : RAW_PNGV_50;
}

function cfmMap(is60Hz: boolean): Record<string, number[]> {
  return is60Hz ? PNGV_CFM_60 : PNGV_CFM_50;
}

/** Model numbers offered at the given frequency, in catalogue order. */
export function getPNGVModelNumbers(is60Hz: boolean): string[] {
  return Object.keys(rawTable(is60Hz));
}

// ── Lookup / interpolation ──────────────────────────────────────────────────

function cellToPoint(c: Cell): PNGVPerfPoint {
  return { totalCapacityBtuh: c[0], sensibleCapacityBtuh: c[1], kwInput: c[2] };
}

function bracket(target: number, options: readonly number[]): { lo: number; hi: number; t: number } {
  const sorted = [...options].sort((a, b) => a - b);
  if (target <= sorted[0]) return { lo: sorted[0], hi: sorted[0], t: 0 };
  const last = sorted[sorted.length - 1];
  if (target >= last) return { lo: last, hi: last, t: 0 };
  for (let i = 0; i < sorted.length - 1; i++) {
    if (target >= sorted[i] && target <= sorted[i + 1]) {
      const lo = sorted[i], hi = sorted[i + 1];
      return { lo, hi, t: hi === lo ? 0 : (target - lo) / (hi - lo) };
    }
  }
  return { lo: sorted[0], hi: sorted[0], t: 0 };
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Bilinear PNGv performance lookup on (airflow CFM × condenser ambient °F) for
 * the given power frequency (Saudi = 60 Hz, all other countries = 50 Hz).
 * Values outside the tabulated ranges clamp to the nearest edge.
 */
export function getPNGVPerformance(
  modelNumber: string,
  cfm: number,
  ambientF: number,
  is60Hz: boolean,
): PNGVPerfPoint | undefined {
  const cfmRow = rawTable(is60Hz)[modelNumber];
  if (!cfmRow) return undefined;

  const cfms = Object.keys(cfmRow).map(Number);
  const { lo: cfmLo, hi: cfmHi, t: tC } = bracket(cfm, cfms);
  const { lo: ambLo, hi: ambHi, t: tA } = bracket(ambientF, PNGV_AMBIENT_F);

  const iLo = PNGV_AMBIENT_F.indexOf(ambLo as (typeof PNGV_AMBIENT_F)[number]);
  const iHi = PNGV_AMBIENT_F.indexOf(ambHi as (typeof PNGV_AMBIENT_F)[number]);
  const rowLo = cfmRow[cfmLo];
  const rowHi = cfmRow[cfmHi];
  if (!rowLo || !rowHi || iLo < 0 || iHi < 0) return undefined;

  const p00 = cellToPoint(rowLo[iLo]);
  const p01 = cellToPoint(rowLo[iHi]);
  const p10 = cellToPoint(rowHi[iLo]);
  const p11 = cellToPoint(rowHi[iHi]);

  const blend = (k: keyof PNGVPerfPoint) => {
    const lo = lerp(p00[k], p01[k], tA);
    const hi = lerp(p10[k], p11[k], tA);
    return lerp(lo, hi, tC);
  };

  return {
    totalCapacityBtuh: blend('totalCapacityBtuh'),
    sensibleCapacityBtuh: blend('sensibleCapacityBtuh'),
    kwInput: blend('kwInput'),
  };
}

/** Expose the raw per-model matrix for the performance panel (frequency-aware). */
export function getPNGVMatrix(
  modelNumber: string,
  is60Hz: boolean,
): Record<string, Record<string, PNGVPerfPoint>> | null {
  const cfmRow = rawTable(is60Hz)[modelNumber];
  if (!cfmRow) return null;
  const out: Record<string, Record<string, PNGVPerfPoint>> = {};
  for (const [cfm, cells] of Object.entries(cfmRow)) {
    out[cfm] = {};
    PNGV_AMBIENT_F.forEach((amb, i) => {
      out[cfm][String(amb)] = cellToPoint(cells[i]);
    });
  }
  return out;
}

/** CFM rows for a given PNGv model number at the given frequency. */
export function getPNGVCfmRows(modelNumber: string, is60Hz: boolean): number[] {
  return cfmMap(is60Hz)[modelNumber] ?? [];
}

export type { Model };
