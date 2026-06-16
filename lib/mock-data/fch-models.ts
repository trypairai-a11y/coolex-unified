import type { Model } from '@/types/product';

// FCH Chilled-Water Fan Coil Unit performance data.
// Source: COOLEX "FCH Performance Data — Cooling" catalogue tables
// (2-Rows and 3-Rows cooling coil), hand-transcribed from the printed sheet.
//
// Rating basis (single catalogue condition — see note at the foot of the page):
//   • Air on-coil ............ 80 / 67 °F DBT/WBT  (26.7 / 19.4 °C)
//   • Entering / leaving water 45 / 55 °F          (7.2 / 12.78 °C)
//
// Unlike the chiller / CCU matrices (which sweep two temperatures), the FCH
// catalogue sweeps two MECHANICAL axes at that fixed thermal condition:
//   • Fan speed ............ HI / MED / LOW   (rows)
//   • External static press. 0 / 0.2 / 0.4 in. WG  (columns)
//
// Each cell stores Total Capacity (Btu/h), Sensible Capacity (Btu/h),
// Water Flow (GPM) and Water Pressure Drop (ft H₂O). Each cabinet size is
// offered in a 2-row and a 3-row coil; these are modelled as separate model
// numbers (FCH-08-2R / FCH-08-3R …), mirroring the way CCU tonnages are
// separate models.
//
// Cabinet size → nominal airflow: 08 → 800 CFM … 20 → 2000 CFM
// (matches the series' 800–2,000 CFM range). Capacity / flow / WPD are the
// catalogue values; structural dimensions and fan power are mock estimates.

export interface FCHPerformancePoint {
  totalCapacityBtuh: number;
  sensibleCapacityBtuh: number;
  waterFlowGPM: number;
  waterPressureDropFtH2O: number;
}

export type FCHSpeed = 'HI' | 'MED' | 'LOW';

// performance[speed][espInWG] → point
export type FCHPerformanceMatrix = Record<string, Record<string, FCHPerformancePoint>>;

export interface FCHModelSpec extends Model {
  refrigerant: string;
  coilRows: number;
  fanSpeeds: FCHSpeed[];
  performance: FCHPerformanceMatrix;
}

export const FCH_SPEEDS: FCHSpeed[] = ['HI', 'MED', 'LOW'];
export const FCH_ESP_INWG = [0, 0.2, 0.4] as const;

export const FCH_RATING_NOTE =
  'Data based on 80/67 °F (26.7/19.4 °C) air on-coil DBT/WBT and 45/55 °F (7.2/12.78 °C) entering/leaving water temperature.';

// Compact source form: [total Btu/h, sensible Btu/h, GPM, WPD ft H₂O].
// Each speed row holds three cells in ESP order: 0 → 0.2 → 0.4 in. WG.
type Cell = [number, number, number, number];
type SpeedRows = Record<FCHSpeed, [Cell, Cell, Cell]>;

// ── 2-ROW COOLING COIL ──────────────────────────────────────────────────────
const RAW_2ROW: Record<string, SpeedRows> = {
  '08': {
    HI:  [[25974, 18853, 5.19, 10.95], [23732, 17054, 4.75, 9.34], [20172, 14259, 4.03, 7.01]],
    MED: [[25115, 18171, 5.02, 10.31], [22966, 16458, 4.59, 8.82], [19744, 13935, 3.95, 6.75]],
    LOW: [[23877, 17197, 4.78, 9.43],  [21529, 15345, 4.31, 7.86], [17877, 12533, 3.58, 5.67]],
  },
  '10': {
    HI:  [[26708, 19448, 5.34, 11.50], [24429, 17610, 4.89, 9.83], [20804, 14750, 4.16, 7.40]],
    MED: [[25684, 18631, 5.14, 10.67], [23507, 16888, 4.70, 9.19], [20236, 14317, 4.05, 7.05]],
    LOW: [[24276, 17519, 4.86, 9.67],  [21897, 15639, 4.38, 8.12], [18210, 12790, 3.64, 5.85]],
  },
  '12': {
    HI:  [[33052, 23975, 6.61, 19.65], [30581, 21982, 6.12, 17.12], [27329, 19406, 5.47, 14.06]],
    MED: [[32230, 23319, 6.45, 18.79], [29739, 21322, 5.95, 16.29], [26452, 18733, 5.29, 13.27]],
    LOW: [[31272, 22561, 6.25, 17.82], [28673, 20491, 5.73, 15.27], [25187, 17770, 5.04, 12.19]],
  },
  '14': {
    HI:  [[33792, 24577, 6.76, 20.43], [31292, 22552, 6.34, 17.85], [27986, 19922, 5.60, 14.67]],
    MED: [[32759, 23750, 6.55, 19.37], [30295, 21767, 6.06, 16.85], [26912, 19096, 5.38, 13.69]],
    LOW: [[31595, 22825, 6.32, 18.18], [28986, 20744, 5.58, 15.59], [25464, 17990, 5.05, 12.42]],
  },
  '16': {
    HI:  [[40235, 29501, 8.05, 17.00], [38245, 27869, 7.65, 15.55], [34494, 24838, 6.90, 12.07]],
    MED: [[39594, 28981, 7.92, 16.08], [37383, 27182, 7.48, 14.97], [33429, 24003, 6.69, 12.27]],
    LOW: [[38720, 28276, 7.74, 15.82], [36586, 26542, 7.32, 14.38], [33002, 23669, 6.60, 12.00]],
  },
  '20': {
    HI:  [[47767, 34947, 9.55, 17.74], [45545, 33082, 9.10, 15.36], [42727, 30581, 8.55, 13.76]],
    MED: [[46561, 33974, 9.31, 16.97], [44306, 32141, 8.86, 14.66], [41790, 29848, 8.36, 14.14]],
    LOW: [[45394, 33035, 9.08, 16.23], [43066, 31155, 8.61, 14.02], [40381, 28751, 8.08, 13.30]],
  },
};

// ── 3-ROW COOLING COIL ──────────────────────────────────────────────────────
const RAW_3ROW: Record<string, SpeedRows> = {
  '08': {
    HI:  [[34271, 23770, 6.85, 8.74], [30993, 21300, 6.20, 7.32], [25862, 17518, 5.17, 5.32]],
    MED: [[33137, 22910, 6.63, 8.23], [29993, 20555, 6.00, 6.91], [25313, 17120, 5.06, 5.12]],
    LOW: [[31504, 21682, 6.30, 7.53], [28116, 19166, 5.62, 6.16], [22920, 15398, 4.58, 4.30]],
  },
  '10': {
    HI:  [[35351, 24594, 7.07, 9.28], [32008, 22060, 6.40, 7.74], [26766, 18177, 5.35, 5.65]],
    MED: [[33996, 23561, 6.80, 8.61], [30800, 21156, 6.16, 7.24], [26035, 17644, 5.21, 5.38]],
    LOW: [[32132, 22154, 6.43, 7.80], [28691, 19591, 5.74, 6.39], [23429, 15762, 4.69, 4.47]],
  },
  '12': {
    HI:  [[42133, 29375, 8.43, 9.58], [38649, 26721, 7.73, 8.23], [34109, 23326, 6.82, 6.60]],
    MED: [[41085, 28571, 8.22, 9.16], [37585, 25919, 7.52, 7.83], [33014, 22517, 6.60, 6.23]],
    LOW: [[39864, 27642, 7.97, 8.69], [36237, 24909, 7.25, 7.34], [31436, 21359, 6.29, 5.72]],
  },
  '14': {
    HI:  [[43181, 30181, 8.64, 9.99], [39649, 27478, 7.93, 8.61], [35022, 24002, 7.00, 6.92]],
    MED: [[41861, 29165, 8.37, 9.47], [38386, 26552, 7.68, 8.13], [33678, 23007, 6.74, 6.46]],
    LOW: [[40373, 28029, 8.07, 8.89], [36727, 25275, 7.35, 7.52], [31866, 21674, 6.37, 5.86]],
  },
  '16': {
    HI:  [[54633, 38136, 10.93, 17.32], [51630, 35827, 10.33, 15.68], [46019, 31578, 9.20, 12.80]],
    MED: [[53762, 37464, 10.75, 16.38], [50473, 34944, 10.09, 15.10], [44598, 30517, 8.92, 12.11]],
    LOW: [[52576, 36552, 10.52, 16.12], [49390, 34121, 9.88, 14.50], [44028, 30092, 8.81, 11.84]],
  },
  '20': {
    HI:  [[63678, 44480, 12.74, 13.60], [60304, 41887, 12.06, 12.36], [56248, 38805, 11.25, 10.24]],
    MED: [[62070, 43241, 12.41, 13.01], [58741, 40695, 11.75, 11.80], [55014, 37875, 11.00, 9.90]],
    LOW: [[60514, 42047, 12.10, 12.44], [57097, 39447, 11.42, 11.27], [53159, 36483, 10.63, 9.50]],
  },
};

const BTUH_PER_TON = 12000;
const STD_EDB = 80; // °F entering dry bulb (catalogue condition)
const STD_EWB_ENTHALPY = 31.4; // Btu/lb air at 67 °F WB

function cellToPoint(c: Cell): FCHPerformancePoint {
  return {
    totalCapacityBtuh: c[0],
    sensibleCapacityBtuh: c[1],
    waterFlowGPM: c[2],
    waterPressureDropFtH2O: c[3],
  };
}

function buildMatrix(rows: SpeedRows): FCHPerformanceMatrix {
  const out: FCHPerformanceMatrix = {};
  for (const speed of FCH_SPEEDS) {
    out[speed] = {};
    FCH_ESP_INWG.forEach((esp, i) => {
      out[speed][String(esp)] = cellToPoint(rows[speed][i]);
    });
  }
  return out;
}

/** Approximate leaving DB/WB from the rated sensible/total split and airflow. */
function leavingConditions(totalBtuh: number, sensibleBtuh: number, cfm: number) {
  // Sensible heat: Q_s = 1.08 · CFM · ΔT  →  leaving DB.
  const leavingDBF = STD_EDB - sensibleBtuh / (1.08 * cfm);
  // Total heat: Q_t = 4.5 · CFM · Δh  →  leaving air enthalpy → WB (linear fit
  // of saturated-air enthalpy vs WB across ~50–65 °F).
  const leavingEnthalpy = STD_EWB_ENTHALPY - totalBtuh / (4.5 * cfm);
  const leavingWBF = 50 + (leavingEnthalpy - 20.3) / 0.653;
  return {
    leavingDBF: Math.round(leavingDBF * 10) / 10,
    leavingWBF: Math.round(leavingWBF * 10) / 10,
  };
}

function buildModel(size: string, coilRows: number, rows: SpeedRows): FCHModelSpec {
  const performance = buildMatrix(rows);
  // Nominal rating point: HI speed, 0 ESP (catalogue maximum for the size).
  const rated = performance['HI']['0'];
  const airflowCFM = parseInt(size, 10) * 100;
  const nominalTons = Math.round((rated.totalCapacityBtuh / BTUH_PER_TON) * 100) / 100;
  const { leavingDBF, leavingWBF } = leavingConditions(
    rated.totalCapacityBtuh,
    rated.sensibleCapacityBtuh,
    airflowCFM,
  );
  // Fan-coil: no compressor; small fan motor scaled by airflow.
  const powerKW = Math.round((airflowCFM / 1000) * 0.3 * 100) / 100;

  return {
    id: `fch-${size}-${coilRows}r`,
    seriesId: 'fch',
    modelNumber: `FCH-${size}-${coilRows}R`,
    coilRows,
    nominalTons,
    totalCapacityBtuh: rated.totalCapacityBtuh,
    sensibleCapacityBtuh: rated.sensibleCapacityBtuh,
    airflowCFM,
    powerKW,
    eer: 0, // fan coil — no compressor, EER not applicable
    leavingDBF,
    leavingWBF,
    compressorCount: 0,
    matchPercent: 100,
    weightLbs: Math.round(airflowCFM * 0.12 + 80),
    lengthIn: Math.round(airflowCFM / 40 + 24),
    widthIn: Math.round(airflowCFM / 120 + 18),
    heightIn: coilRows === 3 ? 24 : 22,
    refrigerant: 'Chilled Water',
    fanSpeeds: FCH_SPEEDS,
    performance,
    // Surface the rated water-side values; recomputed at the design ESP in models.ts.
    matrixWaterFlowGPM: rated.waterFlowGPM,
    matrixWaterPressureDropFtH2O: rated.waterPressureDropFtH2O,
  };
}

export const FCH_MODELS: FCHModelSpec[] = [
  ...Object.entries(RAW_2ROW).map(([size, rows]) => buildModel(size, 2, rows)),
  ...Object.entries(RAW_3ROW).map(([size, rows]) => buildModel(size, 3, rows)),
];

// ── Lookup / interpolation ──────────────────────────────────────────────────

/**
 * Find the two tabulated grid values that bracket a target. Clamps to the
 * range edges when the target is outside the table.
 */
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
 * Look up an FCH performance point by fan speed and external static pressure
 * (in. WG). Fan speed is categorical (HI/MED/LOW); ESP is linearly interpolated
 * between the tabulated columns and clamped to the 0–0.4 in. WG range.
 */
export function getFCHPerformance(
  modelNumber: string,
  espInWG: number,
  speed: FCHSpeed = 'HI',
): FCHPerformancePoint | undefined {
  const model = FCH_MODELS.find(m => m.modelNumber === modelNumber);
  if (!model) return undefined;
  const speedRow = model.performance[speed];
  if (!speedRow) return undefined;

  const { lo, hi, t } = bracket(espInWG, FCH_ESP_INWG);
  const p0 = speedRow[String(lo)];
  const p1 = speedRow[String(hi)];
  if (!p0 || !p1) return undefined;

  const blend = (k: keyof FCHPerformancePoint) => lerp(p0[k], p1[k], t);
  return {
    totalCapacityBtuh: blend('totalCapacityBtuh'),
    sensibleCapacityBtuh: blend('sensibleCapacityBtuh'),
    waterFlowGPM: blend('waterFlowGPM'),
    waterPressureDropFtH2O: blend('waterPressureDropFtH2O'),
  };
}
