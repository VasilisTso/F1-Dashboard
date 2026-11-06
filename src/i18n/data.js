import { useMemo } from "react";
import { countryCode } from "../lib/countries";
import { useI18n } from "./LanguageContext";

// API data stays as Jolpica returns it (names, race names, statuses), except two cheap, exact mappings:
// countries and nationalities. Greek demonyms are gendered (driver vs team), so in Greek a nationality
// is shown as its country name ("Ιταλία"), which reads naturally for both. Unknown values pass through.
const NATIONALITY_ISO = {
  American: "US", "American-Italian": "US", Argentine: "AR", "Argentine-Italian": "AR", Australian: "AU",
  Austrian: "AT", Belgian: "BE", Brazilian: "BR", British: "GB", Canadian: "CA", Chilean: "CL",
  Chinese: "CN", Colombian: "CO", Czech: "CZ", Danish: "DK", Dutch: "NL", "East German": "DE",
  Finnish: "FI", French: "FR", German: "DE", Hungarian: "HU", Indian: "IN",
  Indonesian: "ID", Irish: "IE", Italian: "IT", Japanese: "JP", Liechtensteiner: "LI",
  Malaysian: "MY", Mexican: "MX", Monegasque: "MC", "New Zealander": "NZ", Polish: "PL",
  Portuguese: "PT", Rhodesian: "ZW", Russian: "RU", Spanish: "ES", "South African": "ZA",
  Swedish: "SE", Swiss: "CH", Thai: "TH", Uruguayan: "UY", Venezuelan: "VE",
};

export function useDataLabels() {
  const { lang } = useI18n();
  return useMemo(() => {
    if (lang === "en") return { country: (c) => c, nationality: (n) => n };
    const names = new Intl.DisplayNames(["el"], { type: "region" });
    const region = (code, fallback) => {
      try {
        return code ? names.of(code) : fallback;
      } catch {
        return fallback;
      }
    };
    return {
      country: (c) => region(countryCode(c), c),
      nationality: (n) => region(NATIONALITY_ISO[n], n),
    };
  }, [lang]);
}
