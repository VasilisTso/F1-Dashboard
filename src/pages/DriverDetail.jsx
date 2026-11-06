import { Link, useParams } from "react-router-dom";
import { LuArrowLeft, LuExternalLink, LuChevronRight } from "react-icons/lu";
import {
  useDriver,
  useDriverCareer,
  useDriverConstructors,
  useDriverSeasonResults,
  useDriverSeasonSprints,
  useDriverStandings,
  useWikiSummary,
} from "../hooks/queries";
import { useSeason } from "../context/SeasonContext";
import {
  Card,
  ErrorState,
  FinishCell,
  PlacesCell,
  Skeleton,
  SkeletonRows,
  StatGrid,
  StatTile,
  TeamStripe,
} from "../components/ui";

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

const cell = "px-2 py-2 sm:px-4";
const head = "label-caps px-2 pb-2 sm:px-4";

function SeasonResults({ driverId, label }) {
  const { data: races, isPending, error, refetch } = useDriverSeasonResults(driverId);
  const sprintsQ = useDriverSeasonSprints(driverId);
  const sprints = sprintsQ.data ?? {};

  // Running championship total after each round (race + sprint), as the standings count it.
  let total = 0;
  const rows = (races ?? []).map((race) => {
    const sprint = sprints[race.round];
    const sprintPoints = Number(sprint?.points ?? 0);
    total += Number(race.result.points) + sprintPoints;
    return { race, sprintPoints, total };
  });

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
        <div className="relative overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left">
                <th scope="col" className={`${head} hidden w-12 text-right sm:table-cell`}>Rd</th>
                <th scope="col" className={head}>Grand Prix</th>
                <th scope="col" className={`${head} hidden text-right sm:table-cell`}>Grid</th>
                <th scope="col" className={`${head} text-right`}>Finish</th>
                <th scope="col" className={`${head} text-right`} title="Places gained (▲) or lost (▼) from grid to finish">
                  Places
                </th>
                <th scope="col" className={`${head} text-right`} title="Points scored that weekend (race + sprint)">
                  Pts
                </th>
                <th scope="col" className={`${head} text-right`} title="Championship points after this round">
                  Total
                </th>
                <th scope="col" className={`${head} hidden md:table-cell`}>Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map(({ race, sprintPoints, total }) => {
                const r = race.result;
                return (
                  <tr key={race.round}>
                    <td className={`${cell} font-display hidden text-right text-lg text-ink-3 sm:table-cell`}>
                      {race.round}
                    </td>
                    <td className={cell}>
                      <Link
                        to={`/races/${race.season}/${race.round}`}
                        className="block font-semibold text-ink underline decoration-transparent underline-offset-2 hover:decoration-ink transition-colors duration-150"
                      >
                        {race.raceName.replace(/ Grand Prix$/, " GP")}
                      </Link>
                      <span className="block text-xs text-ink-2">
                        <span className="sm:hidden">R{race.round} · </span>
                        {formatDate(race.date, { day: "numeric", month: "short" })}
                        {r.Constructor && <span className="hidden sm:inline"> · {r.Constructor.name}</span>}
                      </span>
                    </td>
                    <td className={`${cell} hidden text-right text-ink-2 sm:table-cell`}>
                      {Number(r.grid) ? r.grid : "PL"}
                    </td>
                    <td className={`${cell} text-right`}>
                      <FinishCell result={r} />
                    </td>
                    <td className={`${cell} text-right`}>
                      <PlacesCell result={r} />
                    </td>
                    <td className={`${cell} text-right`}>
                      <span className="block font-semibold text-ink">{formatPoints(Number(r.points) + sprintPoints)}</span>
                      {sprintPoints > 0 && (
                        <span className="block whitespace-nowrap text-xs text-ink-2">{formatPoints(sprintPoints)} sprint</span>
                      )}
                    </td>
                    <td className={`${cell} font-display text-right text-lg text-ink`}>{formatPoints(total)}</td>
                    <td className={`${cell} hidden text-ink-2 md:table-cell`}>{r.status}</td>
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
