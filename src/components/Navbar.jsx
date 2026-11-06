import { LuMenu, LuSun, LuMoon } from "react-icons/lu";
import { SiF1 } from "react-icons/si";
import { useSeason, CURRENT_SEASON } from "../context/SeasonContext";
import { useSeasons } from "../hooks/queries";
import { useTheme } from "../hooks/useTheme";

const iconButton =
  "grid size-10 shrink-0 place-items-center rounded-panel text-ink-2 hover:bg-surface-3 hover:text-ink transition-colors duration-150";

function SeasonSelect() {
  const { season, setSeason } = useSeason();
  const { data: seasons = [] } = useSeasons();
  // Latest season is covered by "Current"; list the rest newest-first.
  const [latest, ...years] = [...seasons].reverse();

  return (
    <label className="flex items-center gap-2">
      <span className="label-caps hidden sm:inline">Season</span>
      <select
        value={season}
        onChange={(e) => setSeason(e.target.value)}
        aria-label="Season"
        className="h-10 cursor-pointer rounded-panel border border-line-strong bg-surface-2 pl-3 pr-8 text-sm font-medium text-ink hover:border-ink-3"
      >
        <option value={CURRENT_SEASON}>Current{latest ? ` (${latest})` : ""}</option>
        {years.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
    </label>
  );
}

function Navbar({ onOpenNav }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-surface-1/90 px-4 backdrop-blur-md sm:px-6">
      <button type="button" onClick={onOpenNav} className={`${iconButton} lg:hidden -ml-2`} aria-label="Open navigation">
        <LuMenu className="size-5" aria-hidden />
      </button>
      <SiF1 className="text-[2rem] text-ink lg:hidden" aria-hidden />
      <div className="flex-1" />
      <SeasonSelect />
      <button
        type="button"
        onClick={toggleTheme}
        className={iconButton}
        aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      >
        {isDark ? <LuSun className="size-5" aria-hidden /> : <LuMoon className="size-5" aria-hidden />}
      </button>
    </header>
  );
}

export default Navbar;
