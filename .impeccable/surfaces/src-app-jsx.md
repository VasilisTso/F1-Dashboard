---
version: 1
slug: "src-app-jsx"
primary_target: "src/App.jsx"
related_targets: ["src/components"]
---

# App shell + shared UI (all routes)

Mode: Operate. Fans check standings, results, next race and team/driver history; dark default, light supported; WCAG 2.2 AA. Code-led.

## Direction contract
THESIS: The dashboard reads like a broadcast timing tower: positions, gaps and points are the loudest things on screen, team color is identity, chrome stays neutral. Refuses the generic dark SaaS dashboard of same-size glowing cards and the neon-on-black "racing" costume.
OWN-WORLD: Cool carbon neutrals (two layers: rail darker than content) or cool paper-grey in light. F1 red #E10600 for active nav, primary action, live/next. Timing-sector semantics as state colors: purple = best/leader, green = gain, amber = caution. Archivo variable: condensed width (wdth ~65) bold for positions and headings, normal width for UI; tabular figures everywhere numeric. Hairline borders, 6px radius, soft offset shadows only on raised layers.
STORY: Fan lands, sees season + where things stand in one glance, drills into a team or driver, comes back via rail.
FIRST VIEWPORT: Left rail (wordmark, 4 nav items, active = red block), top bar with page title + season select + theme toggle; content starts with compact page header then timing-tower list. Mobile: top bar with menu button opening drawer.
FORM: Pinned by user ("broadcast telemetry"), #1 of list. seed: none (unavailable)
SIGNATURE: Timing-tower row — condensed position numeral, 4px team-color chip, name + team, right-aligned tabular points and gap to leader; leader gap shows "LEADER" in sector purple.
FINISH: unreviewed and undocumented is unfinished
