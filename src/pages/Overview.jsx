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
import { useI18n } from "../i18n/LanguageContext";
import { useDataLabels } from "../i18n/data";
import {
  Card,
  Countdown,
  ErrorState,
  PageHeader,
  Skeleton,
  SkeletonRows,
  TeamStripe,
  ZoneLabel,
  useZone,
} from "../components/ui";

// Jolpica session keys in weekend order; the race itself sits on the race object.
// Names live in overview.sessions.<key>.
const SESSIONS = ["FirstPractice", "SecondPractice", "ThirdPractice", "SprintQualifying", "SprintShootout", "Sprint", "Qualifying"];

// "2026-11-08" + "17:00:00Z" -> Date. No time = end of the local day, as on the Races page,
// so an untimed session never counts as started early.
const toDate = ({ date, time }) => new Date(time ? `${date}T${time}` : `${date}T23:59:59`);

const weekendSessions = (race) =>
  [...SESSIONS.filter((key) => race[key]).map((key) => ({ key, start: toDate(race[key]), timed: !!race[key].time })),
    { key: "Race", start: toDate(race), timed: !!race.time },
  ].sort((a, b) => a.start - b.start);

const sessionTimeOpts = (timed) => ({
  weekday: "short",
  day: "numeric",
  month: "short",
  ...(timed ? { hour: "2-digit", minute: "2-digit" } : {}),
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
  const { t, fmt } = useI18n();
  const { country } = useDataLabels();
  const now = useNow(30_000);
  const sessions = weekendSessions(race);
  const nextIdx = sessions.findIndex((s) => s.start.getTime() > now);
  const loc = race.Circuit.Location;
  const zone = useZone(toDate(race));

  return (
    <Card
      title={t("overview.nextRace")}
      action={<CardLink to={withSeason(`/races/${race.season}/${race.round}`)}>{t("overview.racePage")}</CardLink>}
    >
      <h3 className="font-display text-3xl uppercase text-ink text-balance">{race.raceName}</h3>
      <p className="mt-1 text-sm text-ink-2">
        <span aria-hidden>{countryFlag(loc.country)} </span>
        {t("overview.round", { round: race.round })} · {race.Circuit.circuitName} · {loc.locality}, {country(loc.country)}
      </p>

      <div className="mt-5">
        <p className="label-caps mb-2">{t("overview.lightsOut")}</p>
        <Countdown target={toDate(race)} />
      </div>

      <div className="mt-6">
        {/* The zone is named once for the whole schedule; each time's tooltip gives it in UTC. */}
        <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <h4 className="label-caps">{t("overview.schedule")}</h4>
          <ZoneLabel at={toDate(race)} />
        </div>
        <ol className="divide-y divide-line">
          {sessions.map((s, i) => {
            const done = s.start.getTime() <= now && i !== sessions.length - 1;
            const isNext = i === nextIdx;
            return (
              <li key={s.key} className="flex min-h-10 items-center gap-3 py-1.5 text-sm">
                <span className={`flex-1 font-medium ${done ? "text-ink-3" : "text-ink"}`}>
                  {t(`overview.sessions.${s.key}`)}
                  {done && <span className="sr-only"> ({t("overview.finished")})</span>}
                </span>
                {isNext && (
                  <span className="rounded-panel bg-accent px-1.5 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-wider text-on-accent">
                    {t("overview.next")}
                  </span>
                )}
                <time
                  dateTime={s.start.toISOString()}
                  title={s.timed ? zone.utc(s.start) : undefined}
                  className={`text-right ${done ? "text-ink-3" : "text-ink-2"}`}
                >
                  {fmt.date(s.start, sessionTimeOpts(s.timed))}
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
  const { t } = useI18n();
  const top3 = race.Results.slice(0, 3);
  const order = [top3[1], top3[0], top3[2]].filter(Boolean);
  return (
    <ol className="grid grid-cols-3 items-end gap-2 sm:gap-3" aria-label={t("overview.podium")}>
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
                <span className="sr-only">{t("common.position")} </span>
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
  const { t, fmt } = useI18n();
  const { data: race, isPending, error, refetch } = query;
  const title = t(isCurrent ? "overview.lastRace" : "overview.finalRace");
  if (error) {
    return <ErrorState title={t(isCurrent ? "overview.lastRaceError" : "overview.finalRaceError")} onRetry={refetch} />;
  }
  return (
    <Card
      title={title}
      className="flex flex-col"
      bodyClassName="flex flex-1 flex-col p-4 sm:p-5"
      action={race && <CardLink to={withSeason(`/races/${race.season}/${race.round}`)}>{t("overview.fullResult")}</CardLink>}
    >
      {isPending ? (
        <>
          <Skeleton className="h-8 w-56" />
          <Skeleton className="mt-6 h-44 w-full" />
        </>
      ) : !race || race.Results.length === 0 ? (
        <p className="text-sm text-ink-2">{t("overview.noRaceYet")}</p>
      ) : (
        <>
          <h3 className="font-display text-3xl uppercase text-ink text-balance">{race.raceName}</h3>
          <p className="mt-1 mb-6 text-sm text-ink-2">
            <span aria-hidden>{countryFlag(race.Circuit.Location.country)} </span>
            {t("overview.round", { round: race.round })} · {race.Circuit.circuitName} ·{" "}
            {fmt.day(race.date, { day: "numeric", month: "long" })}
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
  const { t, fmt } = useI18n();
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
              {fmt.points(points)} <span className="text-xs font-normal text-ink-3">{t("common.pts")}</span>
            </span>
          </span>
          <span className="mt-1.5 flex items-center gap-3">
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-3" aria-hidden>
              <span
                className={`bar-wipe block h-full rounded-full ${isLeader ? "bg-best" : "bg-ink-3"}`}
                style={{ width: `${share * 100}%` }}
              />
            </span>
            <span className="w-16 shrink-0 text-right text-sm">
              {isLeader ? (
                <span className="font-semibold uppercase text-best">{t("common.leader")}</span>
              ) : (
                <span className="text-ink-2">
                  −{fmt.points(gap)}
                  <span className="sr-only"> {t("common.behindLeader")}</span>
                </span>
              )}
            </span>
          </span>
        </span>
      </Link>
    </li>
  );
}

function TopFive({ kind, query, allTo, toRow }) {
  const { t } = useI18n();
  const { data, isPending, error, refetch } = query;
  if (error) return <ErrorState title={t(`overview.${kind}.error`)} onRetry={refetch} />;
  const rows = (data?.standings ?? []).slice(0, 5).map(toRow);
  const leaderPoints = Number(rows[0]?.points ?? 0);
  return (
    <Card
      title={t(`overview.${kind}.title`)}
      action={<CardLink to={allTo}>{t("overview.allStandings")}</CardLink>}
      bodyClassName="py-2"
    >
      {isPending ? (
        <SkeletonRows rows={5} label={t(`overview.${kind}.loading`)} />
      ) : rows.length === 0 ? (
        <p className="px-4 py-6 text-sm text-ink-2">{t("overview.noScores")}</p>
      ) : (
        <ol className="tower divide-y divide-line" aria-label={t(`overview.${kind}.top5`)}>
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
  const { t, fmt } = useI18n();
  const { isCurrent, withSeason } = useSeason();
  const driversQ = useDriverStandings();
  const constructorsQ = useConstructorStandings();
  const nextQ = useNextRace();
  const lastQ = useLastRaceResults();

  const standings = driversQ.data;
  const title = standings?.season ? t("common.season.title", { season: standings.season }) : t("overview.title");
  const meta = driversQ.isPending
    ? t("overview.loadingStandings")
    : standings?.round
      ? t("overview.afterRound", { round: standings.round })
      : t("overview.noStandings");

  return (
    <>
      <PageHeader title={title} meta={meta} />

      {/* Wide screens: race cards take two columns, the standings stack in the third. */}
      <div className="grid gap-8 wide:grid-cols-3 wide:items-start wide:gap-6">
        <div className={`grid gap-6 wide:col-span-2 ${isCurrent ? "lg:grid-cols-2" : ""}`}>
          {isCurrent &&
            (nextQ.isPending ? (
              <Skeleton className="h-96" />
            ) : nextQ.error ? (
              <ErrorState title={t("overview.nextRaceError")} onRetry={nextQ.refetch} />
            ) : nextQ.data ? (
              <NextRace race={nextQ.data} withSeason={withSeason} />
            ) : (
              <Card title={t("overview.nextRace")}>
                <p className="text-sm text-ink-2">{t("overview.seasonOver")}</p>
              </Card>
            ))}
          <LastRace query={lastQ} isCurrent={isCurrent} withSeason={withSeason} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2 wide:grid-cols-1">
          <TopFive
            kind="drivers"
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
            kind="constructors"
            query={constructorsQ}
            allTo={withSeason("/constructors")}
            toRow={(s) => ({
              id: s.Constructor.constructorId,
              position: s.position,
              constructorId: s.Constructor.constructorId,
              name: s.Constructor.name,
              sub: t("common.winCount", { count: Number(s.wins), n: fmt.number(s.wins) }),
              points: s.points,
              to: withSeason(`/constructors/${s.Constructor.constructorId}`),
            })}
          />
        </div>
      </div>
    </>
  );
}

export default Overview;
