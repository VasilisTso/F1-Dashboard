import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { DICTIONARIES } from "./dictionaries";

// en-GB: 24-hour times and day-month dates, as F1 itself publishes them.
const LOCALES = { en: "en-GB", el: "el-GR" };

const LanguageContext = createContext(null);

// Language is applied pre-paint by the inline script in index.html (lang attribute); this keeps it in sync.
const readLang = () => (document.documentElement.lang === "el" ? "el" : "en");

const lookup = (dict, key) => key.split(".").reduce((node, part) => node?.[part], dict);

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(readLang);
  const locale = LOCALES[lang];

  const setLang = useCallback((next) => {
    document.documentElement.lang = next;
    try {
      localStorage.setItem("lang", next);
    } catch {
      // Storage blocked: the language still applies for this visit.
    }
    setLangState(next);
  }, []);

  const value = useMemo(() => {
    const plural = new Intl.PluralRules(locale);

    // t("ns.key", { count, name }) → string. Pass a pre-formatted `n` alongside `count` for big numbers. Plural entries are { one, other }, picked by `count`.
    // Missing Greek keys fall back to English, then to the key itself.
    const t = (key, vars = {}) => {
      let entry = lookup(DICTIONARIES[lang], key) ?? lookup(DICTIONARIES.en, key) ?? key;
      if (typeof entry === "object") entry = entry[plural.select(Number(vars.count))] ?? entry.other;
      // Values are inserted as given: format numbers with fmt first (a raw year must stay "2026", not "2.026").
      return String(entry).replace(/\{(\w+)\}/g, (m, name) => (vars[name] == null ? m : String(vars[name])));
    };

    const number = (n, opts) => Number(n).toLocaleString(locale, opts);
    // Points can be fractional (half-points races), never more than one decimal.
    const points = (p) => number(p, { maximumFractionDigits: 1 });
    // Times are always 24-hour, as F1 publishes them (Greek would otherwise default to "07:00 μ.μ.").
    const date = (d, opts) => new Date(d).toLocaleString(locale, opts?.hour ? { hourCycle: "h23", ...opts } : opts);
    // A calendar day from an ISO date ("2026-11-08"), read as local midnight so it never shifts a day.
    const day = (iso, opts) => (iso ? new Date(`${iso}T00:00:00`).toLocaleDateString(locale, opts) : null);

    return { lang, locale, setLang, t, fmt: { number, points, date, day } };
  }, [lang, locale, setLang]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useI18n() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useI18n must be used inside <LanguageProvider>");
  return ctx;
}

// Shorthand when only the translate function is needed.
// eslint-disable-next-line react-refresh/only-export-components
export const useT = () => useI18n().t;
