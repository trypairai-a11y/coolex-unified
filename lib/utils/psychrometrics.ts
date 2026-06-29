// Leaving wet-bulb temperature for a cooling coil, reproducing the COOLEX
// submittal sheet (WB Calculation.xlsx) bit-for-bit. All correlations are
// ASHRAE Fundamentals psychrometrics in IP units (°F, Btu/lb dry air, psia).

// Saturation pressure over liquid water, 32–392 °F (ASHRAE eq.). T in °R → psia.
const C8 = -10440.397;
const C9 = -11.29465;
const C10 = -0.027022355;
const C11 = 1.289036e-5;
const C12 = -2.4780681e-9;
const C13 = 6.5459673;

function saturationPressurePsia(tempF: number): number {
  const T = tempF + 459.67;
  return Math.exp(C8 / T + C9 + C10 * T + C11 * T * T + C12 * T * T * T + C13 * Math.log(T));
}

// Barometric pressure (psia) from altitude (ft) — same correlation as the sheet
// (29.921 inHg standard atmosphere, converted at 0.491154 psia/inHg).
function barometricPressurePsia(altitudeFt: number): number {
  const inHg = 29.921 * Math.pow(1 - 0.0000068753 * altitudeFt, 5.2559);
  return inHg * 0.491154;
}

// Saturation humidity ratio at tempF given barometric pressure.
function saturationHumidityRatio(tempF: number, pAtmPsia: number): number {
  const pws = saturationPressurePsia(tempF);
  return 0.62198 * (pws / (pAtmPsia - pws));
}

// Humidity ratio of moist air from dry-bulb & wet-bulb (ASHRAE eq., IP).
function humidityRatio(dbF: number, wbF: number, pAtmPsia: number): number {
  const wsStar = saturationHumidityRatio(wbF, pAtmPsia);
  return ((1093 - 0.556 * wbF) * wsStar - 0.24 * (dbF - wbF)) / (1093 + 0.444 * dbF - wbF);
}

// Moist-air enthalpy (Btu/lb dry air) from dry-bulb (°F) and humidity ratio.
function enthalpy(dbF: number, w: number): number {
  return 0.24 * dbF + w * (1061 + 0.444 * dbF);
}

export interface LeavingConditionsInput {
  /** Entering air dry-bulb, °F. */
  enteringDbF: number;
  /** Entering air wet-bulb, °F. */
  enteringWbF: number;
  /** Total cooling capacity, Btu/hr. */
  totalCapacityBtuh: number;
  /** Sensible cooling capacity, Btu/hr. */
  sensibleCapacityBtuh: number;
  /** Air flow, CFM. */
  cfm: number;
  /** Site altitude, ft (default sea level). */
  altitudeFt?: number;
}

export interface LeavingConditions {
  /** Leaving air dry-bulb, °F (sensible-heat equation). */
  leavingDbF: number;
  /** Leaving air wet-bulb, °F (clamped at the leaving dry-bulb). */
  leavingWbF: number;
  /** Leaving air enthalpy, Btu/lb dry air (total-heat equation). */
  leavingEnthalpy: number;
}

/**
 * Compute the leaving air dry-bulb, wet-bulb and enthalpy for a cooling coil.
 *
 * Mirrors the submittal sheet exactly:
 *   1. Entering enthalpy from entering DB/WB.
 *   2. Leaving DB  = entering DB − sensible / (1.08 · CFM)   (sensible heat).
 *      Leaving h   = entering h  − total    / (4.5  · CFM)   (total heat).
 *   3. Sweep candidate WB 40→70 °F in 0.1 °F steps; the leaving WB is the
 *      largest candidate whose enthalpy (rounded to 3 dp) ≤ leaving enthalpy —
 *      the sheet's VLOOKUP(1, …, TRUE). The sheet's candidate enthalpy uses
 *      0.24·WB (not DB); that quirk is preserved so results match.
 *   4. WB can never exceed DB, so clamp at the leaving dry-bulb (saturated air).
 */
export function leavingConditions(input: LeavingConditionsInput): LeavingConditions {
  const { enteringDbF, enteringWbF, totalCapacityBtuh, sensibleCapacityBtuh, cfm } = input;
  const pAtm = barometricPressurePsia(input.altitudeFt ?? 0);

  const wIn = humidityRatio(enteringDbF, enteringWbF, pAtm);
  const hIn = enthalpy(enteringDbF, wIn);

  const leavingDbF = enteringDbF - sensibleCapacityBtuh / (1.08 * cfm);
  const hOut = hIn - totalCapacityBtuh / (4.5 * cfm);

  // VLOOKUP(1, …, TRUE): the ratio is monotonic in WB, so take the largest
  // candidate whose rounded enthalpy ratio is ≤ 1.
  let rawWbF = 40;
  for (let i = 0; i <= 300; i++) {
    const wb = Math.round((40 + i * 0.1) * 10) / 10;
    const w = humidityRatio(leavingDbF, wb, pAtm);
    const candidateH = 0.24 * wb + w * (1061 + 0.444 * leavingDbF);
    if (Math.round((candidateH / hOut) * 1000) / 1000 <= 1) rawWbF = wb;
    else break;
  }

  return {
    leavingDbF,
    leavingWbF: rawWbF > leavingDbF ? leavingDbF : rawWbF,
    leavingEnthalpy: hOut,
  };
}
