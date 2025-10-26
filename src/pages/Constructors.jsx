import React, { useEffect, useState } from "react";
import { getConstructorStandings } from "../api/jolpica";
import { useNavigate } from "react-router-dom";
import { RiTeamFill } from "react-icons/ri";
import { GiTrophyCup } from "react-icons/gi";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";

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
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!team) return;

    // fetch full history of constructor standings
    const fetchHistory = async () => {
      try {
        // Step 1 — get list of seasons this team raced
        const resSeasons = await fetch(
          `https://api.jolpi.ca/ergast/f1/constructors/${team.constructorId}/seasons.json?limit=1000`
        );
        const dataSeasons = await resSeasons.json();
        const seasons = dataSeasons?.MRData?.SeasonTable?.Seasons || [];

        let totalPoints = 0;
        let totalWins = 0;
        // for chart
        const yearlyPoints = [];
        
        // helper before your loop, add delay since there are too many requests
        const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

        // Step 2 — loop through seasons to sum stats
        for (const s of seasons) {
          const year = s.season;

          // 300 ms pause between each API call (adjust if needed)
          await delay(500);

          const res = await fetch(
            `https://api.jolpi.ca/ergast/f1/${year}/constructors/${team.constructorId}/constructorStandings.json`
          );
          const data = await res.json();
          const standing =
            data?.MRData?.StandingsTable?.StandingsLists?.[0]?.ConstructorStandings?.[0];
          if (standing) {
            const pts = parseFloat(standing.points || 0); // for chart
            totalPoints += pts;
            totalWins += parseInt(standing.wins || 0);
            yearlyPoints.push({ season: year, points: pts }); // for chart
          }
        }

        const firstSeason = seasons[0]?.season || null;
        const lastSeason = seasons[seasons.length - 1]?.season || null;

        setHistory({
          totalPoints,
          totalWins,
          seasons: seasons.length,
          firstSeason,
          lastSeason,
          yearlyPoints, // for chart
        });
      } catch (err) {
        console.error("Error fetching constructor history:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [team]);

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

        {/* Lifetime Stats */}
        <div className="mt-8">
          <h3 className="text-2xl font-bold mb-3">Team Lifetime Stats</h3>
          {loading && <p className="text-gray-400">Loading stats...</p>}
          {history && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <p>
                  <span className="font-semibold">Total Seasons:</span> {history.seasons}
                </p>
                <p>
                  <span className="font-semibold">Total Wins:</span> {history.totalWins}
                </p>
                <p>
                  <span className="font-semibold">Total Points:</span> {history.totalPoints.toFixed(1)}
                </p>
                <p>
                  <span className="font-semibold">Active Years:</span>{" "}
                  {history.firstSeason} → {history.lastSeason}
                </p>
              </div>

              {/* Chart Section */}
              {history.yearlyPoints?.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-xl font-semibold mb-3 text-center">
                    Performance Trend (Points per Season)
                  </h3>
                  <div className="bg-[#0f0f0f] p-4 rounded-xl">
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={history.yearlyPoints}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="season" tick={{ fontSize: 10 }} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="points" fill="#2563eb" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </>
          )}
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
              className="cursor-pointer p-4 rounded-xl border border-gray-400 transition-all duration-300 transform hover:scale-[1.05]"
              style={{ backgroundColor: bgColor, color: textColor, boxShadow: `0 0 10px 0 ${bgColor}40`, }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = `0 0 25px 4px ${bgColor}60`; // brighter on hover
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = `0 0 10px 0 ${bgColor}40`; // revert glow
              }}
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
                  className="mt-3 bg-gray-900 text-white px-3 py-1 rounded-md text-sm hover:bg-gray-600 cursor-pointer"
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