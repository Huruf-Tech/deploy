# Dashboard design system and redesign plan

The dashboard (`public/app`, thunder-ui) is a DevOps console: people scan it to see what's running, what's wrong and what changed, then act. This document is the plan for the redesign **and** the reference for every UI change after it. Read it before touching UI; update it when a rule changes.

Status: **plan, awaiting the owner's go.** Phases are in §9.

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

### Color

| Token | Use |
|---|---|
| `--background` | App canvas. Light: near-white. Dark: near-black (not pure black). |
| `--surface` (new) | Panels and cards: one step above the canvas. |
| `--surface-raised` (new) | Popovers, sheets, sticky headers. |
| `--border`, `--border-strong` (new) | Hairlines (1 px) between rows and around panels; stronger for inputs. |
| `--muted-foreground` | Secondary text. At least 4.5:1 contrast on `--surface`. |
| `--primary` | The brand accent (current orange, refined in OKLCH): primary buttons, links, focus ring, selection. Never used for status. |
| `--success`, `--warning`, `--danger`, `--info` (+ `-soft`, `-foreground`) | Status only: dots, badges, meter fills, banners. One hue each, tuned for both themes and AA contrast. |
| `--chart-1…5` | Chart series, a categorical palette distinct from the status colors. |

Hues identify kinds of resources only where the kit says so: CPU, memory and disk meters have fixed hues (sky, violet, emerald), as today. Everything else is neutral.

### Type

- Inter for UI, Geist for headings, JetBrains Mono (or the system mono) for ids, hashes, hostnames, code and numbers in tables; all numbers use `tabular-nums`.
- Scale: 12 (captions, table meta), **13 (tables, dense lists, the default)**, 14 (body, forms), 16 (section titles), 20 (page titles), 28 (single hero numbers only).
- Arabic resolves to Cairo per character (core's font setup).

### Space, size, radius

- 4 px grid. Page gutters 16 px (mobile) / 24 px (desktop). Panel padding 12–16 px. Gaps 8 / 12 / 16.
- Controls 32 px high (`h-8`); compact toolbar controls 28 px. Table rows 36 px. Touch targets are still 40 px on coarse pointers.
- Radius: 6 (inputs, badges), 8 (buttons), 10 (panels), 12 (sheets and dialogs). Panels get a hairline border, not a shadow; shadows only on floating layers.
- Content is full width, with readable maxima: forms 640 px, prose 720 px.

### Elevation and depth

Flat by default: canvas → surface (border) → raised (border + soft shadow). No glass effects on content; the shell may use core's `glass` utility for the top bar.

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

- **Sidebar:** the tenant switcher on top, nav grouped by route group (Applications, Infrastructure, Build, Configuration, Monitoring, Administration) with small group labels, active state as a filled pill, and counts or status dots where useful (e.g. servers offline, open alerts). Account and theme sit at the bottom.
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

Rules: pages compose these; new patterns get added here first, then used. The kit lives in our own folder, so core syncs never touch it.

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

- Install through the CLI into `src/components/charts/` (registry entry added to `components.json`). Its dependencies (`@visx/*`, `d3-*`, `@number-flow/react`; `motion` we have) are justified: they replace `recharts` once every chart is migrated, and `recharts` is then removed.
- Wrap them in `src/components/charts/` presets with our defaults: compact margins, no entry animation on refresh (only on first draw, and none under reduced motion), tooltips with units, `--chart-*` colors, and time axes in the viewer's locale.

---

## 7. Motion and feedback

- Durations 120–200 ms, ease-out `cubic-bezier(0.23, 1, 0.32, 1)`; no ease-in; nothing over 300 ms in the UI.
- Animate: sheets and dialogs (enter/exit), popovers (from their trigger), toasts, a pressed button (`scale(0.98)`), skeleton → content (fade only).
- Don't animate: data refreshes (numbers and rows just update), keyboard actions, the command palette, table sorting.
- `prefers-reduced-motion`: opacity only.

---

## 8. Accessibility checklist (every page)

- Contrast AA (4.5:1 text, 3:1 large text and UI parts) in both themes; status always has text or an icon besides color.
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

## 10. Rules for future changes

- Start every page with `PageHeader`; build with the kit; add new patterns to the kit (and to §5) first.
- No hard-coded colors (`text-sky-600`, `bg-[#…]`) outside `lib/hues.ts` and the tokens; status always through `StatusBadge` or `StatusDot`.
- Lists are `DataTable` unless a card grid is clearly better; dense rows, 13 px.
- Charts only through `src/components/charts/` presets.
- Check light, dark, phone and Arabic before calling a UI change done.
