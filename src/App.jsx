import { useCallback, useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { motion } from "motion/react";
import Sidebar, { MobileNav } from "./components/Sidebar";
import Navbar from "./components/Navbar";
import { ErrorState } from "./components/ui";
import { useT } from "./i18n/LanguageContext";
import Overview from "./pages/Overview";
import Drivers from "./pages/Drivers";
import Constructors from "./pages/Constructors";
import Races from "./pages/Races";
import ConstructorDetail from "./pages/ConstructorDetail";
import DriverDetail from "./pages/DriverDetail";
import RaceDetail from "./pages/RaceDetail";

function App() {
  const t = useT();
  const [navOpen, setNavOpen] = useState(false);
  const openNav = useCallback(() => setNavOpen(true), []);
  const closeNav = useCallback(() => setNavOpen(false), []);
  const { pathname } = useLocation();
  // List pages use extra room on wide screens; detail pages keep the 1280px reading column.
  const isListPage = /^\/(overview|drivers|constructors|races)\/?$/.test(pathname);

  return (
    <div className="flex min-h-dvh">
      <Sidebar />
      <MobileNav open={navOpen} onClose={closeNav} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar onOpenNav={openNav} />
        <main className="bg-grid flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {/* Enter-only fade on route change (no exit, so navigation never waits). Season changes keep the page. */}
          <motion.div
            key={pathname}
            className={`mx-auto w-full max-w-7xl ${isListPage ? "wide:max-w-[100rem]" : ""}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            <Routes>
              <Route path="/" element={<Navigate to="/overview" replace />} />
              <Route path="/overview" element={<Overview />} />
              <Route path="/drivers" element={<Drivers />} />
              <Route path="/drivers/:driverId" element={<DriverDetail />} />
              <Route path="/constructors" element={<Constructors />} />
              <Route path="/constructors/:constructorId" element={<ConstructorDetail />} />
              <Route path="/races" element={<Races />} />
              <Route path="/races/:season/:round" element={<RaceDetail />} />
              <Route
                path="*"
                element={<ErrorState title={t("common.error.notFoundTitle")} titleAs="h1" message={t("common.error.notFoundMessage")} />}
              />
            </Routes>
          </motion.div>
        </main>
      </div>
    </div>
  );
}

export default App;
