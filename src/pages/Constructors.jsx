import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useConstructorHistory, useConstructorStandings } from "../hooks/queries";
import { useSeason } from "../context/SeasonContext";
import { getTeamColor } from "../lib/teams";
import { RiTeamFill } from "react-icons/ri";
import { GiTrophyCup } from "react-icons/gi";
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";

const ConstructorModal = ({ team, onClose }) => {
  const { data: yearlyPoints, isPending: loading, error } = useConstructorHistory(team?.constructorId);

  const history = yearlyPoints && {
    totalPoints: yearlyPoints.reduce((sum, y) => sum + y.points, 0),
    totalWins: yearlyPoints.reduce((sum, y) => sum + y.wins, 0),
    seasons: yearlyPoints.length,
    firstSeason: yearlyPoints[0]?.season ?? null,
    lastSeason: yearlyPoints.at(-1)?.season ?? null,
    yearlyPoints,
  };

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
        </div>

        {/* Lifetime Stats */}
        <div className="mt-8">
          <h3 className="text-2xl font-bold mb-3">Team Lifetime Stats</h3>
          {loading && <p className="text-gray-400">Loading stats...</p>}
          {error && <p className="text-red-400">Couldn't load history: {error.message}</p>}
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
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const navigate = useNavigate();
  const { withSeason } = useSeason();
  const { data, isPending, error } = useConstructorStandings();

  if (isPending) return <div className="p-8 text-gray-300">Loading constructors...</div>;
  if (error) return <div className="p-8 text-red-400">Error: {String(error.message || error)}</div>;

  const constructors = data.standings.map((item) => ({
    ...item.Constructor,
    points: item.points,
    wins: item.wins,
    position: item.position,
  }));

  const ranked = [...constructors].sort(
    (a, b) => parseFloat(b.points) - parseFloat(a.points)
  );

  const filtered = constructors.filter(c =>
  c.name.toLowerCase().includes(search.toLowerCase())
);

  return (
    <div className="p-6">
      {/* LEADERBOARD SECTION */}
      <div className="bg-[#121212] rounded-2xl p-4 mb-8 border border-gray-700">
        <h2 className="text-xl font-semibold text-white mb-4">
          Constructors Championship {data.season}
        </h2>
        <div className="space-y-2">
          {ranked.map((team) => {
            const teamColor = getTeamColor(team.constructorId);

            return (
              <div
                key={team.constructorId}
                className="bg-[#1A1A1A] flex justify-between items-center border rounded-lg px-4 py-2"
                style={{ borderColor: teamColor }}
              >
                <span className="text-2xl font-bold pr-2" style={{ color: teamColor }}>{team.position}. {team.name}</span>
                <span className="text-md font-semibold flex flex-col items-center text-yellow-400"><span className=""><GiTrophyCup /></span> {team.points} pts </span>
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
          const teamColor = getTeamColor(t.constructorId);

          return (
            <div
              key={t.constructorId}
              onClick={() => setSelected(t)}
              className="bg-[#1A1A1A] cursor-pointer p-4 rounded-xl border border-gray-400 transition-all duration-300 transform hover:scale-[1.02]"
              style={{ color: teamColor, borderColor: teamColor, boxShadow: `0 0 10px 0 ${teamColor}40`, }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = `0 0 25px 4px ${teamColor}60`; // brighter on hover
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = `0 0 10px 0 ${teamColor}40`; // revert glow
              }}
            >
              <div className="flex flex-col items-start justify-between px-4 py-2">
                <div className="text-2xl font-bold mb-4">{t.name}</div>
                <div className="text-lg font-semibold mt-2">Nationality: {t.nationality}</div>
                <div className="text-lg font-semibold mt-2">Wins: {t.wins}</div>
                <div className="text-lg font-semibold mt-2">Position: {t.position}</div>

                {/* Link to drivers page */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(withSeason("/drivers", { team: t.constructorId }));
                  }}
                  className="mt-3 bg-gray-600 text-white px-3 py-1 rounded-md text-md hover:bg-gray-600 cursor-pointer"
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