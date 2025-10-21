import React from "react";

function Navbar() {
  return (
    <header className="h-16 bg-[#070707] border-b border-gray-900 flex items-center px-6">
      <div className="flex-1 text-white font-semibold">F1 Season Dashboard</div>
      <div className="text-sm text-gray-400">Season: <span className="text-white ml-1">Current</span></div>
    </header>
  );
}

export default Navbar