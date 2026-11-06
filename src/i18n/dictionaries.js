// One file per namespace and language; keys are "namespace.key" (nested objects allowed).
// Plurals: { one: "{count} win", other: "{count} wins" }. Interpolation: "{name}".
import enCommon from "./en/common";
import enOverview from "./en/overview";
import enDrivers from "./en/drivers";
import enConstructors from "./en/constructors";
import enRaces from "./en/races";
import elCommon from "./el/common";
import elOverview from "./el/overview";
import elDrivers from "./el/drivers";
import elConstructors from "./el/constructors";
import elRaces from "./el/races";

export const DICTIONARIES = {
  en: { common: enCommon, overview: enOverview, drivers: enDrivers, constructors: enConstructors, races: enRaces },
  el: { common: elCommon, overview: elOverview, drivers: elDrivers, constructors: elConstructors, races: elRaces },
};
