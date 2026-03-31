// Country list for project/registration forms.
// To make this admin-configurable, replace with an API call or database lookup.
export const COUNTRIES = [
  "Kuwait",
  "Saudi Arabia",
  "United Arab Emirates",
  "Bahrain",
  "Qatar",
  "Oman",
  "Iraq",
  "Jordan",
  "Egypt",
  "Lebanon",
  "Other",
] as const;

export type Country = (typeof COUNTRIES)[number];
