import { useMemo } from "react";
import { countryCode } from "../lib/countries";
import { useI18n } from "./LanguageContext";

// API data stays as Jolpica returns it (names, race and circuit names), except three cheap, exact mappings:
// countries, nationalities and result statuses. Greek demonyms are gendered (driver vs team), so in Greek a nationality
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

// Jolpica result statuses (a finite set, ~140 values). The common ones are mapped; rare historic ones
// ("Magneto", "Distributor") fall back to English. "+N Laps" is handled as a pattern.
const STATUS_EL = {
  Finished: "Τερμάτισε", Lapped: "Με γύρο διαφορά", Retired: "Εγκατάλειψη", Disqualified: "Αποκλεισμός",
  Excluded: "Αποκλεισμός", "Did not start": "Δεν εκκίνησε", "Did not qualify": "Δεν προκρίθηκε",
  "Did not prequalify": "Δεν πέρασε την προκριματική", Withdrew: "Αποσύρθηκε", "Not classified": "Μη κατατάξιμος",
  "107% Rule": "Κανόνας 107%", Accident: "Ατύχημα", "Fatal accident": "Μοιραίο ατύχημα", Collision: "Σύγκρουση",
  "Collision damage": "Ζημιά από σύγκρουση", Damage: "Ζημιά", Debris: "Συντρίμμια", "Spun off": "Σβούρα",
  Stalled: "Έσβησε", Engine: "Κινητήρας", "Power Unit": "Μονάδα ισχύος", "Power loss": "Απώλεια ισχύος",
  Turbo: "Turbo", ERS: "ERS", Gearbox: "Κιβώτιο ταχυτήτων", Transmission: "Μετάδοση", Clutch: "Συμπλέκτης",
  Driveshaft: "Άξονας μετάδοσης", Halfshaft: "Ημιαξόνιο", Differential: "Διαφορικό", Hydraulics: "Υδραυλικά",
  Pneumatics: "Πνευματικά", Electrical: "Ηλεκτρικό", Electronics: "Ηλεκτρονικά", Battery: "Μπαταρία",
  Alternator: "Εναλλάκτης", Ignition: "Ανάφλεξη", Brakes: "Φρένα", "Brake duct": "Αγωγός φρένων",
  Suspension: "Ανάρτηση", Steering: "Τιμόνι", "Power steering": "Υδραυλικό τιμόνι", Throttle: "Γκάζι",
  Chassis: "Σασί", Undertray: "Δάπεδο", "Front wing": "Εμπρός αεροτομή", "Rear wing": "Πίσω αεροτομή",
  Wheel: "Τροχός", "Wheel nut": "Παξιμάδι τροχού", "Wheel rim": "Ζάντα", Tyre: "Ελαστικό", Puncture: "Σκασμένο λάστιχο",
  Exhaust: "Εξάτμιση", Overheating: "Υπερθέρμανση", "Cooling system": "Σύστημα ψύξης", Radiator: "Ψυγείο",
  "Water leak": "Διαρροή νερού", "Water pressure": "Πίεση νερού", "Water pump": "Αντλία νερού",
  "Oil leak": "Διαρροή λαδιού", "Oil pressure": "Πίεση λαδιού", "Oil line": "Σωλήνας λαδιού",
  "Fuel pressure": "Πίεση καυσίμου", "Fuel system": "Σύστημα καυσίμου", "Fuel pump": "Αντλία καυσίμου",
  "Fuel leak": "Διαρροή καυσίμου", "Out of fuel": "Έμεινε από καύσιμο", Fuel: "Καύσιμο", Mechanical: "Μηχανική βλάβη",
  Vibrations: "Κραδασμοί", Handling: "Οδική συμπεριφορά", Fire: "Φωτιά", "Engine fire": "Φωτιά στον κινητήρα",
  "Launch control": "Launch control", Seat: "Κάθισμα", Illness: "Ασθένεια", Injury: "Τραυματισμός",
  Injured: "Τραυματισμός", Physical: "Σωματική κόπωση", "Safety concerns": "Λόγοι ασφαλείας", Safety: "Λόγοι ασφαλείας",
};

const statusEl = (s) => {
  const laps = s?.match(/^\+(\d+) Laps?$/);
  if (laps) return `+${laps[1]} ${laps[1] === "1" ? "γύρος" : "γύροι"}`;
  return STATUS_EL[s] ?? s;
};

export function useDataLabels() {
  const { lang } = useI18n();
  return useMemo(() => {
    if (lang === "en") return { country: (c) => c, nationality: (n) => n, status: (s) => s };
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
      status: statusEl,
    };
  }, [lang]);
}
