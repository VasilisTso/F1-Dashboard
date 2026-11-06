import { useState } from "react";
import { Link } from "react-router-dom";
import { LuSearch, LuArrowRight } from "react-icons/lu";
import { useConstructorStandings } from "../hooks/queries";
import { useSeason } from "../context/SeasonContext";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import {
  Card,
  PageHeader,
  SkeletonRows,
  Skeleton,
  ErrorState,
  StandingsList,
  StandingsRow,
  TeamStripe,
} from "../components/ui";
import { useI18n, useT } from "../i18n/LanguageContext";
import { useDataLabels } from "../i18n/data";
import { ProgressionChart } from "../components/ProgressionChart";

function TeamCard({ team, profileTo, driversTo }) {
  const { t, fmt } = useI18n();
  const { nationality } = useDataLabels();
  return (
    <li className="relative flex flex-col rounded-panel border border-line bg-surface-2 shadow-raised transition-colors duration-150 hover:border-line-strong">
      <div className="flex items-start gap-3 p-4">
        <TeamStripe constructorId={team.constructorId} className="h-12" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-2xl uppercase text-ink">
            {/* Stretched link: the whole card opens the profile; the drivers link sits above it. */}
            <Link to={profileTo} className="after:absolute after:inset-0 after:rounded-panel">
              {team.name}
            </Link>
          </h3>
          <p className="text-sm text-ink-2">{nationality(team.nationality)}</p>
        </div>
        <span className="font-display text-3xl text-ink-3">
          <span className="sr-only">{t("common.position")} </span>
          <span aria-hidden>P</span>
          {team.position}
        </span>
      </div>
      <dl className="grid grid-cols-2 border-t border-line">
        <div className="px-4 py-3">
          <dt className="label-caps">{t("common.points")}</dt>
          <dd className="font-display mt-1 text-2xl text-ink">{fmt.points(team.points)}</dd>
        </div>
        <div className="border-l border-line px-4 py-3">
          <dt className="label-caps">{t("common.wins")}</dt>
          <dd className="font-display mt-1 text-2xl text-ink">{team.wins}</dd>
        </div>
      </dl>
      <div className="mt-auto flex items-center justify-between gap-2 border-t border-line px-4 py-2">
        <Link
          to={driversTo}
          className="relative z-10 inline-flex h-10 items-center rounded-panel px-2 -ml-2 text-sm font-medium text-ink-2 hover:bg-surface-3 hover:text-ink transition-colors duration-150"
        >
          {t("common.nav.drivers")}
        </Link>
        <span className="inline-flex items-center gap-1 text-sm font-medium text-ink" aria-hidden>
          {t("constructors.teams.seeMore")} <LuArrowRight className="size-4" />
        </span>
      </div>
    </li>
  );
}

function Constructors() {
  const t = useT();
  const { nationality } = useDataLabels();
  const [search, setSearch] = useState("");
  const { season: picked, isCurrent, withSeason } = useSeason();
  useDocumentTitle(t("common.nav.constructors"), !isCurrent && picked);
  const { data, isPending, error, refetch } = useConstructorStandings();

  if (error) {
    return (
      <>
        <PageHeader title={t("common.nav.constructors")} />
        <ErrorState onRetry={refetch} />
      </>
    );
  }

  const standings = data?.standings ?? [];
  const teams = standings.map((s) => ({ ...s.Constructor, points: s.points, wins: s.wins, position: s.position }));
  const leaderPoints = Number(teams[0]?.points ?? 0);
  const query = search.trim().toLowerCase();
  // Matches the raw (English) nationality and the displayed one.
  const filtered = teams.filter((team) =>
    `${team.name} ${team.nationality} ${nationality(team.nationality)}`.toLowerCase().includes(query),
  );

  const meta = isPending
    ? t("constructors.meta.loading")
    : data.season
      ? `${t("common.season.title", { season: data.season })} · ${t("constructors.meta.afterRound", { round: data.round })}`
      : t("constructors.meta.none");

  return (
    <>
      <PageHeader title={t("common.nav.constructors")} meta={meta} />

      {/* Wide screens: standings and the cards sit side by side instead of stacking. */}
      <div className="wide:grid wide:grid-cols-[minmax(0,38rem)_minmax(0,1fr)] wide:items-start wide:gap-6">
        {/* Standings, then how they came about. */}
        <div className="mb-8 flex min-w-0 flex-col gap-8 wide:mb-0">
          <Card title={t("constructors.standings.title")} bodyClassName="py-3">
            {isPending ? (
              <SkeletonRows rows={10} label={t("constructors.standings.loading")} />
            ) : teams.length === 0 ? (
              <p className="px-4 py-6 text-sm text-ink-2">{t("constructors.standings.empty")}</p>
            ) : (
              <StandingsList label={t("constructors.standings.team")} showExtra={t("common.wins")} linked>
                {teams.map((team) => (
                  <StandingsRow
                    key={team.constructorId}
                    position={team.position}
                    constructorId={team.constructorId}
                    name={team.name}
                    sub={nationality(team.nationality)}
                    points={team.points}
                    gap={leaderPoints - Number(team.points)}
                    extra={team.wins}
                    to={withSeason(`/constructors/${team.constructorId}`)}
                  />
                ))}
              </StandingsList>
            )}
          </Card>
          {teams.length > 0 && <ProgressionChart kind="constructors" season={Number(data.season)} />}
        </div>

        <section aria-labelledby="teams-heading">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 id="teams-heading" className="font-display text-2xl uppercase text-ink">
              {t("constructors.teams.title")}
            </h2>
            <label className="relative w-full sm:w-72">
              <span className="sr-only">{t("constructors.teams.search")}</span>
              <LuSearch
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-3"
                aria-hidden
              />
              <input
                type="search"
                placeholder={t("constructors.teams.placeholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 w-full rounded-panel border border-line-strong bg-surface-2 pl-9 pr-3 text-sm text-ink placeholder:text-ink-3 hover:border-ink-3"
              />
            </label>
          </div>

          {isPending ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }, (_, i) => (
                <Skeleton key={i} className="h-44" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <ErrorState
              tone="empty"
              title={t("constructors.teams.noMatch")}
              message={t("constructors.teams.nothingMatches", { query: search })}
            />
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((team) => (
                <TeamCard
                  key={team.constructorId}
                  team={team}
                  profileTo={withSeason(`/constructors/${team.constructorId}`)}
                  driversTo={withSeason("/drivers", { team: team.constructorId })}
                />
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}

export default Constructors;
