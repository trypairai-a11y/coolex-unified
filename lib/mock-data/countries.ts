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
  "Pakistan",
  "Djibouti",
  "Jordan",
  "Egypt",
  "Lebanon",
  "Other",
] as const;

export type Country = (typeof COUNTRIES)[number];

export const COUNTRY_PROJECT_PREFIX: Record<string, string> = {
  Kuwait: "KW",
  "Saudi Arabia": "SA",
  "United Arab Emirates": "UA",
  Bahrain: "BH",
  Qatar: "QR",
  Oman: "OM",
  Iraq: "IQ",
  Pakistan: "PK",
  Djibouti: "DJ",
  Jordan: "JO",
  Egypt: "EG",
  Lebanon: "LB",
};

export function getCountryProjectPrefix(country?: string): string {
  if (!country) return "PRJ";
  return COUNTRY_PROJECT_PREFIX[country] ?? "PRJ";
}
