import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

export const useConstructorSeasons = (constructorId) =>
  useQuery({
    queryKey: ["constructorSeasons", constructorId],
    queryFn: () => api.getConstructorSeasons(constructorId),
    enabled: !!constructorId,
    staleTime: HOUR,
  });

// Seasons fetched before the user asks for the full history.
export const RECENT_SEASONS = 15;

// Points per season (one throttled request each, no cross-season endpoint). Recent seasons load
// first; older ones once `full` is true (or immediately when they're all cached). Rows stream in via `partial` so the chart fills
// progressively. Mount once per constructor (key by id) so streamed rows never mix teams.
export function useConstructorHistory(constructorId, seasons, { full = false } = {}) {
  const [partial, setPartial] = useState({});
  const addRow = useCallback((row) => setPartial((prev) => ({ ...prev, [row.season]: row })), []);
  // Retries resume from the streamed rows instead of refetching every season.
  const known = useRef(partial);
  useEffect(() => {
    known.current = partial;
  }, [partial]);

  const recent = seasons?.slice(-RECENT_SEASONS) ?? [];
  const older = useMemo(() => seasons?.slice(0, -RECENT_SEASONS) ?? [], [seasons]);
  // Older seasons already in storage are free, so show them without asking.
  const olderCached = useMemo(
    () => older.length > 0 && api.areSeasonsCached(constructorId, older),
    [constructorId, older]
  );
  const loadOlder = full || olderCached;

  const recentQ = useQuery({
    queryKey: ["constructorHistory", constructorId, "recent"],
    queryFn: () => api.getConstructorSeasonPoints(constructorId, recent, addRow, known.current),
    enabled: !!constructorId && recent.length > 0,
    retry: false, // per-request retries happen inside
    staleTime: HOUR,
  });
  const olderQ = useQuery({
    queryKey: ["constructorHistory", constructorId, "older"],
    queryFn: () => api.getConstructorSeasonPoints(constructorId, older, addRow, known.current),
    enabled: !!constructorId && loadOlder && older.length > 0,
    retry: false,
    ...HISTORY,
  });

  const bySeason = { ...partial };
  for (const row of [...(recentQ.data ?? []), ...(olderQ.data ?? [])]) bySeason[row.season] = row;
  const rows = Object.values(bySeason).sort((a, b) => a.season - b.season);

  return {
    rows,
    olderCount: older.length,
    hasFull: older.length === 0 || olderQ.isSuccess,
    loadingOlder: loadOlder,
    isLoading: recentQ.isFetching || olderQ.isFetching,
    error: recentQ.error ?? olderQ.error,
    retry: () => (recentQ.error ? recentQ.refetch() : olderQ.refetch()),
  };
}

export const useWikiSummary = (wikiUrl) =>
  useQuery({
    queryKey: ["wiki", wikiUrl],
    queryFn: () => api.getWikiSummary(wikiUrl),
    enabled: !!wikiUrl,
    ...HISTORY,
  });
