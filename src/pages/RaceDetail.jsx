import { Link, useParams } from "react-router-dom";
import { LuArrowLeft, LuExternalLink, LuTimer } from "react-icons/lu";
import { useRace, useSchedule } from "../hooks/queries";
import { CalendarButton } from "../components/CalendarButton";
import { CircuitMap } from "../components/CircuitMap";
import { circuitLayout } from "../lib/circuits";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import {
  Card,
  ErrorState,
  FinishCell,
  PlacesCell,
  Skeleton,
  SkeletonRows,
  StatGrid,
  TeamStripe,
  ZoneLabel,
  useZone,
} from "../components/ui";
import { useI18n } from "../i18n/LanguageContext";
import { useDataLabels } from "../i18n/data";

const DATE_OPTS = { weekday: "short", day: "numeric", month: "long", year: "numeric" };

// "1:32.064" / "59.871" -> seconds, for finding the fastest time of a session.
const lapSeconds = (t) => t.split(":").reduce((acc, part) => acc * 60 + Number(part), 0);

const cell = "px-2 py-2 sm:px-4";
const head = "label-caps px-2 pb-2 sm:px-4";

// Links from a race keep the race's season, whatever the selector says.
const inSeason = (path, season) => `${path}?season=${season}`;

function BackLink({ season }) {
  const { t } = useI18n();
  return (
    <Link
      to={inSeason("/races", season)}
      className="mb-4 -ml-2 inline-flex h-10 items-center gap-2 rounded-panel px-2 text-sm font-medium text-ink-2 hover:bg-surface-3 hover:text-ink transition-colors duration-150"
    >
      <LuArrowLeft className="size-4" aria-hidden /> {t("races.title")}
    </Link>
  );
}

function DriverCell({ result, season, fastest }) {
  const { t } = useI18n();
  const d = result.Driver;
  const c = result.Constructor;
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <TeamStripe constructorId={c?.constructorId} className="h-8" />
      <div className="min-w-0">
        <Link
          to={inSeason(`/drivers/${d.driverId}`, season)}
          className="block truncate font-semibold text-ink underline decoration-transparent underline-offset-2 hover:decoration-ink transition-colors duration-150"
        >
          <span className="hidden sm:inline">{d.givenName} </span>
          {d.familyName}
        </Link>
        <span className="flex items-center gap-1.5 text-xs text-ink-2">
          {c && (
            <Link
              to={inSeason(`/constructors/${c.constructorId}`, season)}
              className="truncate hover:text-ink hover:underline"
            >
              {c.name}
            </Link>
          )}
          {fastest && (
            <span className="inline-flex items-center gap-0.5 font-semibold text-best">
              <LuTimer className="size-3" aria-hidden /> {t("races.race.fastestLap")}
            </span>
          )}
        </span>
      </div>
    </div>
  );
}

// Classification table for the race or the sprint.
function ResultsTable({ results, season }) {
  const { t, fmt } = useI18n();
  const { status } = useDataLabels();
  return (
    <div className="relative overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line text-left">
            <th scope="col" className={`${head} w-14 text-right`}>{t("common.pos")}</th>
            <th scope="col" className={head}>{t("races.race.driver")}</th>
            <th scope="col" className={`${head} hidden text-right sm:table-cell`}>{t("races.race.grid")}</th>
            <th scope="col" className={`${head} text-right`} title={t("common.places.hint")}>
              {t("races.race.places")}
            </th>
            <th scope="col" className={`${head} hidden text-right md:table-cell`}>{t("races.race.laps")}</th>
            <th scope="col" className={`${head} hidden text-right sm:table-cell`}>{t("races.race.timeStatus")}</th>
            <th scope="col" className={`${head} text-right`}>{t("races.race.pts")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {results.map((r) => (
            <tr key={r.Driver.driverId}>
              <td className={`${cell} text-right`}>
                <FinishCell result={r} />
              </td>
              <td className={cell}>
                <DriverCell result={r} season={season} fastest={r.FastestLap?.rank === "1"} />
              </td>
              <td className={`${cell} hidden text-right text-ink-2 sm:table-cell`}>
                {Number(r.grid) ? r.grid : <abbr title={t("races.race.pitLane")}>{t("races.race.pitLaneShort")}</abbr>}
              </td>
              <td className={`${cell} text-right`}>
                <PlacesCell result={r} />
              </td>
              <td className={`${cell} hidden text-right text-ink-2 md:table-cell`}>{r.laps}</td>
              <td className={`${cell} hidden whitespace-nowrap text-right sm:table-cell`}>
                {r.Time?.time ? <span className="text-ink">{r.Time.time}</span> : <span className="text-ink-2">{status(r.status)}</span>}
              </td>
              <td className={`${cell} text-right font-semibold text-ink`}>{fmt.points(r.points)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function QualifyingTable({ results, season }) {
  const { t } = useI18n();
  // Older seasons have no Q2/Q3 split; only show the columns that have data.
  const sessions = ["Q1", "Q2", "Q3"].filter((q) => results.some((r) => r[q]));
  const best = Object.fromEntries(
    sessions.map((q) => [q, results
        .map((r) => r[q])
        .filter(Boolean)
        .sort((a, b) => lapSeconds(a) - lapSeconds(b))[0]]),
  );
  return (
    <div className="relative overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line text-left">
            <th scope="col" className={`${head} w-14 text-right`}>{t("common.pos")}</th>
            <th scope="col" className={head}>{t("races.race.driver")}</th>
            {sessions.map((q) => (
              <th key={q} scope="col" className={`${head} text-right`}>
                {q}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {results.map((r) => (
            <tr key={r.Driver.driverId}>
              <td className={`${cell} font-display text-right text-xl ${r.position === "1" ? "text-best" : "text-ink"}`}>
                P{r.position}
              </td>
              <td className={cell}>
                <DriverCell result={r} season={season} />
              </td>
              {sessions.map((q) => (
                <td
                  key={q}
                  className={`${cell} whitespace-nowrap text-right ${
                    r[q] && r[q] === best[q] ? "font-semibold text-best" : r[q] ? "text-ink" : "text-ink-3"
                  }`}
                >
                  {r[q] || "–"}
                  {r[q] && r[q] === best[q] && <span className="sr-only"> ({t("races.race.fastest")})</span>}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Highlight({ label, result, value }) {
  return (
    <div className="flex flex-col gap-2 rounded-panel border border-line bg-surface-2 p-4 shadow-raised">
      <dt className="label-caps">{label}</dt>
      <dd className="flex min-w-0 items-center gap-2">
        {result ? (
          <>
            <TeamStripe constructorId={result.Constructor?.constructorId} className="h-8" />
            <span className="min-w-0">
              <span className="block truncate font-display text-2xl uppercase text-ink">{result.Driver.familyName}</span>
              <span className="block truncate text-xs text-ink-2">{value}</span>
            </span>
          </>
        ) : (
          <span className="font-display text-2xl text-ink-3">—</span>
        )}
      </dd>
    </div>
  );
}

function RaceDetail() {
  const { t, fmt } = useI18n();
  const { country } = useDataLabels();
  const zone = useZone();
  const params = useParams();
  // Malformed ids never reach the API; they fall through to "not found".
  const valid = /^\d{4}$/.test(params.season) && /^\d{1,2}$/.test(params.round);
  const { season, round } = params;
  const { data: race, isPending, error, refetch } = useRace(valid ? season : null, valid ? round : null);
  // Session times only come with the schedule; fetch it just for weekends still to come.
  const upcoming = !!race && race.results.length === 0 && new Date(`${race.date}T23:59:59`) > new Date();
  const scheduleQ = useSchedule(season, { enabled: upcoming });
  const weekend = upcoming ? scheduleQ.data?.find((r) => r.round === race.round) : null;
  useDocumentTitle(race && `${race.raceName} ${race.season}`, t("races.title"));

  if (valid && isPending) {
    return (
      <>
        <BackLink season={season} />
        <Skeleton className="mb-8 h-24 w-full max-w-xl" />
        <StatGrid className="mb-8 grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </StatGrid>
        <SkeletonRows rows={10} label={t("races.race.loading")} />
      </>
    );
  }

  if (error || !race) {
    return (
      <>
        <BackLink season={season} />
        {error ? (
          <ErrorState onRetry={refetch} />
        ) : (
          <ErrorState
            title={t("races.race.notFound")}
            titleAs="h1"
            message={t("races.race.notFoundMessage", { round, season })}
          />
        )}
      </>
    );
  }

  const { results, sprint, qualifying } = race;
  const winner = results.find((r) => r.position === "1");
  const pole = qualifying.find((r) => r.position === "1") ?? results.find((r) => r.grid === "1");
  const fastest = results.find((r) => r.FastestLap?.rank === "1");
  const loc = race.Circuit.Location;
  const start = race.time ? new Date(`${race.date}T${race.time}`) : null;

  return (
    <>
      <BackLink season={season} />
      <header className="mb-6 flex items-start gap-4 sm:gap-6 lg:mb-8">
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-4xl uppercase text-ink text-balance sm:text-5xl">{race.raceName}</h1>
          <p className="mt-2 text-sm text-ink-2">
            {t("common.season.title", { season: race.season })} · {t("races.round", { round: race.round })}
            {sprint.length > 0 && ` · ${t("races.race.sprintWeekend")}`}
          </p>
          <p className="text-sm text-ink-2">
            {race.Circuit.circuitName} · {loc.locality}, {country(loc.country)} ·{" "}
            {/* With a start time: local date + time, the zone named next to it, UTC in the tooltip. */}
            {start ? (
              <time dateTime={start.toISOString()} title={zone.utc(start)} className="whitespace-nowrap">
                {fmt.date(start, { ...DATE_OPTS, hour: "2-digit", minute: "2-digit" })}
              </time>
            ) : (
              <time dateTime={race.date}>{fmt.day(race.date, DATE_OPTS)}</time>
            )}
          </p>
          {start && <ZoneLabel at={start} className="mt-1 flex w-fit" />}
          {weekend && (
            <CalendarButton
              races={[weekend]}
              filename={`f1-${race.season}-round-${race.round}.ics`}
              className="mt-3 flex w-fit"
            />
          )}
          {race.url && (
            <a
              href={race.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-ink underline decoration-line-strong hover:decoration-ink"
            >
              {t("races.race.wikipedia")} <LuExternalLink className="size-3.5" aria-hidden />
              <span className="sr-only">{t("common.wiki.newTab")}</span>
            </a>
          )}
        </div>
        {circuitLayout(race.Circuit.circuitId) && (
          <figure className="w-20 shrink-0 sm:w-32 lg:w-40">
            <CircuitMap
              circuitId={race.Circuit.circuitId}
              name={race.Circuit.circuitName}
              className="size-20 sm:size-32 lg:size-40"
            />
            {Number(race.season) < new Date().getFullYear() && (
              <figcaption
                title={t("common.circuit.currentHint", { season: race.season })}
                className="mt-1 text-center text-xs text-ink-3"
              >
                {t("common.circuit.current")}
              </figcaption>
            )}
          </figure>
        )}
      </header>

      {results.length > 0 && (
        <section aria-label={t("races.race.highlights")} className="mb-8">
          <StatGrid className="grid-cols-2 lg:grid-cols-4">
            <Highlight label={t("races.winner")} result={winner} value={winner?.Time?.time ?? winner?.Constructor?.name} />
            <Highlight label={t("races.race.pole")} result={pole} value={pole?.Q3 ?? pole?.Q2 ?? pole?.Q1 ?? pole?.Constructor?.name} />
            <Highlight
              label={t("races.race.fastestLap")}
              result={fastest}
              value={fastest && `${fastest.FastestLap.Time?.time ?? ""} · ${t("races.race.lapN", { lap: fastest.FastestLap.lap })}`}
            />
            <div className="flex flex-col gap-2 rounded-panel border border-line bg-surface-2 p-4 shadow-raised">
              <dt className="label-caps">{t("races.race.laps")}</dt>
              <dd className="font-display text-4xl text-ink">{winner?.laps ?? "—"}</dd>
            </div>
          </StatGrid>
        </section>
      )}

      <div className="space-y-8">
        <Card title={t("races.race.result")} bodyClassName="py-3">
          {results.length > 0 ? (
            <ResultsTable results={results} season={season} />
          ) : (
            <p className="px-4 py-6 text-sm text-ink-2">
              {t(new Date(`${race.date}T23:59:59`) > new Date() ? "races.race.notRun" : "races.race.noResults")}
            </p>
          )}
        </Card>

        {sprint.length > 0 && (
          <Card title={t("races.race.sprintResult")} bodyClassName="py-3">
            <ResultsTable results={sprint} season={season} />
          </Card>
        )}

        {qualifying.length > 0 && (
          <Card title={t("races.race.qualifying")} bodyClassName="py-3">
            <QualifyingTable results={qualifying} season={season} />
          </Card>
        )}
      </div>
    </>
  );
}

export default RaceDetail;
