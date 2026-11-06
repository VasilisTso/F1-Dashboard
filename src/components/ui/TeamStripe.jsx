import { getTeamColor } from "../../lib/teams";

// Vertical team-color chip. Decorative: the team name always sits next to it.
// Inset hairline keeps pale liveries (e.g. white) visible on light surfaces.
export function TeamStripe({ constructorId, color, className = "h-8" }) {
  return (
    <span
      aria-hidden
      className={`block w-1 shrink-0 rounded-full shadow-[inset_0_0_0_1px_var(--line)] ${className}`}
      style={{ backgroundColor: color ?? getTeamColor(constructorId) }}
    />
  );
}
