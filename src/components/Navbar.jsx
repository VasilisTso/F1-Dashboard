import React from "react";

function Navbar() {
  return (
    <header className="h-16 bg-[#070707] border-b border-gray-900 flex items-center px-6">
      <div className="flex-1 text-white font-semibold">F1 Season Dashboard</div>
      <div className="text-sm text-gray-400">Season: <span className="text-red-600 ml-1">Current</span></div>
    </header>
  );
}

export default Navbar

/* for changing season NOT WORKING

<div className="flex items-center gap-3">
  <span className="font-semibold text-gray-300">Season:</span>
  <select
    value={season}
    onChange={(e) => setSeason(e.target.value)}
    className="bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#E10600] cursor-pointer"
  >
    <option value="current">Current</option>
    {[...Array(20)].map((_, i) => {
      const year = 2025 - i;
      return (
        <option key={year} value={year}>
          {year}
        </option>
      );
    })}
  </select>
</div>
*/