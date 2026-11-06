import { useQuery } from "@tanstack/react-query";
import * as api from "../api/jolpica";
import { useSeason } from "../context/SeasonContext";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

// Live season data changes after each session; history never does.
const LIVE = { staleTime: 5 * 60 * 1000 };
const HISTORY = { staleTime: DAY, gcTime: DAY };
const staleFor = (season) => (season === "current" ? LIVE : HISTORY);

export const useSeasons = () =>
  useQuery({ queryKey: ["seasons"], queryFn: api.getSeasons, ...HISTORY });

export const useDriverStandings = () => {
  const { season } = useSeason();
  return useQuery({
    queryKey: ["driverStandings", season],
    queryFn: () => api.getDriverStandings(season),
    ...staleFor(season),
  });
};

export const useConstructorStandings = () => {
  const { season } = useSeason();
  return useQuery({
    queryKey: ["constructorStandings", season],
    queryFn: () => api.getConstructorStandings(season),
    ...staleFor(season),
  });
};

export const useSchedule = () => {
  const { season } = useSeason();
  return useQuery({
    queryKey: ["schedule", season],
    queryFn: () => api.getSchedule(season),
    ...staleFor(season),
  });
};

export const useSeasonResults = () => {
  const { season } = useSeason();
  return useQuery({
    queryKey: ["seasonResults", season],
    queryFn: () => api.getSeasonResults(season),
    ...staleFor(season),
  });
};

// "Next race" only exists for the running season.
export const useNextRace = () => {
  const { isCurrent } = useSeason();
  return useQuery({
    queryKey: ["nextRace"],
    queryFn: api.getNextRace,
    enabled: isCurrent,
    ...LIVE,
  });
};

export const useLastRaceResults = () => {
  const { season } = useSeason();
  return useQuery({
    queryKey: ["lastRaceResults", season],
    queryFn: () => api.getLastRaceResults(season),
    ...staleFor(season),
  });
};

export const useDrivers = () => {
  const { season } = useSeason();
  return useQuery({
    queryKey: ["drivers", season],
    queryFn: () => api.getDrivers(season),
    ...staleFor(season),
  });
};

export const useDriver = (driverId) =>
  useQuery({
    queryKey: ["driver", driverId],
    queryFn: () => api.getDriver(driverId),
    enabled: !!driverId,
    ...HISTORY,
  });

export const useDriverCareer = (driverId) =>
  useQuery({
    queryKey: ["driverCareer", driverId],
    queryFn: () => api.getDriverCareer(driverId),
    enabled: !!driverId,
    staleTime: HOUR,
  });

export const useConstructor = (constructorId) =>
  useQuery({
    queryKey: ["constructor", constructorId],
    queryFn: () => api.getConstructor(constructorId),
    enabled: !!constructorId,
    ...HISTORY,
  });

export const useConstructorCareer = (constructorId) =>
  useQuery({
    queryKey: ["constructorCareer", constructorId],
    queryFn: () => api.getConstructorCareer(constructorId),
    enabled: !!constructorId,
    staleTime: HOUR,
  });

// Full points-per-season history (one throttled request per season).
export const useConstructorHistory = (constructorId) =>
  useQuery({
    queryKey: ["constructorHistory", constructorId],
    queryFn: async () => {
      const seasons = await api.getConstructorSeasons(constructorId);
      return api.getConstructorSeasonPoints(constructorId, seasons);
    },
    enabled: !!constructorId,
    staleTime: HOUR,
  });

export const useWikiSummary = (wikiUrl) =>
  useQuery({
    queryKey: ["wiki", wikiUrl],
    queryFn: () => api.getWikiSummary(wikiUrl),
    enabled: !!wikiUrl,
    ...HISTORY,
  });
