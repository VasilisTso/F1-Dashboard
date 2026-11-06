import { Link } from "react-router-dom";
import { LuArrowRight } from "react-icons/lu";
import { useSeason } from "../context/SeasonContext";
import {
  useDriverStandings,
  useConstructorStandings,
  useNextRace,
  useLastRaceResults,
} from "../hooks/queries";
import { useNow } from "../hooks/useNow";
import { countryFlag } from "../lib/countries";
import { Card, Countdown, ErrorState, PageHeader, Skeleton, SkeletonRows, TeamStripe } from "../components/ui";

const formatPoints = (p) => Number(p).toLocaleString("en", { maximumFractionDigits: 1 });

// Jolpica session keys in weekend order; the race itself sits on the race object.
const SESSIONS = [
  ["FirstPractice", "Practice 1"],
  ["SecondPractice", "Practice 2"],
  ["ThirdPractice", "Practice 3"],
  ["SprintQualifying", "Sprint qualifying"],
  ["SprintShootout", "Sprint shootout"],
  ["Sprint", "Sprint"],
  ["Qualifying", "Qualifying"],
];

// "2026-11-08" + "17:00:00Z" -> Date. No time = end of the local day, as on the Races page,
// so an untimed session never counts as started early.
const toDate = ({ date, time }) => new Date(time ? `${date}T${time}` : `${date}T23:59:59`);

const weekendSessions = (race) =>
  [...SESSIONS.filter(([key]) => race[key]).map(([key, name]) => ({ name, start: toDate(race[key]), timed: !!race[key].time })),
    { name: "Race", start: toDate(race), timed: !!race.time },
  ].sort((a, b) => a.start - b.start);

const sessionTime = (s) =>
  s.start.toLocaleString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    ...(s.timed ? { hour: "2-digit", minute: "2-digit" } : {}),
  });

const cardLink =
  "inline-flex h-10 items-center gap-1 rounded-panel px-2 -mr-2 text-sm font-medium text-ink-2 hover:bg-surface-3 hover:text-ink transition-colors duration-150";

function CardLink({ to, children }) {
  return (
    <Link to={to} className={cardLink}>
      {children} <LuArrowRight className="size-4" aria-hidden />
    </Link>
  );
}

// ---- Next race -------------------------------------------------------------

function NextRace({ race, withSeason }) {
  const now = useNow(30_000);
  const sessions = weekendSessions(race);
  const nextIdx = sessions.findIndex((s) => s.start.getTime() > now);
  const loc = race.Circuit.Location;

  return (
    <Card
      title="Next race"
      action={<CardLink to={withSeason(`/races/${race.season}/${race.round}`)}>Race page</CardLink>}
    >
      <h3 className="font-display text-3xl uppercase text-ink text-balance">{race.raceName}</h3>
      <p className="mt-1 text-sm text-ink-2">
        <span aria-hidden>{countryFlag(loc.country)} </span>
        Round {race.round} · {race.Circuit.circuitName} · {loc.locality}, {loc.country}
      </p>

      <div className="mt-5">
        <p className="label-caps mb-2">Lights out in</p>
        <Countdown target={toDate(race)} />
      </div>

      <div className="mt-6">
        <h4 className="label-caps mb-1">Weekend schedule · your time</h4>
        <ol className="divide-y divide-line">
          {sessions.map((s, i) => {
            const done = s.start.getTime() <= now && i !== sessions.length - 1;
            const isNext = i === nextIdx;
            return (
              <li key={s.name} className="flex min-h-10 items-center gap-3 py-1.5 text-sm">
                <span className={`flex-1 font-medium ${done ? "text-ink-3" : "text-ink"}`}>
                  {s.name}
                  {done && <span className="sr-only"> (finished)</span>}
                </span>
                {isNext && (
                  <span className="rounded-panel bg-accent px-1.5 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-wider text-on-accent">
                    Next
                  </span>
                )}
                <time dateTime={s.start.toISOString()} className={`text-right ${done ? "text-ink-3" : "text-ink-2"}`}>
                  {sessionTime(s)}
                </time>
              </li>
            );
          })}
        </ol>
      </div>
    </Card>
  );
}

// ---- Podium ----------------------------------------------------------------

// Step heights for P1 / P2 / P3; rendered in P2 · P1 · P3 order like a real podium.
const STEP = { 1: "h-28 sm:h-32", 2: "h-20 sm:h-24", 3: "h-14 sm:h-16" };
// Steps rise in reverse finishing order (P3, P2, P1) so the winner lands last.
const STEP_DELAY = { 1: "240ms", 2: "120ms", 3: "0ms" };

function Podium({ race, withSeason }) {
  const top3 = race.Results.slice(0, 3);
  const order = [top3[1], top3[0], top3[2]].filter(Boolean);
  return (
    <ol className="grid grid-cols-3 items-end gap-2 sm:gap-3" aria-label="Podium">
      {order.map((r) => {
        const pos = Number(r.position);
        return (
          // Visual order is 2-1-3; `value` keeps the list semantics right for screen readers.
          <li key={r.Driver.driverId} value={pos} className="flex min-w-0 flex-col">
            <div className="mb-2 flex min-w-0 items-start gap-2 px-1">
              <TeamStripe constructorId={r.Constructor.constructorId} className="h-10" />
              <div className="min-w-0">
                <Link
                  to={withSeason(`/drivers/${r.Driver.driverId}`)}
                  className="block truncate font-display text-lg uppercase text-ink underline decoration-transparent underline-offset-2 hover:decoration-ink sm:text-2xl transition-colors duration-150"
                >
                  <span className="sr-only">{r.Driver.givenName} </span>
                  {r.Driver.familyName}
                </Link>
                <p className="truncate text-xs text-ink-2">{r.Constructor.name}</p>
                <p className="truncate text-xs text-ink-3">{r.Time?.time ?? r.status}</p>
              </div>
            </div>
            <div
              className={`step-rise flex items-start justify-center rounded-t-panel bg-surface-3 pt-2 ${STEP[pos]}`}
              style={{ "--delay": STEP_DELAY[pos] }}
            >
              <span className={`font-display text-4xl ${pos === 1 ? "text-best" : "text-ink"}`}>
                <span className="sr-only">Position </span>
                {pos}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function LastRace({ query, isCurrent, withSeason }) {
  const { data: race, isPending, error, refetch } = query;
  const title = isCurrent ? "Last race" : "Final race";
  if (error) return <ErrorState title={`Couldn't load the ${title.toLowerCase()}`} onRetry={refetch} />;
  return (
    <Card
      title={title}
      className="flex flex-col"
      bodyClassName="flex flex-1 flex-col p-4 sm:p-5"
      action={race && <CardLink to={withSeason(`/races/${race.season}/${race.round}`)}>Full result</CardLink>}
    >
      {isPending ? (
        <>
          <Skeleton className="h-8 w-56" />
          <Skeleton className="mt-6 h-44 w-full" />
        </>
      ) : !race || race.Results.length === 0 ? (
        <p className="text-sm text-ink-2">No race has finished yet this season.</p>
      ) : (
        <>
          <h3 className="font-display text-3xl uppercase text-ink text-balance">{race.raceName}</h3>
          <p className="mt-1 mb-6 text-sm text-ink-2">
            <span aria-hidden>{countryFlag(race.Circuit.Location.country)} </span>
            Round {race.round} · {race.Circuit.circuitName} ·{" "}
            {new Date(`${race.date}T00:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "long" })}
          </p>
          <div className="mt-auto">
            <Podium race={race} withSeason={withSeason} />
          </div>
        </>
      )}
    </Card>
  );
}

// ---- Top 5 with gap bars ---------------------------------------------------

// Bar length = points as a share of the leader's; the gap figure carries the exact value.
// Single series, so bars stay neutral; identity comes from the stripe + name.
function GapRow({ position, constructorId, name, sub, points, leaderPoints, to }) {
  const share = leaderPoints > 0 ? Math.max(0, Number(points) / leaderPoints) : 0;
  const gap = leaderPoints - Number(points);
  const isLeader = Number(position) === 1;
  return (
    <li>
      <Link
        to={to}
        className="flex min-h-16 items-center gap-2 px-3 py-2.5 transition-colors duration-150 hover:bg-surface-3 sm:gap-3 sm:px-4"
      >
        <span className="font-display w-7 shrink-0 text-right text-2xl text-ink">{position}</span>
        <TeamStripe constructorId={constructorId} className="h-10" />
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline gap-2">
            <span className="min-w-0 flex-1 truncate">
              <span className="font-semibold text-ink">{name}</span>
              {sub && <span className="ml-2 text-xs text-ink-2">{sub}</span>}
            </span>
            <span className="shrink-0 font-semibold text-ink">
              {formatPoints(points)} <span className="text-xs font-normal text-ink-3">pts</span>
            </span>
          </span>
          <span className="mt-1.5 flex items-center gap-3">
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-3" aria-hidden>
              <span
                className={`bar-wipe block h-full rounded-full ${isLeader ? "bg-best" : "bg-ink-3"}`}
                style={{ width: `${share * 100}%` }}
              />
            </span>
            <span className="w-14 shrink-0 text-right text-sm">
              {isLeader ? (
                <span className="font-semibold uppercase text-best">Leader</span>
              ) : (
                <span className="text-ink-2">
                  −{formatPoints(gap)}
                  <span className="sr-only"> points behind the leader</span>
                </span>
              )}
            </span>
          </span>
        </span>
      </Link>
    </li>
  );
}

function TopFive({ title, query, allTo, label, toRow }) {
  const { data, isPending, error, refetch } = query;
  if (error) return <ErrorState title={`Couldn't load ${title.toLowerCase()}`} onRetry={refetch} />;
  const rows = (data?.standings ?? []).slice(0, 5).map(toRow);
  const leaderPoints = Number(rows[0]?.points ?? 0);
  return (
    <Card title={title} action={<CardLink to={allTo}>All standings</CardLink>} bodyClassName="py-2">
      {isPending ? (
        <SkeletonRows rows={5} label={`Loading ${label}`} />
      ) : rows.length === 0 ? (
        <p className="px-4 py-6 text-sm text-ink-2">No races have been scored yet.</p>
      ) : (
        <ol className="tower divide-y divide-line" aria-label={`Top 5 ${label}`}>
          {rows.map((row) => (
            <GapRow key={row.id} {...row} leaderPoints={leaderPoints} />
          ))}
        </ol>
      )}
    </Card>
  );
}

// ---- Page ------------------------------------------------------------------

function Overview() {
  const { isCurrent, withSeason } = useSeason();
  const driversQ = useDriverStandings();
  const constructorsQ = useConstructorStandings();
  const nextQ = useNextRace();
  const lastQ = useLastRaceResults();

  const standings = driversQ.data;
  const title = standings?.season ? `${standings.season} season` : "Season overview";
  const meta = driversQ.isPending
    ? "Loading standings…"
    : standings?.round
      ? `Standings after round ${standings.round}`
      : "No standings yet for this season";

  return (
    <>
      <PageHeader title={title} meta={meta} />

      <div className={`mb-8 grid gap-6 ${isCurrent ? "lg:grid-cols-2" : ""}`}>
        {isCurrent &&
          (nextQ.isPending ? (
            <Skeleton className="h-96" />
          ) : nextQ.error ? (
            <ErrorState title="Couldn't load the next race" onRetry={nextQ.refetch} />
          ) : nextQ.data ? (
            <NextRace race={nextQ.data} withSeason={withSeason} />
          ) : (
            <Card title="Next race">
              <p className="text-sm text-ink-2">The season is over. The next calendar appears here once it's published.</p>
            </Card>
          ))}
        <LastRace query={lastQ} isCurrent={isCurrent} withSeason={withSeason} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <TopFive
          title="Drivers"
          label="drivers"
          query={driversQ}
          allTo={withSeason("/drivers")}
          toRow={(s) => ({
            id: s.Driver.driverId,
            position: s.position,
            constructorId: s.Constructors?.at(-1)?.constructorId,
            name: `${s.Driver.givenName} ${s.Driver.familyName}`,
            sub: s.Constructors?.at(-1)?.name,
            points: s.points,
            to: withSeason(`/drivers/${s.Driver.driverId}`),
          })}
        />
        <TopFive
          title="Constructors"
          label="constructors"
          query={constructorsQ}
          allTo={withSeason("/constructors")}
          toRow={(s) => ({
            id: s.Constructor.constructorId,
            position: s.position,
            constructorId: s.Constructor.constructorId,
            name: s.Constructor.name,
            sub: `${s.wins} ${s.wins === "1" ? "win" : "wins"}`,
            points: s.points,
            to: withSeason(`/constructors/${s.Constructor.constructorId}`),
          })}
        />
      </div>
    </>
  );
}

export default Overview;
