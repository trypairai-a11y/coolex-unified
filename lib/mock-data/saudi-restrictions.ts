// Series that are not offered in Saudi Arabia (e.g. due to refrigerant or
// regulatory restrictions). Shared between the group grid (for accurate
// "N series" counts) and the series picker (for filtering).
export const SAUDI_EXCLUDED_SERIES_IDS = new Set<string>([
  'thac',
  'acc-bp',
  'acc-st',
  'dhac',
]);

// Entire product groups that are not offered in Saudi Arabia.
export const SAUDI_EXCLUDED_GROUP_IDS = new Set<string>([
  'ccu',
  'crac',
]);
