import React from "react";
import { useSeason, CURRENT_SEASON } from "../context/SeasonContext";
import { useSeasons } from "../hooks/queries";

function Navbar() {
  const { season, setSeason } = useSeason();
  const { data: seasons = [] } = useSeasons();
  // Latest season is covered by "Current"; list the rest newest-first.
  const [latest, ...years] = [...seasons].reverse();

  return (
    <header className="h-16 bg-[#070707] border-b border-gray-900 flex items-center px-6">
      <div className="flex-1 text-white font-semibold">F1 Season Dashboard</div>
      <label className="flex items-center gap-3 text-sm text-gray-400">
        Season
        <select
          value={season}
          onChange={(e) => setSeason(e.target.value)}
          className="bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:ring-2 focus:ring-[#E10600] cursor-pointer"
        >
          <option value={CURRENT_SEASON}>Current{latest ? ` (${latest})` : ""}</option>
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </label>
    </header>
  );
}

export default Navbar;
