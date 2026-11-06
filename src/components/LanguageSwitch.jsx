import { useI18n } from "../i18n/LanguageContext";

// Each option is labelled in its own language, so it is findable whichever language is active.
const OPTIONS = [
  { value: "en", short: "EN", name: "English" },
  { value: "el", short: "ΕΛ", name: "Ελληνικά" },
];

// Two-option segmented control. Same active mark as the season picker's decade tabs.
export function LanguageSwitch({ className = "flex self-start" }) {
  const { lang, setLang, t } = useI18n();
  return (
    <div
      role="group"
      aria-label={t("common.language.label")}
      className={`${className} h-10 shrink-0 items-stretch divide-x divide-line-strong overflow-hidden rounded-panel border border-line-strong`}
    >
      {OPTIONS.map((o) => {
        const active = o.value === lang;
        return (
          <button
            key={o.value}
            type="button"
            lang={o.value}
            aria-pressed={active}
            aria-label={o.name}
            onClick={() => setLang(o.value)}
            className={`w-10 text-xs font-semibold focus-visible:-outline-offset-2 tracking-wide transition-colors duration-150 ${
              active
                ? "bg-surface-3 text-ink shadow-[inset_0_-2px_0_var(--accent)]"
                : "text-ink-2 hover:bg-surface-3 hover:text-ink"
            }`}
          >
            {o.short}
          </button>
        );
      })}
    </div>
  );
}
