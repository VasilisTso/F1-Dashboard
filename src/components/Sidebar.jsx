import { useEffect, useRef } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import { SiF1 } from "react-icons/si";
import { LuX } from "react-icons/lu";
import { motion } from "motion/react";
import { useSeason } from "../context/SeasonContext";
import { NAV_ITEMS } from "../lib/nav";
import { useT } from "../i18n/LanguageContext";
import { LanguageSwitch } from "./LanguageSwitch";

function Wordmark() {
  const { withSeason } = useSeason();
  const t = useT();
  return (
    <Link
      to={withSeason("/overview")}
      className="flex items-center gap-1 text-ink rounded-sm"
      aria-label={t("common.home")}
    >
      <SiF1 className="text-[2.25rem]" aria-hidden />
      <span className="font-display text-2xl uppercase text-accent-ink">Dash</span>
    </Link>
  );
}

// `id` keeps the rail and drawer indicators separate (each list has its own sliding block).
function NavList({ id }) {
  const { withSeason } = useSeason();
  const t = useT();
  return (
    <ul className="flex flex-col gap-1">
      {NAV_ITEMS.map(({ to, labelKey, icon }) => {
        const Icon = icon;
        return (
          <li key={to}>
            <NavLink
              to={withSeason(to)}
              className={({ isActive }) =>
                `relative flex items-center gap-3 h-10 px-3 rounded-panel text-sm font-medium transition-colors duration-150 ${
                  // Delay the white text until the sliding red block has mostly arrived.
                  isActive ? "text-on-accent delay-150" : "text-ink-2 hover:bg-surface-3 hover:text-ink"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {/* The red block slides to the new section instead of jumping. */}
                  {isActive && (
                    <motion.span
                      layoutId={`nav-active-${id}`}
                      className="absolute inset-0 rounded-panel bg-accent"
                      transition={{ type: "spring", bounce: 0, duration: 0.25 }}
                      aria-hidden
                    />
                  )}
                  <Icon className="relative size-[18px] shrink-0" aria-hidden />
                  <span className="relative">{t(labelKey)}</span>
                </>
              )}
            </NavLink>
          </li>
        );
      })}
    </ul>
  );
}

function Footer() {
  const t = useT();
  return (
    <p className="text-xs text-ink-3 leading-relaxed">
      © {new Date().getFullYear()} Vasilis Tsomakas.
      <br />
      {t("common.footer.data")}
    </p>
  );
}

// Desktop: fixed left rail.
export function Sidebar() {
  const t = useT();
  return (
    <aside className="hidden lg:flex sticky top-0 h-dvh w-56 shrink-0 flex-col gap-8 border-r border-line bg-surface-1 px-4 py-5">
      <Wordmark />
      <nav aria-label={t("common.nav.main")}>
        <NavList id="rail" />
      </nav>
      <div className="mt-auto">
        <Footer />
      </div>
    </aside>
  );
}

// Mobile: same nav in a modal <dialog> drawer (native focus trap + Esc).
export function MobileNav({ open, onClose }) {
  const ref = useRef(null);
  const { pathname } = useLocation();
  const t = useT();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // Close after navigating.
  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-label={t("common.nav.drawer")}
      className="drawer m-0 h-dvh max-h-none w-72 max-w-[85vw] bg-surface-1 text-ink border-r border-line p-0 open:flex"
    >
      <div className="flex w-full flex-col gap-8 px-4 py-5">
        <div className="flex items-center justify-between">
          <Wordmark />
          <button
            type="button"
            onClick={onClose}
            className="grid size-10 place-items-center rounded-panel text-ink-2 hover:bg-surface-3 hover:text-ink"
            aria-label={t("common.nav.close")}
          >
            <LuX className="size-5" aria-hidden />
          </button>
        </div>
        <nav aria-label={t("common.nav.main")}>
          <NavList id="drawer" />
        </nav>
        <div className="mt-auto flex flex-col gap-4">
          <LanguageSwitch />
          <Footer />
        </div>
      </div>
    </dialog>
  );
}

export default Sidebar;
