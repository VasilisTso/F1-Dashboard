import { Link } from "react-router-dom";
import { LuChevronRight } from "react-icons/lu";
import { TeamStripe } from "./TeamStripe";

const formatPoints = (p) => Number(p).toLocaleString("en", { maximumFractionDigits: 1 });

// Timing-tower row: position, team chip, name + team, points, gap to leader.
// `gap` is points behind the leader; 0 / null on P1 renders "Leader".
// Render inside a <ul>/<ol> (it is an <li>). With `to`, the whole row is a link.
export function StandingsRow({ position, constructorId, color, name, sub, points, gap, extra, to }) {
  const isLeader = Number(position) === 1;
  const body = (
    <>
      <span className="font-display w-7 shrink-0 sm:w-8 text-right text-2xl text-ink">{position}</span>
      <TeamStripe constructorId={constructorId} color={color} />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold text-ink">{name}</span>
        {sub && <span className="block truncate text-xs text-ink-2">{sub}</span>}
      </span>
      {extra != null && <span className="hidden w-20 shrink-0 text-right text-sm text-ink-2 sm:block">{extra}</span>}
      <span className="w-12 shrink-0 text-right sm:w-16">
        <span className="block font-semibold text-ink">{formatPoints(points)}</span>
        <span className="block text-xs text-ink-3">pts</span>
      </span>
      <span className="w-12 shrink-0 text-right sm:w-16 text-sm">
        {isLeader ? (
          <span className="font-semibold uppercase text-best">Leader</span>
        ) : gap != null ? (
          <span className="text-ink-2">−{formatPoints(gap)}</span>
        ) : null}
      </span>
      {to && <LuChevronRight className="size-4 shrink-0 text-ink-3" aria-hidden />}
    </>
  );

  const rowClass = "flex min-h-14 items-center gap-2 px-3 py-2 sm:gap-3 sm:px-4";
  return (
    <li>
      {to ? (
        <Link to={to} className={`${rowClass} transition-colors duration-150 hover:bg-surface-3`}>
          {body}
        </Link>
      ) : (
        <div className={rowClass}>{body}</div>
      )}
    </li>
  );
}

// List wrapper with column heads; children are StandingsRow. Pass `linked` when rows have `to`.
export function StandingsList({ label, children, showExtra, linked = false }) {
  return (
    <div>
      <div className="flex items-center gap-2 border-b border-line px-3 pb-2 sm:gap-3 sm:px-4" aria-hidden>
        <span className="label-caps w-7 shrink-0 text-right sm:w-8">Pos</span>
        <span className="w-1" />
        <span className="label-caps flex-1">{label}</span>
        {showExtra && <span className="label-caps hidden w-20 text-right sm:block">{showExtra}</span>}
        <span className="label-caps w-12 shrink-0 text-right sm:w-16">Points</span>
        <span className="label-caps w-12 shrink-0 text-right sm:w-16">Gap</span>
        {linked && <span className="w-4 shrink-0" />}
      </div>
      <ol className="divide-y divide-line">{children}</ol>
    </div>
  );
}
