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

// Every result of a season in a few paginated calls; returns { [round]: Results[] }.
// A race can straddle two pages, so results are merged by round.
export const getSeasonResults = async (season = "current") => {
  const byRound = {};
  let offset = 0;
  let total = Infinity;
  while (offset < total) {
    const data = await get(`/${season}/results.json`, { limit: PAGE_LIMIT, offset });
    total = Number(data.total) || 0;
    for (const race of data.RaceTable.Races) {
      (byRound[race.round] ??= []).push(...race.Results);
    }
    offset += PAGE_LIMIT;
  }
  return byRound;
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
    count(`${base}/qualifying/1.json`),
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

// ---- Constructors ----------------------------------------------------------

export const getConstructor = async (constructorId) =>
  (await get(`/constructors/${constructorId}.json`)).ConstructorTable.Constructors[0] ?? null;

export const getConstructorSeasons = async (constructorId) =>
  (await get(`/constructors/${constructorId}/seasons.json`, { limit: PAGE_LIMIT })).SeasonTable.Seasons.map(
    (s) => s.season
  );

export const getConstructorCareer = async (constructorId) => {
  const base = `/constructors/${constructorId}`;
  const [races, wins, poles, drivers, years] = await Promise.all([
    count(`${base}/races.json`),
    count(`${base}/results/1.json`),
    count(`${base}/qualifying/1.json`),
    count(`${base}/drivers.json`),
    getConstructorSeasons(constructorId),
  ]);
  return {
    races,
    wins,
    poles,
    drivers,
    seasons: years.length,
    firstSeason: years[0] ?? null,
    lastSeason: years.at(-1) ?? null,
  };
};

// One standings row per season (no cross-season endpoint exists). Requests go through the
// global throttle; `onProgress` receives each finished season so callers can render progressively.
export const getConstructorSeasonPoints = async (constructorId, seasons, onProgress) => {
  const rows = [];
  for (const season of seasons) {
    const data = await get(`/${season}/constructors/${constructorId}/constructorStandings.json`);
    const s = data.StandingsTable.StandingsLists[0]?.ConstructorStandings[0];
    if (s) {
      const row = { season, points: Number(s.points), wins: Number(s.wins), position: Number(s.position) };
      rows.push(row);
      onProgress?.(row);
    }
  }
  return rows;
};

// ---- Wikipedia -------------------------------------------------------------

// Intro text + thumbnail from the Wikipedia URL Jolpica returns for drivers/constructors.
export const getWikiSummary = async (wikiUrl) => {
  const match = wikiUrl?.match(/^https?:\/\/(\w+)\.wikipedia\.org\/wiki\/(.+)$/);
  if (!match) return null;
  const [, lang, title] = match;
  const res = await axios.get(`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${title}`);
  return res.data;
};
