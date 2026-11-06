import React, { useState } from "react";
import { GiFullMotorcycleHelmet, GiTrophyCup } from "react-icons/gi";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDrivers, useDriverStandings } from "../hooks/queries";
import { useSeason } from "../context/SeasonContext";
import { getTeamColor } from "../lib/teams";

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


function Drivers() {
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState(null);
    const { withSeason } = useSeason();
    const navigate = useNavigate();

    // ?team=<constructorId> from the Constructors page
    const [searchParams] = useSearchParams();
    const teamFilter = searchParams.get("team") || "";

    const driversQ = useDrivers();
    const standingsQ = useDriverStandings();

    if (driversQ.isPending || standingsQ.isPending) return <div className="p-8 text-gray-300">Loading drivers...</div>;
    const err = driversQ.error || standingsQ.error;
    if (err) return <div className="p-8 text-red-400">Error: {String(err.message || err)}</div>;

    const driverStandings = standingsQ.data.standings;
    const seasonLabel = standingsQ.data.season;

    // driverId -> latest constructor of the season
    const constructorMap = {};
    driverStandings.forEach((s) => {
        const c = s.Constructors?.at(-1);
        if (s.Driver?.driverId && c) constructorMap[s.Driver.driverId] = c;
    });

    // Merge constructor info, sort by team then family name so teammates render together
    const drivers = driversQ.data
        .map((d) => {
            const c = constructorMap[d.driverId];
            return { ...d, constructorId: c?.constructorId ?? "", constructorName: c?.name ?? "—" };
        })
        .sort((a, b) => a.constructorName.localeCompare(b.constructorName) || a.familyName.localeCompare(b.familyName));

    const teamFilterName = drivers.find((d) => d.constructorId === teamFilter)?.constructorName || teamFilter;

    // Apply both search filter and team filter
    const filtered = drivers.filter((d) => {
        const matchesSearch = `${d.givenName} ${d.familyName}`
            .toLowerCase()
            .includes(search.toLowerCase());
        const matchesTeam = teamFilter ? d.constructorId === teamFilter : true;
        return matchesSearch && matchesTeam;
    });

    return (
        <div className="p-6">
            {/* DRIVER CHAMPIONSHIP LEADERBOARD */}
            {driverStandings.length > 0 && (
                <div className="bg-[#121212] rounded-2xl p-4 mb-6 border border-gray-700">
                    <h2 className="text-xl font-semibold text-white mb-4">
                        Drivers Championship {seasonLabel}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {driverStandings.map((driver, index) => {
                            const d = driver.Driver;
                            const teamColor = getTeamColor(driver.Constructors?.at(-1)?.constructorId);

                            return (
                                <div
                                    key={d.driverId}
                                    className="bg-[#1A1A1A] flex flex-wrap justify-between items-center border rounded-lg px-4 py-4"
                                    style={{borderColor: teamColor }}
                                >
                                    <span className="text-2xl font-bold"  style={{color: teamColor}}>
                                        {driver.position || index + 1}. {d.givenName} {d.familyName}
                                    </span>
                                    <span className="text-lg text-yellow-400 font-semibold flex items-center gap-2">
                                        <GiTrophyCup /> {driver.points} pts
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}


            {/* Show banner if filtered by team */}
            {teamFilter && (
                <div className="mb-6 text-gray-300">
                    Showing drivers for{" "}
                    <span className="font-bold text-white">{teamFilterName}</span>
                    <button
                        onClick={() => navigate(withSeason("/drivers"))}
                        className="ml-3 text-[#E10600] underline text-sm hover:text-white cursor-pointer"
                    >
                        Clear filter
                    </button>
                </div>
            )}
            
            <h1 className="flex items-center gap-2 text-white text-3xl font-bold mb-6">
                <GiFullMotorcycleHelmet />Drivers
            </h1>

            <input type="text" 
                placeholder="Search driver"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full md:w-1/2 p-2 rounded-lg [#121212] border border-gray-700 text-white mb-10 focus:outline-none focus:ring-1 focus:ring-[#E10600]"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-6">
                {filtered.map(d => {
                    // background based on team color
                    const teamColor = getTeamColor(d.constructorId);

                    return (
                        <div key={d.driverId} onClick={() => setSelected(d)}
                            // bg-[#1A1A1A]
                            className="bg-[#1A1A1A] cursor-pointer p-4 rounded-xl border border-gray-400 transition-all duration-300 transform hover:scale-[1.02]"
                            style={{color: teamColor, borderColor: teamColor, boxShadow: `0 0 10px 0 ${teamColor}40`, }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.boxShadow = `0 0 25px 4px ${teamColor}60`; // brighter on hover
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.boxShadow = `0 0 10px 0 ${teamColor}40`; // revert glow
                            }}
                        >
                            <div className="flex flex-wrap items-center justify-between px-4 py-1">
                                <div className="text-2xl font-bold mb-4 pr-2">
                                    {d.givenName} {d.familyName}
                                </div>
                                <div className="">
                                    <div className="text-xl font-semibold mt-2">{d.constructorName}</div>
                                    <div className="text-xl font-semibold mt-2">{d.nationality}</div>
                                    <div className="text-xl font-semibold mt-2">
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