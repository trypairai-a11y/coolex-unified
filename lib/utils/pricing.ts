import type { Model } from "@/types/product";

/**
 * KWD price per nominal ton — the admin price-list convention.
 * `PriceListManager` builds each series' base price as the series' average
 * tonnage × this rate, and the selection wizard / submittals price a specific
 * model as `nominalTons × this rate`. Centralised here so quotations use the
 * same source of truth.
 */
export const PRICE_PER_NOMINAL_TON_KWD = 185;

/**
 * Base unit price (KWD) for a model, per the admin price list.
 * Prefers a captured submittal `basePriceKWD` snapshot when available, so a
 * quotation reflects the price the unit was actually selected at.
 */
export function unitBasePriceKWD(
  model: Model,
  submittalData?: { basePriceKWD?: number },
): number {
  const snapshot = submittalData?.basePriceKWD;
  if (typeof snapshot === "number" && snapshot > 0) return snapshot;
  return Math.round(model.nominalTons * PRICE_PER_NOMINAL_TON_KWD);
}

/** Format a KWD amount the way the quotation shows it: 3 decimals, grouped. */
export function formatKWD(amount: number): string {
  return amount.toLocaleString("en-US", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });
}
