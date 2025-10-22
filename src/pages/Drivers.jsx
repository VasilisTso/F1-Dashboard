import React, { useEffect, useState } from "react";
import { getDrivers, getDriverStandings } from "../api/jolpica";
import { GiFullMotorcycleHelmet } from "react-icons/gi";

const DriverModal = ({ driver, onClose}) => {
    if (!driver) return null;

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-[#1a1a1a] text-white p-6 rounded-2xl w-11/12 md:w-1/2 relative">
                <button onClick={onClose}
                    className="absolute top-3 right-3 text-red-600 hover:text-white text-2xl cursor-pointer"
                >
                    ✕
                </button>

                <h2 className="text-3xl font-bold mb-2">
                    {driver.givenName} {driver.familyName}
                </h2>
                <p className="text-gray-400 mb-4">Driver ID: {driver.driverId}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <p><span className="font-semibold">Nationality:</span> {driver.nationality}</p>
                    <p><span className="font-semibold">Date of Birth:</span> {driver.dateOfBirth}</p>
                    <p><span className="font-semibold">Permanent Number:</span> {driver.permanentNumber || "—"}</p>
                    <p><span className="font-semibold">Code:</span> {driver.code || "—"}</p>
                </div>

                <div className="mt-10">
                    <a href={driver.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#E10600] hover:underline"
                    >
                        View Biography →
                    </a>
                </div>
            </div>
        </div>
    );
};

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

function Drivers() {
    const [drivers, setDrivers] = useState([]);
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            getDrivers(),
            getDriverStandings()
        ])
            .then(([driversRes, standingsRes]) => {
                const driversList = driversRes?.MRData?.DriverTable?.Drivers || [];
                const standingsList =
                    standingsRes?.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings || [];

                // Map driverId → constructor name
                const constructorMap = {};
                standingsList.forEach(s => {
                    if (s.Driver?.driverId && s.Constructors?.[0]?.name) {
                        constructorMap[s.Driver.driverId] = s.Constructors[0].name;
                    }
                });

                // Merge constructor info into driver list
                const merged = driversList.map(d => ({
                    ...d,
                    constructorName: constructorMap[d.driverId] || "—",
                }));

                // sort by team to render together
                merged.sort((a, b) => {
                    const teamA = a.constructorName || "";
                    const teamB = b.constructorName || "";
                    if (teamA < teamB) return -1;
                    if (teamA > teamB) return 1;
                    // If same team, sort by family name
                    return a.familyName.localeCompare(b.familyName);
                })

                setDrivers(merged);
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [])

    const filtered = drivers.filter(d => 
        `${d.givenName} ${d.familyName}`.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return <div className="p-8 text-gray-300">Loading drivers...</div>;

    return (
        <div className="p-6">
            <h1 className="flex items-center gap-2 text-white text-3xl font-bold mb-6"><GiFullMotorcycleHelmet />Drivers</h1>

            <input type="text" 
                placeholder="Search driver"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full md:w-1/2 p-2 rounded-lg [#121212] border border-gray-700 text-white mb-10 focus:outline-none focus:ring-1 focus:ring-[#E10600]"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-6">
                {filtered.map(d => {
                    // background based on team color
                    const bgColor = teamColors[d.constructorName] || "#1A1A1A";
                    const textColor = teamColorsText[d.constructorName] || "#1A1A1A";

                    return (
                        <div key={d.driverId} onClick={() => setSelected(d)}
                            // bg-[#1A1A1A]
                            className="cursor-pointer p-4 rounded-xl border border-gray-400 transition-colors"
                            style={{ backgroundColor: bgColor, color: textColor }}
                        >
                            <div className="flex flex-wrap items-center justify-between px-4 py-2">
                                <div className="text-xl font-bold mb-4 pr-2">
                                    {d.givenName} {d.familyName}
                                </div>
                                <div className="">
                                    <div className="text-sm font-semibold mt-2">{d.constructorName}</div>
                                    <div className="text-sm font-semibold mt-2">{d.nationality}</div>
                                    <div className="text-sm font-semibold mt-2">
                                        Number: {d.permanentNumber || "—"}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {selected && <DriverModal driver={selected} onClose={() => setSelected(null)} />}
        </div>
    );
}

export default Drivers