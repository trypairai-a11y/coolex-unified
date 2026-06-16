/**
 * Validates the NGW performance matrix for physical consistency and flags
 * likely transcription errors. Run: npx tsx scripts/validate-ngw.ts
 *
 * Checks per (rows, base model):
 *   1. Capacity / flow / WPD strictly DECREASE as EWT rises (42 → 48 °F).
 *   2. Capacity / flow / WPD strictly INCREASE as airflow (CFM) rises.
 *   3. Sensible < Total in every cell.
 *   4. 4-row Total > 3-row Total at the same (base, cfm, ewt).
 *   5. Outliers: an interior cell that deviates > THRESHOLD from the linear
 *      interpolation of its two CFM neighbours (same EWT) — catches transposed
 *      digits that still trend the right way.
 */
import { NGW_EWT_F, NGW_CFM_BY_BASE, __RAW_3ROW, __RAW_4ROW } from '../lib/mock-data/ngw-performance';

type Cell = [number, number, number, number];
type RawTable = Record<string, Record<number, Cell[]>>;

const METRICS = ['total', 'sensible', 'gpm', 'wpd'] as const;
const OUTLIER_PCT = 6; // % deviation from CFM-neighbour interpolation to flag

let errors = 0;
let warns = 0;
const err = (m: string) => { errors++; console.log('  ✖ ' + m); };
const warn = (m: string) => { warns++; console.log('  ⚠ ' + m); };

function checkTable(label: string, table: RawTable) {
  console.log(`\n=== ${label} ===`);
  for (const base of Object.keys(table)) {
    const cfms = NGW_CFM_BY_BASE[base];
    const rows = table[base];

    // Shape checks
    for (const cfm of cfms) {
      const cells = rows[cfm];
      if (!cells) { err(`${base} @ ${cfm} CFM: missing row`); continue; }
      if (cells.length !== NGW_EWT_F.length) err(`${base} @ ${cfm}: ${cells.length} cells, expected ${NGW_EWT_F.length}`);
      cells.forEach((c, i) => {
        if (c[1] >= c[0]) err(`${base} @ ${cfm}/${NGW_EWT_F[i]}°F: sensible ${c[1]} >= total ${c[0]}`);
      });
    }

    // 1. Monotonic DECREASING across EWT (per CFM)
    for (const cfm of cfms) {
      const cells = rows[cfm]; if (!cells) continue;
      for (let m = 0; m < 4; m++) {
        for (let i = 1; i < cells.length; i++) {
          if (cells[i][m] >= cells[i - 1][m])
            err(`${base} @ ${cfm} CFM: ${METRICS[m]} not decreasing ${NGW_EWT_F[i - 1]}→${NGW_EWT_F[i]}°F (${cells[i - 1][m]} → ${cells[i][m]})`);
        }
      }
    }

    // 2. Monotonic INCREASING across CFM (per EWT)
    for (let e = 0; e < NGW_EWT_F.length; e++) {
      for (let m = 0; m < 4; m++) {
        for (let j = 1; j < cfms.length; j++) {
          const prev = rows[cfms[j - 1]]?.[e][m];
          const cur = rows[cfms[j]]?.[e][m];
          if (prev == null || cur == null) continue;
          if (cur <= prev)
            err(`${base} @ ${NGW_EWT_F[e]}°F: ${METRICS[m]} not increasing ${cfms[j - 1]}→${cfms[j]} CFM (${prev} → ${cur})`);
        }
      }
    }

    // 5. Outlier vs CFM-neighbour interpolation
    for (let j = 1; j < cfms.length - 1; j++) {
      const a = cfms[j - 1], b = cfms[j], c = cfms[j + 1];
      const t = (b - a) / (c - a);
      for (let e = 0; e < NGW_EWT_F.length; e++) {
        for (let m = 0; m < 4; m++) {
          const va = rows[a]?.[e][m], vb = rows[b]?.[e][m], vc = rows[c]?.[e][m];
          if (va == null || vb == null || vc == null) continue;
          const expected = va + (vc - va) * t;
          const dev = expected === 0 ? 0 : Math.abs(vb - expected) / Math.abs(expected) * 100;
          if (dev > OUTLIER_PCT)
            warn(`${base} @ ${b} CFM / ${NGW_EWT_F[e]}°F: ${METRICS[m]}=${vb} deviates ${dev.toFixed(1)}% from neighbour-interp ${expected.toFixed(0)}`);
        }
      }
    }
  }
}

checkTable('3-ROW', __RAW_3ROW as RawTable);
checkTable('4-ROW', __RAW_4ROW as RawTable);

// 4. 4-row total > 3-row total at the same point
console.log('\n=== 4-ROW vs 3-ROW ===');
for (const base of Object.keys(__RAW_3ROW)) {
  const cfms = NGW_CFM_BY_BASE[base];
  for (const cfm of cfms) {
    const r3 = (__RAW_3ROW as RawTable)[base]?.[cfm];
    const r4 = (__RAW_4ROW as RawTable)[base]?.[cfm];
    if (!r3 || !r4) continue;
    for (let e = 0; e < NGW_EWT_F.length; e++) {
      if (r4[e][0] <= r3[e][0])
        err(`${base} @ ${cfm}/${NGW_EWT_F[e]}°F: 4-row total ${r4[e][0]} <= 3-row total ${r3[e][0]}`);
    }
  }
}

console.log(`\n${'─'.repeat(50)}`);
console.log(`Errors (monotonicity / physical): ${errors}`);
console.log(`Warnings (possible OCR outliers):  ${warns}`);
process.exit(errors > 0 ? 1 : 0);
