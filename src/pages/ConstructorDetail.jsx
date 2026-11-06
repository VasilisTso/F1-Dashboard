import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { LuArrowLeft, LuHistory } from "react-icons/lu";
import {
  useConstructor,
  useConstructorCareer,
  useConstructorHistory,
  useConstructorSeasons,
  useConstructorStandings,
  useDriverStandings,
  useWikiSummary,
} from "../hooks/queries";
import { useSeason } from "../context/SeasonContext";
import { SeasonPointsChart, isTitle } from "../components/SeasonPointsChart";
import { WikiIntro } from "../components/WikiIntro";
import { Card, ErrorState, Skeleton, SkeletonRows, StatGrid, StatTile, TeamStripe } from "../components/ui";
import { useI18n, useT } from "../i18n/LanguageContext";
import { useDataLabels } from "../i18n/data";

const yearSpan = (years) =>
  !years?.length ? undefined : years.length === 1 ? years[0] : `${years[0]}–${years.at(-1)}`;
// Fewer seasons than this make a meaningless chart; the table says it better.
const MIN_CHART_SEASONS = 3;

function BackLink() {
  const t = useT();
  const { withSeason } = useSeason();
  return (
    <Link
      to={withSeason("/constructors")}
      className="mb-4 -ml-2 inline-flex h-10 items-center gap-2 rounded-panel px-2 text-sm font-medium text-ink-2 hover:bg-surface-3 hover:text-ink transition-colors duration-150"
    >
      <LuArrowLeft className="size-4" aria-hidden /> {t("common.nav.constructors")}
    </Link>
  );
}

function Hero({ team, wiki, seasons }) {
  const t = useT();
  const { nationality } = useDataLabels();
  const logo = wiki?.thumbnail?.source;
  const span = yearSpan(seasons);
  return (
    <header className="mb-6 flex flex-wrap items-center gap-4 lg:mb-8">
      <TeamStripe constructorId={team.constructorId} className="h-16 sm:h-20" />
      <div className="min-w-0 flex-1">
        <h1 className="font-display text-4xl uppercase text-ink text-balance sm:text-5xl">{team.name}</h1>
        <p className="mt-2 text-sm text-ink-2">
          {nationality(team.nationality)}
          {span && ` · ${t("constructors.hero.inF1", { span })}`}
        </p>
      </div>
      {logo && (
        // Logos are drawn for white backgrounds, so they sit on a fixed white plate in both themes.
        <div className="flex h-20 w-36 shrink-0 items-center justify-center rounded-panel border border-line bg-white p-3 sm:h-24 sm:w-44">
          <img src={logo} alt={t("constructors.hero.logo", { name: team.name })} className="max-h-full max-w-full object-contain" />
        </div>
      )}
    </header>
  );
}

function CareerStats({ constructorId, seasons, titles, titlesComplete }) {
  const { t, fmt } = useI18n();
  const { data: career, isPending } = useConstructorCareer(constructorId);
  const seasonsHint = yearSpan(seasons);
  return (
    <section aria-label={t("constructors.stats.label")} className="mb-8">
      <StatGrid className="grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile label={t("constructors.stats.seasons")} value={seasons?.length} hint={seasonsHint} loading={!seasons} />
        <StatTile label={t("constructors.stats.races")} value={career?.races} loading={isPending} />
        <StatTile label={t("common.wins")} value={career?.wins} loading={isPending} />
        <StatTile label={t("constructors.stats.poles")} value={career?.poles} loading={isPending} />
        <StatTile
          label={t("constructors.stats.drivers")}
          value={career?.drivers}
          hint={t("constructors.stats.allTime")}
          loading={isPending}
        />
        <StatTile
          label={t("constructors.stats.titles")}
          // Until every season is loaded the count is only a floor ("3+"), or unknown.
          value={titlesComplete ? titles : titles > 0 ? `${fmt.number(titles)}+` : null}
          accent={titles > 0 ? "var(--best)" : undefined}
          hint={titlesComplete ? t("constructors.stats.titlesHint") : t("constructors.stats.titlesPartial")}
          loading={titles == null}
        />
      </StatGrid>
    </section>
  );
}

function CurrentSeason({ constructorId }) {
  const { t, fmt } = useI18n();
  const { withSeason } = useSeason();
  const teamsQ = useConstructorStandings();
  const driversQ = useDriverStandings();

  const label = teamsQ.data?.season;
  const standing = teamsQ.data?.standings.find((s) => s.Constructor.constructorId === constructorId);
  const drivers =
    driversQ.data?.standings.filter((s) => s.Constructors?.some((c) => c.constructorId === constructorId)) ?? [];

  return (
    <Card title={label ? t("common.season.title", { season: label }) : t("common.season.label")} className="h-full">
      {teamsQ.isPending ? (
        <SkeletonRows rows={3} label={t("constructors.season.loading")} />
      ) : teamsQ.error ? (
        <ErrorState onRetry={teamsQ.refetch} className="border-0 p-0" />
      ) : !standing ? (
        <p className="text-sm text-ink-2">
          {label
            ? t("constructors.season.notClassified", { season: label })
            : t("constructors.season.notClassifiedSelected")}
        </p>
      ) : (
        <>
          <dl className="grid grid-cols-3 gap-3">
            {[
              [t("common.position"), `P${standing.position}`],
              [t("common.points"), fmt.points(standing.points)],
              [t("common.wins"), standing.wins],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="label-caps">{k}</dt>
                <dd className="font-display mt-1 text-3xl text-ink">{v}</dd>
              </div>
            ))}
          </dl>

          <h3 className="label-caps mt-6 border-b border-line pb-2">{t("common.nav.drivers")}</h3>
          {driversQ.isPending ? (
            <SkeletonRows rows={2} label={t("constructors.season.loadingDrivers")} />
          ) : (
            <ul className="tower divide-y divide-line">
              {drivers.map((s) => (
                <li key={s.Driver.driverId}>
                  <Link
                    to={withSeason(`/drivers/${s.Driver.driverId}`)}
                    className="-mx-2 flex min-h-12 items-center gap-3 rounded-panel px-2 hover:bg-surface-3 transition-colors duration-150"
                  >
                    <span className="font-display w-8 text-right text-xl text-ink-3">P{s.position}</span>
                    <span className="min-w-0 flex-1 truncate font-semibold text-ink">
                      {s.Driver.givenName} {s.Driver.familyName}
                    </span>
                    <span className="text-sm text-ink">
                      {fmt.points(s.points)} <span className="text-ink-3">{t("common.pts")}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </Card>
  );
}

function History({ team, seasonsQ, history, onLoadFull }) {
  const { t, fmt } = useI18n();
  const { rows, olderCount, hasFull, loadingOlder, isLoading, error, retry } = history;
  const action =
    !hasFull && !loadingOlder && olderCount > 0 ? (
      <button
        type="button"
        onClick={onLoadFull}
        className="inline-flex h-10 items-center gap-2 rounded-panel border border-line-strong px-3 text-sm font-medium text-ink hover:bg-surface-3 transition-colors duration-150"
      >
        <LuHistory className="size-4" aria-hidden />
        {t("constructors.history.loadFull")}
        <span className="hidden text-ink-3 sm:inline">
          {t("constructors.history.more", { count: olderCount, n: fmt.number(olderCount) })}
        </span>
      </button>
    ) : null;

  return (
    <Card title={t("constructors.history.title")} action={action}>
      <p className="mb-4 text-sm text-ink-2" aria-live="polite">
        {seasonsQ.isPending
          ? t("constructors.history.loadingSeasons")
          : isLoading
            ? t("constructors.history.loadingStandings", { n: fmt.number(rows.length) })
            : rows.length === 0
              ? ""
              : t(hasFull && !error ? "constructors.history.showingAll" : "constructors.history.showingLast", {
                  count: rows.length,
                  n: fmt.number(rows.length),
                })}
      </p>
      {seasonsQ.error ? (
        <ErrorState onRetry={seasonsQ.refetch} />
      ) : rows.length === 0 ? (
        error ? (
          <ErrorState onRetry={retry} />
        ) : isLoading || seasonsQ.isPending ? (
          <Skeleton className="h-64 sm:h-72" />
        ) : (
          <p className="text-sm text-ink-2">{t("constructors.history.empty")}</p>
        )
      ) : (
        <>
          {/* Keep what loaded on screen; retry resumes from the missing seasons. */}
          {error && (
            <ErrorState
              title={t("constructors.history.partialTitle")}
              message={t("constructors.history.partialMessage")}
              onRetry={retry}
              className="mb-4"
            />
          )}
          <SeasonPointsChart
            rows={rows}
            teamName={team.name}
            chart={rows.length >= MIN_CHART_SEASONS}
            animate={!isLoading}
          />
        </>
      )}
    </Card>
  );
}

function ConstructorProfile({ constructorId }) {
  const t = useT();
  const [full, setFull] = useState(false);
  const teamQ = useConstructor(constructorId);
  const seasonsQ = useConstructorSeasons(constructorId);
  const team = teamQ.data;
  const wikiQ = useWikiSummary(team?.url);
  const history = useConstructorHistory(constructorId, seasonsQ.data, { full });

  if (teamQ.isPending) {
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

  if (teamQ.error || !team) {
    return (
      <>
        <BackLink />
        {teamQ.error ? (
          <ErrorState onRetry={teamQ.refetch} />
        ) : (
          <ErrorState
            title={t("constructors.notFound.title")}
            titleAs="h1"
            message={t("constructors.notFound.message", { id: constructorId })}
          />
        )}
      </>
    );
  }

  const titles = history.rows.filter(isTitle).length;

  return (
    <>
      <BackLink />
      <Hero team={team} wiki={wikiQ.data} seasons={seasonsQ.data} />
      <CareerStats
        constructorId={constructorId}
        seasons={seasonsQ.data}
        titles={history.rows.length > 0 || (!history.isLoading && seasonsQ.isSuccess) ? titles : null}
        titlesComplete={history.hasFull}
      />
      <div className="mb-8 grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <WikiIntro wiki={wikiQ.data} isPending={wikiQ.isPending && !!team.url} fallbackUrl={team.url} />
        </div>
        <div className="lg:col-span-2">
          <CurrentSeason constructorId={constructorId} />
        </div>
      </div>
      <History team={team} seasonsQ={seasonsQ} history={history} onLoadFull={() => setFull(true)} />
    </>
  );
}

// Keyed by id so per-team state (streamed history rows, "full" toggle) resets on navigation.
function ConstructorDetail() {
  const { constructorId } = useParams();
  return <ConstructorProfile key={constructorId} constructorId={constructorId} />;
}

export default ConstructorDetail;
