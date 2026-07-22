import type { Model } from '@/types/product';

/**
 * SPU (Self-contained Packaged Unit) SUPPLY-FAN performance matrix — "4 ROWS".
 *
 * Companion to the cooling table in spu-performance.ts. Where that module gives
 * capacity/power for a coil, this one gives the supply fan's operating point:
 * for each catalogue airflow (CFM) it lists the fan Speed (RPM) and absorbed
 * power (BHP) required to develop a given External Static Pressure (in. WG).
 *
 * Indexed by:
 *   • Model                       — SPU-420 … SPU-1200 (11 sizes)
 *   • Indoor air flow (CFM)       — 4 rows per model (same rows as SPU_CFM_BY_MODEL)
 *   • External Static Pressure    — 0.40, 0.70, 1.00, 1.25, 1.50, 1.75, 2.00 in. WG
 *
 * Each cell stores: fan Speed (RPM) and fan absorbed power (BHP).
 *
 * ──────────────────────────────────────────────────────────────────────────
 * DATA SOURCE: parsed deterministically (openpyxl) from the authoritative
 * workbook "Preformance data/SPU Fan Performance.xlsx" — sheet
 * "Fan Performance (4 Rows)". Every value is transcribed verbatim from the
 * Excel; a handful of catalogue anomalies (e.g. a BHP that dips as static rises)
 * are preserved as-is, not "corrected".
 * ──────────────────────────────────────────────────────────────────────────
 *
 * Catalogue notes (from the workbook LEGEND / Note block):
 *   1. Internal static pressure is based on pressure drops through evaporator
 *      coil, fan casing and 2" washable filters.
 *   2. Blue-shaded catalogue area = standard motor and drive combination.
 *   3. Green-shaded area = standard motor with non-standard drive.
 *   4. Gray-shaded area = non-standard motor and drive.
 *   5. To size the motor to be installed, multiply the absorbed power (BHP)
 *      above by 1.2  (see spuMotorHP).
 */

/** External static pressures tabulated (in. WG), ascending — the X axis. */
export const SPU_FAN_ESP_INWG = [0.4, 0.7, 1.0, 1.25, 1.5, 1.75, 2.0] as const;

/** Service factor applied to absorbed power (BHP) to size the installed motor. */
export const SPU_FAN_MOTOR_SF = 1.2;

/** Catalogue footnote shown beneath the SPU fan-performance table. */
export const SPU_FAN_NOTE =
  'Static pressure covers pressure drops through the evaporator coil, fan casing and 2" washable filters. Required motor power = absorbed power (BHP) × 1.2.';

export interface SPUFanPoint {
  /** Fan speed (revolutions per minute). */
  rpm: number;
  /** Fan absorbed power (brake horsepower). */
  bhp: number;
}

// Compact source form per cell: [rpm, bhp] in ESP order 0.40 → 2.00 in. WG.
type FanCell = [number, number];
type FanCfmRow = Record<number, FanCell[]>; // cfm -> 7 cells (one per ESP)
type FanTable = Record<string, FanCfmRow>;  // model -> FanCfmRow

// ── FAN PERFORMANCE (4 ROWS) ────────────────────────────────────────────────
const RAW_FAN: FanTable = {
  'SPU-420': {
    10500: [[662, 3.81], [733, 4.61], [802, 5.5], [858, 6.31], [914, 7.21], [970, 8.19], [1025, 9.25]],
    11400: [[670, 4.29], [738, 5.11], [803, 6], [856, 6.79], [908, 7.67], [960, 8.59], [1011, 9.6]],
    12300: [[680, 4.84], [745, 4.24], [807, 6.58], [857, 7.39], [907, 8.23], [955, 9.14], [1003, 10.11]],
    13200: [[691, 5.47], [754, 6.33], [813, 7.25], [862, 8.06], [909, 8.91], [955, 9.81], [1000, 10.75]],
  },
  'SPU-480': {
    12000: [[676, 4.65], [742, 5.48], [805, 6.38], [856, 7.17], [907, 8.05], [956, 8.94], [1005, 9.92]],
    13000: [[688, 5.32], [752, 6.18], [812, 7.09], [860, 7.9], [908, 8.75], [955, 9.65], [1001, 10.6]],
    14000: [[701, 6.07], [763, 6.97], [821, 7.91], [867, 8.74], [913, 9.6], [957, 10.5], [1001, 11.45]],
    15000: [[716, 6.9], [775, 7.86], [832, 8.83], [877, 9.68], [920, 10.55], [963, 11.46], [1005, 12.41]],
  },
  'SPU-540': {
    13500: [[653, 4.89], [719, 5.79], [784, 6.77], [837, 7.64], [889, 8.58], [940, 9.56], [990, 10.59]],
    14600: [[663, 5.56], [726, 6.49], [787, 7.48], [837, 8.36], [886, 9.29], [934, 10.28], [982, 11.31]],
    15700: [[675, 6.31], [736, 7.28], [793, 8.3], [841, 9.18], [887, 10.12], [933, 11.11], [978, 12.14]],
    16800: [[689, 7.17], [747, 8.16], [802, 9.21], [847, 10.12], [891, 11.07], [935, 12.06], [978, 13.1]],
  },
  'SPU-600': {
    15000: [[668, 5.83], [729, 6.75], [789, 7.76], [838, 8.65], [886, 9.58], [933, 10.56], [980, 11.6]],
    16100: [[680, 6.62], [739, 7.59], [796, 8.61], [843, 9.5], [888, 10.46], [933, 11.45], [977, 12.48]],
    17200: [[694, 7.49], [751, 8.51], [806, 9.57], [850, 10.48], [893, 11.45], [936, 12.44], [978, 13.47]],
    18300: [[708, 8.47], [764, 9.53], [817, 10.63], [859, 11.57], [901, 12.55], [942, 13.55], [982, 14.61]],
  },
  'SPU-660': {
    16500: [[394, 5.51], [435, 6.54], [474, 7.67], [507, 8.67], [538, 9.75], [569, 10.87], [600, 12.06]],
    17700: [[400, 6.17], [438, 7.22], [476, 8.36], [506, 9.37], [536, 10.44], [566, 11.57], [595, 12.76]],
    19000: [[406, 6.97], [443, 8.07], [479, 9.22], [508, 10.24], [536, 11.31], [564, 12.45], [592, 13.63]],
    20300: [[414, 7.86], [449, 9], [483, 10.19], [511, 11.22], [538, 12.31], [565, 13.44], [591, 14.64]],
  },
  'SPU-720': {
    18000: [[401, 6.35], [439, 7.41], [476, 8.55], [509, 9.56], [536, 10.63], [565, 11.77], [594, 12.95]],
    19400: [[408, 7.24], [445, 8.38], [480, 9.5], [509, 10.54], [537, 11.61], [564, 12.75], [592, 13.93]],
    20800: [[417, 8.24], [452, 9.4], [485, 10.59], [513, 11.64], [539, 12.72], [566, 13.87], [592, 15.05]],
    22200: [[425, 9.36], [460, 10.56], [492, 11.8], [518, 12.87], [543, 13.98], [569, 15.15], [593, 16.34]],
  },
  'SPU-780': {
    19500: [[347, 6.3], [385, 7.59], [422, 9.02], [452, 10.29], [482, 11.66], [510, 13.08], [538, 14.58]],
    21000: [[351, 7.04], [387, 8.35], [421, 9.79], [450, 11.06], [478, 12.43], [506, 13.86], [533, 15.36]],
    22500: [[355, 7.87], [389, 9.21], [423, 10.66], [450, 11.94], [477, 13.31], [503, 14.75], [529, 16.26]],
    24000: [[361, 8.81], [394, 10.19], [425, 11.65], [451, 12.95], [477, 14.32], [502, 15.75], [527, 17.27]],
  },
  'SPU-840': {
    21000: [[351, 7.04], [387, 8.35], [421, 9.79], [450, 11.06], [478, 12.43], [506, 13.86], [533, 15.36]],
    22500: [[355, 7.87], [389, 9.21], [423, 10.66], [450, 11.94], [477, 13.31], [503, 14.75], [529, 16.26]],
    24000: [[361, 8.81], [394, 10.19], [425, 11.65], [451, 12.95], [477, 14.32], [502, 15.75], [527, 17.27]],
    25500: [[367, 9.83], [398, 11.26], [429, 12.76], [454, 14.08], [478, 15.44], [502, 16.89], [526, 18.4]],
  },
  'SPU-960': {
    24000: [[361, 8.81], [394, 10.19], [425, 11.65], [451, 12.95], [477, 14.32], [502, 15.75], [527, 17.27]],
    25600: [[367, 9.91], [398, 11.33], [429, 12.83], [454, 14.14], [478, 15.5], [501, 16.97], [526, 18.49]],
    27200: [[374, 11.11], [405, 12.6], [434, 14.14], [458, 15.5], [481, 16.89], [504, 18.35], [526, 19.87]],
    28800: [[381, 12.44], [411, 13.99], [440, 15.6], [462, 16.97], [485, 18.39], [507, 19.88], [528, 21.41]],
  },
  'SPU-1080': {
    27000: [[313, 9.14], [344, 10.82], [375, 12.63], [400, 14.25], [425, 15.98], [449, 17.79], [475, 19.69]],
    28800: [[317, 10.17], [347, 11.88], [376, 13.71], [400, 15.34], [424, 17.06], [447, 18.88], [470, 20.79]],
    30600: [[322, 13.31], [351, 13.07], [379, 14.92], [402, 16.57], [424, 18.3], [446, 20.24], [468, 22.04]],
    32400: [[327, 12.56], [355, 14.37], [382, 16.27], [404, 17.94], [425, 19.68], [447, 21.51], [468, 23.42]],
  },
  'SPU-1200': {
    30000: [[320, 10.92], [349, 12.65], [378, 14.5], [401, 16.14], [424, 17.87], [446, 19.69], [469, 21.6]],
    32000: [[326, 12.27], [354, 14.04], [381, 15.95], [403, 17.61], [425, 19.36], [446, 21.19], [468, 23.1]],
    34000: [[332, 13.77], [359, 12.56], [385, 17.57], [406, 19.29], [427, 21.03], [448, 22.87], [468, 24.79]],
    36000: [[338, 15.4], [365, 17.35], [390, 19.36], [411, 21.09], [431, 22.88], [450, 24.75], [470, 26.68]],
  },
};

// ── Lookup / interpolation ──────────────────────────────────────────────────

/** Parse an SPU model number ("SPU-420", "SPU-420-4R", "SPU-420-6R") → base. */
export function parseSPUFanBase(modelNumber: string): string | null {
  const m = /^(SPU-\d{3,4})(?:-[46]R)?$/.exec(modelNumber);
  return m ? m[1] : null;
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

/** CFM rows tabulated for a given SPU model (the panel's Y axis). */
export function getSPUFanCfmRows(modelNumber: string): number[] {
  const base = parseSPUFanBase(modelNumber);
  if (!base) return [];
  const row = RAW_FAN[base];
  return row ? Object.keys(row).map(Number).sort((a, b) => a - b) : [];
}

/**
 * Bilinear fan-performance lookup on (airflow CFM × external static ESP) for an
 * SPU model. Returns the fan speed (RPM) and absorbed power (BHP). Values
 * outside the tabulated ranges clamp to the nearest edge. The 4-row and 6-row
 * coil variants share the same supply-fan table, so the coil suffix is ignored.
 */
export function getSPUFanPerformance(
  modelNumber: string,
  cfm: number,
  espInWG: number,
): SPUFanPoint | undefined {
  const base = parseSPUFanBase(modelNumber);
  if (!base) return undefined;
  const cfmRow = RAW_FAN[base];
  if (!cfmRow) return undefined;

  const cfms = Object.keys(cfmRow).map(Number);
  const { lo: cLo, hi: cHi, t: tC } = bracket(cfm, cfms);
  const { lo: eLo, hi: eHi, t: tE } = bracket(espInWG, SPU_FAN_ESP_INWG);
  const iLo = SPU_FAN_ESP_INWG.indexOf(eLo as (typeof SPU_FAN_ESP_INWG)[number]);
  const iHi = SPU_FAN_ESP_INWG.indexOf(eHi as (typeof SPU_FAN_ESP_INWG)[number]);

  const rowLo = cfmRow[cLo];
  const rowHi = cfmRow[cHi];
  if (!rowLo || !rowHi || iLo < 0 || iHi < 0) return undefined;

  const blend = (idx: 0 | 1) => {
    const lo = lerp(rowLo[iLo][idx], rowLo[iHi][idx], tE);
    const hi = lerp(rowHi[iLo][idx], rowHi[iHi][idx], tE);
    return lerp(lo, hi, tC);
  };

  return { rpm: blend(0), bhp: blend(1) };
}

/** Recommended installed-motor power (HP) for an absorbed power (BHP). */
export function spuMotorHP(bhp: number): number {
  return bhp * SPU_FAN_MOTOR_SF;
}

/**
 * Build the 2D panel matrix (CFM × ESP) of fan points for a model. Keys are
 * stringified CFM (rows) → stringified ESP (columns), matching the shape the
 * performance panels consume.
 */
export function getSPUFanMatrix(
  modelNumber: string,
): Record<string, Record<string, SPUFanPoint>> | null {
  const base = parseSPUFanBase(modelNumber);
  if (!base) return null;
  const cfmRow = RAW_FAN[base];
  if (!cfmRow) return null;

  const out: Record<string, Record<string, SPUFanPoint>> = {};
  for (const cfm of Object.keys(cfmRow).map(Number)) {
    out[cfm] = {};
    SPU_FAN_ESP_INWG.forEach((esp, i) => {
      const cell = cfmRow[cfm][i];
      out[cfm][String(esp)] = { rpm: cell[0], bhp: cell[1] };
    });
  }
  return out;
}

// Re-export the raw table for validators (not used by the app at runtime).
export const __RAW_FAN = RAW_FAN;

export type { Model };
