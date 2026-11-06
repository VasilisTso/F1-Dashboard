import { Link, useParams } from "react-router-dom";
import { LuArrowLeft, LuExternalLink, LuChevronRight } from "react-icons/lu";
import {
  useDriver,
  useDriverCareer,
  useDriverConstructors,
  useDriverSeasonResults,
  useDriverStandings,
  useWikiSummary,
} from "../hooks/queries";
import { useSeason } from "../context/SeasonContext";
import { Card, ErrorState, Skeleton, SkeletonRows, StatGrid, StatTile, TeamStripe } from "../components/ui";

const formatPoints = (p) => Number(p).toLocaleString("en", { maximumFractionDigits: 1 });
const formatDate = (iso, opts = { day: "numeric", month: "short", year: "numeric" }) =>
  iso ? new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", opts) : null;

const ageOn = (dob) => {
  if (!dob) return null;
  const birth = new Date(`${dob}T00:00:00`);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const beforeBirthday =
    now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate());
  return beforeBirthday ? age - 1 : age;
};

// Ergast positionText codes for unclassified results.
const OUTCOME = { R: "DNF", D: "DSQ", E: "EXC", W: "WD", F: "DNQ", N: "NC" };

function BackLink() {
  const { withSeason } = useSeason();
  return (
    <Link
      to={withSeason("/drivers")}
      className="mb-4 -ml-2 inline-flex h-10 items-center gap-2 rounded-panel px-2 text-sm font-medium text-ink-2 hover:bg-surface-3 hover:text-ink transition-colors duration-150"
    >
      <LuArrowLeft className="size-4" aria-hidden /> Drivers
    </Link>
  );
}

function Hero({ driver, wiki, teamId }) {
  const photo = wiki?.thumbnail?.source;
  const age = ageOn(driver.dateOfBirth);
  return (
    <header className="mb-6 flex flex-wrap items-center gap-4 lg:mb-8">
      <TeamStripe constructorId={teamId} className="h-16 sm:h-20" />
      {driver.permanentNumber && (
        <span className="font-display text-5xl text-ink-3 sm:text-6xl" aria-hidden>
          {driver.permanentNumber}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-ink-2">{driver.givenName}</p>
        <h1 className="font-display text-4xl uppercase text-ink text-balance sm:text-5xl">
          <span className="sr-only">{driver.givenName} </span>
          {driver.familyName}
        </h1>
        <p className="mt-2 text-sm text-ink-2">
          {[
            driver.nationality,
            driver.dateOfBirth && `Born ${formatDate(driver.dateOfBirth)}${age != null ? ` (${age})` : ""}`,
            driver.code,
            driver.permanentNumber && `Car #${driver.permanentNumber}`,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>
      {photo && (
        <img
          src={photo}
          alt={`${driver.givenName} ${driver.familyName}`}
          className="h-28 w-24 shrink-0 rounded-panel border border-line object-cover object-top sm:h-36 sm:w-28"
        />
      )}
    </header>
  );
}

function CareerStats({ driverId, teams }) {
  const { data: career, isPending } = useDriverCareer(driverId);
  const span =
    career?.firstSeason &&
    (career.firstSeason === career.lastSeason ? career.firstSeason : `${career.firstSeason}–${career.lastSeason}`);
  return (
    <section aria-label="Career statistics" className="mb-8">
      <StatGrid className="grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile label="Seasons" value={career?.seasons} hint={span} loading={isPending} />
        <StatTile label="Starts" value={career?.starts} loading={isPending} />
        <StatTile
          label="Wins"
          value={career?.wins}
          accent={career?.wins > 0 ? "var(--best)" : undefined}
          loading={isPending}
        />
        <StatTile label="Podiums" value={career?.podiums} loading={isPending} />
        <StatTile label="Poles" value={career?.poles} loading={isPending} />
        <StatTile label="Teams" value={teams?.length} hint="All time" loading={!teams} />
      </StatGrid>
    </section>
  );
}

function Intro({ wiki, isPending, fallbackUrl }) {
  return (
    <Card title="About" className="h-full">
      {isPending ? (
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      ) : (
        <>
          {wiki?.extract ? (
            <p className="max-w-prose text-ink-2 text-pretty">{wiki.extract}</p>
          ) : (
            <p className="text-sm text-ink-2">No biography available.</p>
          )}
          {(wiki?.content_urls?.desktop?.page || fallbackUrl) && (
            <a
              href={wiki?.content_urls?.desktop?.page ?? fallbackUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink underline decoration-line-strong hover:decoration-ink"
            >
              Read more on Wikipedia <LuExternalLink className="size-3.5" aria-hidden />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          )}
        </>
      )}
    </Card>
  );
}

function SeasonSummary({ standing, standingsQ }) {
  const { withSeason } = useSeason();
  const label = standingsQ.data?.season;
  const team = standing?.Constructors?.at(-1);
  return (
    <Card title={label ? `${label} season` : "Season"}>
      {standingsQ.isPending ? (
        <SkeletonRows rows={2} label="Loading season" />
      ) : standingsQ.error ? (
        <ErrorState onRetry={standingsQ.refetch} className="border-0 p-0" />
      ) : !standing ? (
        <p className="text-sm text-ink-2">Not classified in the {label ?? "selected"} drivers' championship.</p>
      ) : (
        <>
          <dl className="grid grid-cols-3 gap-3">
            {[
              ["Position", standing.position ? `P${standing.position}` : "—"],
              ["Points", formatPoints(standing.points)],
              ["Wins", standing.wins],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="label-caps">{k}</dt>
                <dd className="font-display mt-1 text-3xl text-ink">{v}</dd>
              </div>
            ))}
          </dl>
          {team && (
            <Link
              to={withSeason(`/constructors/${team.constructorId}`)}
              className="-mx-2 mt-4 flex min-h-12 items-center gap-3 rounded-panel px-2 hover:bg-surface-3 transition-colors duration-150"
            >
              <TeamStripe constructorId={team.constructorId} className="h-6" />
              <span className="min-w-0 flex-1 truncate font-semibold text-ink">{team.name}</span>
              <LuChevronRight className="size-4 shrink-0 text-ink-3" aria-hidden />
            </Link>
          )}
        </>
      )}
    </Card>
  );
}

function Teams({ teamsQ }) {
  const { withSeason } = useSeason();
  return (
    <Card title="Teams">
      {teamsQ.isPending ? (
        <SkeletonRows rows={2} label="Loading teams" />
      ) : teamsQ.error ? (
        <ErrorState onRetry={teamsQ.refetch} className="border-0 p-0" />
      ) : (
        <ul className="divide-y divide-line">
          {teamsQ.data.map((c) => (
            <li key={c.constructorId}>
              <Link
                to={withSeason(`/constructors/${c.constructorId}`)}
                className="-mx-2 flex min-h-12 items-center gap-3 rounded-panel px-2 hover:bg-surface-3 transition-colors duration-150"
              >
                <TeamStripe constructorId={c.constructorId} className="h-6" />
                <span className="min-w-0 flex-1 truncate font-semibold text-ink">{c.name}</span>
                <span className="text-xs text-ink-3">{c.nationality}</span>
                <LuChevronRight className="size-4 shrink-0 text-ink-3" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

// Finish cell: classified position, or the unclassified code (DNF, DSQ…).
function Finish({ result }) {
  const outcome = OUTCOME[result.positionText];
  if (outcome) return <span className="font-semibold text-ink-3">{outcome}</span>;
  const pos = Number(result.position);
  return <span className={`font-display text-xl ${pos === 1 ? "text-best" : "text-ink"}`}>P{pos}</span>;
}

// Places gained (+) or lost (−) from grid to flag; pit-lane starts (grid 0) have no reference.
function Delta({ result }) {
  const grid = Number(result.grid);
  if (!grid || OUTCOME[result.positionText]) return null;
  const d = grid - Number(result.position);
  if (d === 0) return <span className="text-ink-3">=</span>;
  return d > 0 ? (
    <span className="text-gain">
      <span className="sr-only">gained </span>+{d}
    </span>
  ) : (
    <span className="text-ink-3">
      <span className="sr-only">lost </span>−{-d}
    </span>
  );
}

function SeasonResults({ driverId, label }) {
  const { data: races, isPending, error, refetch } = useDriverSeasonResults(driverId);
  return (
    <Card title={label ? `${label} race results` : "Race results"} bodyClassName="py-3">
      {isPending ? (
        <SkeletonRows rows={8} label="Loading race results" />
      ) : error ? (
        <div className="px-4">
          <ErrorState onRetry={refetch} className="border-0 p-0" />
        </div>
      ) : races.length === 0 ? (
        <p className="px-4 py-6 text-sm text-ink-2">No race results for this driver in the selected season.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left">
                <th scope="col" className="label-caps w-12 px-3 pb-2 text-right sm:px-4">Rd</th>
                <th scope="col" className="label-caps px-3 pb-2 sm:px-4">Grand Prix</th>
                <th scope="col" className="label-caps hidden px-3 pb-2 text-right sm:table-cell sm:px-4">Grid</th>
                <th scope="col" className="label-caps px-3 pb-2 text-right sm:px-4">Finish</th>
                <th scope="col" className="label-caps hidden w-12 whitespace-nowrap px-3 pb-2 text-right sm:table-cell sm:px-4">+/−</th>
                <th scope="col" className="label-caps px-3 pb-2 text-right sm:px-4">Pts</th>
                <th scope="col" className="label-caps hidden px-3 pb-2 md:table-cell md:px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {races.map((race) => {
                const r = race.result;
                return (
                  <tr key={race.round}>
                    <td className="font-display px-3 py-2 text-right text-lg text-ink-3 sm:px-4">{race.round}</td>
                    <td className="px-3 py-2 sm:px-4">
                      <span className="block font-semibold text-ink">{race.raceName.replace(/ Grand Prix$/, " GP")}</span>
                      <span className="block text-xs text-ink-2">
                        {formatDate(race.date, { day: "numeric", month: "short" })}
                        {r.Constructor && ` · ${r.Constructor.name}`}
                      </span>
                    </td>
                    <td className="hidden px-3 py-2 text-right text-ink-2 sm:table-cell sm:px-4">
                      {Number(r.grid) ? r.grid : "PL"}
                    </td>
                    <td className="px-3 py-2 text-right sm:px-4">
                      <Finish result={r} />
                    </td>
                    <td className="hidden px-3 py-2 text-right sm:table-cell sm:px-4">
                      <Delta result={r} />
                    </td>
                    <td className="px-3 py-2 text-right font-semibold text-ink sm:px-4">{formatPoints(r.points)}</td>
                    <td className="hidden px-3 py-2 text-ink-2 md:table-cell md:px-4">{r.status}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function DriverProfile({ driverId }) {
  const driverQ = useDriver(driverId);
  const driver = driverQ.data;
  const wikiQ = useWikiSummary(driver?.url);
  const teamsQ = useDriverConstructors(driverId);
  const standingsQ = useDriverStandings();
  const resultsQ = useDriverSeasonResults(driverId);
  const standing = standingsQ.data?.standings.find((s) => s.Driver.driverId === driverId);

  if (driverQ.isPending) {
    return (
      <>
        <BackLink />
        <div className="mb-8 flex items-center gap-4">
          <Skeleton className="h-20 w-1" />
          <Skeleton className="h-12 w-72" />
        </div>
        <StatGrid className="grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </StatGrid>
      </>
    );
  }

  if (driverQ.error || !driver) {
    return (
      <>
        <BackLink />
        {driverQ.error ? (
          <ErrorState onRetry={driverQ.refetch} />
        ) : (
          <ErrorState
            title="Driver not found"
            message={`There's no driver with the id “${driverId}”. Pick a driver from the drivers list.`}
          />
        )}
      </>
    );
  }

  // Stripe color: the driver's team in the selected season (none = neutral fallback).
  const teamId =
    standing?.Constructors?.at(-1)?.constructorId ?? resultsQ.data?.at(-1)?.result?.Constructor?.constructorId;

  return (
    <>
      <BackLink />
      <Hero driver={driver} wiki={wikiQ.data} teamId={teamId} />
      <CareerStats driverId={driverId} teams={teamsQ.data} />
      <div className="mb-8 grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <Intro wiki={wikiQ.data} isPending={wikiQ.isPending && !!driver.url} fallbackUrl={driver.url} />
        </div>
        <div className="flex flex-col gap-6 lg:col-span-2">
          <SeasonSummary standing={standing} standingsQ={standingsQ} />
          <Teams teamsQ={teamsQ} />
        </div>
      </div>
      <SeasonResults driverId={driverId} label={standingsQ.data?.season ?? resultsQ.data?.[0]?.season} />
    </>
  );
}

function DriverDetail() {
  const { driverId } = useParams();
  return <DriverProfile key={driverId} driverId={driverId} />;
}

export default DriverDetail;
