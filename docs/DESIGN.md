# Dashboard design system and redesign plan

The dashboard (`public/app`, thunder-ui) is a DevOps console: people scan it to see what's running, what's wrong and what changed, then act. This document is the plan for the redesign **and** the reference for every UI change after it. Read it before touching UI; update it when a rule changes.

Status: **built (D1–D6 done).** This is now the reference for every UI change; phases are kept in §9 as history.

---

## 1. Principles

1. **State first.** Every page answers "is anything wrong?" in its first screen: a status line, then the numbers that explain it.
2. **Dense, not cramped.** More fits on screen than today (smaller paddings, one-line rows, 13 px tables), but with a strict rhythm, so it still reads calmly.
3. **Color means something.** Surfaces are neutral. Color is reserved for status (ok, warning, critical, info), the one brand accent (primary actions, focus, selection) and chart series. No decorative gradients on content.
4. **One way to do each thing.** Every page uses the same header, stat, table, meter, status, chart and empty state, from the kit (§5). No one-off cards.
5. **Keyboard and screen readers are first-class.** Everything reachable by Tab, visible focus, ⌘K for navigation, labels on every control, color never the only signal.
6. **Fast and still.** Motion only where it explains a change (§7). Nothing animates on data refresh.

---

## 2. Framework boundaries (thunder-ui)

- **Never edit `src/core/`.** Restyle through tokens in `src/index.css` (ours), our own layout registered in `src/overrides/layouts.ts`, overrides in `src/overrides/`, pages in `src/pages/`, components in `src/components/`.
- **The shell** is our own layout, `console` (`src/layouts/console/`), registered under the name `navbar` in `src/overrides/layouts.ts`, so no env change is needed. It reads routes with `getNavRoutes(useLayout().router.routes)`, like core's layouts, so permissions and route visibility keep working.
- **Generated CRUD screens** (users, plans, envs and other core modules) are styled by tokens and our card and view overrides. They aren't rewritten unless they're a real problem.
- **Components:** shadcn/ui (`base-luma`, Base UI) first. New primitives come from the shadcn registry; charts from **bklit** (§6).
- **i18n and RTL:** every string goes through `t()` with English and Arabic. Layouts use logical properties (`ms-`, `pe-`, `start`/`end`) so RTL mirrors correctly.

---

## 3. Foundations (tokens in `src/index.css`)

### The Huruf theme (from huruftech.com, keep it)

The dashboard wears Huruf's own theme, taken from the site's stylesheet. These values are the source of truth; anything below refines around them, never replaces them.

| | Light | Dark |
|---|---|---|
| Background | `oklch(100% 0 0)` (white) | `oklch(0% 0 0)` (black) |
| Foreground | `oklch(0% 0 0)` | `oklch(98.5% 0 0)` |
| Card / popover | `oklch(100% 0 0)` | `oklch(13% 0 0)` |
| Secondary | `oklch(96.7% .001 286.375)` | `oklch(17% 0 0)` |
| Muted / accent surface | `oklch(97% 0 0)` | `oklch(15% 0 0)` / `oklch(20% 0 0)` |
| Muted foreground | `oklch(52% 0 0)` (the site's 55.6% fails AA on muted surfaces: 4.2:1) | `oklch(70.8% 0 0)` |
| Border / input | `oklch(92.2% 0 0)` | `oklch(100% 0 0 / .1)` / `/ .15` |
| Sidebar | `oklch(98.5% 0 0)` | `oklch(10% 0 0)` |
| **Primary (Huruf orange)** | `oklch(70.5% .213 47.604)` (≈ #FF6900) | same |
| Primary foreground | `oklch(14.5% 0 0)` (near-black, owner's decision §8; the site uses `oklch(98% .016 73.684)`) | same |
| Destructive | `oklch(58% .22 27)` | `oklch(70.4% .191 22.216)` |
| Charts 1–5 | `oklch(83.7% .128 66.29)`, `oklch(70.5% .213 47.604)`, `oklch(64.6% .222 41.116)`, `oklch(55.3% .195 38.402)`, `oklch(47% .157 37.304)` (the orange ramp) | same |
| Radius | `.625rem` | |

- **Neutrals are achromatic** (zero chroma): no blue-grey tints anywhere.
- **Fonts:** Geist for UI and headings, Geist Mono for code, ids and numbers, Noto Sans Arabic for Arabic, Instrument Serif only for rare display accents (e.g. an empty state's headline), never in data UI. Geist Mono and Noto Sans Arabic are added as `@fontsource-variable` packages (bundled, offline-safe like core's fonts).
- **Charts** use the orange ramp first; when a chart needs more distinct series than a ramp can separate, the extra series use the neutral greys, never the status colors.
- **Status colors** (success green, warning amber, info blue, plus the destructive red above) are the only other hues. Warning amber is kept clearly yellower than the brand orange so the two never read as the same thing.
- The dashboard's current darker orange (`oklch(55.3% …)`, chart 4 of the ramp) was a drift from the brand. It's only used where contrast requires it (see the primary-button note under §8).

### Color roles

| Token | Use |
|---|---|
| `--background` | App canvas: Huruf's white / black. |
| `--card` | Panels: white in light (separated by hairlines), `13%` in dark. |
| `--popover` | Popovers, sheets, sticky headers (with a soft shadow in light). |
| `--border`, `--input` | Hairlines (1 px) between rows and around panels; inputs one step stronger. |
| `--muted-foreground` | Secondary text. At least 4.5:1 contrast on `--surface`. |
| `--primary` | Huruf orange: primary buttons, links, focus ring, selection, active nav. Never used for status. |
| `--success`, `--warning`, `--danger`, `--info` (+ `-soft`, `-foreground`) | Status only: dots, badges, meter fills, banners. One hue each, tuned for both themes and AA contrast. |
| `--chart-1…5` | Huruf's orange ramp for chart series. |
| `--brand-text` | Orange as text (links, active nav icon): the ramp's darker step in light, a lighter one in dark, so it stays AA. |
| `--ring` | Focus ring: Huruf orange. |

Hues identify kinds of resources only where the kit says so: CPU, memory and disk meters have fixed hues (sky, violet, emerald), as today. Everything else is neutral.

### Type

- Geist for UI and headings, Geist Mono for ids, hashes, hostnames, code and numbers in tables (Huruf's fonts); all numbers use `tabular-nums`.
- Scale: 12 (captions, table meta), **13 (tables, dense lists, the default)**, 14 (body, forms), 16 (section titles), 20 (page titles), 28 (single hero numbers only).
- Arabic uses Noto Sans Arabic, as on huruftech.com (replacing core's Cairo through our `--font-sans` stack).

### Space, size, radius

- 4 px grid. Page gutters 16 px (mobile) / 24 px (desktop). Panel padding 12–16 px. Gaps 8 / 12 / 16.
- Controls 32 px high (`h-8`); compact toolbar controls 28 px. Table rows 36 px. Touch targets are still 40 px on coarse pointers.
- Radius: 6 (inputs, badges), 8 (buttons), 10 (panels), 12 (sheets and dialogs). Panels get a hairline border, not a shadow; shadows only on floating layers.
- Content is full width, with readable maxima: forms 640 px, prose 720 px.

### Elevation and depth

Flat by default: canvas → card (hairline border) → popover (border + soft shadow). No glass effects on content; the shell may use core's `glass` utility for the top bar.

---

## 4. The shell (`console` layout)

```
┌──────────┬──────────────────────────────────────────────────────────┐
│ ◆ Huruf  │ Projects / shop / Deployments        ⌘K  ☾  🔔  (avatar) │  48 px top bar
│ [Tenant▾]├──────────────────────────────────────────────────────────┤
│          │                                                          │
│ Overview │  Page header: title · status · actions                   │
│ Projects │  Tabs (when the page has them)                           │
│ Servers  │                                                          │
│ …        │  Content                                                 │
│ ── Build │                                                          │
│ Templates│                                                          │
│ …        │                                                          │
│          │                                                          │
│ (user)   │                                                          │
└──────────┴──────────────────────────────────────────────────────────┘
  232 px, collapses to a 56 px icon rail (remembered), a sheet on mobile
```

- Built in `src/layouts/console/` (`index.tsx`, `command-menu.tsx`, `shell-dock.tsx`). Sidebar 232 px / 56 px rail, **open by default**, remembered per browser (`localStorage` `console-sidebar`; core's `sidebar_state` cookie is ignored), ⌘B toggles it.
- **Nav sections:** top-level pages and route groups with a single page sit unlabelled at the top (e.g. Overview, Projects, Wallet); only groups with two or more pages get a label.
- **Shell dock:** a 32 px bar at the bottom of every page (with `streams.openHostTerminal` + `projects.placementInfo`). It opens a panel, you pick an online server, and get a root terminal; Ctrl/⌘ + ` toggles it, ⌘K has "Open a shell on a server". xterm loads on first open.
- **Sidebar:** the logo on top (switch tenant from the account menu), nav grouped by route group (Applications, Infrastructure, Build, Configuration, Monitoring, Administration) with small group labels, active state as a filled pill, and counts or status dots where useful (e.g. servers offline, open alerts). Account and theme sit at the bottom.
- **Top bar:** the breadcrumb (core's `useBreadcrumbTitle` keeps working), the **command palette** (⌘K / Ctrl K: jump to any page, project or server, and run quick actions), notifications and the theme toggle.
- **Mobile:** the sidebar becomes a sheet, and the top bar keeps the breadcrumb's last item and the menu button. Safe-area utilities come from core.

---

## 5. Component kit (`src/components/console/`)

| Component | What it is |
|---|---|
| `PageHeader` | Title, optional status badge, one-line description, actions on the end side, optional tabs underneath. Every page starts with it. |
| `StatusDot`, `StatusBadge` | One mapping from states (online, offline, pending, healthy, building, deploying, failed, cancelled, active…) to the status tokens, with text, never color alone. Replaces today's scattered pills. |
| `Stat` | A compact KPI: label, value, optional delta and sparkline, optional link. Used in strips of 3–6. |
| `Meter` | Labelled bar with value text and threshold coloring (from `components/meter.tsx`, generalized). |
| `Panel` | A bordered surface with an optional header (title, description, actions) and dense body. Replaces ad-hoc `Card` usage. |
| `DataTable` | The default for lists: sticky header, 36 px rows, sortable columns, selection, row actions menu, empty and loading states, client filter box. Card grids remain only where a visual summary helps (servers have both). |
| `KeyValue` | Two-column facts list (label → value, copyable mono values). For detail pages. |
| `Toolbar` | Search, filters, view toggle and primary action above lists, one line. |
| `EmptyState` | Icon, one sentence, one action. |
| `CodeBlock` | Mono, copy button, wraps or scrolls. For DNS records, commands and logs. |
| `Timeline` | Deployment and event history: dot, label, time, details on expand. |

Kit props worth knowing: `DataTable` takes `isSelected` (selected-row highlight), `onRowClick` and `limit` (first N rows after sorting, then "Show N more"; use it for long secondary lists); its wrapper clips to the radius so the header can't square the corners. `CodeBlock` takes `lang` (`shell`, `yaml`, `dockerfile`: every command and template file is highlighted, via `highlight.tsx`, theme tokens only) and `maxHeight` (the code scrolls, the copy button stays); `PageHeader` wraps a string title in the page's `h1`, while a custom title (an inline rename) renders its own.

Files: `page-header`, `status` (`StatusDot`, `StatusBadge`, `toneOf`), `stat` (`Stat`, `StatStrip`), `meter`, `panel`, `data-table` (`DataTable`, `TColumn`), `key-value`, `toolbar`, `empty-state`, `code-block`, `timeline`, `kbd`. Status tokens come as a fill (`bg-success`), text (`text-success-foreground`) and soft background (`bg-success-soft`), likewise `warning`, `info` and `destructive`.

Rules: pages compose these; new patterns get added here first, then used. The kit lives in our own folder, so core syncs never touch it. `DataTable` selection and row menus are columns for now; they become built-in when a second page needs them.

---

## 6. Charts (bklit)

[bklit](https://github.com/bklit/bklit-ui) (MIT, shadcn registry `@bklit`, built on Visx 4 and Motion) has every chart we need:

| Need | bklit |
|---|---|
| Time series (requests, latency, CPU, memory, DB ops) | `line-chart`, `area-chart` with `grid`, `x-axis`, `y-axis`, `chart-tooltip`, `legend` |
| Live server metrics (2 s samples) | `live-line-chart` |
| KPI sparklines | `sparkline` |
| Usage of a whole (disk, quota) | `gauge-chart`, `ring-chart` |
| Comparisons (busiest routes, per-server load) | `bar-chart` |

- Installed through the CLI into `src/components/charts/` (registry `@bklit`: `https://bklit.com/r/{name}.json`; the old `ui.bklit.com` redirects). The CLI overwrites `src/lib/utils.ts`: restore ours after any `shadcn add @bklit/...`. It also appends `--chart-*` / `--legend*` variables to `src/index.css`; ours map them onto Huruf's neutrals. Its dependencies (`@visx/*`, `d3-*`, `@number-flow/react`; `motion` we have) are justified: they replace `recharts` once every chart is migrated, and `recharts` is then removed.
- `recharts` and `ui/chart.tsx` are gone; bklit's d3 types come from `@types/d3-shape` and `@types/d3-array`. bklit's vendored files are excluded from eslint (presets are linted).
- `TimeSeries` draws monotone curves (no overshoot), labels the time axis with times up to two days and dates beyond, and expects rows with `date: Date`; thin long series to about 240 points first. A null bucket is carried forward by the caller (the control plane does this).
- Presets live in `src/components/charts/presets.tsx` (`TimeSeries`, `Spark`, `SERIES` colors); gauge, ring, bar and live-line presets are added there when a page first needs them. Defaults: compact margins, no entry animation on refresh (only on first draw, and none under reduced motion), tooltips with units, `--chart-*` colors, and time axes in the viewer's locale.

---

## 7. Motion and feedback

- Durations 120–200 ms, ease-out `cubic-bezier(0.23, 1, 0.32, 1)`; no ease-in; nothing over 300 ms in the UI.
- Animate: sheets and dialogs (enter/exit), popovers (from their trigger), toasts, a pressed button (`scale(0.98)`), skeleton → content (fade only).
- Don't animate: data refreshes (numbers and rows just update), keyboard actions, the command palette, table sorting.
- `prefers-reduced-motion`: opacity only.

---

## 8. Accessibility checklist (every page)

- Contrast AA (4.5:1 text, 3:1 large text and UI parts) in both themes; status always has text or an icon besides color.
- **Text on Huruf orange (owner's decision):** primary buttons keep the brand orange fill with **near-black labels** (`--primary-foreground: oklch(14.5% 0 0)` or darker), about 8:1, passing AA. huruftech.com's light labels (about 2.6:1) aren't used. Orange *text* on white uses the ramp's `55.3%` step so links stay readable.
- One `h1` per page (`PageHeader`), headings in order, landmarks (`nav`, `main`, `aside`).
- Visible focus ring (2 px, accent) on every interactive element; logical tab order; Esc closes overlays; focus returns to the trigger.
- Tables use real `table` markup with header cells and an accessible name; icon-only buttons have `aria-label`; live regions announce async results (deploy started, check finished).
- Works at 320 px width and 200% zoom without sideways scrolling; RTL mirrors.

---

## 9. Phases

Each phase ends with screenshots (light, dark, phone, Arabic), the app's checks (`tsc`, `eslint`, build) and the owner's review before the next.

1. **D1 — Foundations:** tokens (§3), the `console` shell with ⌘K (§4), the kit (§5), bklit installed with chart presets (§6). Pages are untouched except that they inherit the new tokens and shell.
2. **D2 — Overview and Servers:** Overview rebuilt as a console home: status line, KPI strip, servers table with meters, recent deployments, open alerts, the AI prompt as a slim command bar, and the control plane mini panel. The servers list (table by default, cards optional), server detail (KeyValue facts, live metrics chart, containers table, setup steps), and add, accept and remove server flows.
3. **D3 — Projects:** list (table), new project (a stepped form), project detail (header with status and Deploy, Overview / Deployments / Logs / Variables / Domains / Settings), the deployment sheet (timeline + log), domains, and the AI fix and create flows.
4. **D4 — Build and configuration:** templates (list, detail, editor), variables (scopes table), GitHub, registries, storage, private network.
5. **D5 — Monitoring and administration:** alerts (rules and history), control plane (bklit charts, machine meters), billing and plans, roles and policies, users and envs (token and card styling of core screens).
6. **D6 — Cleanup:** remove `recharts` and orphaned components, run an accessibility pass with axe on every page, and update this document with anything learned.

---

## 9b. Projects and folders

Project groups are **folders on the Projects page**, not a nav item: folder cards above the projects that are in none; opening one (`?folder=<id>` in the URL) lists its projects with Rename, Delete (its projects move out first) and New project (created inside it). Every project row has "Move to folder", and a selection can be moved at once.

## 9c. Private network

"Who reaches whom" is a React Flow graph (`src/pages/network/ReachGraph.tsx`, lazy): servers on a circle, one edge per pair (green both ways, red dashed one way, red no link, grey dotted not in the mesh), the registry host starred. The old matrix stays in the DOM, visually hidden, for screen readers.

## 9a. Known gaps (core screens)

axe (WCAG 2 A/AA + best practices) is clean on our pages in both themes. What remains comes from `src/core/`, which we don't edit:

- Core's generated list pages (servers, plans, roles, policies, users, envs) have no `h1` and an unlabelled select-all checkbox, and their card/table toggle switches to core's generic table (our card override is the designed view).
- Core's breadcrumb renders the home crumb as a bare icon link; the shell labels it ("Home") after each navigation (`src/layouts/console/index.tsx`).
- Base UI tooltips and popovers portal outside the landmarks (axe "region", best practice only).

Raise these upstream with thunder-ui rather than patching core.

## 10. Rules for future changes

- Start every page with `PageHeader`; build with the kit; add new patterns to the kit (and to §5) first.
- No hard-coded colors (`text-sky-600`, `bg-[#…]`) outside `lib/hues.ts` and the tokens; status always through `StatusBadge` or `StatusDot`.
- Lists are `DataTable` unless a card grid is clearly better; dense rows, 13 px.
- Charts only through `src/components/charts/` presets.
- Check light, dark, phone and Arabic before calling a UI change done; run axe on the page (both themes).
- No palette colors (`text-amber-700`, `bg-sky-500/10`) on content: status tokens (`bg-warning-soft text-warning-foreground` …) and `text-brand-text` for orange text.
- Panels `rounded-[10px]`, inner boxes `rounded-lg`; no gradients, glass or large icon tiles on content.
