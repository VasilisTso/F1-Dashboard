---
name: F1 Dashboard
description: A fan's championship dashboard that reads like a broadcast timing tower.
colors:
  surface-0: "#0e1013"
  surface-1: "#08090b"
  surface-2: "#16191e"
  surface-3: "#1f232a"
  line: "#262a31"
  line-strong: "#353a43"
  ink: "#f2f4f7"
  ink-2: "#a9b0bb"
  ink-3: "#8a919c"
  accent: "#e10600"
  accent-ink: "#ff4136"
  on-accent: "#ffffff"
  best: "#b98bff"
  gain: "#3ddc84"
  caution: "#ffc21a"
  danger: "#ff4136"
  surface-0-light: "#f3f4f6"
  surface-1-light: "#e7e9ed"
  surface-2-light: "#ffffff"
  surface-3-light: "#eef0f3"
  line-light: "#dadde3"
  line-strong-light: "#c3c8d0"
  ink-light: "#0e1013"
  ink-2-light: "#4a515c"
  ink-3-light: "#5f6672"
  accent-ink-light: "#c40500"
  best-light: "#7b2cbf"
  gain-light: "#0f7a41"
  caution-light: "#8f5a00"
  danger-light: "#c40500"
  team-fallback: "#6b7280"
typography:
  display:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "3rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.01em"
    fontVariation: "'wdth' 68"
  numeral:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.01em"
    fontFeature: "'tnum' 1"
    fontVariation: "'wdth' 68"
  position:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.01em"
    fontFeature: "'tnum' 1"
    fontVariation: "'wdth' 68"
  title:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.01em"
    fontVariation: "'wdth' 68"
  body:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    fontFeature: "'tnum' 1"
  body-sm:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.43
    fontFeature: "'tnum' 1"
  meta:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.33
    fontFeature: "'tnum' 1"
  label:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 600
    letterSpacing: "0.08em"
rounded:
  panel: "6px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  2xl: "24px"
  3xl: "32px"
components:
  nav-item:
    textColor: "{colors.ink-2}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.panel}"
    padding: "0 12px"
    height: "40px"
  nav-item-hover:
    backgroundColor: "{colors.surface-3}"
    textColor: "{colors.ink}"
  nav-item-active:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
  card:
    backgroundColor: "{colors.surface-2}"
    rounded: "{rounded.panel}"
    padding: "20px"
  card-title:
    textColor: "{colors.ink}"
    typography: "{typography.title}"
    padding: "12px 20px"
  stat-tile:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink}"
    typography: "{typography.numeral}"
    rounded: "{rounded.panel}"
    padding: "16px"
  standings-row:
    textColor: "{colors.ink}"
    padding: "8px 16px"
    height: "56px"
  standings-row-hover:
    backgroundColor: "{colors.surface-3}"
  team-stripe:
    rounded: "{rounded.full}"
    width: "4px"
    height: "32px"
  countdown-cell:
    backgroundColor: "{colors.surface-3}"
    textColor: "{colors.ink}"
    typography: "{typography.numeral}"
    rounded: "{rounded.panel}"
    padding: "8px"
  button-outline:
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.panel}"
    padding: "0 16px"
    height: "40px"
  button-outline-hover:
    backgroundColor: "{colors.surface-3}"
  icon-button:
    textColor: "{colors.ink-2}"
    rounded: "{rounded.panel}"
    size: "40px"
  icon-button-hover:
    backgroundColor: "{colors.surface-3}"
    textColor: "{colors.ink}"
  select:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.panel}"
    padding: "0 32px 0 12px"
    height: "40px"
---

# Design System: F1 Dashboard

## Overview

**Creative North Star: "The Timing Tower"**

The dashboard reads like a broadcast timing tower. Positions, points and gaps are the loudest marks on screen, set in condensed bold numerals with tabular figures so columns never jitter. Team color is identity and lives only in a narrow vertical stripe beside the team name; the chrome around it stays neutral carbon (dark) or cool paper-grey (light).

Density is moderate and list-led: content is a stack of hairline-bordered panels on a faint dot grid, and the primary data shape is a row (position, stripe, name, points, gap), not a card per item. F1 red is spent sparingly on the active nav block, focus, selection and the wordmark. Timing-sector semantics carry state: purple for best/leader, green for gain, amber for caution.

The system rejects the generic dark SaaS dashboard of same-size glowing cards and the neon-on-black "racing" costume. Dark is the default experience; light is a full peer theme, not an inversion afterthought.

**Key Characteristics:**
- Condensed (wdth 68) bold Archivo for numerals and headings; normal-width Archivo for UI.
- Tabular figures on everything (set on `body`).
- Two-layer neutrals: rail and top bar sit a step darker than the content area in both themes.
- Hairline borders, one 6px radius, one soft raised shadow.
- Team color appears only as a 4px stripe, always paired with the team name.

## Colors

Cool carbon neutrals with one red and three timing-state hues; every value is defined twice (dark default, light peer) on `[data-theme]`.

### Primary
- **Race Control Red** (`accent`): fills only. Active nav block, `::selection`, white text on it (4.97:1). Never used as a text color on dark surfaces, where it fails 4.5:1.
- **Signal Red Ink** (`accent-ink`, light `accent-ink-light`): the red when it must be read as text or a line: wordmark "Dash", focus outline, "Underway" countdown state.

### Tertiary (timing states)
- **Sector Purple** (`best`, light `best-light`): best, fastest, championship leader. The "LEADER" gap label and leader-type stat figures.
- **Sector Green** (`gain`, light `gain-light`): improvement, personal best, positions gained.
- **Sector Amber** (`caution`, light `caution-light`): warnings and caution states.
- **Fault Red** (`danger`, light `danger-light`): error icons. Shares the accent-ink value by design.

### Neutral
- **Carbon Page** (`surface-0`): page and content background, under the dot grid.
- **Carbon Pit Wall** (`surface-1`): left rail, mobile drawer, sticky top bar (at 90% with backdrop blur). A step darker than the page in both themes.
- **Carbon Panel** (`surface-2`): raised panels (Card, StatTile, ErrorState, select).
- **Carbon Inset** (`surface-3`): hover fills, countdown cells, skeleton blocks.
- **Hairline** (`line`) / **Hairline Strong** (`line-strong`): panel borders and row dividers; strong for controls (select, outline button) and scrollbar thumbs.
- **Ink** (`ink`), **Ink Secondary** (`ink-2`, ≥8:1), **Ink Tertiary** (`ink-3`, ≥5:1): primary text, meta and sub-lines, labels and units.
- **Team colors** (`src/lib/teams.js`, keyed by constructorId; `team-fallback` for unknown teams): data, not chrome.

### Named Rules
**The Neutral Chrome Rule.** The UI shell never takes a team color or a decorative hue. Red marks the active place and focus; everything else is ink on carbon.

**The Red Fill, Red Ink Rule.** `accent` is a fill; `accent-ink` is the text/line red. Do not swap them.

**The Sector Semantics Rule.** Purple, green and amber mean best, gain and caution, as on a timing screen. Never use them decoratively.

## Typography

**Display Font:** Archivo variable, condensed (font-stretch 68%, loaded with wdth 62..125), with ui-sans-serif, system-ui fallback
**Body Font:** Archivo variable at normal width

**Character:** One family in two widths. The condensed bold cut is the broadcast graphic voice, uppercase and tight; the normal width keeps UI text calm and readable.

### Hierarchy
- **Display** (700, condensed, 2.25rem rising to 3rem at sm, lh 1, uppercase, balanced): page title in the page header.
- **Numeral** (700, condensed, 2.25rem; 1.875rem in countdown cells): stat figures and countdown digits.
- **Position** (700, condensed, 1.5rem): the standings position numeral, right-aligned.
- **Title** (700, condensed, 1.125rem, uppercase): card headings.
- **Body** (400, 1rem): row names (600 for driver/team name), prose in error states capped at 65ch.
- **Body small** (500, 0.875rem): nav items, controls, page meta line, gap values.
- **Meta** (400, 0.75rem): row sub-lines, units ("pts"), hints, footer.
- **Label** (600, 0.6875rem, 0.08em tracking, uppercase, ink-3): column heads, stat names, countdown units, inline control labels.

### Named Rules
**The Tabular Everything Rule.** Tabular figures are on globally; every numeric column right-aligns so digits stack.

**The Label Is Not A Kicker Rule.** Uppercase labels name a column, a stat or a control. They never sit above a heading as an eyebrow.

## Layout

App shell: a sticky 224px left rail (`lg` and up, 1024px) beside a column holding a sticky 64px top bar and the main content. Below `lg` the rail disappears; the top bar shows a menu button that opens the same nav in a modal `<dialog>` drawer (288px, max 85vw, 60% black backdrop, native focus trap and Esc). Main content sits on the dot grid (1px dots, 16px pitch), padded 16px / 24px (sm) / 32px (lg), capped at 1280px and centered.

Rhythm is the 4px Tailwind scale: 8–12px gaps inside rows and tiles, 16–20px panel padding, 24–32px below the page header. Stat tiles flow 2 / 3 / 5 columns (base / sm / lg) with 12px gaps. Interactive targets are 40px tall; standings rows are at least 56px.

## Elevation & Depth

Hybrid: depth is mostly tonal (page, pit wall, panel, inset surfaces) and hairline-bordered. One soft two-layer shadow lifts raised panels; it is never hard-edged or offset for effect.

### Shadow Vocabulary
- **Raised** (dark `0 1px 2px rgb(0 0 0 / 0.4), 0 8px 24px -8px rgb(0 0 0 / 0.5)`; light `0 1px 2px rgb(14 16 19 / 0.06), 0 8px 24px -10px rgb(14 16 19 / 0.18)`): Card panels.

### Named Rules
**The Flat Chrome Rule.** Rail, top bar and controls carry no shadow; separation comes from surface tone and a hairline.

## Shapes

One radius (6px, `panel`) for panels, controls, nav items, countdown cells and skeleton blocks. Fully rounded only for the team stripe and scrollbar thumbs. Borders are 1px hairlines; rows are separated by dividers rather than boxed individually.

## Components

### Buttons
- **Shape:** gently squared (6px).
- **Outline (retry):** transparent with a `line-strong` hairline, ink text, body-small 500, 40px tall, 16px side padding, leading 16px icon; hover fills `surface-3`. 150ms color transition.
- **Icon button:** 40px square, `ink-2` icon at 20px, hover fills `surface-3` and lifts the icon to `ink`. Used for menu, close and theme toggle.
- **Focus:** global 2px `accent-ink` outline, 2px offset.

### Cards / Containers
- **Corner Style:** 6px.
- **Background:** `surface-2` with a `line` hairline and the Raised shadow.
- **Header:** optional title row (condensed uppercase title, optional action on the right) separated by a hairline; 12px × 16px (20px at sm).
- **Internal Padding:** 16px, 20px at sm. List bodies drop the padding so rows run edge to edge.

### Inputs / Fields
- **Select (season):** native select, 40px, `surface-2`, `line-strong` hairline, body-small 500; hover border shifts to `ink-3`. Inline uppercase label beside it from sm.

### Navigation
- **Rail items:** 40px rows, 18px icon + label, body-small 500, `ink-2`; hover `surface-3` + `ink`; active is a solid red block (`accent` fill, white text). The wordmark (F1 mark + condensed "DASH" in `accent-ink`) heads the rail; a meta-size footer with attribution and non-affiliation sits at the bottom.
- **Mobile:** identical list in the drawer; closes after navigation.

### Timing-Tower Row (signature)
Position numeral (condensed, right-aligned) → 4px team stripe → name (600) over a meta sub-line → optional extra column (sm+) → points over "pts" → gap. P1 shows "LEADER" in `best`; others show "−N" in `ink-2`. Whole row links with a trailing chevron and `surface-3` hover. Rows live in an ordered list with hairline dividers under a label-caps column-head row.

### Team Stripe (signature)
A 4px × 32px fully rounded vertical chip in the team's color with an inset 1px `line` ring so pale liveries survive light surfaces. Decorative (`aria-hidden`); the team name always sits next to it.

### Stat Tile
Bordered `surface-2` panel with the Raised shadow, 16px padding: label-caps name, condensed 2.25rem numeral that counts up over 900ms with ease-out-expo (skipped under reduced motion), optional meta hint. Numeral color is `ink`, or a timing color (`best`/`gain`/`caution`) — never a team color. A missing value shows an em dash in `ink-3`. Tiles group into one `<dl>` grid.

### Countdown
Four `surface-3` cells (min 56px wide) of condensed two-digit numerals over label-caps units; announces one stable sentence to screen readers. Past the target it becomes "Underway" in `accent-ink`.

### Loading and Error States
Skeleton blocks are `surface-3` 6px shapes that pulse only under `motion-safe`; skeleton rows mimic the timing-tower row. Error/empty states are a bordered `surface-2` panel with a `danger` icon (errors only), title, 65ch message and optional outline retry button.

## Do's and Don'ts

### Do:
- **Do** set positions, points, stats and headings in condensed bold Archivo (font-stretch 68%, weight 700) and keep tabular figures on.
- **Do** show team identity with the 4px team stripe next to the team name, never by color alone.
- **Do** use `accent` (#E10600) only as a fill with white text, and `accent-ink` whenever red is text or an outline.
- **Do** use `best` purple for leader/fastest, `gain` green for improvement and `caution` amber for warnings.
- **Do** build lists as timing-tower rows with hairline dividers, right-aligned numeric columns and a label-caps column head.
- **Do** keep targets at 40px, give every view loading, empty and error states, and gate motion behind reduced-motion checks.
- **Do** define every new color in both `[data-theme="dark"]` and `[data-theme="light"]` and map it through `@theme inline`.

### Don't:
- **Don't** put team colors on chrome, card fills, headings or large areas; they belong to the stripe.
- **Don't** set text in `accent` (#E10600) on dark surfaces; it fails 4.5:1.
- **Don't** use purple, green or amber decoratively.
- **Don't** place an uppercase label above a heading as an eyebrow.
- **Don't** add glow, neon, gradients or hard offset shadows; the only shadow is Raised, on panels.
- **Don't** introduce a second radius or a second typeface.
