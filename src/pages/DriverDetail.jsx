import { Link, useParams } from "react-router-dom";
import { LuArrowLeft, LuChevronRight } from "react-icons/lu";
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
import { WikiIntro } from "../components/WikiIntro";
import { useI18n, useT } from "../i18n/LanguageContext";
import { useDataLabels } from "../i18n/data";
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
  const t = useT();
  const { withSeason } = useSeason();
  return (
    <Link
      to={withSeason("/drivers")}
      className="mb-4 -ml-2 inline-flex h-10 items-center gap-2 rounded-panel px-2 text-sm font-medium text-ink-2 hover:bg-surface-3 hover:text-ink transition-colors duration-150"
    >
      <LuArrowLeft className="size-4" aria-hidden /> {t("common.nav.drivers")}
    </Link>
  );
}

function Hero({ driver, wiki, teamId }) {
  const { t, fmt } = useI18n();
  const { nationality } = useDataLabels();
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
            nationality(driver.nationality),
            driver.dateOfBirth &&
              t(age != null ? "drivers.hero.bornAge" : "drivers.hero.born", {
                date: fmt.day(driver.dateOfBirth, { day: "numeric", month: "short", year: "numeric" }),
                age,
              }),
            driver.code,
            driver.permanentNumber && t("drivers.hero.car", { n: driver.permanentNumber }),
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
  const t = useT();
  const { data: career, isPending } = useDriverCareer(driverId);
  const span =
    career?.firstSeason &&
    (career.firstSeason === career.lastSeason ? career.firstSeason : `${career.firstSeason}–${career.lastSeason}`);
  return (
    <section aria-label={t("drivers.stats.label")} className="mb-8">
      <StatGrid className="grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile label={t("drivers.stats.seasons")} value={career?.seasons} hint={span} loading={isPending} />
        <StatTile label={t("drivers.stats.starts")} value={career?.starts} loading={isPending} />
        <StatTile
          label={t("common.wins")}
          value={career?.wins}
          accent={career?.wins > 0 ? "var(--best)" : undefined}
          loading={isPending}
        />
        <StatTile label={t("drivers.stats.podiums")} value={career?.podiums} loading={isPending} />
        <StatTile label={t("drivers.stats.poles")} value={career?.poles} loading={isPending} />
        <StatTile
          label={t("drivers.stats.teams")}
          value={teams?.length}
          hint={t("drivers.stats.allTime")}
          loading={!teams}
        />
      </StatGrid>
    </section>
  );
}

function SeasonSummary({ standing, standingsQ }) {
  const { t, fmt } = useI18n();
  const { withSeason } = useSeason();
  const label = standingsQ.data?.season;
  const team = standing?.Constructors?.at(-1);
  return (
    <Card title={label ? t("common.season.title", { season: label }) : t("common.season.label")}>
      {standingsQ.isPending ? (
        <SkeletonRows rows={2} label={t("drivers.season.loading")} />
      ) : standingsQ.error ? (
        <ErrorState onRetry={standingsQ.refetch} className="border-0 p-0" />
      ) : !standing ? (
        <p className="text-sm text-ink-2">
          {label
            ? t("drivers.season.notClassified", { season: label })
            : t("drivers.season.notClassifiedSelected")}
        </p>
      ) : (
        <>
          <dl className="grid grid-cols-3 gap-3">
            {[
              [t("common.position"), standing.position ? `P${standing.position}` : "—"],
              [t("common.points"), fmt.points(standing.points)],
              [t("common.wins"), standing.wins],
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
  const t = useT();
  const { nationality } = useDataLabels();
  const { withSeason } = useSeason();
  return (
    <Card title={t("drivers.teams.title")}>
      {teamsQ.isPending ? (
        <SkeletonRows rows={2} label={t("drivers.teams.loading")} />
      ) : teamsQ.error ? (
        <ErrorState onRetry={teamsQ.refetch} className="border-0 p-0" />
      ) : (
        <ul className="tower divide-y divide-line">
          {teamsQ.data.map((c) => (
            <li key={c.constructorId}>
              <Link
                to={withSeason(`/constructors/${c.constructorId}`)}
                className="-mx-2 flex min-h-12 items-center gap-3 rounded-panel px-2 hover:bg-surface-3 transition-colors duration-150"
              >
                <TeamStripe constructorId={c.constructorId} className="h-6" />
                <span className="min-w-0 flex-1 truncate font-semibold text-ink">{c.name}</span>
                <span className="text-xs text-ink-3">{nationality(c.nationality)}</span>
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
  const { t, fmt } = useI18n();
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
    <Card
      title={label ? t("drivers.results.title", { season: label }) : t("drivers.results.titleNoSeason")}
      bodyClassName="py-3"
    >
      {isPending ? (
        <SkeletonRows rows={8} label={t("drivers.results.loading")} />
      ) : error ? (
        <div className="px-4">
          <ErrorState onRetry={refetch} className="border-0 p-0" />
        </div>
      ) : races.length === 0 ? (
        <p className="px-4 py-6 text-sm text-ink-2">{t("drivers.results.empty")}</p>
      ) : (
        <div className="relative overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left">
                <th scope="col" className={`${head} hidden w-12 text-right sm:table-cell`}>
                  {t("drivers.results.round")}
                </th>
                <th scope="col" className={head}>
                  {t("drivers.results.grandPrix")}
                </th>
                <th scope="col" className={`${head} hidden text-right sm:table-cell`}>
                  {t("drivers.results.grid")}
                </th>
                <th scope="col" className={`${head} text-right`}>
                  {t("drivers.results.finish")}
                </th>
                <th scope="col" className={`${head} text-right`} title={t("common.places.hint")}>
                  {t("drivers.results.places")}
                </th>
                <th scope="col" className={`${head} text-right`} title={t("drivers.results.ptsHint")}>
                  {t("drivers.results.pts")}
                </th>
                <th scope="col" className={`${head} text-right`} title={t("drivers.results.totalHint")}>
                  {t("drivers.results.total")}
                </th>
                <th scope="col" className={`${head} hidden md:table-cell`}>
                  {t("drivers.results.status")}
                </th>
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
                        <span className="sm:hidden">{t("drivers.results.roundShort", { round: race.round })} · </span>
                        {fmt.day(race.date, { day: "numeric", month: "short" })}
                        {r.Constructor && <span className="hidden sm:inline"> · {r.Constructor.name}</span>}
                      </span>
                    </td>
                    <td className={`${cell} hidden text-right text-ink-2 sm:table-cell`}>
                      {Number(r.grid) ? r.grid : t("drivers.results.pitLane")}
                    </td>
                    <td className={`${cell} text-right`}>
                      <FinishCell result={r} />
                    </td>
                    <td className={`${cell} text-right`}>
                      <PlacesCell result={r} />
                    </td>
                    <td className={`${cell} text-right`}>
                      <span className="block font-semibold text-ink">{fmt.points(Number(r.points) + sprintPoints)}</span>
                      {sprintPoints > 0 && (
                        <span className="block whitespace-nowrap text-xs text-ink-2">
                          {t("drivers.results.sprint", { count: sprintPoints, n: fmt.points(sprintPoints) })}
                        </span>
                      )}
                    </td>
                    <td className={`${cell} font-display text-right text-lg text-ink`}>{fmt.points(total)}</td>
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
  const t = useT();
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
            title={t("drivers.notFound.title")}
            titleAs="h1"
            message={t("drivers.notFound.message", { id: driverId })}
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
          <WikiIntro wiki={wikiQ.data} isPending={wikiQ.isPending && !!driver.url} fallbackUrl={driver.url} />
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
