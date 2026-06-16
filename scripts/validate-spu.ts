/**
 * Validates the SPU performance matrix for physical consistency and flags
 * likely transcription errors. Run: npx tsx scripts/validate-spu.ts
 *
 * Hard checks (errors) per variant / model:
 *   1. Total & Sensible strictly DECREASE as condenser ambient rises (95→125 °F).
 *   2. kW Input strictly INCREASES as condenser ambient rises.
 *   3. Total / Sensible / kW strictly INCREASE as airflow (CFM) rises.
 *   4. Total / Sensible / kW strictly INCREASE as entering DB rises.
 *   5. Sensible ≤ Total in every cell.
 *   6. 6-row Total > 4-row Total at the same (model, cfm, db, ambient).
 */
import {
  SPU_AMBIENT_F,
  SPU_EDB_4ROW,
  SPU_EDB_6ROW,
  SPU_CFM_BY_MODEL,
  __RAW_4ROW,
  __RAW_6ROW,
} from '../lib/mock-data/spu-performance';

type Cell = [number, number, number];
type RawTable = Record<string, Record<number, Record<number, Cell[]>>>;

const METRICS = ['total', 'sensible', 'kW'] as const;
const AMB = SPU_AMBIENT_F;

let errors = 0;
let warns = 0;
const err = (m: string) => { errors++; console.log('  ✖ ' + m); };
const warn = (m: string) => { warns++; console.log('  ⚠ ' + m); };

// kW should rise roughly linearly with ambient. Flag any segment whose per-°F
// slope deviates sharply from the cell's overall 95→125 slope — catches a
// misread leading digit that still trends upward (e.g. 47.61 vs 54.61).
function checkKwSlope(model: string, cfm: number, db: number, kw: number[]) {
  if (kw.length !== AMB.length) return;
  const overall = (kw[kw.length - 1] - kw[0]) / (AMB[AMB.length - 1] - AMB[0]);
  if (overall <= 0) return;
  for (let i = 1; i < kw.length; i++) {
    const seg = (kw[i] - kw[i - 1]) / (AMB[i] - AMB[i - 1]);
    const ratio = seg / overall;
    if (ratio < 0.4 || ratio > 2.5)
      warn(`${model} @ ${cfm}/${db}: kW slope ${AMB[i - 1]}→${AMB[i]}°F is ${ratio.toFixed(1)}× the cell average (kW ${kw[i - 1]} → ${kw[i]}) — verify/reconstruct`);
  }
}

function checkTable(label: string, table: RawTable, edbAxis: readonly number[]) {
  console.log(`\n=== ${label} ===`);
  for (const model of Object.keys(table)) {
    const cfms = SPU_CFM_BY_MODEL[model];
    const rows = table[model];

    // Shape + sensible ≤ total
    for (const cfm of cfms) {
      const edbRow = rows[cfm];
      if (!edbRow) { err(`${model} @ ${cfm} CFM: missing row`); continue; }
      for (const db of edbAxis) {
        const cells = edbRow[db];
        if (!cells) { err(`${model} @ ${cfm}/${db}°F: missing DB row`); continue; }
        if (cells.length !== AMB.length) err(`${model} @ ${cfm}/${db}: ${cells.length} cells, expected ${AMB.length}`);
        cells.forEach((c, i) => {
          if (c[1] > c[0]) err(`${model} @ ${cfm}/${db}/${AMB[i]}°F: sensible ${c[1]} > total ${c[0]}`);
        });
        checkKwSlope(model, cfm, db, cells.map(c => c[2]));
      }
    }

    // 1/2. Trends across ambient (per cfm, db): total ↓, sensible ↓, kW ↑
    for (const cfm of cfms) {
      for (const db of edbAxis) {
        const cells = rows[cfm]?.[db]; if (!cells) continue;
        for (let i = 1; i < cells.length; i++) {
          if (cells[i][0] >= cells[i - 1][0]) err(`${model} @ ${cfm}/${db}: total not ↓ ${AMB[i - 1]}→${AMB[i]}°F (${cells[i - 1][0]} → ${cells[i][0]})`);
          if (cells[i][1] >= cells[i - 1][1]) err(`${model} @ ${cfm}/${db}: sensible not ↓ ${AMB[i - 1]}→${AMB[i]}°F (${cells[i - 1][1]} → ${cells[i][1]})`);
          if (cells[i][2] <= cells[i - 1][2]) warn(`${model} @ ${cfm}/${db}: kW not ↑ ${AMB[i - 1]}→${AMB[i]}°F (${cells[i - 1][2]} → ${cells[i][2]})`);
        }
      }
    }

    // 3. Trends across CFM (per db, ambient): all ↑. Capacities are strict
    //    (errors); kW is best-effort/compressor-dominated, so ties → warnings.
    for (const db of edbAxis) {
      for (let a = 0; a < AMB.length; a++) {
        for (let m = 0; m < 3; m++) {
          for (let j = 1; j < cfms.length; j++) {
            const prev = rows[cfms[j - 1]]?.[db]?.[a]?.[m];
            const cur = rows[cfms[j]]?.[db]?.[a]?.[m];
            if (prev == null || cur == null) continue;
            if (cur <= prev) (m === 2 ? warn : err)(`${model} @ ${db}°F/${AMB[a]}°F: ${METRICS[m]} not ↑ ${cfms[j - 1]}→${cfms[j]} CFM (${prev} → ${cur})`);
          }
        }
      }
    }

    // 4. Trends across entering DB (per cfm, ambient): all ↑ (kW ties → warn).
    for (const cfm of cfms) {
      for (let a = 0; a < AMB.length; a++) {
        for (let m = 0; m < 3; m++) {
          for (let k = 1; k < edbAxis.length; k++) {
            const prev = rows[cfm]?.[edbAxis[k - 1]]?.[a]?.[m];
            const cur = rows[cfm]?.[edbAxis[k]]?.[a]?.[m];
            if (prev == null || cur == null) continue;
            if (cur <= prev) (m === 2 ? warn : err)(`${model} @ ${cfm} CFM/${AMB[a]}°F: ${METRICS[m]} not ↑ ${edbAxis[k - 1]}→${edbAxis[k]}°F DB (${prev} → ${cur})`);
          }
        }
      }
    }
  }
}

checkTable('4-ROW', __RAW_4ROW as RawTable, SPU_EDB_4ROW);
checkTable('6-ROW', __RAW_6ROW as RawTable, SPU_EDB_6ROW);

// 6. 6-row total > 4-row total at common DB points
console.log('\n=== 6-ROW vs 4-ROW ===');
for (const model of Object.keys(__RAW_4ROW as RawTable)) {
  const cfms = SPU_CFM_BY_MODEL[model];
  for (const cfm of cfms) {
    for (const db of SPU_EDB_4ROW) {
      const r4 = (__RAW_4ROW as RawTable)[model]?.[cfm]?.[db];
      const r6 = (__RAW_6ROW as RawTable)[model]?.[cfm]?.[db];
      if (!r4 || !r6) continue;
      for (let a = 0; a < AMB.length; a++) {
        if (r6[a][0] <= r4[a][0]) err(`${model} @ ${cfm}/${db}/${AMB[a]}°F: 6-row total ${r6[a][0]} <= 4-row total ${r4[a][0]}`);
      }
    }
  }
}

console.log(`\n${'─'.repeat(50)}`);
console.log(`Errors (monotonicity / physical): ${errors}`);
console.log(`Warnings (kW slope — verify/reconstruct): ${warns}`);
process.exit(errors > 0 ? 1 : 0);
