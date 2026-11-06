import { createContext, useCallback, useContext, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

export const CURRENT_SEASON = "current";

const SeasonContext = createContext(null);

// Season lives in the URL (`?season=2021`) so it survives reloads, can be shared,
// and every query key can include it.
export function SeasonProvider({ children }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const raw = searchParams.get("season");
  const season = raw && /^\d{4}$/.test(raw) ? raw : CURRENT_SEASON;

  const setSeason = useCallback(
    (next) => {
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev);
        if (!next || next === CURRENT_SEASON) params.delete("season");
        else params.set("season", next);
        return params;
      });
    },
    [setSearchParams]
  );

  // Build an in-app link that keeps the selected season (and any extra params).
  const withSeason = useCallback(
    (path, extra = {}) => {
      const params = new URLSearchParams(extra);
      if (season !== CURRENT_SEASON) params.set("season", season);
      const qs = params.toString();
      return qs ? `${path}?${qs}` : path;
    },
    [season]
  );

  const value = useMemo(
    () => ({ season, setSeason, withSeason, isCurrent: season === CURRENT_SEASON }),
    [season, setSeason, withSeason]
  );

  return <SeasonContext.Provider value={value}>{children}</SeasonContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSeason() {
  const ctx = useContext(SeasonContext);
  if (!ctx) throw new Error("useSeason must be used inside <SeasonProvider>");
  return ctx;
}
