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

// ── 2-ROW COOLING COIL ──────────────────────────────────────────────────────
const RAW_2ROW: RowTable = {
  '02': {
    HI:  [[8803, 6249, 1.80, 5.83], [7958, 5649, 1.62, 5.27], [7207, 5116, 1.47, 4.77]],
    MED: [[8300, 5865, 1.57, 5.27], [7517, 5311, 1.42, 4.77], [6807, 4810, 1.28, 4.32]],
    LOW: [[7822, 5499, 1.35, 4.73], [7064, 4969, 1.25, 4.29], [6415, 4510, 1.10, 3.88]],
  },
  '03': {
    HI:  [[9439, 6743, 1.80, 6.59], [8565, 6119, 1.69, 5.98], [7757, 5541, 1.48, 5.42]],
    MED: [[8841, 6281, 1.80, 5.89], [7993, 5678, 1.62, 5.32], [7238, 5142, 1.47, 4.82]],
    LOW: [[8265, 5836, 1.80, 5.22], [7485, 5285, 1.63, 4.72], [6779, 4786, 1.47, 4.28]],
  },
  '04': {
    HI:  [[10056, 7228, 1.80, 7.37], [9091, 6505, 1.62, 6.66], [8223, 5911, 1.47, 6.03]],
    MED: [[9130, 6508, 1.80, 6.25], [8166, 5822, 1.61, 5.56], [7388, 5266, 1.45, 5.06]],
    LOW: [[8304, 5866, 1.80, 5.26], [7511, 5306, 1.62, 4.76], [6794, 4799, 1.47, 4.30]],
  },
  '05': {
    HI:  [[10692, 7874, 2.24, 1.46], [9257, 6817, 1.94, 1.26], [7842, 5775, 1.65, 1.07]],
    MED: [[9626, 7051, 2.01, 1.22], [7938, 5614, 1.66, 1.01], [6725, 4926, 1.41, 0.85]],
    LOW: [[8623, 6277, 1.80, 1.05], [7050, 5132, 1.47, 0.83], [5972, 4348, 1.24, 0.69]],
  },
  '06': {
    HI:  [[12597, 9396, 2.69, 1.95], [11197, 8352, 2.39, 1.73], [9970, 7437, 2.13, 1.54]],
    MED: [[11943, 8872, 2.49, 1.83], [10317, 7664, 2.15, 1.56], [9186, 6824, 1.92, 1.40]],
    LOW: [[11127, 8218, 2.24, 1.67], [9575, 7072, 1.93, 1.44], [8240, 6086, 1.66, 1.24]],
  },
  '08': {
    HI:  [[14683, 11109, 3.14, 2.56], [13007, 9841, 2.78, 2.27], [11750, 8890, 2.51, 2.05]],
    MED: [[14069, 10605, 3.01, 2.38], [12096, 9173, 2.59, 2.05], [10575, 7971, 2.26, 1.79]],
    LOW: [[12597, 9396, 2.69, 1.95], [11197, 8352, 2.39, 1.73], [9970, 7437, 2.13, 1.54]],
  },
  '10': {
    HI:  [[24947, 17813, 4.94, 10.51], [22304, 15926, 4.41, 9.39], [19977, 14264, 3.95, 8.41]],
    MED: [[23649, 16804, 4.73, 9.58], [20764, 14754, 4.15, 8.41], [18599, 13216, 3.72, 7.54]],
    LOW: [[22165, 15650, 4.49, 9.55], [19418, 13710, 3.93, 7.47], [17022, 12019, 3.45, 6.55]],
  },
  '12': {
    HI:  [[27360, 19722, 5.39, 12.36], [24189, 17263, 4.71, 10.82], [21192, 15276, 4.17, 9.58]],
    MED: [[25103, 17944, 4.85, 10.66], [22444, 16043, 4.34, 9.53], [20102, 14369, 3.89, 8.63]],
    LOW: [[23565, 16733, 4.49, 9.50], [20690, 14692, 3.94, 8.34], [18533, 13160, 3.53, 7.47]],
  },
};

// ── 3-ROW COOLING COIL ──────────────────────────────────────────────────────
const RAW_3ROW: RowTable = {
  '02': {
    HI:  [[11116, 7567, 2.24, 4.30], [10050, 6841, 2.03, 3.89], [9101, 6195, 1.84, 3.52]],
    MED: [[10414, 7063, 2.01, 3.85], [9431, 6396, 1.82, 3.48], [8541, 5793, 1.65, 3.16]],
    LOW: [[9746, 6583, 1.80, 3.41], [8826, 5962, 1.63, 3.09], [7993, 5399, 1.47, 2.80]],
  },
  '03': {
    HI:  [[12013, 8221, 2.24, 4.93], [10901, 7480, 2.04, 4.48], [9872, 6756, 1.84, 4.05]],
    MED: [[11172, 7611, 2.24, 4.36], [10100, 6881, 2.03, 3.94], [9147, 6232, 1.84, 3.57]],
    LOW: [[10363, 7024, 2.24, 3.80], [9365, 6361, 2.03, 3.44], [8499, 5761, 1.84, 3.12]],
  },
  '04': {
    HI:  [[12990, 8866, 2.69, 5.59], [11654, 8016, 2.43, 5.05], [10541, 7250, 2.20, 4.57]],
    MED: [[11583, 7913, 2.46, 4.66], [10362, 7079, 2.20, 4.17], [9373, 6403, 1.99, 3.77]],
    LOW: [[10418, 7064, 2.24, 3.84], [9423, 6390, 2.03, 3.47], [8524, 5779, 1.84, 3.14]],
  },
  '05': {
    HI:  [[16285, 11150, 3.14, 4.70], [14099, 9653, 2.72, 4.07], [11944, 8178, 2.30, 3.45]],
    MED: [[14670, 9982, 2.91, 3.94], [12097, 8231, 2.40, 3.25], [10248, 6973, 2.03, 2.75]],
    LOW: [[13150, 8883, 2.69, 3.23], [10751, 7282, 2.20, 2.64], [9108, 6152, 1.87, 2.23]],
  },
  '06': {
    HI:  [[19336, 13415, 4.04, 6.37], [17186, 11924, 3.59, 5.66], [15304, 10618, 3.20, 5.04]],
    MED: [[18285, 12632, 3.84, 5.78], [15794, 10911, 3.32, 5.00], [14063, 9716, 2.95, 4.45]],
    LOW: [[16971, 11654, 3.59, 5.06], [14604, 10029, 3.09, 4.35], [12568, 8631, 2.66, 3.75]],
  },
  '08': {
    HI:  [[22790, 16050, 4.49, 8.50], [20189, 14218, 3.96, 7.53], [18237, 12844, 3.59, 6.80]],
    MED: [[21774, 15275, 4.49, 7.87], [18720, 13132, 3.86, 6.77], [16366, 11481, 3.37, 5.92]],
    LOW: [[19336, 13415, 4.49, 6.37], [17186, 11924, 3.99, 5.66], [15304, 10618, 3.55, 5.04]],
  },
  '10': {
    HI:  [[31953, 21829, 6.28, 7.95], [28568, 19517, 5.62, 7.11], [25587, 17480, 5.03, 6.37]],
    MED: [[30122, 20494, 5.86, 7.19], [26448, 17994, 5.15, 6.31], [23690, 16118, 4.61, 5.65]],
    LOW: [[28029, 18967, 5.39, 6.31], [24555, 16616, 4.72, 5.53], [21525, 14566, 4.14, 4.85]],
  },
  '12': {
    HI:  [[35405, 24387, 7.16, 9.53], [30991, 21347, 6.29, 8.34], [27424, 18889, 5.56, 7.38]],
    MED: [[32187, 22012, 6.38, 8.09], [28777, 19660, 5.70, 7.23], [25774, 17627, 5.11, 6.48]],
    LOW: [[29994, 20394, 5.83, 7.11], [26535, 17906, 5.12, 6.24], [23589, 16039, 4.59, 5.59]],
  },
};

// ── 4-ROW COOLING COIL ──────────────────────────────────────────────────────
const RAW_4ROW: RowTable = {
  '02': {
    HI:  [[12676, 8423, 2.69, 3.27], [11460, 7615, 2.43, 2.95], [10378, 6896, 2.20, 2.68]],
    MED: [[11814, 7829, 2.46, 2.90], [10699, 7090, 2.23, 2.62], [9690, 6421, 2.02, 2.38]],
    LOW: [[10995, 7264, 2.24, 2.54], [9957, 6578, 2.03, 2.30], [9018, 5958, 1.84, 2.09]],
  },
  '03': {
    HI:  [[13786, 9198, 2.69, 3.79], [12510, 8346, 2.44, 3.44], [11329, 7559, 2.21, 3.11]],
    MED: [[12749, 8477, 2.69, 3.31], [11526, 7663, 2.43, 3.00], [10438, 6940, 2.20, 2.71]],
    LOW: [[11750, 7782, 2.69, 2.86], [10641, 7048, 2.44, 2.59], [9637, 6382, 2.21, 2.34]],
  },
  '04': {
    HI:  [[14879, 9968, 3.14, 4.34], [13452, 9012, 2.84, 3.92], [12167, 8151, 2.57, 3.54]],
    MED: [[13260, 8837, 2.67, 3.57], [11863, 7906, 2.39, 3.19], [10730, 7151, 2.16, 2.89]],
    LOW: [[11817, 7829, 2.24, 2.89], [10689, 7082, 2.03, 2.61], [9668, 6405, 1.84, 2.36]],
  },
  '05': {
    HI:  [[18687, 12474, 3.59, 4.05], [16178, 10799, 3.11, 3.50], [13706, 9149, 2.63, 2.97]],
    MED: [[16711, 11102, 3.36, 3.35], [13780, 9154, 2.77, 2.76], [11674, 7755, 2.35, 2.34]],
    LOW: [[14852, 9810, 3.14, 2.70], [12142, 8020, 2.57, 2.21], [10287, 6794, 2.18, 1.87]],
  },
  '06': {
    HI:  [[22479, 15172, 4.49, 5.60], [19981, 13486, 3.99, 4.98], [17792, 12008, 3.55, 4.43]],
    MED: [[21170, 14238, 4.29, 5.05], [18286, 12299, 3.70, 4.37], [16282, 10951, 3.30, 3.89]],
    LOW: [[19534, 13072, 4.11, 4.37], [16810, 11249, 3.48, 3.76], [14466, 9681, 2.99, 3.24]],
  },
  '08': {
    HI:  [[26825, 18340, 5.39, 7.65], [23763, 16246, 4.77, 6.77], [21466, 14676, 4.31, 6.12]],
    MED: [[25547, 17408, 5.12, 7.04], [21993, 14966, 4.40, 6.06], [19201, 13084, 3.85, 5.30]],
    LOW: [[22479, 15172, 4.49, 5.60], [19981, 13486, 3.99, 4.98], [17792, 12008, 3.55, 4.43]],
  },
  '10': {
    HI:  [[36869, 24532, 7.18, 6.16], [32963, 22034, 6.42, 5.51], [29524, 19645, 5.75, 4.93]],
    MED: [[34601, 22948, 6.76, 5.53], [30380, 20149, 5.94, 4.85], [27212, 18048, 5.32, 4.35]],
    LOW: [[32007, 21137, 6.28, 4.81], [28040, 18517, 5.50, 4.21], [24580, 16232, 4.83, 3.69]],
  },
  '12': {
    HI:  [[41193, 27596, 8.08, 7.49], [36057, 24155, 7.07, 6.56], [31907, 21375, 6.26, 5.80]],
    MED: [[37174, 24759, 7.28, 6.29], [33235, 22136, 6.51, 5.62], [29768, 19826, 5.83, 5.03]],
    LOW: [[34435, 22826, 6.73, 5.46], [30234, 20041, 5.91, 4.80], [27082, 17952, 5.29, 4.30]],
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
