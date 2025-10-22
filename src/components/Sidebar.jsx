import React from "react";
import { NavLink } from "react-router-dom";
import { SiF1 } from "react-icons/si";
import { GiFullMotorcycleHelmet, GiF1Car } from "react-icons/gi";
import { FaFlagCheckered } from "react-icons/fa";
import { RiTeamFill } from "react-icons/ri";


const LinkItem = ({ to, children }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center gap-3 px-4 py-3 rounded-lg text-sm ${isActive ? "bg-[#141414] text-white" : "text-gray-400 hover:bg-[#111111]"}`
    }
  >
    {children}
  </NavLink>
);

function Sidebar() {
  return (
    <aside className="w-64 sm:w-48  bg-[#060606] border-r border-gray-900 min-h-screen p-4 flex flex-col">
      <div className="mb-6">
        <div className="flex items-center text-2xl font-bold text-white"><SiF1 /><span className="text-[#e10600]">Dash</span></div>
        <div className="text-xs text-gray-400 mt-1">Season Dashboard</div>
      </div>

      <nav className="flex flex-col gap-2">
        <LinkItem to="/overview"><span className="text-md"><FaFlagCheckered /></span> Overview</LinkItem>
        <LinkItem to="/drivers"><span className="text-xl"><GiFullMotorcycleHelmet /></span> Drivers</LinkItem>
        <LinkItem to="/constructors"><span className="text-xl"><RiTeamFill /></span> Constructors</LinkItem>
        <LinkItem to="/races"><span className="text-3xl"><GiF1Car /></span> Races</LinkItem>
      </nav>

      <div className="mt-auto text-xs text-gray-600 pt-6">
        <p className="text-sm text-gray-400">
            © Copyright Vasilis Tsomakas {new Date().getFullYear()}. All rights reserved.
        </p>
      </div>
    </aside>
  );
}

export default Sidebar