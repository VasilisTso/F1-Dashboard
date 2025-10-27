import React, { useState, useEffect, useRef } from "react";

function Races() {
  const [calendar, setCalendar] = useState([]);
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(true);
  const raceRefs = useRef({});

  useEffect(() => {
    const fetchRaces = async () => {
      try {
        const res = await fetch("https://api.jolpi.ca/ergast/f1/current.json");
        const data = await res.json();
        const races = data?.MRData?.RaceTable?.Races || [];
        setCalendar(races);

        // Fetch results for each round sequentially
        const resultsData = {};
        const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

        for (const race of races) {
          await delay(300); // avoid API throttling
          const resRound = await fetch(
            `https://api.jolpi.ca/ergast/f1/${race.season}/${race.round}/results.json`
          );
          const roundData = await resRound.json();
          resultsData[race.round] = roundData?.MRData?.RaceTable?.Races[0]?.Results || [];
        }
        setResults(resultsData);
      } catch (err) {
        console.error("Error fetching races:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRaces();
  }, []);

  const scrollToRace = (round) => {
    const element = raceRefs.current[round];
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (loading) return <div className="p-8 text-gray-300">Loading races...</div>;

  return (
    <div className="p-4">
      {/* ===== Mini Calendar / Race Buttons (Wrapped, No Scroll) ===== */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-3 justify-center">
          {calendar.map((race) => (
            <button
              key={race.round}
              onClick={() => scrollToRace(race.round)}
              className="px-4 py-2 bg-[#1a1a1a] text-white rounded-3xl border border-gray-700 hover:bg-[#E10600] hover:text-white transition-colors duration-300 flex flex-col items-center text-center cursor-pointer"
            >
              <span className="text-sm font-semibold whitespace-nowrap">
                Round {race.round}: {race.raceName}
              </span>
              <span className="text-xs text-gray-400">
                {race.Circuit.Location.locality}, {race.Circuit.Location.country}
              </span>
              <span className="text-xs text-gray-500">{race.date}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {calendar.map((race) => (
          <div
            key={race.round}
            className="bg-[#1a1a1a] text-white p-5 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300"
          >
            {/* Race Header */}
            <div className="mb-3">
              <h3 className="text-xl font-bold mb-1">{race.raceName}</h3>
              <p className="text-gray-400 text-sm">
                {race.date} | {race.Circuit.circuitName}
              </p>
              <p className="text-gray-400 text-sm">
                {race.Circuit.Location.locality}, {race.Circuit.Location.country}
              </p>
            </div>

            {/* Race Results */}
            {results[race.round]?.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold mb-2 text-blue-400">Race Results</h4>
                <ul className="space-y-1 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800">
                  {results[race.round].map((r) => (
                    <li
                      key={r.position}
                      className="flex justify-between items-center text-sm bg-[#222] p-2 rounded-md hover:bg-[#333] transition-colors"
                    >
                      <span>
                        {r.position}. {r.Driver.givenName} {r.Driver.familyName} (
                        {r.Constructor.name})
                      </span>
                      <span className="font-semibold text-yellow-300">{r.points} pts</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Races