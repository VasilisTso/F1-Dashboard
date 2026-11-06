import { toDate } from "./weekend";

// ---- Title maths -------------------------------------------------------------

// Most points one entry can still score per weekend under the current rules
// (no fastest-lap point since 2025). Constructors: P1 + P2.
const RACE_MAX = { drivers: 25, constructors: 25 + 18 };
const SPRINT_MAX = { drivers: 8, constructors: 8 + 7 };

// Who can still win the running season. A weekend counts as still to come if it is after the
// standings' round or its race hasn't started yet, so a sprint already folded into the standings
// is at worst counted twice: the maths errs towards "still in it", never a false "clinched".
// Returns null once nothing is left to race.
export function titleMaths(standings, schedule, afterRound, kind, now = Date.now()) {
  if (!standings?.length || !schedule?.length) return null;
  const left = schedule.filter((r) => Number(r.round) > Number(afterRound) || toDate(r).getTime() > now);
  if (left.length === 0) return null;
  const sprints = left.filter((r) => r.Sprint).length;
  const max = left.length * RACE_MAX[kind] + sprints * SPRINT_MAX[kind];
  const leader = Number(standings[0].points);
  const reach = (s) => Number(s.points) + max;
  const contenders = standings.filter((s) => reach(s) >= leader);
  return {
    max,
    races: left.length,
    sprints,
    contenders: contenders.length,
    decided: contenders.length === 1,
    // A rival who can at best draw level: the title would go to countback (most wins).
    tieOnly: contenders.some((s, i) => i > 0 && reach(s) === leader),
    // Whether a standings row can still reach the leader.
    isIn: (s) => reach(s) >= leader,
  };
}

// ---- Progression -------------------------------------------------------------

const driverEntry = (r) => ({
  id: r.Driver.driverId,
  name: `${r.Driver.givenName} ${r.Driver.familyName}`,
  short: r.Driver.code ?? r.Driver.familyName.slice(0, 3).toUpperCase(),
  constructorId: r.Constructor.constructorId,
});
const teamEntry = (r) => ({
  id: r.Constructor.constructorId,
  name: r.Constructor.name,
  short: r.Constructor.name,
  constructorId: r.Constructor.constructorId,
});

// Cumulative points after every scored round, from the season's race and sprint results.
// `rows` is one object per round ({ round, [id]: points }); `series` lists every entry by final
// total. Summed points match the standings from 1991 on; earlier seasons counted only each
// driver's best results (and teams' best car), so the caller flags those.
export function buildProgression(resultsByRound = {}, sprintsByRound = {}, kind = "drivers") {
  const entry = kind === "drivers" ? driverEntry : teamEntry;
  const rounds = [...new Set([...Object.keys(resultsByRound), ...Object.keys(sprintsByRound)])]
    .map(Number)
    .sort((a, b) => a - b);
  const totals = {};
  const wins = {};
  const series = {};
  const rows = rounds.map((round) => {
    for (const r of [...(sprintsByRound[round] ?? []), ...(resultsByRound[round] ?? [])]) {
      const e = entry(r);
      series[e.id] = e; // later rounds overwrite: a driver who switched shows the latest team
      totals[e.id] = (totals[e.id] ?? 0) + (Number(r.points) || 0);
    }
    for (const r of resultsByRound[round] ?? []) {
      if (r.position === "1") wins[entry(r).id] = (wins[entry(r).id] ?? 0) + 1;
    }
    return { round, ...totals };
  });
  const ordered = Object.values(series).sort(
    (a, b) => (totals[b.id] ?? 0) - (totals[a.id] ?? 0) || (wins[b.id] ?? 0) - (wins[a.id] ?? 0)
  );
  return { rows, series: ordered };
}
