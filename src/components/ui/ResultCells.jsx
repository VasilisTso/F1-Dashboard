import { LuArrowUp, LuArrowDown } from "react-icons/lu";

// Ergast positionText codes for unclassified results.
const OUTCOME = { R: "DNF", D: "DSQ", E: "EXC", W: "DNS", F: "DNQ", N: "NC" };
const unclassified = (result) => OUTCOME[result.positionText];

// Finishing position ("P4", winner in sector purple) or the unclassified code (DNF, DSQ…).
export function FinishCell({ result }) {
  const outcome = unclassified(result);
  if (outcome) return <span className="font-semibold text-ink-3">{outcome}</span>;
  const pos = Number(result.position);
  return <span className={`font-display text-xl ${pos === 1 ? "text-best" : "text-ink"}`}>P{pos}</span>;
}

// Places gained (▲) or lost (▼) from grid to finish. No value for pit-lane starts or unclassified.
export function PlacesCell({ result }) {
  const grid = Number(result.grid);
  if (!grid || unclassified(result)) return <span className="text-ink-3">–</span>;
  const d = grid - Number(result.position);
  if (d === 0) {
    return (
      <span className="text-ink-3">
        <span aria-hidden>=</span>
        <span className="sr-only">no change</span>
      </span>
    );
  }
  const gained = d > 0;
  const Icon = gained ? LuArrowUp : LuArrowDown;
  return (
    <span className={`inline-flex items-center gap-0.5 font-semibold ${gained ? "text-gain" : "text-ink-2"}`}>
      <Icon className="size-3.5" aria-hidden />
      {Math.abs(d)}
      <span className="sr-only">
        {gained ? " gained" : " lost"} {Math.abs(d) === 1 ? "place" : "places"}
      </span>
    </span>
  );
}
