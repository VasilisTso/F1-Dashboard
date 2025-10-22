import React, { useEffect, useState } from "react";
import { getConstructorStandings } from "../api/jolpica";
import { useNavigate } from "react-router-dom";
import { RiTeamFill } from "react-icons/ri";
import { GiTrophyCup } from "react-icons/gi";

const teamColors = {
  "Red Bull": "#223971",
  "Ferrari": "#EF1A2D",
  "McLaren": "#FF8000",
  "Mercedes": "#00A19B",
  "Aston Martin": "#037A68",
  "Williams": "#1868DB",
  "RB F1 Team": "#FFFFFF",
  "Sauber": "#01C00E",
  "Haas F1 Team": "#9C9FA2",
  "Alpine F1 Team": "#02192B",
};

const teamColorsText = {
  "Red Bull": "#FFFFFF", //red #df2739
  "Ferrari": "#FFF200",
  "McLaren": "#000000",
  "Mercedes": "#000000",
  "Aston Martin": "#FFFFFF",
  "RB F1 Team": "#005CAA",
  "Williams": "#000000",
  "Sauber": "#000000",
  "Haas F1 Team": "#E6002B",
  "Alpine F1 Team": "#2173B8",
};

const ConstructorModal = ({ team, onClose }) => {
  if (!team) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-[#1a1a1a] text-white p-6 rounded-2xl w-11/12 md:w-1/2 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-red-600 hover:text-white text-2xl cursor-pointer"
        >
          ✕
        </button>

        <h2 className="text-3xl font-bold mb-2">{team.name}</h2>
        <p className="text-gray-400 mb-4">Constructor ID: {team.constructorId}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <p>
            <span className="font-semibold">Nationality:</span> {team.nationality}
          </p>
          <p>
            <span className="font-semibold">Wins:</span> {team.wins}
          </p>
          <p>
            <span className="font-semibold">Position:</span> {team.position}
          </p>
          <p>
            <span className="font-semibold">Seasons Participated:</span>{" "}
            {team.seasons || "—"}
          </p>
        </div>

        <div className="mt-10">
          <a
            href={team.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#E10600] hover:underline"
          >
            View Team Profile →
          </a>
        </div>
      </div>
    </div>
  );
};

function Constructors() {
  const [constructors, setConstructors] = useState([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
  const fetchConstructors = async () => {
    try {
      const res = await getConstructorStandings();
      const list =
        res?.MRData?.StandingsTable?.StandingsLists?.[0]?.ConstructorStandings || [];

      // Fetch season history for each team (optional extra)
      const teamsWithHistory = await Promise.all(
        list.map(async (item) => {
          const constructor = item.Constructor;
          let seasons = null;
          try {
            const seasonRes = await fetch(
              `https://api.jolpi.ca/ergast/f1/constructors/${constructor.constructorId}/seasons.json`
            );
            const data = await seasonRes.json();
            seasons =
              data?.MRData?.SeasonTable?.Seasons?.length ||
              data?.MRData?.SeasonTable?.total ||
              0;
          } catch {
            seasons = null;
          }

          return {
            constructorId: constructor.constructorId,
            name: constructor.name,
            nationality: constructor.nationality,
            url: constructor.url,
            points: item.points,
            wins: item.wins,
            position: item.position,
            seasons,
          };
        })
      );

      setConstructors(teamsWithHistory);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  fetchConstructors();
}, []);

  const ranked = [...constructors].sort(
    (a, b) => parseFloat(b.points) - parseFloat(a.points)
  );

  const filtered = constructors.filter(c =>
  c.name.toLowerCase().includes(search.toLowerCase())
);

  if (loading) return <div className="p-8 text-gray-300">Loading constructors...</div>;

  return (
    <div className="p-6">
      {/* LEADERBOARD SECTION */}
      <div className="bg-[#121212] rounded-2xl p-4 mb-8 border border-gray-700">
        <h2 className="text-xl font-semibold text-white mb-4">
          Constructors Championship 2025
        </h2>
        <div className="space-y-2">
          {ranked.map((team) => {
            const bgColor = teamColors[team.name] || "#1A1A1A";
            const textColor = teamColorsText[team.name] || "#1A1A1A";

            return (
              <div
                key={team.constructorId}
                className="flex justify-between items-center rounded-lg px-4 py-2"
                style={{ backgroundColor: bgColor, color: textColor }}
              >
                <span className="text-xl font-bold pr-2">{team.position}. {team.name}</span>
                <span className="text-md font-semibold flex flex-col items-center"><span className="text-black"><GiTrophyCup /></span> {team.points} pts </span>
              </div>
            );
          })}
        </div>
      </div>

      <h1 className="flex items-center gap-2 text-white text-3xl font-bold mb-8">
        <RiTeamFill /> Constructors
      </h1>

      {/* SEARCH INPUT */}
      <input
        type="text"
        placeholder="Search team"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full md:w-1/2 p-2 rounded-lg [#121212] border border-gray-700 text-white mb-10 focus:outline-none focus:ring-1 focus:ring-[#E10600]"
      />

      {/* GRID OF TEAM CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-6">
        {filtered.map((t) => {
          const bgColor = teamColors[t.name] || "#1A1A1A";
          const textColor = teamColorsText[t.name] || "#FFFFFF";

          return (
            <div
              key={t.constructorId}
              onClick={() => setSelected(t)}
              className="cursor-pointer p-4 rounded-xl border border-gray-400 transition-colors"
              style={{ backgroundColor: bgColor, color: textColor }}
            >
              <div className="flex flex-col items-start justify-between px-4 py-2">
                <div className="text-xl font-bold mb-4">{t.name}</div>
                <div className="text-sm font-semibold mt-2">Nationality: {t.nationality}</div>
                <div className="text-sm font-semibold mt-2">Wins: {t.wins}</div>
                <div className="text-sm font-semibold mt-2">Position: {t.position}</div>

                {/* Link to drivers page */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/drivers?team=${encodeURIComponent(t.name)}`);
                  }}
                  className="mt-3 bg-gray-900 text-white px-3 py-1 rounded-md text-sm hover:bg-red-700"
                >
                  View Drivers →
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {selected && <ConstructorModal team={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

export default Constructors