// Race-weekend timing shared by the Overview, the race page and calendar export.

// Jolpica session keys in weekend order; the race itself sits on the race object.
// Names live in overview.sessions.<key>.
export const SESSIONS = [
  "FirstPractice",
  "SecondPractice",
  "ThirdPractice",
  "SprintQualifying",
  "SprintShootout",
  "Sprint",
  "Qualifying",
];

// Scheduled length in minutes. Jolpica only gives start times; these are the usual slots,
// so "underway" and "ends around" are estimates (red flags can stretch a session).
export const SESSION_MINUTES = {
  FirstPractice: 60,
  SecondPractice: 60,
  ThirdPractice: 60,
  SprintQualifying: 44,
  SprintShootout: 44,
  Sprint: 60,
  Qualifying: 60,
  Race: 120,
};

// "2026-11-08" + "17:00:00Z" -> Date. No time = end of the local day, so an untimed session
// never counts as started early.
export const toDate = ({ date, time }) => new Date(time ? `${date}T${time}` : `${date}T23:59:59`);

// Every session of a weekend in time order: { key, start, end, timed }.
export const weekendSessions = (race) =>
  [
    ...SESSIONS.filter((key) => race[key]).map((key) => ({ key, ...race[key] })),
    { key: "Race", date: race.date, time: race.time },
  ]
    .map(({ key, date, time }) => {
      const start = toDate({ date, time });
      return { key, start, end: new Date(start.getTime() + SESSION_MINUTES[key] * 60_000), timed: !!time };
    })
    .sort((a, b) => a.start - b.start);

// Where the weekend stands at `now`:
//   "live"     a timed session is running (`session` says which)
//   "awaiting" the race has run but this race is still "next", i.e. results aren't in yet
//   "upcoming" anything else (before or between sessions)
export const weekendPhase = (sessions, now) => {
  const race = sessions.find((s) => s.key === "Race");
  const live = sessions.find((s) => s.timed && s.start.getTime() <= now && now < s.end.getTime());
  if (live) return { phase: "live", session: live };
  if (race.timed && race.end.getTime() <= now) return { phase: "awaiting", session: race };
  return { phase: "upcoming", session: null };
};
