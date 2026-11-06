import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Link } from "react-router-dom";
import { LuArrowRight, LuChevronDown } from "react-icons/lu";
import { useSchedule, useSeasonResults } from "../hooks/queries";
import { useSeason } from "../context/SeasonContext";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useNow } from "../hooks/useNow";
import { countryFlag } from "../lib/countries";
import { ErrorState, FinishCell, PageHeader, Skeleton, TeamStripe, ZoneLabel, useZone } from "../components/ui";
import { useI18n } from "../i18n/LanguageContext";
import { useDataLabels } from "../i18n/data";
import { CalendarButton } from "../components/CalendarButton";

// Race start; races without a time count from the end of the day so they aren't "done" too early.
const raceStart = (race) => new Date(race.time ? `${race.date}T${race.time}` : `${race.date}T23:59:59`);

const fullDateOpts = (race) => ({
  weekday: "short",
  day: "numeric",
  month: "long",
  ...(race.time ? { hour: "2-digit", minute: "2-digit" } : {}),
});

// A race runs ~2h; until results land it stays "next" for a while after lights out.
const RACE_WINDOW = 3 * 60 * 60 * 1000;

// "done" once the race has results or its start is well past; the first race after that is "next".
const withStatus = (calendar, results, now) => {
  let nextFound = false;
  return calendar.map((race) => {
    const done = results[race.round]?.length > 0 || raceStart(race).getTime() + RACE_WINDOW <= now;
    let status = done ? "done" : "upcoming";
    if (!done && !nextFound) {
      status = "next";
      nextFound = true;
    }
    return { ...race, status };
  });
};

function StatusChip({ status }) {
  const { t } = useI18n();
  const style = {
    done: "border-line text-ink-3",
    next: "border-accent bg-accent text-on-accent",
    upcoming: "border-line-strong text-ink-2",
  }[status];
  return (
    <span className={`rounded-panel border px-1.5 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-wider ${style}`}>
      {t(`races.status.${status}`)}
    </span>
  );
}

// ---- Calendar strip --------------------------------------------------------

function CalendarStrip({ races, selected, onSelect }) {
  const { t, fmt } = useI18n();
  const listRef = useRef(null);
  const nextRound = races.find((r) => r.status === "next")?.round;
  // Start the strip at the next race (or the end of a finished season) instead of round 1.
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const target = nextRound ? list.querySelector(`[data-round="${nextRound}"]`) : list.lastElementChild;
    if (target) list.scrollLeft = target.offsetLeft - list.clientWidth / 2 + target.offsetWidth / 2;
  }, [nextRound]);

  return (
    <nav aria-label={t("races.calendar")} className="mb-8">
      {/* `relative` keeps the chips' sr-only text inside the scroll box (it would widen the page). */}
      <ol ref={listRef} className="relative -mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
        {races.map((race) => (
          <li key={race.round} data-round={race.round} className="shrink-0">
            <a
              href={`#round-${race.round}`}
              onClick={() => onSelect(race.round)}
              aria-current={race.status === "next" ? "step" : undefined}
              className={`flex w-28 flex-col gap-1 rounded-panel border px-3 py-2 transition-colors duration-150 hover:bg-surface-3 ${
                race.status === "next" ? "border-accent" : selected === race.round ? "border-ink" : "border-line"
              } ${selected === race.round ? "bg-surface-3" : "bg-surface-2"}`}
            >
              <span className="flex items-center justify-between">
                <span className={`font-display text-lg ${race.status === "done" ? "text-ink-3" : "text-ink"}`}>
                  {t("races.roundShort", { round: race.round })}
                </span>
                <span aria-hidden>{countryFlag(race.Circuit.Location.country)}</span>
              </span>
              <span className={`truncate text-sm font-medium ${race.status === "done" ? "text-ink-2" : "text-ink"}`}>
                {race.Circuit.Location.locality}
              </span>
              <span className="text-xs text-ink-3">
                {fmt.day(race.date, { day: "numeric", month: "short" })}
                <span className="sr-only"> · {t(`races.status.${race.status}`)}</span>
              </span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

// ---- Race card -------------------------------------------------------------

function ResultList({ results, withSeason }) {
  const { fmt } = useI18n();
  return (
    <ol className="tower divide-y divide-line border-t border-line">
      {results.map((r) => (
        <li key={r.Driver.driverId} className="flex min-h-10 items-center gap-2 px-4 py-1.5 text-sm">
          <span className="w-10 shrink-0 text-right [&_.font-display]:text-lg">
            <FinishCell result={r} />
          </span>
          <TeamStripe constructorId={r.Constructor.constructorId} className="h-6" />
          <Link
            to={withSeason(`/drivers/${r.Driver.driverId}`)}
            className="min-w-0 flex-1 truncate text-ink hover:underline"
          >
            {r.Driver.givenName} {r.Driver.familyName}
            <span className="ml-2 text-xs text-ink-2">{r.Constructor.name}</span>
          </Link>
          <span className="w-10 shrink-0 text-right font-semibold text-ink">{fmt.points(r.points)}</span>
        </li>
      ))}
    </ol>
  );
}

function RaceCard({ race, results, resultsLoading, selected, withSeason, zone }) {
  const { t, fmt } = useI18n();
  const { country } = useDataLabels();
  const [open, setOpen] = useState(false);
  // MotionConfig only strips transforms; height would still animate, so skip it here.
  const reduceMotion = useReducedMotion();
  const loc = race.Circuit.Location;
  const winner = results?.find((r) => r.position === "1");
  const listId = `round-${race.round}-results`;
  const detailTo = withSeason(`/races/${race.season}/${race.round}`);

  return (
    <li
      id={`round-${race.round}`}
      // Next keeps its red border; hover and the race picked in the strip get a neutral ink edge.
      className={`flex scroll-mt-24 flex-col rounded-panel border bg-surface-2 shadow-raised transition-[border-color,outline-color,translate] duration-150 motion-safe:hover:-translate-y-0.5 ${
        race.status === "next" ? "border-accent" : selected ? "border-ink" : "border-line hover:border-ink-2"
      } ${selected ? "outline-2 outline-offset-2 outline-ink" : "outline-transparent"}`}
    >
      <div className="p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="label-caps">{t("races.round", { round: race.round })}</span>
          <StatusChip status={race.status} />
        </div>
        <h3 className="mt-2 font-display text-2xl uppercase text-ink text-balance">
          <Link to={detailTo} className="underline decoration-transparent underline-offset-2 hover:decoration-ink transition-colors duration-150">
            {race.raceName}
          </Link>
        </h3>
        <p className="mt-1 text-sm text-ink-2">
          <span aria-hidden>{countryFlag(loc.country)} </span>
          {loc.locality}, {country(loc.country)}
        </p>
        <p className="text-xs text-ink-3">
          {race.Circuit.circuitName} ·{" "}
          {/* nowrap: the date and start time break as one unit, never a lone "19:00". */}
          <time
            dateTime={race.time ? raceStart(race).toISOString() : race.date}
            title={race.time ? zone.utc(raceStart(race)) : undefined}
            className="whitespace-nowrap"
          >
            {fmt.date(raceStart(race), fullDateOpts(race))}
          </time>
        </p>
      </div>

      <div className="mt-auto border-t border-line">
        {winner ? (
          <div className="flex items-center gap-3 px-4 py-3">
            <TeamStripe constructorId={winner.Constructor.constructorId} className="h-9" />
            <div className="min-w-0 flex-1">
              <p className="label-caps">{t("races.winner")}</p>
              <p className="truncate font-semibold text-ink">
                {winner.Driver.givenName} {winner.Driver.familyName}
              </p>
            </div>
            <span className="text-right text-xs text-ink-2">{winner.Constructor.name}</span>
          </div>
        ) : race.status === "done" && resultsLoading ? (
          <div className="px-4 py-3">
            <Skeleton className="h-9 w-48" />
          </div>
        ) : (
          <p className="px-4 py-3 text-sm text-ink-2">
            {t(race.status === "done" ? "races.notPublished" : "races.afterFlag")}
          </p>
        )}

        <AnimatePresence initial={false}>
          {open && results?.length > 0 && (
            <motion.div
              id={listId}
              className="overflow-hidden"
              initial={reduceMotion ? false : { height: 0 }}
              animate={{ height: "auto" }}
              exit={reduceMotion ? undefined : { height: 0, transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            >
              <ResultList results={results} withSeason={withSeason} />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between gap-2 border-t border-line px-2 py-1">
          {results?.length > 0 ? (
            <button
              type="button"
              aria-expanded={open}
              aria-controls={listId}
              onClick={() => setOpen((v) => !v)}
              className="inline-flex h-10 items-center gap-1.5 rounded-panel px-2 text-sm font-medium text-ink-2 hover:bg-surface-3 hover:text-ink transition-colors duration-150"
            >
              <LuChevronDown
                className={`size-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                aria-hidden
              />
              {t(open ? "races.hideResult" : "races.fullResult")}
            </button>
          ) : (
            <span />
          )}
          <Link
            to={detailTo}
            className="inline-flex h-10 items-center gap-1 rounded-panel px-2 text-sm font-medium text-ink hover:bg-surface-3 transition-colors duration-150"
          >
            {t("races.details")} <LuArrowRight className="size-4" aria-hidden />
            <span className="sr-only">: {race.raceName}</span>
          </Link>
        </div>
      </div>
    </li>
  );
}

// ---- Page ------------------------------------------------------------------

function Races() {
  const { t } = useI18n();
  const { season: picked, isCurrent, withSeason } = useSeason();
  useDocumentTitle(t("races.title"), !isCurrent && picked);
  const scheduleQ = useSchedule();
  const resultsQ = useSeasonResults();
  const now = useNow(60_000);
  const zone = useZone();
  // Race picked in the calendar strip (also restored from a #round-N link).
  const [selected, setSelected] = useState(() => window.location.hash.match(/^#round-(\d+)$/)?.[1] ?? null);

  if (scheduleQ.error) {
    return (
      <>
        <PageHeader title={t("races.title")} />
        <ErrorState onRetry={scheduleQ.refetch} />
      </>
    );
  }

  const results = resultsQ.data ?? {};
  const races = withStatus(scheduleQ.data ?? [], results, now);
  const finished = races.filter((r) => r.status === "done").length;
  const meta = scheduleQ.isPending
    ? t("races.loading")
    : races.length
      ? [
          t("common.season.title", { season: races[0].season }),
          t("races.rounds", { count: races.length, n: races.length }),
          t("races.finishedCount", { count: finished, n: finished }),
        ].join(" · ")
      : t("races.noCalendarYet");

  return (
    <>
      <PageHeader
        title={t("races.title")}
        meta={meta}
        actions={
          <CalendarButton
            races={races.filter((r) => r.status !== "done")}
            scope="season"
            filename={`f1-${races[0]?.season}-season.ics`}
          />
        }
      >
        {/* Named once for the page; every card's time is in this zone (tooltip: UTC). */}
        {races.length > 0 && <ZoneLabel at={raceStart(races.find((r) => r.status === "next") ?? races.at(-1))} className="mt-1 flex w-fit" />}
      </PageHeader>

      {scheduleQ.isPending ? (
        <>
          <div className="mb-8 flex gap-2 overflow-hidden">
            {Array.from({ length: 8 }, (_, i) => (
              <Skeleton key={i} className="h-20 w-28 shrink-0" />
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 wide:grid-cols-4">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-60" />
            ))}
          </div>
        </>
      ) : races.length === 0 ? (
        <ErrorState tone="empty" title={t("races.noRaces")} message={t("races.noCalendar")} />
      ) : (
        <>
          <CalendarStrip races={races} selected={selected} onSelect={setSelected} />
          {resultsQ.error && (
            <ErrorState
              className="mb-6"
              title={t("races.resultsError")}
              message={t("races.resultsErrorMessage")}
              onRetry={resultsQ.refetch}
            />
          )}
          <section aria-labelledby="rounds-heading">
            <h2 id="rounds-heading" className="sr-only">
              {t("races.roundsHeading")}
            </h2>
            <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 wide:grid-cols-4">
              {races.map((race) => (
                <RaceCard
                  key={race.round}
                  race={race}
                  results={results[race.round]}
                  resultsLoading={resultsQ.isPending}
                  selected={selected === race.round}
                  withSeason={withSeason}
                  zone={zone}
                />
              ))}
            </ul>
          </section>
        </>
      )}
    </>
  );
}

export default Races;
