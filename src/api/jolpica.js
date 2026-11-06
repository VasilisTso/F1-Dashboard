import axios from "axios";

// Single source for every F1 data request (Ergast is shut down; Jolpica mirrors its API).
export const API_BASE = "https://api.jolpi.ca/ergast/f1";
const PAGE_LIMIT = 100; // Jolpica max page size

const http = axios.create({ baseURL: API_BASE, timeout: 15000 });

// Jolpica rate limit is ~4 req/s burst, 500 req/h. Space every request out globally
// so pages that fire several queries at once never trip it.
const MIN_GAP_MS = 300;
let nextSlot = 0;
const throttle = () => {
  const now = Date.now();
  const wait = Math.max(0, nextSlot - now);
  nextSlot = Math.max(now, nextSlot) + MIN_GAP_MS;
  return new Promise((resolve) => setTimeout(resolve, wait));
};

const get = async (path, params) => {
  await throttle();
  const res = await http.get(path, { params });
  return res.data.MRData;
};

// "Total" of a collection without downloading it.
const count = async (path) => Number((await get(path, { limit: 1 })).total) || 0;

// ---- Seasons ---------------------------------------------------------------

export const getSeasons = async () => {
  const data = await get("/seasons.json", { limit: PAGE_LIMIT });
  return data.SeasonTable.Seasons.map((s) => s.season);
};

// ---- Standings -------------------------------------------------------------

export const getDriverStandings = async (season = "current") => {
  const list = (await get(`/${season}/driverStandings.json`)).StandingsTable.StandingsLists[0];
  return { season: list?.season ?? null, round: list?.round ?? null, standings: list?.DriverStandings ?? [] };
};

export const getConstructorStandings = async (season = "current") => {
  const list = (await get(`/${season}/constructorStandings.json`)).StandingsTable.StandingsLists[0];
  return { season: list?.season ?? null, round: list?.round ?? null, standings: list?.ConstructorStandings ?? [] };
};

// ---- Races -----------------------------------------------------------------

export const getSchedule = async (season = "current") =>
  (await get(`/${season}.json`)).RaceTable.Races;

export const getNextRace = async () =>
  (await get("/current/next.json")).RaceTable.Races[0] ?? null;

export const getLastRaceResults = async (season = "current") =>
  (await get(`/${season}/last/results.json`)).RaceTable.Races[0] ?? null;

// Every row of a paginated season endpoint, merged by round: { [round]: rows[] }.
// A race can straddle two pages, so rows are appended per round.
const getByRound = async (path, field) => {
  const byRound = {};
  let offset = 0;
  let total = Infinity;
  while (offset < total) {
    const data = await get(path, { limit: PAGE_LIMIT, offset });
    total = Number(data.total) || 0;
    for (const race of data.RaceTable.Races) {
      (byRound[race.round] ??= []).push(...race[field]);
    }
    offset += PAGE_LIMIT;
  }
  return byRound;
};

// Every result of a season in a few paginated calls; returns { [round]: Results[] }.
export const getSeasonResults = (season = "current") => getByRound(`/${season}/results.json`, "Results");

// Every sprint result of a season, same shape. Sprints started in 2021, so older seasons
// cost no request.
export const getSeasonSprints = async (season = "current") =>
  season !== "current" && Number(season) < 2021 ? {} : getByRound(`/${season}/sprint.json`, "SprintResults");

// Poles are counted as starts from grid slot 1: Jolpica's qualifying table only covers recent
// seasons and has gaps (Senna: 3 vs 65 real), while grid data is complete. Grid penalties
// can shift a pole by a race or two, which is close enough for a career total.

// One race weekend: race info plus `results`, `sprint` and `qualifying` arrays (empty until run).
// Returns null for a round that doesn't exist.
export const getRace = async (season, round) => {
  const [results, sprint, qualifying] = await Promise.all([
    get(`/${season}/${round}/results.json`, { limit: PAGE_LIMIT }),
    get(`/${season}/${round}/sprint.json`, { limit: PAGE_LIMIT }),
    get(`/${season}/${round}/qualifying.json`, { limit: PAGE_LIMIT }),
  ]);
  const race =
    results.RaceTable.Races[0] ??
    sprint.RaceTable.Races[0] ??
    qualifying.RaceTable.Races[0] ??
    (await get(`/${season}/${round}.json`)).RaceTable.Races[0];
  if (!race) return null;
  const { Results, SprintResults, QualifyingResults, ...info } = race;
  return {
    ...info,
    results: results.RaceTable.Races[0]?.Results ?? [],
    sprint: sprint.RaceTable.Races[0]?.SprintResults ?? [],
    qualifying: qualifying.RaceTable.Races[0]?.QualifyingResults ?? [],
  };
};

// ---- Drivers ---------------------------------------------------------------

export const getDrivers = async (season = "current") =>
  (await get(`/${season}/drivers.json`, { limit: PAGE_LIMIT })).DriverTable.Drivers;

export const getDriver = async (driverId) =>
  (await get(`/drivers/${driverId}.json`)).DriverTable.Drivers[0] ?? null;

export const getDriverCareer = async (driverId) => {
  const base = `/drivers/${driverId}`;
  const [starts, wins, seconds, thirds, poles, seasons] = await Promise.all([
    count(`${base}/results.json`),
    count(`${base}/results/1.json`),
    count(`${base}/results/2.json`),
    count(`${base}/results/3.json`),
    count(`${base}/grid/1/results.json`),
    get(`${base}/seasons.json`, { limit: PAGE_LIMIT }),
  ]);
  const years = seasons.SeasonTable.Seasons.map((s) => s.season);
  return {
    starts,
    wins,
    podiums: wins + seconds + thirds,
    poles,
    seasons: years.length,
    firstSeason: years[0] ?? null,
    lastSeason: years.at(-1) ?? null,
  };
};

// Teams a driver has raced for, all time.
export const getDriverConstructors = async (driverId) =>
  (await get(`/drivers/${driverId}/constructors.json`, { limit: PAGE_LIMIT })).ConstructorTable.Constructors;

// One driver's race results in a season (one entry per race, `Results[0]` is theirs).
export const getDriverSeasonResults = async (driverId, season = "current") =>
  (await get(`/${season}/drivers/${driverId}/results.json`, { limit: PAGE_LIMIT })).RaceTable.Races.map(
    ({ Results, ...race }) => ({ ...race, result: Results[0] })
  );

// A driver's sprint results in a season as { [round]: SprintResult }.
export const getDriverSeasonSprints = async (driverId, season = "current") =>
  Object.fromEntries(
    (await get(`/${season}/drivers/${driverId}/sprint.json`, { limit: PAGE_LIMIT })).RaceTable.Races.map((r) => [
      r.round,
      r.SprintResults[0],
    ])
  );

// ---- Constructors ----------------------------------------------------------

export const getConstructor = async (constructorId) =>
  (await get(`/constructors/${constructorId}.json`)).ConstructorTable.Constructors[0] ?? null;

export const getConstructorSeasons = async (constructorId) =>
  (await get(`/constructors/${constructorId}/seasons.json`, { limit: PAGE_LIMIT })).SeasonTable.Seasons.map(
    (s) => s.season
  );

// All-time totals via cheap `?limit=1` calls (seasons come from getConstructorSeasons).
export const getConstructorCareer = async (constructorId) => {
  const base = `/constructors/${constructorId}`;
  const [races, wins, poles, drivers] = await Promise.all([
    count(`${base}/races.json`),
    count(`${base}/results/1.json`),
    count(`${base}/grid/1/results.json`),
    count(`${base}/drivers.json`),
  ]);
  return { races, wins, poles, drivers };
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Long sequential runs eventually hit Jolpica's rate limit; back off and retry that one request
// instead of failing (and later restarting) the whole run.
const getWithRetry = async (path, tries = 4) => {
  for (let attempt = 0; ; attempt++) {
    try {
      return await get(path);
    } catch (err) {
      if (attempt >= tries - 1) throw err;
      await sleep(4000 * 2 ** attempt);
    }
  }
};

// Finished seasons never change, so their rows are kept in localStorage: a team's history costs
// its requests once per browser, not once per visit. Storage failures just mean refetching.
// Read per call so a tab left open across New Year treats the finished season as final.
const isFinalSeason = (season) => Number(season) < new Date().getFullYear();
const seasonKey = (constructorId, season) => `f1:constructorSeason:${constructorId}:${season}`;
const readSeason = (constructorId, season) => {
  if (!isFinalSeason(season)) return undefined;
  try {
    const raw = localStorage.getItem(seasonKey(constructorId, season));
    return raw == null ? undefined : JSON.parse(raw); // null = team didn't score that season
  } catch {
    return undefined;
  }
};
const writeSeason = (constructorId, season, row) => {
  if (!isFinalSeason(season)) return;
  try {
    localStorage.setItem(seasonKey(constructorId, season), JSON.stringify(row));
  } catch {
    // Quota or private mode: fine, it will be refetched next time.
  }
};

// True when every given season is already stored, i.e. loading them costs no requests.
export const areSeasonsCached = (constructorId, seasons) =>
  seasons.every((season) => readSeason(constructorId, season) !== undefined);

// One standings row per season (no cross-season endpoint exists). Requests go through the
// global throttle; `onProgress` receives each finished season so callers can render progressively.
// `known` ({ [season]: row }) skips seasons already fetched, so a retry resumes where it stopped.
// Seasons before 1958 (no constructors' championship) return nothing and are skipped.
export const getConstructorSeasonPoints = async (constructorId, seasons, onProgress, known = {}) => {
  const rows = [];
  for (const season of seasons) {
    const cached = known[season] ?? readSeason(constructorId, season);
    if (cached !== undefined) {
      if (cached) {
        rows.push(cached);
        if (!known[season]) onProgress?.(cached);
      }
      continue;
    }
    const data = await getWithRetry(`/${season}/constructors/${constructorId}/constructorStandings.json`);
    const s = data.StandingsTable.StandingsLists[0]?.ConstructorStandings[0];
    const row = s
      ? {
          season,
          points: Number(s.points),
          wins: Number(s.wins),
          position: Number(s.position),
          // A current-year P1 is a lead, not a title (yet).
          inProgress: !isFinalSeason(season),
        }
      : null;
    writeSeason(constructorId, season, row);
    if (row) {
      rows.push(row);
      onProgress?.(row);
    }
  }
  return rows;
};

// ---- Wikipedia -------------------------------------------------------------

const wikiSummary = async (lang, title) =>
  (await axios.get(`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`)).data;

// The article's title in another language via langlinks (follows redirects), or null if there is none.
const wikiLanglink = async (fromLang, title, toLang) => {
  const res = await axios.get(`https://${fromLang}.wikipedia.org/w/api.php`, {
    params: { action: "query", prop: "langlinks", lllang: toLang, titles: title, redirects: 1, format: "json", origin: "*" },
  });
  const page = Object.values(res.data?.query?.pages ?? {})[0];
  return page?.langlinks?.[0]?.["*"] ?? null;
};

// Intro text + thumbnail from the Wikipedia URL Jolpica returns for drivers/constructors.
// With `lang` other than the URL's (e.g. "el"), the matching article is used when one exists,
// else the original. The result's `lang` says which one was shown.
export const getWikiSummary = async (wikiUrl, lang = "en") => {
  const match = wikiUrl?.match(/^https?:\/\/(\w+)\.wikipedia\.org\/wiki\/(.+)$/);
  if (!match) return null;
  const [, srcLang, rawTitle] = match;
  let title = rawTitle;
  try {
    title = decodeURIComponent(rawTitle);
  } catch {
    // Malformed escape (e.g. a literal "%"): use the raw title as the old code did.
  }
  title = title.replace(/_/g, " ");
  if (lang !== srcLang) {
    try {
      const translated = await wikiLanglink(srcLang, title, lang);
      if (translated) return { ...(await wikiSummary(lang, translated)), lang, requested: lang };
    } catch {
      // Lookup failed: fall back to the source-language article below.
    }
  }
  // `requested` lets the UI tell a real fallback from the previous language's placeholder data.
  return { ...(await wikiSummary(srcLang, title)), lang: srcLang, requested: lang };
};
