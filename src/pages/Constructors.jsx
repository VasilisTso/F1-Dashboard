import { useState } from "react";
import { Link } from "react-router-dom";
import { LuSearch, LuArrowRight } from "react-icons/lu";
import { useConstructorStandings } from "../hooks/queries";
import { useSeason } from "../context/SeasonContext";
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

const formatPoints = (p) => Number(p).toLocaleString("en", { maximumFractionDigits: 1 });

function TeamCard({ team, profileTo, driversTo }) {
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
          <p className="text-sm text-ink-2">{team.nationality}</p>
        </div>
        <span className="font-display text-3xl text-ink-3">
          <span className="sr-only">Position </span>
          <span aria-hidden>P</span>
          {team.position}
        </span>
      </div>
      <dl className="grid grid-cols-2 border-t border-line">
        <div className="px-4 py-3">
          <dt className="label-caps">Points</dt>
          <dd className="font-display mt-1 text-2xl text-ink">{formatPoints(team.points)}</dd>
        </div>
        <div className="border-l border-line px-4 py-3">
          <dt className="label-caps">Wins</dt>
          <dd className="font-display mt-1 text-2xl text-ink">{team.wins}</dd>
        </div>
      </dl>
      <div className="mt-auto flex items-center justify-between gap-2 border-t border-line px-4 py-2">
        <Link
          to={driversTo}
          className="relative z-10 inline-flex h-10 items-center rounded-panel px-2 -ml-2 text-sm font-medium text-ink-2 hover:bg-surface-3 hover:text-ink transition-colors duration-150"
        >
          Drivers
        </Link>
        <span className="inline-flex items-center gap-1 text-sm font-medium text-ink" aria-hidden>
          See more <LuArrowRight className="size-4" />
        </span>
      </div>
    </li>
  );
}

function Constructors() {
  const [search, setSearch] = useState("");
  const { withSeason } = useSeason();
  const { data, isPending, error, refetch } = useConstructorStandings();

  if (error) {
    return (
      <>
        <PageHeader title="Constructors" />
        <ErrorState onRetry={refetch} />
      </>
    );
  }

  const standings = data?.standings ?? [];
  const teams = standings.map((s) => ({ ...s.Constructor, points: s.points, wins: s.wins, position: s.position }));
  const leaderPoints = Number(teams[0]?.points ?? 0);
  const query = search.trim().toLowerCase();
  const filtered = teams.filter(
    (t) => t.name.toLowerCase().includes(query) || t.nationality.toLowerCase().includes(query),
  );

  const meta = isPending
    ? "Loading standings…"
    : data.season
      ? `${data.season} season · after round ${data.round}`
      : "No standings yet for this season";

  return (
    <>
      <PageHeader title="Constructors" meta={meta} />

      <Card title="Championship standings" bodyClassName="py-3" className="mb-8">
        {isPending ? (
          <SkeletonRows rows={10} label="Loading constructor standings" />
        ) : teams.length === 0 ? (
          <p className="px-4 py-6 text-sm text-ink-2">No races have been scored yet.</p>
        ) : (
          <StandingsList label="Team" showExtra="Wins" linked>
            {teams.map((t) => (
              <StandingsRow
                key={t.constructorId}
                position={t.position}
                constructorId={t.constructorId}
                name={t.name}
                sub={t.nationality}
                points={t.points}
                gap={leaderPoints - Number(t.points)}
                extra={t.wins}
                to={withSeason(`/constructors/${t.constructorId}`)}
              />
            ))}
          </StandingsList>
        )}
      </Card>

      <section aria-labelledby="teams-heading">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 id="teams-heading" className="font-display text-2xl uppercase text-ink">
            Teams
          </h2>
          <label className="relative w-full sm:w-72">
            <span className="sr-only">Search teams</span>
            <LuSearch
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-3"
              aria-hidden
            />
            <input
              type="search"
              placeholder="Search team or nationality"
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
          <ErrorState tone="empty" title="No teams match" message={`Nothing matches “${search}”.`} />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((t) => (
              <TeamCard
                key={t.constructorId}
                team={t}
                profileTo={withSeason(`/constructors/${t.constructorId}`)}
                driversTo={withSeason("/drivers", { team: t.constructorId })}
              />
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

export default Constructors;
