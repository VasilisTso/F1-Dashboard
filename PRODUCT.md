# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Primary: Formula 1 fans checking the championship between and during race weekends — standings, last result, next race and its session times, and team/driver history. Often on a phone, glancing quickly.
Secondary: people viewing it as a portfolio project by its author (Vasilis Tsomakas), who judge craft, data handling, and polish.

## Product Purpose
A fan dashboard for any Formula 1 season: drivers' and constructors' championships, race calendar and results, and deep pages for each constructor and driver (career stats, history, intro). Success: a fan finds the number they came for in seconds, and the history pages are worth browsing.

## Positioning
Free, ad-free, season-switchable view of F1 data with constructor/driver history pages built from the Jolpica (Ergast-compatible) API and Wikipedia summaries.

## Operating Context
- Data: Jolpica API (`https://api.jolpi.ca/ergast/f1`), rate limited (~4 req/s, 500/h) — history loads must be throttled and cached (React Query).
- Intro text/images: Wikipedia REST summary endpoint.
- Season selectable via `?season=` URL param; "current" is default.

## Capabilities and Constraints
- Stack: React 19, Vite 7, Tailwind v4, Recharts, motion, React Query, react-router 7.
- Pages: Overview, Drivers (+ detail), Constructors (+ detail), Races.
- Must support both dark and light themes (dark is the primary/default experience).
- Data can be missing for new teams (e.g. Cadillac, Audi) and for future races; every view needs loading, empty and error states.

## Brand Commitments
- Name "F1 Dashboard"; wordmark: F1 icon + "Dash" in F1 red `#E10600`.
- Direction confirmed by user: "broadcast telemetry" style.
- Not an official F1 product; do not claim affiliation.

## Evidence on Hand
- Real data only, from Jolpica and Wikipedia. No invented stats.
- Old screenshots in `screenshots/` (pre-redesign).

## Product Principles
1. The number first: positions, points and gaps are always the most legible thing on screen.
2. Team identity carries color; the UI chrome stays neutral.
3. Never flood the API; show progressive data instead of blocking.
4. Works one-handed on a phone as well as on a desktop.

## Accessibility & Inclusion
WCAG 2.2 AA: contrast in both themes, full keyboard use, visible focus, 24px minimum targets, `prefers-reduced-motion` respected. Team colors never the sole carrier of meaning (always paired with name/abbr).
