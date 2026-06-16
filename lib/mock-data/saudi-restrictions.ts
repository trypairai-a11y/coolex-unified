// Series that are not offered in Saudi Arabia (e.g. due to refrigerant or
// regulatory restrictions). Shared between the group grid (for accurate
// "N series" counts) and the series picker (for filtering).
export const SAUDI_EXCLUDED_SERIES_IDS = new Set<string>([
  'thac',
  'acc-bp',
  'acc-st',
  'dhac',
  'fapu',
]);

// Entire product groups that are not offered in Saudi Arabia.
export const SAUDI_EXCLUDED_GROUP_IDS = new Set<string>([
  'ccu',
  'crac',
]);

// R-407C series are only offered in Kuwait. For every other country they are
// hidden from both the group counts and the series picker, across all groups.
export function isKuwaitOnlySeries(series: {
  primaryRefrigerant?: string;
  refrigerants?: string[];
}): boolean {
  return (
    series.primaryRefrigerant === 'R-407C' ||
    (series.refrigerants?.length === 1 && series.refrigerants[0] === 'R-407C')
  );
}
