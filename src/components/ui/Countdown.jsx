import { useNow } from "../../hooks/useNow";
import { useI18n } from "../../i18n/LanguageContext";

const UNITS = [
  ["days", 86400],
  ["hrs", 3600],
  ["min", 60],
  ["sec", 1],
];

// Live countdown to `target` (Date | ISO string). Shows `doneLabel` once the time has passed.
export function Countdown({ target, doneLabel }) {
  const now = useNow();
  const { t, fmt } = useI18n();
  const end = new Date(target).getTime();
  if (!Number.isFinite(end)) return null;

  let remaining = Math.max(0, Math.floor((end - now) / 1000));
  if (remaining === 0) {
    return <p className="font-display text-3xl uppercase text-accent-ink">{doneLabel ?? t("common.countdown.underway")}</p>;
  }

  const parts = UNITS.map(([unit, size]) => {
    const n = Math.floor(remaining / size);
    remaining -= n * size;
    return [unit, n];
  });

  return (
    <div>
      {/* Screen readers get one stable sentence instead of a per-second stream. */}
      <span className="sr-only">
        {t("common.countdown.starts", {
          date: fmt.date(end, { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZoneName: "short" }),
        })}
      </span>
      <div className="flex gap-2" aria-hidden>
        {parts.map(([unit, n]) => (
          <div key={unit} className="min-w-14 rounded-panel bg-surface-3 px-2 py-2 text-center">
            <div className="font-display text-3xl text-ink">{String(n).padStart(2, "0")}</div>
            <div className="label-caps mt-1">{t(`common.countdown.${unit}`)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
