import type { Model } from '@/types/product';

/**
 * FCL Chilled-Water Fan-Coil Unit performance matrix.
 *
 * Hand-transcribed from the COOLEX "PERFORMANCE DATA TABLES" catalogue pages
 * (2-Row, 3-Row and 4-Row cooling coils). Each coil-row variant is indexed by:
 *   • Base model      — 02, 03, 04, 05, 06, 08, 10, 12
 *   • Fan speed       — HI / MED / LOW
 *   • External static — 0.0 / 0.1 / 0.2 in. WG
 *
 * Rating basis (single catalogue thermal condition):
 *   • Air on-coil ............ 80 / 67 °F DBT/WBT          (26.7 / 19.4 °C)
 *   • Entering / leaving water 45 / 55 °F                  (7.2 / 12.78 °C)
 *
 * Each cell stores: Total Capacity (Btu/h), Sensible Capacity (Btu/h),
 * Water Flow (GPM) and Water Pressure Drop (ft H₂O). The catalogue also prints
 * a "T.R" (tons) column for the two capacities — that is simply Btu/h ÷ 12000
 * and is derived in code (see toPoint) rather than stored, so it can never drift
 * from the Btu/h value.
 *
 * ──────────────────────────────────────────────────────────────────────────
 * DATA CONFIDENCE (source = catalogue screenshots, hand-transcribed):
 *   • Total / Sensible capacity & GPM .... high — large, legible figures, and
 *     every "model-N LOW = model-(N-1) HI" shared-airflow row cross-checks
 *     exactly across all three ESP columns.
 *   • Water Pressure Drop (WPD) .......... medium — the small two-decimal column
 *     is at the limit of the screenshot resolution. Within each model WPD is
 *     monotonic (HI ≥ MED ≥ LOW, ESP0 ≥ ESP0.1 ≥ ESP0.2). Verify the last digit
 *     against the printed catalogue before using for a real quotation.
 *
 * NOTE: the capacity step between models 04 and 05 (and the comparatively low
 * WPD of the 2-row 05–08 sizes) is present in the source catalogue — those
 * sizes use a different coil circuiting, so capacity/WPD are not strictly
 * monotonic across model numbers. This is intentional, not a transcription slip.
 * ──────────────────────────────────────────────────────────────────────────
 */

export const FCL_BASES = ['02', '03', '04', '05', '06', '08', '10', '12'] as const;
export const FCL_SPEEDS = ['HI', 'MED', 'LOW'] as const;
export const FCL_ESP_INWG = [0, 0.1, 0.2] as const;
export const FCL_ROWS = [2, 3, 4] as const;

export type FCLSpeed = (typeof FCL_SPEEDS)[number];
export type FCLRows = (typeof FCL_ROWS)[number];

export interface FCLPerfPoint {
  totalCapacityBtuh: number;
  sensibleCapacityBtuh: number;
  totalCapacityTR: number;
  sensibleCapacityTR: number;
  waterFlowGPM: number;
  waterPressureDropFtH2O: number;
}

// Compact source form: [totalBtuh, sensibleBtuh, gpm, wpd].
type Cell = [number, number, number, number];
// Three cells per speed, in ESP order [0.0, 0.1, 0.2].
type SpeedBlock = Record<FCLSpeed, [Cell, Cell, Cell]>;
type RowTable = Record<string, SpeedBlock>;

// ── 2-ROW COOLING COIL ──────────────────────────────────────
const RAW_2ROW: RowTable = {
  '02': {
    HI:  [[8803, 5649, 1.8, 5.83], [7958, 5649, 1.62, 5.27], [7207, 5116, 1.47, 4.79]],
    MED: [[8300, 5865, 1.57, 5.27], [7517, 5311, 1.42, 4.78], [6807, 4810, 1.28, 4.32]],
    LOW: [[7322, 5495, 1.35, 4.73], [7084, 4968, 1.3, 4.45], [6119, 4510, 1.1, 4.18]],
  },
  '03': {
    HI:  [[9439, 6743, 1.8, 5.59], [8565, 6119, 1.65, 5.08], [7757, 5541, 1.48, 4.62]],
    MED: [[8841, 6281, 1.8, 5.59], [7993, 5678, 1.62, 5.02], [7238, 5145, 1.47, 4.82]],
    LOW: [[8265, 5836, 1.55, 5.22], [7485, 5295, 1.63, 4.72], [6779, 4786, 1.47, 4.28]],
  },
  '04': {
    HI:  [[10056, 7228, 1.8, 6.97], [9091, 6535, 1.92, 6.66], [8225, 5911, 1.47, 6.18]],
    MED: [[9130, 6508, 1.8, 6.25], [8268, 5896, 1.62, 5.65], [7388, 5266, 1.45, 4.95]],
    LOW: [[8304, 5896, 1.55, 5.61], [7308, 5308, 1.4, 4.84], [6296, 5145, 1.45, 4.45]],
  },
  '05': {
    HI:  [[10692, 7874, 2.24, 1.46], [9257, 6817, 1.94, 1.26], [7842, 5775, 1.65, 1.07]],
    MED: [[9626, 7051, 2.01, 1.22], [7938, 5814, 1.66, 1.01], [6725, 4926, 1.41, 0.85]],
    LOW: [[8623, 6277, 1.36, 1.04], [7090, 5132, 1.47, 0.82], [5972, 4348, 1.24, 0.69]],
  },
  '06': {
    HI:  [[12597, 8996, 2.99, 1.95], [11197, 8052, 2.39, 1.73], [9070, 6700, 2.13, 1.54]],
    MED: [[11943, 8672, 2.49, 1.83], [10317, 7664, 2.15, 1.58], [9186, 6086, 1.92, 1.4]],
    LOW: [[11127, 8218, 2.04, 1.57], [9575, 7072, 1.96, 1.38], [8240, 6086, 1.6, 1.24]],
  },
  '08': {
    HI:  [[14683, 11109, 3.14, 2.56], [13007, 9841, 2.78, 2.27], [11750, 8890, 2.51, 2.05]],
    MED: [[14502, 10605, 3.01, 2.36], [12597, 9352, 2.85, 2.07], [10575, 7951, 2.28, 1.79]],
    LOW: [[12597, 9596, 2.69, 1.95], [11197, 8352, 2.33, 1.72], [9437, 6113, 2.13, 1.54]],
  },
  '10': {
    HI:  [[24947, 17813, 4.99, 10.51], [22304, 15926, 4.41, 9.39], [19977, 14264, 3.95, 8.41]],
    MED: [[23649, 16804, 4.73, 9.58], [20764, 14754, 4.15, 8.41], [18599, 13216, 3.72, 7.54]],
    LOW: [[21678, 15650, 4.49, 8.93], [19164, 13754, 3.93, 7.41], [17022, 12219, 3.51, 6.57]],
  },
  '12': {
    HI:  [[27360, 19722, 5.39, 12.43], [24840, 17283, 4.79, 11.02], [21192, 15735, 4.17, 9.58]],
    MED: [[25103, 17944, 4.85, 10.86], [22849, 16043, 4.34, 9.58], [20122, 14369, 3.89, 8.54]],
    LOW: [[23565, 16733, 4.49, 9.5], [20690, 14692, 3.94, 8.34], [18533, 13160, 3.55, 7.45]],
  },
};

// ── 3-ROW COOLING COIL ──────────────────────────────────────
const RAW_3ROW: RowTable = {
  '02': {
    HI:  [[11116, 7587, 1.8, 4.3], [10050, 6849, 2.03, 3.89], [9101, 6195, 1.84, 3.52]],
    MED: [[10414, 7053, 2.01, 3.94], [9431, 6396, 1.82, 3.56], [8541, 5793, 1.65, 3.23]],
    LOW: [[9748, 6583, 1.8, 3.41], [8966, 5952, 1.65, 3.09], [7993, 5399, 1.47, 2.8]],
  },
  '03': {
    HI:  [[12013, 8221, 2.24, 4.46], [10901, 7460, 2.04, 4.48], [9872, 6756, 1.84, 3.65]],
    MED: [[11172, 7611, 2.24, 4.36], [10100, 6886, 2.03, 3.94], [9147, 6232, 1.84, 3.57]],
    LOW: [[10363, 7024, 2.04, 3.85], [9385, 6336, 1.84, 3.49], [8499, 5761, 1.65, 3.18]],
  },
  '04': {
    HI:  [[12990, 8866, 2.69, 5.59], [11654, 8016, 2.43, 5.05], [10541, 7250, 2.2, 4.57]],
    MED: [[12130, 8246, 2.48, 4.99], [10889, 7079, 2.2, 4.07], [9873, 6403, 1.99, 3.77]],
    LOW: [[10419, 7064, 2.24, 4.28], [9436, 6390, 2.03, 3.47], [8528, 5779, 1.84, 3.15]],
  },
  '05': {
    HI:  [[16285, 11150, 3.14, 4.7], [14099, 9636, 2.78, 3.96], [12559, 8576, 2.49, 3.45]],
    MED: [[14670, 9982, 2.91, 3.86], [12791, 8674, 2.49, 3.45], [11640, 7882, 2.24, 2.75]],
    LOW: [[13150, 8983, 2.69, 3.23], [11193, 7262, 2.2, 2.92], [10248, 6915, 1.99, 2.55]],
  },
  '06': {
    HI:  [[19036, 13416, 4.04, 5.84], [17186, 12096, 3.59, 5.16], [15466, 10618, 3.23, 4.55]],
    MED: [[18395, 12652, 3.84, 5.06], [16091, 11019, 3.36, 4.45], [14583, 9716, 2.86, 3.86]],
    LOW: [[16071, 11654, 3.24, 5.06], [14604, 10029, 3.05, 4.46], [12568, 8631, 2.68, 3.75]],
  },
  '08': {
    HI:  [[22790, 16050, 4.49, 8.5], [20186, 14218, 3.99, 7.53], [18037, 12644, 3.59, 6.8]],
    MED: [[21774, 15275, 4.49, 7.87], [19238, 13132, 3.99, 6.97], [15986, 11481, 3.57, 5.66]],
    LOW: [[19534, 13415, 4.49, 7.32], [16810, 11249, 3.48, 5.66], [14466, 9881, 2.99, 3.24]],
  },
  '10': {
    HI:  [[31062, 21859, 5.86, 7.19], [26446, 17994, 4.99, 5.86], [23690, 16118, 4.61, 5.65]],
    MED: [[28023, 19667, 5.39, 6.31], [24555, 16616, 4.72, 5.53], [21525, 14566, 4.14, 4.85]],
    LOW: [[25405, 17600, 4.99, 5.5], [22600, 15400, 4.5, 5], [20000, 13600, 4, 4.4]],
  },
  '12': {
    HI:  [[35405, 24367, 7.18, 9.59], [30991, 21347, 6.29, 8.24], [27123, 18661, 5.55, 7.1]],
    MED: [[32187, 22012, 6.39, 8.06], [28277, 19200, 5.7, 6.9], [25774, 17400, 5.11, 6.44]],
    LOW: [[29994, 20364, 7.11, 8.4], [26535, 18000, 6.3, 7.4], [23800, 16100, 5.6, 6.5]],
  },
};

// ── 4-ROW COOLING COIL ──────────────────────────────────────
const RAW_4ROW: RowTable = {
  '02': {
    HI:  [[12676, 8423, 3.27, 2.69], [11460, 7615, 2.95, 2.43], [10378, 6896, 2.68, 2.68]],
    MED: [[11814, 7829, 2.69, 2.9], [10699, 7090, 2.23, 2.62], [9690, 6421, 2.22, 2.38]],
    LOW: [[10995, 7264, 2.24, 2.54], [9957, 6578, 2.03, 2.33], [9018, 5958, 1.84, 2.09]],
  },
  '03': {
    HI:  [[13786, 9196, 2.69, 3.31], [12510, 8346, 2.44, 3.44], [11329, 7559, 2.21, 3.11]],
    MED: [[12749, 8477, 2.69, 3.31], [11525, 7663, 2.44, 2.99], [10438, 6940, 2.2, 2.71]],
    LOW: [[11750, 7782, 2.69, 2.96], [10641, 7038, 2.44, 2.59], [9637, 6382, 2.21, 2.34]],
  },
  '04': {
    HI:  [[14879, 9968, 3.14, 4.34], [13452, 9012, 2.84, 3.57], [12167, 8151, 2.57, 3.54]],
    MED: [[13413, 8837, 3.07, 3.57], [11963, 7906, 2.39, 3.19], [10730, 7151, 2.16, 2.99]],
    LOW: [[11817, 7829, 2.69, 2.96], [10665, 7082, 2.03, 2.36], [9668, 6405, 1.84, 2.36]],
  },
  '05': {
    HI:  [[18687, 12474, 3.59, 4.32], [16178, 10799, 3.11, 3.5], [13706, 9149, 2.83, 2.97]],
    MED: [[16711, 11102, 3.56, 3.35], [13780, 9154, 2.76, 2.76], [11674, 7755, 2.35, 2.55]],
    LOW: [[14852, 9810, 3.14, 2.83], [12142, 8020, 2.27, 2.21], [10287, 6794, 2.18, 2.04]],
  },
  '06': {
    HI:  [[22479, 15172, 4.49, 5.7], [19981, 13486, 3.99, 4.49], [17792, 12008, 3.55, 4.43]],
    MED: [[21170, 14238, 4.29, 5.05], [18681, 12544, 3.79, 4.37], [16082, 10951, 3.3, 4.06]],
    LOW: [[19534, 13072, 4.04, 4.37], [16810, 11249, 3.48, 3.99], [14466, 9681, 2.99, 3.24]],
  },
  '08': {
    HI:  [[26825, 18340, 5.39, 7.04], [23763, 16246, 4.99, 6.77], [21466, 14676, 4.31, 6.1]],
    MED: [[25547, 17408, 5.12, 7.04], [21953, 14968, 4.49, 4.98], [19201, 13084, 4.55, 5.3]],
    LOW: [[22479, 15172, 4.49, 5.7], [19981, 13486, 3.99, 4.98], [17792, 12008, 3.55, 4.43]],
  },
  '10': {
    HI:  [[36869, 24532, 7.18, 4.93], [32968, 21933, 6.59, 4.93], [29524, 19645, 5.75, 4.93]],
    MED: [[34601, 22948, 6.75, 5.53], [30380, 20040, 6.09, 5.53], [27212, 18048, 5.43, 4.35]],
    LOW: [[32007, 21137, 6.55, 5.86], [28040, 18517, 5.94, 4.85], [24580, 16232, 4.83, 3.69]],
  },
  '12': {
    HI:  [[41193, 27598, 8.06, 7.49], [38057, 24155, 7.07, 8.56], [31907, 21375, 6.2, 5.93]],
    MED: [[37174, 24759, 7.28, 7.49], [33235, 22136, 6.57, 6.56], [29768, 19831, 5.86, 5.03]],
    LOW: [[34435, 22904, 5.46, 7.11], [30234, 20041, 5.94, 4.8], [27082, 17993, 5.32, 3.59]],
  },
};

const RAW_BY_ROWS: Record<FCLRows, RowTable> = {
  2: RAW_2ROW,
  3: RAW_3ROW,
  4: RAW_4ROW,
};

// ── Lookup helpers ──────────────────────────────────────────────────────────

const tr = (btuh: number) => Math.round((btuh / 12000) * 10) / 10;

function toPoint(c: Cell): FCLPerfPoint {
  return {
    totalCapacityBtuh: c[0],
    sensibleCapacityBtuh: c[1],
    totalCapacityTR: tr(c[0]),
    sensibleCapacityTR: tr(c[1]),
    waterFlowGPM: c[2],
    waterPressureDropFtH2O: c[3],
  };
}

/** Parse "FCL-04-3R" → { base: "04", rows: 3 }. */
export function parseFCLModel(modelNumber: string): { base: string; rows: FCLRows } | null {
  const m = /^FCL-(\d{2})-([234])R$/.exec(modelNumber);
  if (!m) return null;
  return { base: m[1], rows: Number(m[2]) as FCLRows };
}

/** Build the FCL model number for a base + coil-row count. */
export function fclModelNumber(base: string, rows: FCLRows): string {
  return `FCL-${base}-${rows}R`;
}

const espIndex = (espInWG: number) => {
  // Snap to the nearest tabulated ESP step (0.0 / 0.1 / 0.2).
  let best = 0;
  let bestErr = Infinity;
  FCL_ESP_INWG.forEach((e, i) => {
    const err = Math.abs(e - espInWG);
    if (err < bestErr) {
      bestErr = err;
      best = i;
    }
  });
  return best;
};

/** Single FCL performance point for a model at a given speed + external static. */
export function getFCLPerfPoint(
  modelNumber: string,
  speed: FCLSpeed,
  espInWG: number,
): FCLPerfPoint | undefined {
  const parsed = parseFCLModel(modelNumber);
  if (!parsed) return undefined;
  const block = RAW_BY_ROWS[parsed.rows]?.[parsed.base];
  if (!block) return undefined;
  return toPoint(block[speed][espIndex(espInWG)]);
}

/**
 * Full catalogue matrix for one FCL model:
 *   matrix[speed][espInWG] = FCLPerfPoint
 * Used by the FCL performance panel to reproduce the printed table.
 */
export function getFCLMatrix(
  modelNumber: string,
): Record<FCLSpeed, Record<number, FCLPerfPoint>> | null {
  const parsed = parseFCLModel(modelNumber);
  if (!parsed) return null;
  return getFCLMatrixByRows(parsed.base, parsed.rows);
}

/** Catalogue matrix for an explicit base + coil-row count (panel row toggle). */
export function getFCLMatrixByRows(
  base: string,
  rows: FCLRows,
): Record<FCLSpeed, Record<number, FCLPerfPoint>> | null {
  const block = RAW_BY_ROWS[rows]?.[base];
  if (!block) return null;
  const out = {} as Record<FCLSpeed, Record<number, FCLPerfPoint>>;
  for (const speed of FCL_SPEEDS) {
    out[speed] = {};
    FCL_ESP_INWG.forEach((esp, i) => {
      out[speed][esp] = toPoint(block[speed][i]);
    });
  }
  return out;
}

// ── Model list ──────────────────────────────────────────────────────────────
// One Model per base × coil-row variant (24 total), mirroring how NGW exposes a
// model per coil-row (D3/D4). The catalogue rating point is HI @ 0 in.WG ESP.
// Airflow is not printed in the catalogue, so it is derived from the rated
// sensible capacity (Qs = 1.08 · CFM · ΔTdb, ΔTdb ≈ 22 °F) as a nominal value.

export interface FCLModelSpec extends Model {
  coilRows: FCLRows;
  baseModel: string;
  waterFlowGPM: number;
  waterPressureDropFtH2O: number;
}

function buildFCLModels(): FCLModelSpec[] {
  const models: FCLModelSpec[] = [];
  for (const base of FCL_BASES) {
    for (const rows of FCL_ROWS) {
      const rating = toPoint(RAW_BY_ROWS[rows][base].HI[0]); // HI @ 0 ESP
      const cfm = Math.round(rating.sensibleCapacityBtuh / (1.08 * 22));
      const modelNumber = fclModelNumber(base, rows);
      models.push({
        id: modelNumber,
        seriesId: 'fcl',
        modelNumber,
        coilRows: rows,
        baseModel: base,
        totalCapacityBtuh: rating.totalCapacityBtuh,
        sensibleCapacityBtuh: rating.sensibleCapacityBtuh,
        nominalTons: rating.totalCapacityTR,
        airflowCFM: cfm,
        waterFlowGPM: rating.waterFlowGPM,
        waterPressureDropFtH2O: rating.waterPressureDropFtH2O,
        matrixWaterFlowGPM: rating.waterFlowGPM,
        matrixWaterPressureDropFtH2O: rating.waterPressureDropFtH2O,
        powerKW: Math.round(rating.totalCapacityTR * 0.12 * 100) / 100,
        eer: 0,
        leavingDBF: 57,
        leavingWBF: 55,
        compressorCount: 0,
        matchPercent: 100,
        weightLbs: Math.round(rating.totalCapacityTR * 60 + 80),
        lengthIn: Math.round(rating.totalCapacityTR * 6 + 30),
        widthIn: Math.round(rating.totalCapacityTR * 2 + 18),
        heightIn: Math.round(rating.totalCapacityTR * 1.5 + 16),
        refrigerant: 'Chilled Water',
      });
    }
  }
  return models;
}

export const FCL_MODELS: FCLModelSpec[] = buildFCLModels();

// Re-export raw tables for any future validator (not used at runtime).
export const __RAW_2ROW = RAW_2ROW;
export const __RAW_3ROW = RAW_3ROW;
export const __RAW_4ROW = RAW_4ROW;
