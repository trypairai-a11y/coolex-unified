// VRF refrigerant-piping rule engine.
//
// Encodes the design limits and pipe-sizing tables from the COOLEX V5 P VRF
// 50/60Hz piping guide (Section 4.3 "Permitted Piping Lengths and Level
// Differences" and Section 4.4 "Selecting Piping Diameters"). The System Layout
// canvas (components/selection/VRFSystemDiagram.tsx) feeds the live pipe lengths
// in here so every edit is checked against the catalogue rules in real time.
//
// All lengths arrive in FEET (the canvas stores Imperial); the guide is metric,
// so checks are done in metres and limits are expressed in metres.

import { ftToM } from "./unit-conversions";

// 1 kBTU/h → kW (1 ton = 12 kBTU/h = 3.51685 kW).
const KW_PER_KBTUH = 0.293071;
// Nominal V5 P sizing: ~2.8 kW of cooling per HP (8 HP ≈ 22.4 kW). Used only to
// map this app's tons-rated outdoor unit onto the guide's HP-bracketed table.
const KW_PER_HP = 2.8;

export const kbtuhToKw = (kbtuh: number) => kbtuh * KW_PER_KBTUH;

/** Permitted maximums, in metres, from Table 3-4.3. */
export const VRF_PIPING_LIMITS_M = {
  /** Req 1 — total system piping (indoor main pipes counted double). */
  totalPiping: 1000,
  /** Req 2 — farthest indoor unit to first outdoor branch joint, actual run. */
  farthestActual: 175,
  /** Req 2 — same path, equivalent length (each branch joint adds 0.5 m). */
  farthestEquivalent: 200,
  /** Req 3 — farthest indoor unit to first indoor branch joint (standard). */
  toFirstIndoorJointStd: 40,
  /** Req 3 — same, extended ceiling when the listed measures are taken. */
  toFirstIndoorJointMax: 90,
  /** Req 3a — each indoor auxiliary pipe (unit to its nearest branch joint). */
  auxiliaryEach: 40,
  /** Req 3b — spread between the longest and shortest indoor-branch run. */
  auxiliarySpread: 40,
  /** Req 4 — level difference indoor↔outdoor when the outdoor unit is above. */
  levelOduAbove: 90,
  /** Req 4 — level difference indoor↔outdoor when the outdoor unit is below. */
  levelOduBelow: 110,
  /** Req 5 — level difference between any two indoor units. */
  levelIndoorToIndoor: 30,
} as const;

/** Equivalent length added by each branch joint along a path (Req 2). */
const BRANCH_JOINT_EQUIV_M = 0.5;

export type PipingCheckStatus = "ok" | "warning" | "violation";

export interface PipingCheck {
  id: string;
  /** Guide reference, e.g. "Req 1". */
  ref: string;
  label: string;
  /** Measured value, in metres. */
  valueM: number;
  /** Permitted maximum, in metres. */
  limitM: number;
  status: PipingCheckStatus;
  /** Plain-language explanation shown to the engineer. */
  detail: string;
}

export interface PipeSize {
  /** Gas (suction) pipe diameter in mm, or null if no table row applies. */
  gasMm: number | null;
  /** Liquid pipe diameter in mm. */
  liquidMm: number | null;
}

export interface VRFPipingRoomInput {
  id: string;
  name: string;
  capacityKbtuh: number;
  /** This unit's own branch (auxiliary) segment length, in feet. */
  branchFt: number;
}

export interface VRFPipingFloorInput {
  /** Vertical trunk run reaching this floor from the floor above, in feet.
   *  The first floor is reached by the main trunk, so its value is 0 here. */
  segFromAboveFt: number;
  /** Rooms in branch order — index 0 is nearest the trunk. */
  rooms: VRFPipingRoomInput[];
}

export interface VRFPipingInput {
  /** Main pipe L1 — outdoor unit down to the first indoor branch joint, ft. */
  mainTrunkFt: number;
  floors: VRFPipingFloorInput[];
  /** Total length of any user-drawn custom pipes, ft (counted once toward total). */
  customPipesFt: number;
  /** Outdoor unit nominal capacity, tons. */
  oduTons: number;
  /** True when the outdoor unit sits above the indoor units (rooftop). */
  oduAbove: boolean;
}

export interface PipeSizingResult {
  mainPipe: PipeSize;
  branchJointKit: string | null;
  /** Per indoor unit auxiliary pipe sizing. */
  auxiliary: { id: string; name: string; size: PipeSize }[];
}

export interface VRFPipingResult {
  checks: PipingCheck[];
  overall: PipingCheckStatus;
  sizing: PipeSizingResult;
  /** Convenience flags surfaced to the UI. */
  hasIndoorUnits: boolean;
}

// --- Diameter tables --------------------------------------------------------

// Table 3-4.4 — main pipe (L1) and indoor main pipes by total indoor capacity.
// [maxKwExclusive, gasMm, liquidMm, branchJointKit]
const TABLE_344: [number, number, number, string][] = [
  [16.6, 15.9, 9.53, "FQZHN-01D"],
  [23, 19.1, 9.53, "FQZHN-01D"],
  [33, 22.2, 9.53, "FQZHN-02D"],
  [46, 28.6, 12.7, "FQZHN-03D"],
  [66, 28.6, 15.9, "FQZHN-03D"],
  [92, 31.8, 19.1, "FQZHN-03D"],
  [135, 38.1, 19.1, "FQZHN-04D"],
  [180, 41.3, 22.2, "FQZHN-05D"],
  [Infinity, 44.5, 25.4, "FQZHN-05D"],
];

// Table 3-4.5 — main pipe (L1) by outdoor capacity (HP) and equivalent length.
// [maxHpInclusive, gas<90, liq<90, gas>=90, liq>=90]
const TABLE_345: [number, number, number, number, number][] = [
  [8, 22.2, 9.53, 22.2, 12.7],
  [10, 22.2, 9.53, 25.4, 12.7],
  [14, 25.4, 12.7, 28.6, 15.9],
  [16, 28.6, 12.7, 31.8, 15.9],
  [22, 28.6, 15.9, 31.8, 19.1],
  [24, 28.6, 15.9, 31.8, 19.1],
  [34, 31.8, 19.1, 38.1, 22.2],
  [50, 38.1, 19.1, 38.1, 22.2],
  [66, 41.3, 22.2, 44.5, 25.4],
  [Infinity, 44.5, 25.4, 54.0, 25.4],
];

// Table 3-4.8 — indoor auxiliary pipes (a to m) by unit capacity and length.
function auxiliarySize(capacityKw: number, lengthM: number): PipeSize {
  const small = capacityKw < 5.6; // guide rows: ≤4.5 kW vs ≥5.6 kW
  const short = lengthM <= 10;
  if (small) {
    return short ? { gasMm: 12.7, liquidMm: 6.35 } : { gasMm: 15.9, liquidMm: 9.53 };
  }
  return short ? { gasMm: 15.9, liquidMm: 9.53 } : { gasMm: 19.1, liquidMm: 12.7 };
}

function mainPipeByIndoorCapacity(totalKw: number): { size: PipeSize; kit: string } {
  const row = TABLE_344.find(([maxKw]) => totalKw < maxKw) ?? TABLE_344[TABLE_344.length - 1];
  return { size: { gasMm: row[1], liquidMm: row[2] }, kit: row[3] };
}

function mainPipeByOutdoorHp(hp: number, equivalentLengthM: number): PipeSize {
  const row = TABLE_345.find(([maxHp]) => hp <= maxHp) ?? TABLE_345[TABLE_345.length - 1];
  const long = equivalentLengthM >= 90;
  return long ? { gasMm: row[3], liquidMm: row[4] } : { gasMm: row[1], liquidMm: row[2] };
}

/** Pick the larger of two pipe sizes, diameter by diameter (guide: size L1 to
 *  the larger of Tables 3-4.4 and 3-4.5). */
function largerSize(a: PipeSize, b: PipeSize): PipeSize {
  return {
    gasMm: Math.max(a.gasMm ?? 0, b.gasMm ?? 0) || null,
    liquidMm: Math.max(a.liquidMm ?? 0, b.liquidMm ?? 0) || null,
  };
}

// --- Status helpers ---------------------------------------------------------

function statusFor(valueM: number, limitM: number): PipingCheckStatus {
  if (valueM > limitM) return "violation";
  // Flag the top 5% of the envelope as a heads-up before the hard limit.
  if (valueM > limitM * 0.95) return "warning";
  return "ok";
}

function worst(a: PipingCheckStatus, b: PipingCheckStatus): PipingCheckStatus {
  const rank = { ok: 0, warning: 1, violation: 2 } as const;
  return rank[a] >= rank[b] ? a : b;
}

// --- Engine -----------------------------------------------------------------

export function evaluateVRFPiping(input: VRFPipingInput): VRFPipingResult {
  const { mainTrunkFt, floors, customPipesFt, oduTons, oduAbove } = input;

  const allRooms = floors.flatMap((f) => f.rooms);
  const hasIndoorUnits = allRooms.length > 0;

  // Vertical run from the outdoor unit down to each floor's branch line.
  // floor 0 is reached by the main trunk; each subsequent floor adds its riser.
  const verticalToFloorFt: number[] = [];
  let runningVert = mainTrunkFt;
  floors.forEach((f, i) => {
    runningVert += i === 0 ? 0 : f.segFromAboveFt;
    verticalToFloorFt.push(runningVert);
  });

  // Per-room path metrics.
  interface RoomPath {
    id: string;
    name: string;
    capacityKbtuh: number;
    auxiliaryFt: number; // own branch segment (unit → nearest joint)
    actualFt: number; // ODU → unit (full run)
    fromFirstJointFt: number; // first indoor branch joint A → unit
    branchJoints: number; // joints traversed from the ODU
  }
  const paths: RoomPath[] = [];
  floors.forEach((f, fi) => {
    let cumulativeBranchFt = 0;
    f.rooms.forEach((r, ri) => {
      cumulativeBranchFt += r.branchFt;
      const vertical = verticalToFloorFt[fi];
      paths.push({
        id: r.id,
        name: r.name,
        capacityKbtuh: r.capacityKbtuh,
        auxiliaryFt: r.branchFt,
        actualFt: vertical + cumulativeBranchFt,
        fromFirstJointFt: vertical - mainTrunkFt + cumulativeBranchFt,
        branchJoints: fi + ri + 1,
      });
    });
  });

  // --- Req 1: total piping length (indoor main / vertical risers doubled). ---
  const indoorMainFt = floors.reduce((a, f, i) => a + (i === 0 ? 0 : f.segFromAboveFt), 0);
  const auxiliaryTotalFt = allRooms.reduce((a, r) => a + r.branchFt, 0);
  const totalPipingFt = mainTrunkFt + 2 * indoorMainFt + auxiliaryTotalFt + customPipesFt;
  const totalPipingM = ftToM(totalPipingFt);

  // --- Req 2: farthest indoor unit → first outdoor branch joint. ---
  const farthest = paths.reduce<RoomPath | null>(
    (m, p) => (!m || p.actualFt > m.actualFt ? p : m),
    null
  );
  const farthestActualM = ftToM(farthest?.actualFt ?? 0);
  const farthestEquivalentM = farthestActualM + (farthest?.branchJoints ?? 0) * BRANCH_JOINT_EQUIV_M;

  // --- Req 3: farthest indoor unit → first indoor branch joint A. ---
  const farthestFromJoint = paths.reduce(
    (m, p) => Math.max(m, p.fromFirstJointFt),
    0
  );
  const farthestFromJointM = ftToM(farthestFromJoint);

  // --- Req 3a/3b: auxiliary pipe length and spread. ---
  const auxValuesFt = allRooms.map((r) => r.branchFt);
  const maxAuxM = ftToM(auxValuesFt.length ? Math.max(...auxValuesFt) : 0);
  const fromJointValues = paths.map((p) => p.fromFirstJointFt);
  const auxSpreadM = ftToM(
    fromJointValues.length ? Math.max(...fromJointValues) - Math.min(...fromJointValues) : 0
  );

  // --- Req 4 & 5: level differences (vertical only). ---
  const levelOduToIndoorM = ftToM(
    verticalToFloorFt.length ? Math.max(...verticalToFloorFt) : 0
  );
  const levelIndoorM = ftToM(
    verticalToFloorFt.length
      ? Math.max(...verticalToFloorFt) - Math.min(...verticalToFloorFt)
      : 0
  );
  const oduLevelLimit = oduAbove
    ? VRF_PIPING_LIMITS_M.levelOduAbove
    : VRF_PIPING_LIMITS_M.levelOduBelow;

  const fmt = (m: number) => `${m.toFixed(1)} m`;

  const checks: PipingCheck[] = [
    {
      id: "total",
      ref: "Req 1",
      label: "Total system piping",
      valueM: totalPipingM,
      limitM: VRF_PIPING_LIMITS_M.totalPiping,
      status: statusFor(totalPipingM, VRF_PIPING_LIMITS_M.totalPiping),
      detail: `Main pipe + 2× indoor risers + branch runs = ${fmt(totalPipingM)} (limit ${VRF_PIPING_LIMITS_M.totalPiping} m).`,
    },
    {
      id: "farthest-actual",
      ref: "Req 2",
      label: "Farthest unit → outdoor (actual)",
      valueM: farthestActualM,
      limitM: VRF_PIPING_LIMITS_M.farthestActual,
      status: statusFor(farthestActualM, VRF_PIPING_LIMITS_M.farthestActual),
      detail: `Longest outdoor-to-indoor run is ${fmt(farthestActualM)}${farthest ? ` (to ${farthest.name})` : ""} (limit ${VRF_PIPING_LIMITS_M.farthestActual} m).`,
    },
    {
      id: "farthest-equivalent",
      ref: "Req 2",
      label: "Farthest unit → outdoor (equivalent)",
      valueM: farthestEquivalentM,
      limitM: VRF_PIPING_LIMITS_M.farthestEquivalent,
      status: statusFor(farthestEquivalentM, VRF_PIPING_LIMITS_M.farthestEquivalent),
      detail: `Actual + 0.5 m per branch joint = ${fmt(farthestEquivalentM)} (limit ${VRF_PIPING_LIMITS_M.farthestEquivalent} m).`,
    },
    {
      id: "to-first-joint",
      ref: "Req 3",
      label: "Farthest unit → first indoor joint",
      valueM: farthestFromJointM,
      limitM: VRF_PIPING_LIMITS_M.toFirstIndoorJointMax,
      status:
        farthestFromJointM > VRF_PIPING_LIMITS_M.toFirstIndoorJointMax
          ? "violation"
          : farthestFromJointM > VRF_PIPING_LIMITS_M.toFirstIndoorJointStd
          ? "warning"
          : "ok",
      detail:
        farthestFromJointM > VRF_PIPING_LIMITS_M.toFirstIndoorJointStd
          ? `${fmt(farthestFromJointM)} exceeds the ${VRF_PIPING_LIMITS_M.toFirstIndoorJointStd} m standard. Permitted up to ${VRF_PIPING_LIMITS_M.toFirstIndoorJointMax} m only if each auxiliary pipe ≤ 40 m, the run spread ≤ 40 m, and indoor main pipe diameters are increased per Table 3-4.2.`
          : `${fmt(farthestFromJointM)} (standard limit ${VRF_PIPING_LIMITS_M.toFirstIndoorJointStd} m).`,
    },
    {
      id: "aux-each",
      ref: "Req 3a",
      label: "Longest indoor auxiliary pipe",
      valueM: maxAuxM,
      limitM: VRF_PIPING_LIMITS_M.auxiliaryEach,
      status: statusFor(maxAuxM, VRF_PIPING_LIMITS_M.auxiliaryEach),
      detail: `Each unit-to-branch run must be ≤ ${VRF_PIPING_LIMITS_M.auxiliaryEach} m; longest is ${fmt(maxAuxM)}.`,
    },
    {
      id: "aux-spread",
      ref: "Req 3b",
      label: "Branch-run length spread",
      valueM: auxSpreadM,
      limitM: VRF_PIPING_LIMITS_M.auxiliarySpread,
      status: statusFor(auxSpreadM, VRF_PIPING_LIMITS_M.auxiliarySpread),
      detail: `Difference between the longest and shortest indoor-joint run is ${fmt(auxSpreadM)} (limit ${VRF_PIPING_LIMITS_M.auxiliarySpread} m).`,
    },
    {
      id: "level-odu",
      ref: "Req 4",
      label: `Level difference indoor↔outdoor (outdoor ${oduAbove ? "above" : "below"})`,
      valueM: levelOduToIndoorM,
      limitM: oduLevelLimit,
      status: statusFor(levelOduToIndoorM, oduLevelLimit),
      detail: `Vertical drop from the outdoor unit to the lowest indoor unit is ${fmt(levelOduToIndoorM)} (limit ${oduLevelLimit} m). ${oduAbove && levelOduToIndoorM > 20 ? "Above 20 m, fit an oil-return bend every 10 m of gas riser." : ""}`.trim(),
    },
    {
      id: "level-indoor",
      ref: "Req 5",
      label: "Level difference between indoor units",
      valueM: levelIndoorM,
      limitM: VRF_PIPING_LIMITS_M.levelIndoorToIndoor,
      status: statusFor(levelIndoorM, VRF_PIPING_LIMITS_M.levelIndoorToIndoor),
      detail: `Highest-to-lowest indoor unit drop is ${fmt(levelIndoorM)} (limit ${VRF_PIPING_LIMITS_M.levelIndoorToIndoor} m).`,
    },
  ];

  const overall = checks.reduce<PipingCheckStatus>((s, c) => worst(s, c.status), "ok");

  // --- Pipe sizing (Section 4.4). ---
  const totalKw = kbtuhToKw(allRooms.reduce((a, r) => a + r.capacityKbtuh, 0));
  const byIndoor = mainPipeByIndoorCapacity(totalKw);
  const oduHp = (oduTons * 12 * KW_PER_KBTUH) / KW_PER_HP;
  const byOutdoor = mainPipeByOutdoorHp(oduHp, farthestEquivalentM);
  const mainPipe = largerSize(byIndoor.size, byOutdoor);

  const auxiliary = paths.map((p) => ({
    id: p.id,
    name: p.name,
    size: auxiliarySize(kbtuhToKw(p.capacityKbtuh), ftToM(p.auxiliaryFt)),
  }));

  return {
    checks,
    overall,
    sizing: {
      mainPipe,
      branchJointKit: hasIndoorUnits ? byIndoor.kit : null,
      auxiliary,
    },
    hasIndoorUnits,
  };
}
