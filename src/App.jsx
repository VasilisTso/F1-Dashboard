import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import Overview from "./pages/Overview";
import Drivers from "./pages/Drivers";
import Constructors from "./pages/Constructors";
import Races from "./pages/Races";

function App() {

  return (
    <>
      <div className="min-h-screen flex">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Navbar />
          <main className="p-6 bg-[#0b0b0b] min-h-[calc(100vh-64px)]">
            <Routes>
              <Route path="/" element={<Navigate to="/overview" replace />} />
              <Route path="/overview" element={<Overview />} />
              <Route path="/drivers" element={<Drivers />} />
              <Route path="/constructors" element={<Constructors />} />
              <Route path="/races" element={<Races />} />
              <Route path="*" element={<div className="text-white">Page not found</div>} />
            </Routes>
          </main>
        </div>
      </div>
    </>
  )
}

export default App
