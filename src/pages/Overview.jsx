import React, { useEffect, useState } from "react";
import { getDriverStandings, getNextRace, getLastRaceResults } from "../api/jolpica";
import { SiF1 } from "react-icons/si";
import { GiTrophyCup } from "react-icons/gi";

const StatCard = ({ title, children }) => (
  <div className="bg-[#1A1A1A] rounded-2xl p-5 shadow-md border border-[#2C2C2C] hover:border-[#E10600] transition-colors">
    <h3 className="text-sm text-gray-200 mb-2 uppercase tracking-wide">{title}</h3>
    <div className="text-white text-lg font-semibold">{children}</div>
  </div>
);

const DriverCard = ({ driverStanding }) => {
  const d = driverStanding.Driver;
  const constructor = driverStanding.Constructors?.[0];
  return (
    <div className="bg-[#1A1A1A] p-5 rounded-xl border border-[#2C2C2C] hover:border-[#E10600] transition-colors shadow-sm">
      <div className="flex items-center gap-4">
        <div className="text-3xl font-extrabold text-[#E10600]">{driverStanding.position}</div>
        <div>
          <div className="text-lg font-bold text-white leading-tight">
            {d.givenName} {d.familyName}
          </div>
          <div className="text-sm text-gray-400">{constructor?.name || "—"}</div>
          <div className="flex items-center gap-2 text-sm text-gray-300 mt-2"><span className="text-yellow-600"><GiTrophyCup /></span> {driverStanding.points} pts</div>
        </div>
      </div>
    </div>
  );
};

function Overview() {
  const [standings, setStandings] = useState(null);
  const [nextRace, setNextRace] = useState(null);
  const [lastResults, setLastResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    Promise.all([
      getDriverStandings(),
      getNextRace(),
      getLastRaceResults()
    ]).then(([standRes, nextRes, lastRes]) => {
      if (!mounted) return;
      try {
        const driverStandings = (standRes?.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings) || [];
        const nextRaceInfo = (nextRes?.MRData?.RaceTable?.Races?.[0]) || null;
        const lastRaceResults = (lastRes?.MRData?.RaceTable?.Races?.[0]) || null;
        setStandings(driverStandings);
        setNextRace(nextRaceInfo);
        setLastResults(lastRaceResults);
      } catch (e) {
        setErr(e);
      } finally {
        setLoading(false);
      }
    }).catch(e => {
      setErr(e);
      setLoading(false);
    });

    return () => { mounted = false; };
  }, []);

  if (loading) return <div className="p-8 text-gray-300">Loading...</div>;
  if (err) return <div className="p-8 text-red-400">Error: {String(err.message || err)}</div>;

  return (
    <div className="p-6 bg-[#0D0D0D] min-h-screen text-white">
        <header className="flex flex-wrap items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                <span className="text-[#E10600]"><SiF1 /></span> Season Overview
            </h1>

            {/* Next-Last Race */}
            <div className="flex flex-wrap gap-4">
            <StatCard title="Next Race">
                {nextRace ? (
                <div>
                    <div className="font-bold text-white">{nextRace.raceName}</div>
                    <div className="text-sm text-gray-300">
                    {nextRace.Circuit?.Location?.locality}, {nextRace.Circuit?.Location?.country}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                    Date: {nextRace.date} {nextRace.time || ""}
                    </div>
                </div>
                ) : <div>—</div>}
            </StatCard>

            <StatCard title="Last Race">
                {lastResults ? (
                <>
                    <div className="font-bold text-white">{lastResults.raceName}</div>
                    <div className="text-sm text-gray-300">{lastResults.Circuit?.circuitName}</div>
                </>
                ) : <div>—</div>}
            </StatCard>
            </div>
        </header>

        {/* Top Drivers section */}
        <section>
            <h2 className="text-2xl font-semibold mb-4 border-l-4 border-[#E10600] pl-3">Top Drivers</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {standings?.slice(0, 3).map(s => (
                <DriverCard key={s.Driver.driverId} driverStanding={s} />
            ))}
            </div>
        </section>

		{/* Last Race Podium section */}
        <section className="mt-10">
            <h2 className="text-2xl font-semibold mb-4 border-l-4 border-[#E10600] pl-3">Last Race Podium</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {lastResults?.Results?.slice(0,3).map((r) => (
                    <div key={r.position} className="bg-[#1A1A1A] p-5 rounded-xl border border-[#2C2C2C] hover:border-[#E10600] transition-colors">
                        <div className="text-xl font-bold text-white mb-1">
                            #{r.position} — {r.Driver.givenName} {r.Driver.familyName}
                        </div>
                        <div className="text-sm text-gray-300">{r.Constructor.name}</div>
                        <div className="text-sm text-gray-400 mt-2">
                            {r.Time?.time ? `⏱ ${r.Time.time}` : r.status}
                        </div>
                    </div>
                )) || <div className="text-gray-400">No results yet</div>}
            </div>
        </section>
    </div>
  );
}

export default Overview;