import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { LuSearch, LuArrowRight, LuX } from "react-icons/lu";
import { AnimatePresence, motion } from "motion/react";
import { useDrivers, useDriverStandings } from "../hooks/queries";
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
const NO_TEAM = "__none";

// Filtering: cards that stay glide to their new slot, cards that leave fade out of the way.
const EASE = [0.16, 1, 0.3, 1];
const cardMotion = {
  layout: true,
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.96, transition: { duration: 0.15 } },
  transition: { duration: 0.3, ease: EASE },
};

// `ref` is passed through so AnimatePresence (popLayout) can measure the card.
function DriverCard({ driver, to, ref }) {
  const s = driver.standing;
  return (
    <motion.li
      ref={ref}
      {...cardMotion}
      className="relative flex flex-col rounded-panel border border-line bg-surface-2 shadow-raised transition-colors duration-150 hover:border-line-strong">
      <div className="flex items-start gap-3 p-4">
        <span className="font-display w-12 shrink-0 text-4xl text-ink-3" aria-hidden>
          {driver.permanentNumber ?? "—"}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-ink-2">{driver.givenName}</p>
          <h4 className="truncate font-display text-2xl uppercase text-ink">
            {/* Stretched link: the whole card opens the profile. */}
            <Link to={to} className="after:absolute after:inset-0 after:rounded-panel">
              <span className="sr-only">{driver.givenName} </span>
              {driver.familyName}
            </Link>
          </h4>
          <p className="truncate text-xs text-ink-2">
            {driver.nationality}
            {driver.permanentNumber && <span className="sr-only"> · car number {driver.permanentNumber}</span>}
          </p>
        </div>
        {driver.code && (
          <span className="rounded-panel border border-line-strong px-1.5 py-0.5 text-xs font-semibold tracking-wide text-ink-2">
            {driver.code}
          </span>
        )}
      </div>
      <dl className="mt-auto grid grid-cols-3 border-t border-line">
        {[
          ["Pos", s ? `P${s.position}` : "—"],
          ["Points", s ? formatPoints(s.points) : "—"],
          ["Wins", s?.wins ?? "—"],
        ].map(([k, v], i) => (
          <div key={k} className={`px-4 py-3 ${i > 0 ? "border-l border-line" : ""}`}>
            <dt className="label-caps">{k}</dt>
            <dd className="font-display mt-1 text-xl text-ink">{v}</dd>
          </div>
        ))}
      </dl>
    </motion.li>
  );
}

function TeamGroup({ team, drivers, profileTo, driverTo, ref }) {
  const headingId = `team-${team.constructorId || NO_TEAM}`;
  return (
    <motion.section ref={ref} {...cardMotion} aria-labelledby={headingId}>
      <div className="mb-3 flex items-center gap-3">
        <TeamStripe constructorId={team.constructorId} className="h-6" />
        <h3 id={headingId} className="min-w-0 flex-1 truncate font-display text-xl uppercase text-ink">
          {team.name}
        </h3>
        {profileTo && (
          <Link
            to={profileTo}
            className="inline-flex h-10 items-center gap-1 rounded-panel px-2 -mr-2 text-sm font-medium text-ink-2 hover:bg-surface-3 hover:text-ink transition-colors duration-150"
          >
            Team profile <LuArrowRight className="size-4" aria-hidden />
          </Link>
        )}
      </div>
      <ul className="relative grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <AnimatePresence mode="popLayout" initial={false}>
          {drivers.map((d) => (
            <DriverCard key={d.driverId} driver={d} to={driverTo(d.driverId)} />
          ))}
        </AnimatePresence>
      </ul>
    </motion.section>
  );
}

function Drivers() {
  const [search, setSearch] = useState("");
  const { withSeason } = useSeason();
  // ?team=<constructorId>, e.g. from the Constructors page.
  const [searchParams, setSearchParams] = useSearchParams();
  const teamFilter = searchParams.get("team") || "";
  const setTeamFilter = (team) =>
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      if (team) params.set("team", team);
      else params.delete("team");
      return params;
    });

  const driversQ = useDrivers();
  const standingsQ = useDriverStandings();
  const error = driversQ.error || standingsQ.error;

  if (error) {
    return (
      <>
        <PageHeader title="Drivers" />
        <ErrorState
          onRetry={() => {
            driversQ.refetch();
            standingsQ.refetch();
          }}
        />
      </>
    );
  }

  const isPending = driversQ.isPending || standingsQ.isPending;
  const standings = standingsQ.data?.standings ?? [];
  const leaderPoints = Number(standings[0]?.points ?? 0);
  const driverTo = (id) => withSeason(`/drivers/${id}`);

  // Group the season's drivers by their latest team, teams in championship order
  // (best-placed driver first); drivers without a classified result go last.
  const standingById = Object.fromEntries(standings.map((s) => [s.Driver.driverId, s]));
  const groups = new Map();
  for (const s of standings) {
    const c = s.Constructors?.at(-1);
    if (c && !groups.has(c.constructorId)) groups.set(c.constructorId, { team: c, drivers: [] });
  }
  for (const d of driversQ.data ?? []) {
    const standing = standingById[d.driverId];
    const c = standing?.Constructors?.at(-1);
    const key = c?.constructorId ?? NO_TEAM;
    if (!groups.has(key)) groups.set(key, { team: { constructorId: "", name: "Other entries" }, drivers: [] });
    groups.get(key).drivers.push({ ...d, standing });
  }
  const allGroups = [...groups.values()].filter((g) => g.drivers.length > 0);
  for (const g of allGroups) {
    g.drivers.sort((a, b) => (Number(a.standing?.position) || 999) - (Number(b.standing?.position) || 999));
  }

  const query = search.trim().toLowerCase();
  const visible = allGroups
    .filter((g) => !teamFilter || g.team.constructorId === teamFilter)
    .map((g) => ({
      ...g,
      drivers: g.drivers.filter((d) =>
        `${d.givenName} ${d.familyName} ${d.nationality} ${d.code ?? ""}`.toLowerCase().includes(query),
      ),
    }))
    .filter((g) => g.drivers.length > 0);

  const teamFilterName = allGroups.find((g) => g.team.constructorId === teamFilter)?.team.name ?? teamFilter;
  const season = standingsQ.data?.season;
  const meta = isPending
    ? "Loading drivers…"
    : season
      ? `${season} season · after round ${standingsQ.data.round}`
      : "No standings yet for this season";

  return (
    <>
      <PageHeader title="Drivers" meta={meta} />

      <Card title="Championship standings" bodyClassName="py-3" className="mb-8">
        {isPending ? (
          <SkeletonRows rows={10} label="Loading driver standings" />
        ) : standings.length === 0 ? (
          <p className="px-4 py-6 text-sm text-ink-2">No races have been scored yet.</p>
        ) : (
          <StandingsList label="Driver" showExtra="Wins" linked>
            {standings.map((s) => {
              const team = s.Constructors?.at(-1);
              return (
                <StandingsRow
                  key={s.Driver.driverId}
                  position={s.position ?? s.positionText}
                  constructorId={team?.constructorId}
                  name={`${s.Driver.givenName} ${s.Driver.familyName}`}
                  sub={team?.name}
                  points={s.points}
                  gap={leaderPoints - Number(s.points)}
                  extra={s.wins}
                  to={driverTo(s.Driver.driverId)}
                />
              );
            })}
          </StandingsList>
        )}
      </Card>

      <section aria-labelledby="grid-heading">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 id="grid-heading" className="font-display text-2xl uppercase text-ink">
            Grid
          </h2>
          <div className="flex w-full flex-wrap gap-2 sm:w-auto">
            <label className="w-full sm:w-52">
              <span className="sr-only">Filter by team</span>
              <select
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
                disabled={isPending}
                className="h-10 w-full rounded-panel border border-line-strong bg-surface-2 px-3 text-sm text-ink hover:border-ink-3"
              >
                <option value="">All teams</option>
                {allGroups
                  .filter((g) => g.team.constructorId)
                  .map((g) => (
                    <option key={g.team.constructorId} value={g.team.constructorId}>
                      {g.team.name}
                    </option>
                  ))}
              </select>
            </label>
            <label className="relative w-full sm:w-64">
              <span className="sr-only">Search drivers</span>
              <LuSearch
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-3"
                aria-hidden
              />
              <input
                type="search"
                placeholder="Search driver or nationality"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 w-full rounded-panel border border-line-strong bg-surface-2 pl-9 pr-3 text-sm text-ink placeholder:text-ink-3 hover:border-ink-3"
              />
            </label>
          </div>
        </div>

        {teamFilter && !isPending && (
          <p className="mb-4 flex flex-wrap items-center gap-2 text-sm text-ink-2" role="status">
            Showing drivers for <span className="font-semibold text-ink">{teamFilterName}</span>
            <button
              type="button"
              onClick={() => setTeamFilter("")}
              className="inline-flex h-8 items-center gap-1 rounded-panel border border-line-strong px-2 font-medium text-ink hover:bg-surface-3 transition-colors duration-150"
            >
              <LuX className="size-3.5" aria-hidden /> Clear filter
            </button>
          </p>
        )}

        {isPending ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <ErrorState
            tone="empty"
            title="No drivers match"
            message={query ? `Nothing matches “${search}”.` : `No drivers found for ${teamFilterName}.`}
          />
        ) : (
          <div className="relative flex flex-col gap-8">
            <AnimatePresence mode="popLayout" initial={false}>
              {visible.map((g) => (
                <TeamGroup
                  key={g.team.constructorId || NO_TEAM}
                  team={g.team}
                  drivers={g.drivers}
                  profileTo={g.team.constructorId ? withSeason(`/constructors/${g.team.constructorId}`) : null}
                  driverTo={driverTo}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>
    </>
  );
}

export default Drivers;
