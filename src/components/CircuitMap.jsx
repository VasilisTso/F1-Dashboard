import { useQuery } from "@tanstack/react-query";
import { useI18n } from "../i18n/LanguageContext";
import { circuitLayout } from "../lib/circuits";

// Start/finish tick length, in viewBox units (the longest side is 1000).
const TICK = 80;

// Track outline: a thin neutral line in the current text colour, the start/finish line in
// accent. Renders nothing for circuits without a layout (mostly pre-1990 venues).
export function CircuitMap({ circuitId, name, className = "" }) {
  const { t } = useI18n();
  const load = circuitLayout(circuitId);
  const { data } = useQuery({
    queryKey: ["circuitLayout", circuitId],
    queryFn: load,
    enabled: !!load,
    staleTime: Infinity,
    gcTime: Infinity,
  });
  if (!load) return null;

  // The box is sized by the caller, so the page doesn't move when the layout arrives.
  return (
    <div className={`text-ink-2 ${className}`}>
      {data && (
        <svg viewBox={data.viewBox} role="img" aria-label={t("common.circuit.layout", { name })} className="size-full">
          <path
            d={data.d}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
          {/* Perpendicular to the direction of travel at the line. */}
          <line
            x1={-TICK / 2}
            x2={TICK / 2}
            transform={`translate(${data.start[0]} ${data.start[1]}) rotate(${data.start[2] + 90})`}
            className="stroke-accent-ink"
            strokeWidth={3}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      )}
    </div>
  );
}
