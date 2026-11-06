import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { LuChevronDown, LuCheck } from "react-icons/lu";
import { useSeason, CURRENT_SEASON } from "../context/SeasonContext";
import { useSeasons } from "../hooks/queries";
import { useT } from "../i18n/LanguageContext";

const decadeOf = (year) => Math.floor(Number(year) / 10) * 10;
const COLS = 5;

// Two-level season picker: decade tabs, then a 5×2 year grid (each slot is year % 10, so the
// grid never shifts). The latest season is "current" and also reachable from the top row.
// Keyboard: arrows move inside tabs / grid, Enter or Space picks, Esc closes; focus returns to the trigger.
export function SeasonPicker() {
  const { season, setSeason, isCurrent } = useSeason();
  const { data: seasons = [] } = useSeasons();
  const t = useT();
  const latest = seasons.at(-1);
  const selectedYear = isCurrent ? latest : season;

  const [open, setOpen] = useState(false);
  const [decade, setDecade] = useState(null);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const gridRef = useRef(null);
  const tabsRef = useRef(null);
  const panelId = useId();

  const decades = [...new Set(seasons.map(decadeOf))].sort((a, b) => b - a);
  // A season outside the list (e.g. ?season=1949) falls back to the newest decade, so a tab is always selected.
  const selectedDecade = selectedYear ? decadeOf(selectedYear) : null;
  const shownDecade = decade ?? (decades.includes(selectedDecade) ? selectedDecade : decades[0]);
  const available = new Set(seasons);
  const slots = Array.from({ length: 10 }, (_, i) => String(shownDecade + i));
  const years = slots.filter((y) => available.has(y));

  const focusYear = (year) => gridRef.current?.querySelector(`[data-year="${year}"]`)?.focus();
  const focusTab = (d) => tabsRef.current?.querySelector(`[data-decade="${d}"]`)?.focus();

  const openPanel = () => {
    setDecade(null);
    setOpen(true);
  };
  const close = (returnFocus = true) => {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  };
  const pick = (year) => {
    setSeason(year === latest ? CURRENT_SEASON : year);
    close();
  };

  // On open, focus the selected year (or the first year of the decade).
  useEffect(() => {
    if (!open) return;
    const target = years.includes(selectedYear) ? selectedYear : years[0];
    focusYear(target);
    // Only on open: later decade switches keep focus where the user is.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Click outside closes (without stealing focus from what was clicked).
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      // The phone scrim handles its own tap (closing here would let the click fall through to the page).
      if (!rootRef.current?.contains(e.target) && !e.target.closest?.("[data-season-scrim]")) close(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  const onPanelKeyDown = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    }
  };

  // Tabbing out of the panel closes it.
  const onBlur = (e) => {
    if (open && e.relatedTarget && !rootRef.current?.contains(e.relatedTarget)) close(false);
  };

  const onTabKeyDown = (e) => {
    const i = decades.indexOf(shownDecade);
    const move = { ArrowRight: 1, ArrowLeft: -1, Home: -Infinity, End: Infinity }[e.key];
    if (move !== undefined) {
      e.preventDefault();
      const next = decades[Math.max(0, Math.min(decades.length - 1, i + move))];
      setDecade(next);
      focusTab(next);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      focusYear(years.includes(selectedYear) ? selectedYear : years[0]);
    }
  };

  const onGridKeyDown = (e) => {
    const year = e.target.dataset?.year;
    if (!year) return;
    const slot = Number(year) - shownDecade;
    const step = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: COLS, ArrowUp: -COLS }[e.key];
    if (step !== undefined) {
      e.preventDefault();
      // Walk in the direction until an existing season (skips unraced years in a decade).
      for (let s = slot + step; s >= 0 && s < 10; s += step) {
        if (available.has(slots[s])) return focusYear(slots[s]);
      }
      if (e.key === "ArrowUp") focusTab(shownDecade);
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      focusYear(e.key === "Home" ? years[0] : years.at(-1));
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      pick(year);
    }
  };

  // Roving tabindex: one tab stop in the grid (the selected year, else the first).
  const tabStop = years.includes(selectedYear) ? selectedYear : years[0];

  return (
    <div ref={rootRef} className="relative" onBlur={onBlur}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        disabled={!latest}
        onClick={() => (open ? close() : openPanel())}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" && !open) {
            e.preventDefault();
            openPanel();
          }
        }}
        className="flex h-10 cursor-pointer items-center gap-2 rounded-panel border border-line-strong bg-surface-2 pl-3 pr-2 text-ink transition-colors duration-150 hover:border-ink-3 disabled:cursor-default"
      >
        <span className="label-caps hidden sm:inline">{t("common.season.label")}</span>
        <span className="font-display text-xl">{selectedYear ?? "—"}</span>
        {isCurrent && <span className="hidden text-xs text-ink-3 sm:inline">{t("common.season.current")}</span>}
        <span className="sr-only">{isCurrent && t("common.season.srCurrent")}{t("common.season.change")}</span>
        <LuChevronDown
          className={`size-4 text-ink-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      {/* Phone: the panel is a sheet under the top bar; a scrim catches the dismissing tap so it never lands on a link. */}
      {/* Portalled: the top bar's backdrop-filter would otherwise be its containing block. */}
      {open &&
        createPortal(
          <div
            aria-hidden
            data-season-scrim
            className="fixed inset-0 top-16 z-10 bg-black/40 sm:hidden"
            onClick={() => close(false)}
          />,
          document.body
        )}
      {open && (
        <div
          id={panelId}
          role="dialog"
          aria-label={t("common.season.choose")}
          onKeyDown={onPanelKeyDown}
          className="pop-in fixed inset-x-3 top-[4.25rem] z-40 rounded-panel border border-line-strong bg-surface-2 p-3 shadow-raised sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80"
        >
          <button
            type="button"
            onClick={() => pick(latest)}
            aria-pressed={isCurrent}
            className={`flex h-12 w-full items-center gap-3 rounded-panel px-3 text-left transition-colors duration-150 ${
              isCurrent ? "bg-surface-3" : "hover:bg-surface-3"
            }`}
          >
            <span className="font-display text-2xl text-ink">{latest}</span>
            <span className="flex-1 text-sm font-medium text-ink-2">{t("common.season.currentSeason")}</span>
            {isCurrent && <LuCheck className="size-4 text-ink" aria-hidden />}
          </button>

          <div className="my-3 border-t border-line" />

          <div
            ref={tabsRef}
            role="tablist"
            aria-label={t("common.season.decade")}
            onKeyDown={onTabKeyDown}
            className="grid grid-cols-4 gap-1"
          >
            {decades.map((d) => {
              const active = d === shownDecade;
              return (
                <button
                  key={d}
                  type="button"
                  role="tab"
                  data-decade={d}
                  aria-selected={active}
                  aria-controls={`${panelId}-years`}
                  tabIndex={active ? 0 : -1}
                  onClick={() => setDecade(d)}
                  className={`h-10 rounded-panel text-sm font-medium transition-colors duration-150 ${
                    active
                      ? "bg-surface-3 text-ink shadow-[inset_0_-2px_0_var(--accent)]"
                      : "text-ink-2 hover:bg-surface-3 hover:text-ink"
                  }`}
                >
                  {t("common.season.decadeName", { decade: d })}
                </button>
              );
            })}
          </div>

          <div
            ref={gridRef}
            id={`${panelId}-years`}
            role="listbox"
            aria-label={t("common.season.yearsIn", { decade: shownDecade })}
            onKeyDown={onGridKeyDown}
            className="mt-2 grid grid-cols-5 gap-1"
          >
            {slots.map((year) =>
              available.has(year) ? (
                <div
                  key={year}
                  role="option"
                  data-year={year}
                  aria-selected={year === selectedYear}
                  tabIndex={year === tabStop ? 0 : -1}
                  onClick={() => pick(year)}
                  className={`grid h-11 cursor-pointer place-items-center rounded-panel font-display text-xl transition-colors duration-150 ${
                    year === selectedYear ? "bg-accent text-on-accent" : "text-ink hover:bg-surface-3"
                  }`}
                >
                  {year}
                </div>
              ) : (
                <span key={year} aria-hidden className="grid h-11 place-items-center font-display text-xl text-line-strong">
                  {year}
                </span>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
