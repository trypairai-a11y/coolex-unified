/**
 * Validates the FAPU performance matrix for physical consistency and flags
 * likely transcription errors. Run: npx tsx scripts/validate-fapu.ts
 *
 * Hard checks (errors) per model:
 *   1. Total capacity strictly DECREASES as entering DB rises (95 → 125 °F).
 *   2. kW Input strictly INCREASES as entering DB rises.
 *   3. Total / Sensible / kW strictly INCREASE as airflow (CFM) rises.
 *   4. Sensible ≤ Total in every cell.
 * Soft checks (warnings):
 *   5. Sensible generally INCREASES with DB — may plateau/fall at 125 °F on the
 *      larger models, so a decrease is warned, not errored.
 *   6. Outlier: the middle CFM row deviates > THRESHOLD from the linear
 *      interpolation of its two CFM neighbours (same DB).
 */
import { FAPU_ENTERING_AIR_DB_F, FAPU_CFM_BY_MODEL, __RAW_FAPU } from '../lib/mock-data/fapu-performance';

type Cell = [number, number, number];
type RawTable = Record<string, Record<number, Cell[]>>;

const METRICS = ['total', 'sensible', 'kW'] as const;
const OUTLIER_PCT = 8; // % deviation from CFM-neighbour interpolation to flag

let errors = 0;
let warns = 0;
const err = (m: string) => { errors++; console.log('  ✖ ' + m); };
const warn = (m: string) => { warns++; console.log('  ⚠ ' + m); };

const DB = FAPU_ENTERING_AIR_DB_F;
const table = __RAW_FAPU as RawTable;

for (const model of Object.keys(table)) {
  console.log(`\n=== ${model} ===`);
  const cfms = FAPU_CFM_BY_MODEL[model];
  const rows = table[model];

  // Shape + sensible≤total
  for (const cfm of cfms) {
    const cells = rows[cfm];
    if (!cells) { err(`${model} @ ${cfm} CFM: missing row`); continue; }
    if (cells.length !== DB.length) err(`${model} @ ${cfm}: ${cells.length} cells, expected ${DB.length}`);
    cells.forEach((c, i) => {
      if (c[1] > c[0]) err(`${model} @ ${cfm}/${DB[i]}°F: sensible ${c[1]} > total ${c[0]}`);
    });
  }

  // 1/2/5. Trends across DB (per CFM): total ↓, kW ↑ (hard); sensible ↑ (soft)
  for (const cfm of cfms) {
    const cells = rows[cfm]; if (!cells) continue;
    for (let i = 1; i < cells.length; i++) {
      if (cells[i][0] >= cells[i - 1][0])
        err(`${model} @ ${cfm} CFM: total not decreasing ${DB[i - 1]}→${DB[i]}°F (${cells[i - 1][0]} → ${cells[i][0]})`);
      if (cells[i][2] <= cells[i - 1][2])
        err(`${model} @ ${cfm} CFM: kW not increasing ${DB[i - 1]}→${DB[i]}°F (${cells[i - 1][2]} → ${cells[i][2]})`);
      if (cells[i][1] < cells[i - 1][1])
        warn(`${model} @ ${cfm} CFM: sensible dips ${DB[i - 1]}→${DB[i]}°F (${cells[i - 1][1]} → ${cells[i][1]})`);
    }
  }

  // 3. Trends across CFM (per DB): total / sensible / kW all ↑ (hard)
  for (let d = 0; d < DB.length; d++) {
    for (let m = 0; m < 3; m++) {
      for (let j = 1; j < cfms.length; j++) {
        const prev = rows[cfms[j - 1]]?.[d][m];
        const cur = rows[cfms[j]]?.[d][m];
        if (prev == null || cur == null) continue;
        if (cur <= prev)
          err(`${model} @ ${DB[d]}°F: ${METRICS[m]} not increasing ${cfms[j - 1]}→${cfms[j]} CFM (${prev} → ${cur})`);
      }
    }
  }

  // 6. Outlier vs CFM-neighbour interpolation (interior CFM rows only)
  for (let j = 1; j < cfms.length - 1; j++) {
    const a = cfms[j - 1], b = cfms[j], c = cfms[j + 1];
    const t = (b - a) / (c - a);
    for (let d = 0; d < DB.length; d++) {
      for (let m = 0; m < 3; m++) {
        const va = rows[a]?.[d][m], vb = rows[b]?.[d][m], vc = rows[c]?.[d][m];
        if (va == null || vb == null || vc == null) continue;
        const expected = va + (vc - va) * t;
        const dev = expected === 0 ? 0 : Math.abs(vb - expected) / Math.abs(expected) * 100;
        if (dev > OUTLIER_PCT)
          warn(`${model} @ ${b} CFM / ${DB[d]}°F: ${METRICS[m]}=${vb} deviates ${dev.toFixed(1)}% from neighbour-interp ${expected.toFixed(1)}`);
      }
    }
  }
}

console.log(`\n${'─'.repeat(50)}`);
console.log(`Errors (monotonicity / physical): ${errors}`);
console.log(`Warnings (possible OCR outliers):  ${warns}`);
process.exit(errors > 0 ? 1 : 0);
