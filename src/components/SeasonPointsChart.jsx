import { useReducedMotion } from "motion/react";
import { Bar, BarChart, CartesianGrid, Cell, Rectangle, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const formatPoints = (p) => Number(p).toLocaleString("en", { maximumFractionDigits: 1 });

// 4px rounded data-end, clamped so narrow bars (long histories on phones) don't distort.
const RoundedBar = (props) => {
  const r = Math.max(0, Math.min(4, props.width / 2));
  return <Rectangle {...props} radius={[r, r, 0, 0]} />;
};

function ChartTooltip({ active, payload }) {
  const row = active && payload?.[0]?.payload;
  if (!row) return null;
  const champion = isTitle(row);
  return (
    <div className="rounded-panel border border-line-strong bg-surface-2 px-3 py-2 text-sm shadow-raised">
      <p className="font-display text-lg text-ink">{row.season}</p>
      <p className="text-ink">
        {formatPoints(row.points)} <span className="text-ink-3">pts</span>
      </p>
      <p className="text-ink-2">
        P{row.position} · {row.wins} {row.wins === 1 ? "win" : "wins"}
      </p>
      {champion && <p className="font-semibold uppercase text-best">Champions</p>}
      {row.inProgress && <p className="text-ink-3">Season in progress</p>}
    </div>
  );
}

// Constructors' points per season, one column each. Championship seasons use sector purple
// ("best"); everything else is a neutral mark so the titles carry the story.
// Colors come from CSS (fill-* classes) so both themes work without re-rendering.
// With `chart={false}` (too few seasons to plot) only the table renders, open.
// Pass `animate={false}` while rows are still streaming in: each new row would restart the reveal.
// eslint-disable-next-line react-refresh/only-export-components
export const isTitle = (row) => row.position === 1 && !row.inProgress;

export function SeasonPointsChart({ rows, teamName, chart = true, animate = true }) {
  const reduceMotion = useReducedMotion();
  const titles = rows.filter(isTitle).map((r) => r.season);
  const best = rows.reduce((a, r) => (r.points > (a?.points ?? -1) ? r : a), null);
  const summary =
    `${teamName} points per season, ${rows[0].season} to ${rows.at(-1).season}. ` +
    `Best: ${formatPoints(best.points)} points in ${best.season}. ` +
    (titles.length ? `Championships: ${titles.join(", ")}.` : "No championships in this range.");

  const table = (
    <table className="w-full text-sm">
      <thead className="sticky top-0 bg-surface-2">
        <tr className="text-left">
          <th scope="col" className="label-caps px-4 py-2">
            Season
          </th>
          <th scope="col" className="label-caps px-4 py-2 text-right">
            Pos
          </th>
          <th scope="col" className="label-caps px-4 py-2 text-right">
            Points
          </th>
          <th scope="col" className="label-caps px-4 py-2 text-right">
            Wins
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-line">
        {[...rows].reverse().map((r) => (
          <tr key={r.season}>
            <th scope="row" className="px-4 py-2 text-left font-medium text-ink">
              {r.season}
            </th>
            <td className={`px-4 py-2 text-right ${isTitle(r) ? "font-semibold text-best" : "text-ink-2"}`}>
              P{r.position}
            </td>
            <td className="px-4 py-2 text-right text-ink">{formatPoints(r.points)}</td>
            <td className="px-4 py-2 text-right text-ink-2">{r.wins}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  if (!chart) return <div className="rounded-panel border border-line">{table}</div>;

  return (
    <figure>
      <div
        role="img"
        aria-label={summary}
        className="h-64 sm:h-72 [&_.recharts-cartesian-axis-tick-value]:fill-ink-3 [&_.recharts-cartesian-axis-tick-value]:text-xs [&_.recharts-cartesian-grid_line]:stroke-line [&_.recharts-tooltip-cursor]:fill-surface-3"
      >
        <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 320, height: 256 }}>
          <BarChart
            data={rows}
            margin={{ top: 8, right: 4, bottom: 0, left: -12 }}
            barCategoryGap={rows.length > 30 ? 1 : 2}
          >
            <CartesianGrid vertical={false} />
            <XAxis dataKey="season" tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={16} />
            <YAxis tickLine={false} axisLine={false} allowDecimals={false} tickFormatter={formatPoints} width={48} />
            <Tooltip content={<ChartTooltip />} isAnimationActive={false} />
            <Bar
              dataKey="points"
              maxBarSize={24}
              shape={RoundedBar}
              isAnimationActive={animate && !reduceMotion}
              animationDuration={600}
            >
              {rows.map((r) => (
                <Cell key={r.season} className={isTitle(r) ? "fill-best" : "fill-ink-3"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      {/* Single series: a key is only needed once title seasons add a second color. */}
      {titles.length > 0 && (
        <figcaption className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-2">
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden className="size-2.5 rounded-sm bg-best" /> Championship season
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden className="size-2.5 rounded-sm bg-ink-3" /> Other seasons
          </span>
        </figcaption>
      )}
      <details className="mt-4 rounded-panel border border-line">
        <summary className="cursor-pointer px-4 py-2.5 text-sm font-medium text-ink-2 hover:text-ink">
          Show as table
        </summary>
        <div className="max-h-80 overflow-auto border-t border-line">{table}</div>
      </details>
    </figure>
  );
}
