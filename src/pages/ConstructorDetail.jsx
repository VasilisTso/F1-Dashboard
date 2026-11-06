import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { LuArrowLeft, LuExternalLink, LuHistory } from "react-icons/lu";
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
import { Card, ErrorState, Skeleton, SkeletonRows, StatGrid, StatTile, TeamStripe } from "../components/ui";

const formatPoints = (p) => Number(p).toLocaleString("en", { maximumFractionDigits: 1 });
const yearSpan = (years) =>
  !years?.length ? undefined : years.length === 1 ? years[0] : `${years[0]}–${years.at(-1)}`;
// Fewer seasons than this make a meaningless chart; the table says it better.
const MIN_CHART_SEASONS = 3;

function BackLink() {
  const { withSeason } = useSeason();
  return (
    <Link
      to={withSeason("/constructors")}
      className="mb-4 -ml-2 inline-flex h-10 items-center gap-2 rounded-panel px-2 text-sm font-medium text-ink-2 hover:bg-surface-3 hover:text-ink transition-colors duration-150"
    >
      <LuArrowLeft className="size-4" aria-hidden /> Constructors
    </Link>
  );
}

function Hero({ team, wiki, seasons }) {
  const logo = wiki?.thumbnail?.source;
  const span = yearSpan(seasons);
  return (
    <header className="mb-6 flex flex-wrap items-center gap-4 lg:mb-8">
      <TeamStripe constructorId={team.constructorId} className="h-16 sm:h-20" />
      <div className="min-w-0 flex-1">
        <h1 className="font-display text-4xl uppercase text-ink text-balance sm:text-5xl">{team.name}</h1>
        <p className="mt-2 text-sm text-ink-2">
          {team.nationality}
          {span && ` · in Formula 1 ${span}`}
        </p>
      </div>
      {logo && (
        // Logos are drawn for white backgrounds, so they sit on a fixed white plate in both themes.
        <div className="flex h-20 w-36 shrink-0 items-center justify-center rounded-panel border border-line bg-white p-3 sm:h-24 sm:w-44">
          <img src={logo} alt={`${team.name} logo`} className="max-h-full max-w-full object-contain" />
        </div>
      )}
    </header>
  );
}

function CareerStats({ constructorId, seasons, titles, titlesComplete }) {
  const { data: career, isPending } = useConstructorCareer(constructorId);
  const seasonsHint = yearSpan(seasons);
  return (
    <section aria-label="Career statistics" className="mb-8">
      <StatGrid className="grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile label="Seasons" value={seasons?.length} hint={seasonsHint} loading={!seasons} />
        <StatTile label="Races" value={career?.races} loading={isPending} />
        <StatTile label="Wins" value={career?.wins} loading={isPending} />
        <StatTile label="Poles" value={career?.poles} loading={isPending} />
        <StatTile label="Drivers" value={career?.drivers} hint="All time" loading={isPending} />
        <StatTile
          label="Titles"
          // Until every season is loaded the count is only a floor ("3+"), or unknown.
          value={titlesComplete ? titles : titles > 0 ? `${titles}+` : null}
          accent={titles > 0 ? "var(--best)" : undefined}
          hint={titlesComplete ? "Constructors' championships" : "Load full history to count all"}
          loading={titles == null}
        />
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
            <p className="text-sm text-ink-2">No summary available.</p>
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

function CurrentSeason({ constructorId }) {
  const { withSeason } = useSeason();
  const teamsQ = useConstructorStandings();
  const driversQ = useDriverStandings();

  const label = teamsQ.data?.season;
  const standing = teamsQ.data?.standings.find((s) => s.Constructor.constructorId === constructorId);
  const drivers =
    driversQ.data?.standings.filter((s) => s.Constructors?.some((c) => c.constructorId === constructorId)) ?? [];

  return (
    <Card title={label ? `${label} season` : "Season"} className="h-full">
      {teamsQ.isPending ? (
        <SkeletonRows rows={3} label="Loading season" />
      ) : teamsQ.error ? (
        <ErrorState onRetry={teamsQ.refetch} className="border-0 p-0" />
      ) : !standing ? (
        <p className="text-sm text-ink-2">Not classified in the {label ?? "selected"} constructors' championship.</p>
      ) : (
        <>
          <dl className="grid grid-cols-3 gap-3">
            {[
              ["Position", `P${standing.position}`],
              ["Points", formatPoints(standing.points)],
              ["Wins", standing.wins],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="label-caps">{k}</dt>
                <dd className="font-display mt-1 text-3xl text-ink">{v}</dd>
              </div>
            ))}
          </dl>

          <h3 className="label-caps mt-6 border-b border-line pb-2">Drivers</h3>
          {driversQ.isPending ? (
            <SkeletonRows rows={2} label="Loading drivers" />
          ) : (
            <ul className="divide-y divide-line">
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
                      {formatPoints(s.points)} <span className="text-ink-3">pts</span>
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
  const { rows, olderCount, hasFull, loadingOlder, isLoading, error, retry } = history;
  const action =
    !hasFull && !loadingOlder && olderCount > 0 ? (
      <button
        type="button"
        onClick={onLoadFull}
        className="inline-flex h-10 items-center gap-2 rounded-panel border border-line-strong px-3 text-sm font-medium text-ink hover:bg-surface-3 transition-colors duration-150"
      >
        <LuHistory className="size-4" aria-hidden />
        Load full history
        <span className="hidden text-ink-3 sm:inline">+{olderCount} seasons</span>
      </button>
    ) : null;

  return (
    <Card title="Points per season" action={action}>
      <p className="mb-4 text-sm text-ink-2" aria-live="polite">
        {seasonsQ.isPending
          ? "Loading seasons…"
          : isLoading
            ? `Loading season standings… ${rows.length} loaded`
            : rows.length === 0
              ? ""
              : `Showing ${hasFull && !error ? "all" : "the last"} ${rows.length} ${rows.length === 1 ? "season" : "seasons"}`}
      </p>
      {seasonsQ.error ? (
        <ErrorState onRetry={seasonsQ.refetch} />
      ) : rows.length === 0 ? (
        error ? (
          <ErrorState onRetry={retry} />
        ) : isLoading || seasonsQ.isPending ? (
          <Skeleton className="h-64 sm:h-72" />
        ) : (
          <p className="text-sm text-ink-2">No championship standings recorded yet.</p>
        )
      ) : (
        <>
          {/* Keep what loaded on screen; retry resumes from the missing seasons. */}
          {error && (
            <ErrorState
              title="Some seasons didn't load"
              message="The F1 data service is rate limiting requests. Wait a moment, then continue."
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
            title="Constructor not found"
            message={`There's no constructor with the id “${constructorId}”. Pick a team from the constructors list.`}
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
          <Intro wiki={wikiQ.data} isPending={wikiQ.isPending && !!team.url} fallbackUrl={team.url} />
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
