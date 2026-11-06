// Jolpica country names -> ISO 3166-1 alpha-2, for flag emoji.
const ISO = {
  Argentina: "AR",
  Australia: "AU",
  Austria: "AT",
  Azerbaijan: "AZ",
  Bahrain: "BH",
  Belgium: "BE",
  Brazil: "BR",
  Canada: "CA",
  China: "CN",
  France: "FR",
  Germany: "DE",
  Hungary: "HU",
  India: "IN",
  Italy: "IT",
  Japan: "JP",
  Korea: "KR",
  Malaysia: "MY",
  Mexico: "MX",
  Monaco: "MC",
  Morocco: "MA",
  Netherlands: "NL",
  Portugal: "PT",
  Qatar: "QA",
  Russia: "RU",
  "Saudi Arabia": "SA",
  Singapore: "SG",
  "South Africa": "ZA",
  Spain: "ES",
  Sweden: "SE",
  Switzerland: "CH",
  Turkey: "TR",
  UAE: "AE",
  "United Arab Emirates": "AE",
  UK: "GB",
  "United Kingdom": "GB",
  USA: "US",
  "United States": "US",
};

// ISO code for a Jolpica country name (undefined when unknown).
export const countryCode = (country) => ISO[country];

// Flag emoji for a country name, or "" when unknown. Decorative: always show the name too.
export const countryFlag = (country) => {
  const code = ISO[country];
  if (!code) return "";
  return String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
};
