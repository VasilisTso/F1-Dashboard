import { LuClock } from "react-icons/lu";
import { useI18n } from "../../i18n/LanguageContext";

// Times are shown in the device's zone; this names it once per block ("Times in Athens · GMT+2").
// The offset is taken at `at` (the event date), so a race after a DST change shows the right one.
// eslint-disable-next-line react-refresh/only-export-components
export function useZone(at = new Date()) {
  const { t, fmt, locale } = useI18n();
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC";
  const city = zone.split("/").at(-1).replace(/_/g, " ");
  const offset =
    new Intl.DateTimeFormat(locale, { timeZone: zone, timeZoneName: "shortOffset" })
      .formatToParts(new Date(at))
      .find((p) => p.type === "timeZoneName")?.value ?? "";
  const name = offset && offset !== city ? `${city} · ${offset}` : city;
  return {
    name,
    label: t("common.timezone.label", { zone: name }),
    // Tooltip text for a <time>: the same moment in UTC.
    utc: (d) =>
      t("common.timezone.utc", {
        time: fmt.date(d, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "UTC" }),
      }),
  };
}

// `className` sets the display too (default inline); pass "flex w-fit" to put it on its own line.
export function ZoneLabel({ at, className = "inline-flex" }) {
  const { label } = useZone(at);
  const { t } = useI18n();
  return (
    <span className={`items-center gap-1.5 text-xs text-ink-3 ${className}`} title={t("common.timezone.hint")}>
      <LuClock className="size-3.5 shrink-0" aria-hidden />
      {label}
    </span>
  );
}
