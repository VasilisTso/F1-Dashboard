import { LuArrowUp, LuArrowDown } from "react-icons/lu";
import { useT } from "../../i18n/LanguageContext";

// Ergast positionText codes for unclassified results (R = retired, D = disqualified, …); labels in common.outcome.
const OUTCOME_CODES = new Set(["R", "D", "E", "W", "F", "N"]);
const unclassified = (result) => OUTCOME_CODES.has(result.positionText);

// Finishing position ("P4", winner in sector purple) or the unclassified code (DNF, DSQ…).
export function FinishCell({ result }) {
  const t = useT();
  if (unclassified(result)) return <span className="font-semibold text-ink-3">{t(`common.outcome.${result.positionText}`)}</span>;
  const pos = Number(result.position);
  return <span className={`font-display text-xl ${pos === 1 ? "text-best" : "text-ink"}`}>P{pos}</span>;
}

// Places gained (▲) or lost (▼) from grid to finish. No value for pit-lane starts or unclassified.
export function PlacesCell({ result }) {
  const t = useT();
  const grid = Number(result.grid);
  if (!grid || unclassified(result)) return <span className="text-ink-3">–</span>;
  const d = grid - Number(result.position);
  if (d === 0) {
    return (
      <span className="text-ink-3">
        <span aria-hidden>=</span>
        <span className="sr-only">{t("common.places.noChange")}</span>
      </span>
    );
  }
  const gained = d > 0;
  const Icon = gained ? LuArrowUp : LuArrowDown;
  return (
    <span className={`inline-flex items-center gap-0.5 font-semibold ${gained ? "text-gain" : "text-ink-2"}`}>
      <Icon className="size-3.5" aria-hidden />
      {/* The sr-only sentence carries the number, so the digit itself is hidden from AT. */}
      <span aria-hidden>{Math.abs(d)}</span>
      <span className="sr-only"> {t(gained ? "common.places.gained" : "common.places.lost", { count: Math.abs(d), n: Math.abs(d) })}</span>
    </span>
  );
}
