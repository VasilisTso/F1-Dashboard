import { useEffect, useRef, useState } from "react";
import { animate, useReducedMotion } from "motion/react";
import { Skeleton } from "./Skeleton";
import { useI18n } from "../../i18n/LanguageContext";

// Counts up from 0 on first render (skipped for reduced motion / non-numbers).
function CountUp({ value }) {
  const { fmt } = useI18n();
  const reduce = useReducedMotion();
  const target = Number(value);
  const numeric = Number.isFinite(target);
  const [shown, setShown] = useState(reduce || !numeric ? target : 0);
  const from = useRef(0);

  useEffect(() => {
    if (reduce || !numeric) {
      setShown(target);
      return;
    }
    const controls = animate(from.current, target, {
      duration: 0.9,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        from.current = v;
        setShown(v);
      },
    });
    return () => controls.stop();
  }, [target, numeric, reduce]);

  if (!numeric) return value;
  const decimals = Number.isInteger(target) ? 0 : 1;
  return fmt.number(shown, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

// Key figure with a label. `value` may be a number (counts up) or any node; `hint` sits underneath.
// `accent` is for timing-state colors only (e.g. "var(--best)"); team colors fail contrast as text.
export function StatTile({ label, value, hint, loading = false, accent }) {
  return (
    <div className="flex flex-col gap-2 rounded-panel border border-line bg-surface-2 p-4 shadow-raised">
      <dt className="label-caps">{label}</dt>
      <dd className="font-display text-4xl" style={accent ? { color: accent } : undefined}>
        {loading ? (
          <Skeleton className="h-9 w-16" />
        ) : value == null ? (
          <span className="text-ink-3">—</span>
        ) : (
          <span className={accent ? undefined : "text-ink"}>
            <CountUp value={value} />
          </span>
        )}
      </dd>
      {hint && <dd className="text-xs text-ink-2">{hint}</dd>}
    </div>
  );
}

// Grid wrapper so tiles form one <dl>.
export function StatGrid({ children, className = "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5" }) {
  return <dl className={`grid gap-3 ${className}`}>{children}</dl>;
}
