import { Link, useParams } from "react-router-dom";
import { LuArrowLeft, LuExternalLink, LuTimer } from "react-icons/lu";
import { useRace } from "../hooks/queries";
import {
  Card,
  ErrorState,
  FinishCell,
  PlacesCell,
  Skeleton,
  SkeletonRows,
  StatGrid,
  TeamStripe,
} from "../components/ui";

const formatPoints = (p) => Number(p).toLocaleString("en", { maximumFractionDigits: 1 });
const formatDate = (iso) =>
  iso
    ? new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

// "1:32.064" / "59.871" -> seconds, for finding the fastest time of a session.
const lapSeconds = (t) => t.split(":").reduce((acc, part) => acc * 60 + Number(part), 0);

const cell = "px-2 py-2 sm:px-4";
const head = "label-caps px-2 pb-2 sm:px-4";

// Links from a race keep the race's season, whatever the selector says.
const inSeason = (path, season) => `${path}?season=${season}`;

function BackLink({ season }) {
  return (
    <Link
      to={inSeason("/races", season)}
      className="mb-4 -ml-2 inline-flex h-10 items-center gap-2 rounded-panel px-2 text-sm font-medium text-ink-2 hover:bg-surface-3 hover:text-ink transition-colors duration-150"
    >
      <LuArrowLeft className="size-4" aria-hidden /> Races
    </Link>
  );
}

function DriverCell({ result, season, fastest }) {
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
              <LuTimer className="size-3" aria-hidden /> Fastest lap
            </span>
          )}
        </span>
      </div>
    </div>
  );
}

// Classification table for the race or the sprint.
function ResultsTable({ results, season }) {
  return (
    <div className="relative overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line text-left">
            <th scope="col" className={`${head} w-14 text-right`}>Pos</th>
            <th scope="col" className={head}>Driver</th>
            <th scope="col" className={`${head} hidden text-right sm:table-cell`}>Grid</th>
            <th scope="col" className={`${head} text-right`} title="Places gained (▲) or lost (▼) from grid to finish">
              Places
            </th>
            <th scope="col" className={`${head} hidden text-right md:table-cell`}>Laps</th>
            <th scope="col" className={`${head} hidden text-right sm:table-cell`}>Time / status</th>
            <th scope="col" className={`${head} text-right`}>Pts</th>
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
                {Number(r.grid) ? r.grid : "PL"}
              </td>
              <td className={`${cell} text-right`}>
                <PlacesCell result={r} />
              </td>
              <td className={`${cell} hidden text-right text-ink-2 md:table-cell`}>{r.laps}</td>
              <td className={`${cell} hidden whitespace-nowrap text-right sm:table-cell`}>
                {r.Time?.time ? <span className="text-ink">{r.Time.time}</span> : <span className="text-ink-2">{r.status}</span>}
              </td>
              <td className={`${cell} text-right font-semibold text-ink`}>{formatPoints(r.points)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function QualifyingTable({ results, season }) {
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
            <th scope="col" className={`${head} w-14 text-right`}>Pos</th>
            <th scope="col" className={head}>Driver</th>
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
                  {r[q] && r[q] === best[q] && <span className="sr-only"> (fastest)</span>}
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
  const params = useParams();
  // Malformed ids never reach the API; they fall through to "not found".
  const valid = /^\d{4}$/.test(params.season) && /^\d{1,2}$/.test(params.round);
  const { season, round } = params;
  const { data: race, isPending, error, refetch } = useRace(valid ? season : null, valid ? round : null);

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
        <SkeletonRows rows={10} label="Loading race" />
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
            title="Race not found"
            message={`There's no round ${round} in the ${season} season. Pick a race from the calendar.`}
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

  return (
    <>
      <BackLink season={season} />
      <header className="mb-6 lg:mb-8">
        <p className="label-caps">
          {race.season} · Round {race.round}
          {sprint.length > 0 && " · Sprint weekend"}
        </p>
        <h1 className="mt-1 font-display text-4xl uppercase text-ink text-balance sm:text-5xl">{race.raceName}</h1>
        <p className="mt-2 text-sm text-ink-2">
          {race.Circuit.circuitName} · {loc.locality}, {loc.country} · {formatDate(race.date)}
        </p>
        {race.url && (
          <a
            href={race.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-ink underline decoration-line-strong hover:decoration-ink"
          >
            Race on Wikipedia <LuExternalLink className="size-3.5" aria-hidden />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        )}
      </header>

      {results.length > 0 && (
        <section aria-label="Race highlights" className="mb-8">
          <StatGrid className="grid-cols-2 lg:grid-cols-4">
            <Highlight label="Winner" result={winner} value={winner?.Time?.time ?? winner?.Constructor?.name} />
            <Highlight label="Pole position" result={pole} value={pole?.Q3 ?? pole?.Q2 ?? pole?.Q1 ?? pole?.Constructor?.name} />
            <Highlight
              label="Fastest lap"
              result={fastest}
              value={fastest && `${fastest.FastestLap.Time?.time ?? ""} · lap ${fastest.FastestLap.lap}`}
            />
            <div className="flex flex-col gap-2 rounded-panel border border-line bg-surface-2 p-4 shadow-raised">
              <dt className="label-caps">Laps</dt>
              <dd className="font-display text-4xl text-ink">{winner?.laps ?? "—"}</dd>
            </div>
          </StatGrid>
        </section>
      )}

      <div className="space-y-8">
        <Card title="Race result" bodyClassName="py-3">
          {results.length > 0 ? (
            <ResultsTable results={results} season={season} />
          ) : (
            <p className="px-4 py-6 text-sm text-ink-2">
              {new Date(`${race.date}T23:59:59`) > new Date()
                ? "This race hasn't run yet. Results appear here after the chequered flag."
                : "No results recorded for this race."}
            </p>
          )}
        </Card>

        {sprint.length > 0 && (
          <Card title="Sprint result" bodyClassName="py-3">
            <ResultsTable results={sprint} season={season} />
          </Card>
        )}

        {qualifying.length > 0 && (
          <Card title="Qualifying" bodyClassName="py-3">
            <QualifyingTable results={qualifying} season={season} />
          </Card>
        )}
      </div>
    </>
  );
}

export default RaceDetail;
