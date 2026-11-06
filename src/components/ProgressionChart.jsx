import { useId, useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useSchedule, useSeasonResults, useSeasonSprints } from "../hooks/queries";
import { buildProgression } from "../lib/championship";
import { useI18n } from "../i18n/LanguageContext";
import { Card, ErrorState, Skeleton, TeamStripe } from "./ui";

// Lines drawn: the final top TOP_N plus anyone who led after some round (an early leader who
// faded is part of the story). Capped so the chart stays readable.
const TOP_N = 5;
const MAX_LINES = 8;

// Lines stay neutral (team colour lives only in the stripe): the leader at the selected round is
// sector purple, a followed entry is full ink, the rest recede. Identity comes from the
// legend list and the direct labels, never from colour.
const lineTone = (id, leaderId, focusId) =>
  id === focusId ? "text-ink" : id === leaderId ? "text-best" : focusId ? "text-ink-3 opacity-40" : "text-ink-3";

function pickSeries(rows, series) {
  const ids = new Set(series.slice(0, TOP_N).map((s) => s.id));
  for (const row of rows) {
    if (ids.size >= MAX_LINES) break;
    const leader = series.reduce((best, s) => ((row[s.id] ?? 0) > (row[best?.id] ?? -1) ? s : best), null);
    if (leader) ids.add(leader.id);
  }
  return series.filter((s) => ids.has(s.id));
}

// Points of `shown` entries at one row, best first.
const rankAt = (row, shown) =>
  shown.map((s) => ({ ...s, points: row?.[s.id] ?? 0 })).sort((a, b) => b.points - a.points);

function ChartTooltip({ active, payload, label, shown, raceName }) {
  const { t, fmt } = useI18n();
  const row = active && payload?.[0]?.payload;
  if (!row) return null;
  return (
    <div className="min-w-44 rounded-panel border border-line-strong bg-surface-2 px-3 py-2 text-sm shadow-raised">
      <p className="font-display text-lg text-ink">{t("races.roundShort", { round: label })}</p>
      {raceName(label) && <p className="mb-1 text-xs text-ink-2">{raceName(label)}</p>}
      <ol>
        {rankAt(row, shown).map((s) => (
          <li key={s.id} className="flex items-center gap-2 py-0.5">
            <TeamStripe constructorId={s.constructorId} className="h-3.5" />
            <span className="flex-1 truncate text-ink-2">{s.short}</span>
            <span className="font-semibold text-ink">{fmt.points(s.points)}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function ProgressionChart({ kind, season }) {
  const { t, fmt } = useI18n();
  const sliderId = useId();
  const resultsQ = useSeasonResults();
  const sprintsQ = useSeasonSprints();
  const scheduleQ = useSchedule();
  const [picked, setPicked] = useState(null); // selected round index; null = latest
  const [focusId, setFocusId] = useState(null);

  const { rows, series } = useMemo(
    () => buildProgression(resultsQ.data, sprintsQ.data, kind),
    [resultsQ.data, sprintsQ.data, kind]
  );
  const shown = useMemo(() => pickSeries(rows, series), [rows, series]);

  const title = t("common.progression.title");
  const error = resultsQ.error || sprintsQ.error;
  if (error) {
    return (
      <ErrorState
        title={t("common.progression.error")}
        onRetry={() => {
          resultsQ.refetch();
          sprintsQ.refetch();
        }}
      />
    );
  }
  if (resultsQ.isPending || sprintsQ.isPending) {
    return (
      <Card title={title}>
        <span className="sr-only" role="status">
          {t("common.progression.loading")}
        </span>
        <Skeleton className="h-72 w-full" />
      </Card>
    );
  }
  if (rows.length < 2 || shown.length === 0) return null;

  const last = rows.length - 1;
  const index = Math.min(picked ?? last, last);
  const current = rows[index];
  const round = current.round;
  const total = scheduleQ.data?.length || rows.at(-1).round;
  const raceName = (r) => scheduleQ.data?.find((race) => Number(race.round) === Number(r))?.raceName ?? "";
  const ranked = rankAt(current, shown);
  const leaderId = ranked[0].id;
  const focus = shown.some((s) => s.id === focusId) ? focusId : null;

  // Every round stays on the x axis so the scale holds still while scrubbing; later rounds are
  // blanked so the lines end at the selected one.
  const data = rows.map((row, i) =>
    i <= index ? row : { round: row.round, ...Object.fromEntries(shown.map((s) => [s.id, null])) }
  );
  // Round gridlines (0, 100, 200…) sized to the final totals, so the scale holds while scrubbing.
  const finalMax = Math.max(1, ...shown.map((s) => rows.at(-1)[s.id] ?? 0));
  const step = [5, 10, 20, 25, 50, 100, 200, 250, 500].find((n) => finalMax / n <= 5) ?? 1000;
  const yTicks = Array.from({ length: Math.ceil(finalMax / step) + 1 }, (_, i) => i * step);

  const [first, second] = ranked;
  const summary = second
    ? t("common.progression.summary", {
        leader: first.name,
        points: fmt.points(first.points),
        round,
        total,
        gap: fmt.points(first.points - second.points),
        second: second.name,
      })
    : t("common.progression.summaryAlone", { leader: first.name, points: fmt.points(first.points), round, total });

  // Direct label at the end of the leader's and the followed line only (the legend names the rest).
  const endLabel = (id) =>
    function EndLabel({ x, y, index: i, value }) {
      if (i !== index || value == null || (id !== leaderId && id !== focus)) return null;
      const s = shown.find((e) => e.id === id);
      return (
        <text x={x + 6} y={y} dy={4} className="fill-ink-2 text-xs font-semibold">
          {s.short.length > 10 ? `${s.short.slice(0, 9)}…` : s.short}
        </text>
      );
    };

  return (
    <Card title={title} className="@container" bodyClassName="p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <label htmlFor={sliderId} className="label-caps">
          {t("common.progression.upTo")}
        </label>
        <input
          id={sliderId}
          type="range"
          min={0}
          max={last}
          step={1}
          value={index}
          onChange={(e) => setPicked(Number(e.target.value))}
          aria-valuetext={t("common.progression.upToValue", { round, total, race: raceName(round) })}
          className="h-10 min-w-40 flex-1 accent-accent"
        />
        <p className="w-full text-sm text-ink-2 sm:w-auto" aria-hidden>
          <span className="font-display text-xl text-ink">{t("races.roundShort", { round })}</span> {raceName(round)}
        </p>
      </div>

      {season < 1991 && <p className="mb-3 text-xs text-ink-3">{t("common.progression.oldRules")}</p>}

      <div className="grid gap-6 @3xl:grid-cols-[minmax(0,1fr)_16rem]">
        <figure className="min-w-0">
          <div
            role="img"
            aria-label={summary}
            className="h-64 sm:h-80 [&_.recharts-cartesian-axis-tick-value]:fill-ink-3 [&_.recharts-cartesian-axis-tick-value]:text-xs [&_.recharts-cartesian-grid_line]:stroke-line [&_.recharts-tooltip-cursor]:stroke-line-strong"
          >
            <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 320, height: 256 }}>
              <LineChart data={data} margin={{ top: 8, right: 64, bottom: 0, left: -12 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="round"
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                  minTickGap={12}
                  tickFormatter={(r) => t("races.roundShort", { round: r })}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                  domain={[0, yTicks.at(-1)]}
                  ticks={yTicks}
                  tickFormatter={(v) => fmt.points(v)}
                  width={48}
                />
                <Tooltip
                  content={<ChartTooltip shown={shown} raceName={raceName} />}
                  isAnimationActive={false}
                />
                {/* Leader and followed lines are drawn last so they sit on top. */}
                {[...shown]
                  .sort((a, b) => (a.id === focus) - (b.id === focus) || (a.id === leaderId) - (b.id === leaderId))
                  .map((s) => (
                    <Line
                      key={s.id}
                      dataKey={s.id}
                      name={s.name}
                      type="linear"
                      stroke="currentColor"
                      className={lineTone(s.id, leaderId, focus)}
                      strokeWidth={s.id === leaderId || s.id === focus ? 2.5 : 1.5}
                      dot={false}
                      activeDot={{ r: 4, strokeWidth: 2, className: "stroke-surface-2" }}
                      label={endLabel(s.id)}
                      isAnimationActive={false}
                    />
                  ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <figcaption className="mt-3 text-xs text-ink-3">{t("common.progression.hint", { n: TOP_N })}</figcaption>
        </figure>

        {/* Legend: standings at the selected round. Selecting a row follows its line. */}
        <div>
          <p className="label-caps mb-2">{t("common.progression.pointsAfter", { round })}</p>
          <ol className="tower divide-y divide-line border-y border-line">
            {ranked.map((s, i) => (
              <li key={s.id}>
                <button
                  type="button"
                  aria-pressed={focus === s.id}
                  onClick={() => setFocusId(focus === s.id ? null : s.id)}
                  className={`flex min-h-10 w-full items-center gap-2 px-2 py-1.5 text-left text-sm transition-colors duration-150 hover:bg-surface-3 ${
                    focus === s.id ? "bg-surface-3" : ""
                  }`}
                >
                  <span className="font-display w-6 shrink-0 text-right text-lg text-ink">{i + 1}</span>
                  <TeamStripe constructorId={s.constructorId} className="h-6" />
                  <span className="min-w-0 flex-1 truncate font-medium text-ink">{s.name}</span>
                  <span className={`shrink-0 font-semibold ${s.id === leaderId ? "text-best" : "text-ink"}`}>
                    {fmt.points(s.points)}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <details className="mt-4 border-t border-line">
        <summary className="cursor-pointer py-2.5 text-sm font-medium text-ink-2 hover:text-ink">
          {t("common.progression.showTable")}
        </summary>
        <div className="max-h-80 overflow-auto border-t border-line">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-surface-2">
              <tr>
                <th scope="col" className="label-caps px-3 py-2 text-left">
                  {t("common.progression.round")}
                </th>
                {shown.map((s) => (
                  <th key={s.id} scope="col" className="label-caps whitespace-nowrap px-3 py-2 text-right">
                    {s.short}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((row) => (
                <tr key={row.round}>
                  <th scope="row" className="whitespace-nowrap px-3 py-2 text-left font-medium text-ink">
                    {t("races.roundShort", { round: row.round })}{" "}
                    <span className="font-normal text-ink-2">{raceName(row.round)}</span>
                  </th>
                  {shown.map((s) => (
                    <td key={s.id} className="px-3 py-2 text-right text-ink">
                      {fmt.points(row[s.id] ?? 0)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </Card>
  );
}
