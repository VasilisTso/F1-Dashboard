import { LuMenu, LuSun, LuMoon } from "react-icons/lu";
import { SiF1 } from "react-icons/si";
import { SeasonPicker } from "./SeasonPicker";
import { LanguageSwitch } from "./LanguageSwitch";
import { useT } from "../i18n/LanguageContext";
import { useTheme } from "../hooks/useTheme";

const iconButton =
  "grid size-10 shrink-0 place-items-center rounded-panel text-ink-2 hover:bg-surface-3 hover:text-ink transition-colors duration-150";

function Navbar({ onOpenNav }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const t = useT();

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-surface-1/90 px-4 backdrop-blur-md sm:px-6">
      <button type="button" onClick={onOpenNav} className={`${iconButton} lg:hidden -ml-2`} aria-label={t("common.nav.open")}>
        <LuMenu className="size-5" aria-hidden />
      </button>
      <SiF1 className="text-[2rem] text-ink lg:hidden" aria-hidden />
      <div className="flex-1" />
      <SeasonPicker />
      {/* Phones get the switch in the drawer; the top bar is full. */}
      <LanguageSwitch className="hidden sm:flex" />
      <button
        type="button"
        onClick={toggleTheme}
        className={iconButton}
        aria-label={t(isDark ? "common.theme.toLight" : "common.theme.toDark")}
      >
        {isDark ? <LuSun className="size-5" aria-hidden /> : <LuMoon className="size-5" aria-hidden />}
      </button>
    </header>
  );
}

export default Navbar;
