import { useCallback, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Sidebar, { MobileNav } from "./components/Sidebar";
import Navbar from "./components/Navbar";
import { ErrorState } from "./components/ui";
import Overview from "./pages/Overview";
import Drivers from "./pages/Drivers";
import Constructors from "./pages/Constructors";
import Races from "./pages/Races";

function App() {
  const [navOpen, setNavOpen] = useState(false);
  const openNav = useCallback(() => setNavOpen(true), []);
  const closeNav = useCallback(() => setNavOpen(false), []);

  return (
    <div className="flex min-h-dvh">
      <Sidebar />
      <MobileNav open={navOpen} onClose={closeNav} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar onOpenNav={openNav} />
        <main className="bg-grid flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-7xl">
            <Routes>
              <Route path="/" element={<Navigate to="/overview" replace />} />
              <Route path="/overview" element={<Overview />} />
              <Route path="/drivers" element={<Drivers />} />
              <Route path="/constructors" element={<Constructors />} />
              <Route path="/races" element={<Races />} />
              <Route
                path="*"
                element={<ErrorState title="Page not found" message="That page doesn't exist. Pick a section from the menu." />}
              />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
