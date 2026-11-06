import { LuCalendarPlus } from "react-icons/lu";
import { buildCalendar, downloadCalendar } from "../lib/ics";
import { useI18n } from "../i18n/LanguageContext";

// Downloads `races` as an .ics file. `scope` picks the label: one weekend or the rest of a season.
export function CalendarButton({ races, filename, scope = "weekend", className = "" }) {
  const { t } = useI18n();
  if (!races?.length) return null;
  return (
    <button
      type="button"
      title={t(`common.calendar.${scope}Hint`)}
      onClick={() => downloadCalendar(filename, buildCalendar(races, t))}
      className={`inline-flex h-10 items-center gap-2 rounded-panel border border-line-strong bg-surface-2 px-3 text-sm font-medium text-ink transition-colors duration-150 hover:bg-surface-3 ${className}`}
    >
      <LuCalendarPlus className="size-4" aria-hidden />
      {t(`common.calendar.${scope}`)}
    </button>
  );
}
