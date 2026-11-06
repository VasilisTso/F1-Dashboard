import { useEffect, useRef } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import { SiF1 } from "react-icons/si";
import { LuX } from "react-icons/lu";
import { useSeason } from "../context/SeasonContext";
import { NAV_ITEMS } from "../lib/nav";

function Wordmark() {
  const { withSeason } = useSeason();
  return (
    <Link
      to={withSeason("/overview")}
      className="flex items-center gap-1 text-ink rounded-sm"
      aria-label="F1 Dashboard home"
    >
      <SiF1 className="text-[2.25rem]" aria-hidden />
      <span className="font-display text-2xl uppercase text-accent-ink">Dash</span>
    </Link>
  );
}

function NavList() {
  const { withSeason } = useSeason();
  return (
    <ul className="flex flex-col gap-1">
      {NAV_ITEMS.map(({ to, label, icon }) => {
        const Icon = icon;
        return (
          <li key={to}>
            <NavLink
              to={withSeason(to)}
              className={({ isActive }) =>
                `flex items-center gap-3 h-10 px-3 rounded-panel text-sm font-medium transition-colors duration-150 ${
                  isActive ? "bg-accent text-on-accent" : "text-ink-2 hover:bg-surface-3 hover:text-ink"
                }`
              }
            >
              <Icon className="size-[18px] shrink-0" aria-hidden />
              {label}
            </NavLink>
          </li>
        );
      })}
    </ul>
  );
}

function Footer() {
  return (
    <p className="text-xs text-ink-3 leading-relaxed">
      © {new Date().getFullYear()} Vasilis Tsomakas.
      <br />
      Data: Jolpica F1 API. Not affiliated with Formula 1.
    </p>
  );
}

// Desktop: fixed left rail.
export function Sidebar() {
  return (
    <aside className="hidden lg:flex sticky top-0 h-dvh w-56 shrink-0 flex-col gap-8 border-r border-line bg-surface-1 px-4 py-5">
      <Wordmark />
      <nav aria-label="Main">
        <NavList />
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
      aria-label="Navigation"
      className="m-0 h-dvh max-h-none w-72 max-w-[85vw] bg-surface-1 text-ink border-r border-line p-0 backdrop:bg-black/60 open:flex"
    >
      <div className="flex w-full flex-col gap-8 px-4 py-5">
        <div className="flex items-center justify-between">
          <Wordmark />
          <button
            type="button"
            onClick={onClose}
            className="grid size-10 place-items-center rounded-panel text-ink-2 hover:bg-surface-3 hover:text-ink"
            aria-label="Close navigation"
          >
            <LuX className="size-5" aria-hidden />
          </button>
        </div>
        <nav aria-label="Main">
          <NavList />
        </nav>
        <div className="mt-auto">
          <Footer />
        </div>
      </div>
    </dialog>
  );
}

export default Sidebar;
