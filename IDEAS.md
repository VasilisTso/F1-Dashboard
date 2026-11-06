# F1 Dashboard: Next-Level Ideas

Proposal only, no code yet. Written against `PRODUCT.md`, `DESIGN.md`, `README.md` and `src/` as of 2026-11-06.

**Request cost key.** "Extra" = new Jolpica requests on top of what the page already makes. The global throttle is 300ms per request (`src/api/jolpica.js`), so N requests take about N × 0.3s. The budget is 500/hour per visitor. Wikipedia is not counted.

**Already-paid data worth reusing:**

| Query | Cost | Already used by |
| --- | --- | --- |
| `getSeasonResults` (every result, every round) | ~5 req/season | Races |
| `getSchedule` (sessions, circuits, dates) | 1 | Races |
| Driver and constructor standings | 1 each | Overview, Drivers, Constructors |
| `getRace` (results, sprint, qualifying) | 3–4 | Race page |

Every idea below is client-side unless it says otherwise.

---

## 1. Ideas

### A. Data and insight

#### A1. Championship progression chart
- **Pitch:** a line chart of cumulative points per round for the top drivers and constructors, with an "as of round N" scrubber.
- **Why a fan cares:** it's the season's story in one picture: when the lead changed, who collapsed, who came back. It's the most-shared F1 graphic online.
- **Data:** `getSeasonResults` (already fetched on Races) plus one new `/{season}/sprint.json` paginated call for sprint points.
- **Request cost:** 0 extra if Races was visited, otherwise ~5–6. Finished seasons can be cached forever.
- **Caveat:** before 1991, dropped scores (best-N results) mean summed points ≠ official totals. For those seasons, either label the line "points scored", or fetch per-round standings (1 req/round, ~16, cached forever).
- **Design:** Recharts is already in the bundle. Lines are drawn in team colour, but each line also gets a direct end label (abbr + points), so colour never carries meaning alone. Leader marker in `best`. The line draw-in respects reduced motion.
- **Effort:** M. **Impact:** 5.

#### A2. Teammate head-to-head
- **Pitch:** on the driver page, an "vs teammate" panel with qualifying H2H, race H2H, points, average finish and DNFs for the selected season.
- **Why a fan cares:** the teammate is the only fair benchmark in F1. Fans argue about this more than anything else.
- **Data:** season results (exists) plus `/{season}/qualifying.json`, paginated (~5 req, cached with the season). Teammate pairs come from the constructor on each result, which also handles mid-season swaps.
- **Request cost:** ~5 extra per season, shared by every driver page that season.
- **Design:** two timing-tower columns mirrored around a centre tally ("14–8"). The winning side's figure is in `best`.
- **Effort:** M. **Impact:** 5.

#### A3. Title maths: "still in it?"
- **Pitch:** for the running season, the maximum points still available and who can mathematically still win. Once decided, show "Clinched at Round N, {race}".
- **Why a fan cares:** late in the season (now, November) this is the main question every fan has.
- **Data:** standings + schedule (counts remaining races and sprints). The points table is a constant: 25 per race, 8 per sprint, and no fastest-lap point since 2025.
- **Request cost:** 0 extra on Overview. "Clinched at" for past seasons reuses the A1 data.
- **Design:** a single row on the Overview standings card: "Max 58 pts left · 3 drivers in contention". Contenders get a `best` tick; eliminated drivers dim to `ink-3`. Tie-break by countback is noted in a hint.
- **Effort:** S. **Impact:** 4.

#### A4. Race story: lap chart and pit strategy
- **Pitch:** on the race page, a position-by-lap chart ("bump chart") plus a strategy strip of stints and pit stops per driver.
- **Why a fan cares:** a finishing order hides the race. This shows the undercut, the safety-car shuffle and the recovery drive.
- **Data:** `/{s}/{r}/laps.json`, which paginates on timings (~1,200 rows ≈ 12–14 req), plus `/{s}/{r}/pitstops.json` (1 req). Laps exist from 1996 and pit stops from 2011, so the panel hides itself for older races.
- **Request cost:** ~13–15 per race, about 4–5s. Load it on demand behind a "Load race story" button, the same pattern as constructor full history. Store a compact form (an array of positions per lap, a few KB) in localStorage once the race is final.
- **Effort:** L. **Impact:** 4.

#### A5. Places gained and biggest mover
- **Pitch:** a "+/−" column on race results (grid → finish), plus a "Biggest mover" callout on the last-race card.
- **Why a fan cares:** it shows who drove well, not just who had the fastest car.
- **Data:** `grid` is already on every result object.
- **Request cost:** 0.
- **Design:** `gain` green ▲ / `ink-2` ▼ with the number, always written as text ("+7"), never as colour alone. Pit-lane starts (grid 0) show "PL".
- **Effort:** S. **Impact:** 3.

#### A6. Circuit history on the race page
- **Pitch:** "At this track": the last 10 winners, the most successful driver and team, and the first Grand Prix held there.
- **Why a fan cares:** this is pre-race context during the weekend, and it's what the broadcast shows before lights out.
- **Data:** `/circuits/{id}/results/1.json?limit=100` (1 req, or 2 for Monza and Silverstone).
- **Request cost:** 1–2, cached for a day (it only changes once a year).
- **Design:** a compact timing-tower list (year, stripe, winner). It also appears as a small strip on the Overview "Next race" card.
- **Effort:** M. **Impact:** 4.

### B. UX and navigation

#### B1. Favourite driver and team
- **Pitch:** star a driver or team. Their row is highlighted in every standings list, and Overview gets a "Your driver" tile showing their last result, championship position and gap.
- **Why a fan cares:** most fans follow one driver. It makes the dashboard feel personal without needing accounts.
- **Data:** localStorage plus queries that already exist.
- **Request cost:** 0.
- **Design:** the highlight is a `surface-3` row fill plus a star icon. It must not be a team colour (Neutral Chrome Rule).
- **Effort:** S–M. **Impact:** 4.

#### B2. Add weekend to calendar (.ics)
- **Pitch:** one button on the Next race card and race pages. It downloads an `.ics` file with every session at the correct UTC time. There's also a "whole season" option.
- **Why a fan cares:** "When is quali in my time zone?" is the top race-weekend question. A calendar answers it on their phone without opening the app.
- **Data:** the schedule, already fetched. The file is generated in the browser as a Blob, so no backend is needed. Event titles are in the active language.
- **Request cost:** 0.
- **Note:** real push reminders ("Quali in 15 min") would need a push server, i.e. a backend. Calendar alarms inside the `.ics` (`VALARM`) give the same result for free.
- **Effort:** S. **Impact:** 4.

#### B3. Weekend-aware Overview
- **Pitch:** Overview changes with the weekend's state. Before: a countdown. During a session: "Qualifying underway" with when it ends. After the race, before Jolpica updates: "Results usually published within a few hours". After: the result.
- **Why a fan cares:** this is the race-weekend glance. Right now, the gap between the chequered flag and Jolpica updating shows stale "last race" data with no explanation.
- **Data:** the schedule plus `useNow`, and the existing 10-minute `nextRace` refetch. Session lengths are constants (FP 60', Q 60', SQ 44', Sprint ~60', Race ~120').
- **Request cost:** 0. Optionally, poll `last/results` every 10 minutes, and only during the post-race window (~6 req/hour, bounded).
- **Honest limit:** there is no live timing. Jolpica has no live data and no practice results.
- **Effort:** M. **Impact:** 4.

#### B4. Quick search (⌘K / `/`)
- **Pitch:** a command palette for jumping to any driver, team, race or season.
- **Why a fan cares:** between races, fans browse history ("how many wins did Prost have?"). Today that means picking a season first, then finding the driver.
- **Data:** season-scoped results are free (existing queries). All-time search needs `/drivers.json` (~9 pages for ~870 drivers) and `/constructors.json` (~3 pages), cached in localStorage for a week.
- **Request cost:** 0 for season scope, or ~12 once per week per browser for all-time.
- **Design:** a native `<dialog>` like the mobile drawer, a full-width sheet on phones, with arrow-key navigation. A search button in the top bar makes it discoverable without the shortcut.
- **Effort:** M. **Impact:** 4.

#### B5. Driver vs driver compare page
- **Pitch:** `/compare?a=hamilton&b=max_verstappen` puts two drivers' career stat tiles side by side, with a points-per-season overlay and the seasons they raced together.
- **Why a fan cares:** "Who's better?" debates are the core of F1 fandom.
- **Data:** reuses `getDriverCareer` (6 counts each) and a per-season standings row per driver.
- **Request cost:** ~12 for the career stats. Season history is like constructor history (1 req/season), so it should be on demand and stored in localStorage.
- **Effort:** L. **Impact:** 3. It overlaps with A2. Build A2 first; this is the all-time version.

### C. Visual and delight

#### C1. Circuit outline
- **Pitch:** a track-layout line drawing on the race page and the Next race card.
- **Why a fan cares:** it's the most recognisable image in a race weekend, and it's what the broadcast graphic shows.
- **Data:** the static GeoJSON from `bacinger/f1-circuits` (MIT), keyed by circuit, converted to SVG paths at build time and bundled.
- **Request cost:** 0 API (a static asset, ~2–4 KB per circuit, lazy-loaded).
- **Design:** a 1.5px `ink-2` stroke with a start/finish tick in `accent-ink`. No fill and no glow. It works in both themes because it uses `currentColor`.
- **Effort:** M. **Impact:** 3.

#### C2. Share card
- **Pitch:** "Share" on a race result or driver page creates a 1200×630 PNG in timing-tower style and opens the Web Share API (or downloads it on desktop).
- **Why a fan cares:** fans post results. It also helps the portfolio: every share is an ad for the app.
- **Data:** what's already on screen, rendered to `<canvas>` in the browser.
- **Request cost:** 0.
- **Effort:** M. **Impact:** 3.

### D. Tech, performance and PWA

#### D1. Persist the query cache across visits
- **Pitch:** `@tanstack/query-sync-storage-persister` (or IndexedDB) for HISTORY-tier queries: finished seasons, careers, wiki.
- **Why a fan cares:** past seasons and profiles reopen instantly, and the 500/hour budget stops being a risk when browsing history.
- **Data:** none new. It's the same pattern as the constructor-season localStorage cache, made general.
- **Request cost:** large savings. A driver page costs ~12 requests cold, and that cost is paid again on every new visit today.
- **Effort:** S. **Impact:** 4.

#### D2. Installable PWA
- **Pitch:** a manifest, icons and a service worker (`vite-plugin-pwa`). The app shell is precached, and Jolpica GETs use stale-while-revalidate.
- **Why a fan cares:** it gets a home-screen icon on the phone, opens instantly at the track with poor signal, and works offline with the last data.
- **Request cost:** fewer, because repeat views come from the service worker.
- **Note:** the app needs a "data as of …" hint when serving offline, so stale standings aren't mistaken for live ones.
- **Effort:** M. **Impact:** 4.

---

## 2. Top 3 picks

1. **A1 Championship progression + A3 Title maths (ship together).** The data is almost all already fetched, so it costs close to zero requests. It suits the timing-screen design (purple leader line, contender ticks). It's timely: the season is nearly over and the title fight is the story. Both features also work in every past season, which serves the "browse history between races" use case.
2. **B3 Weekend-aware Overview + B2 .ics export.** These are aimed straight at the primary user, a fan glancing at a phone during a race weekend. Neither costs any requests. B3 also fixes a real trust problem: today the post-race window shows the previous result with no explanation. Small to medium effort.
3. **D1 Persisted query cache.** It's invisible but it raises the ceiling on everything else. History pages are the second use case and the most request-heavy (a driver page is ~12 requests, constructor history 1 per season). Every future feature (A2, A4, B4, B5) gets cheaper once the cache is persisted. It's an S effort for an app-wide win, and it should come before the request-heavy ideas.

Close fourth: **A2 Teammate H2H.** It has high fan value, but it adds ~5 requests per season, so do it after D1.

---

## 3. Fix before adding features

1. ~~**SPA deep links on Vercel.**~~ False alarm: `vercel.json` already has the catch-all rewrite (commit 3992474).
2. **No error boundary.** One render-time crash (e.g. an unexpected Jolpica shape on a 1950s race) blanks the whole app. Add a route-level boundary that renders `ErrorState` with a retry.
3. **No per-page `document.title` or meta.** Every tab, history entry and bookmark reads "F1 Dashboard". Set titles like "Hamilton · Drivers · F1 Dash" in both languages. Add a meta description and OG tags in `index.html`, which matters for a portfolio piece that gets shared.
4. **No route code-splitting.** All seven pages, Recharts and motion ship in one bundle. Lazy-load the detail pages (Recharts is only needed on ConstructorDetail, and on the A1 chart later) to cut first load on phones.
5. **`gcTime` on careers and history.** `useDriverCareer`, `useDriverConstructors`, `useConstructorCareer` and `useConstructorSeasons` set `staleTime: HOUR` but keep the default 5-minute `gcTime`. Leave a profile for 5 minutes, come back, and all ~6–12 requests run again. Use `HISTORY` (or `gcTime: HOUR`). This is a one-line fix, and partly what D1 solves properly.
6. **Live data during a weekend.** `refetchOnWindowFocus: false` plus a 5-minute `staleTime` means standings and last result on an open tab never update until the user navigates. Only `nextRace` polls. Enable refetch-on-focus for the LIVE tier only. It's cheap, because stale checks are bounded by `staleTime`.
7. **Result statuses stay English in Greek.** `i18n/data.js` deliberately leaves API strings as Jolpica returns them, and that is fine for race and circuit names. But statuses ("+1 Lap", "Engine", "Collision", "Retired") are a small, finite set that Greek readers see in every result table. They're worth an exact mapping, with the raw string as the fallback.
