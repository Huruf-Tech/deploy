# Thunder UI

A React + Vite dashboard boilerplate for [Thunder Framework](https://thunder.huruftech.com/).

It reads your backend's schemas through a generated `thunder-sdk` and builds navigation, list
pages and forms for every module automatically. Beyond that it is a normal React app — add your
own pages, components, features and layouts however you like.

> **Looking for the full reference?** [`llms.txt`](./llms.txt) documents everything: route
> generation, the schema → form pipeline, every extension point, theming, i18n, integrations and
> the mobile build. It is written for an AI agent but reads fine as a human reference.

## Installation

Thunder UI is not installed with a package manager. It is generated into a Thunder Framework
project, from that project's root:

```bash
deno task generate:app
```

That clones Thunder UI into `public/app/`, generates an SDK into `public/www/sdk@<version>/`,
links the app to it, and runs the first install and build.

## The one rule

**`src/core/` is read-only. Everything outside it is yours.**

Updating pulls the latest Thunder UI by replacing `src/core/` wholesale:

```bash
deno task generate:app --forceSync
```

Any edit inside `src/core/` is lost on every sync, with no warning. Build on top instead —
register in `src/overrides/`, and put your own code anywhere else.

## Two kinds of update

These are different things, and conflating them is the most common source of confusion:

| What changed | What to run |
| --- | --- |
| **Your backend** — a schema or a route's shape | `deno task generate:sdk -v <version> --overwrite`, then rebuild |
| **Thunder UI itself** — an upstream fix | `deno task generate:app --forceSync` |

If you added a field or a module on the backend and the UI is not showing it, the SDK has not
been regenerated.

## What you get

- **Generated CRUD** — a list page, create/update forms and a detail route per backend module,
  derived from its JSON Schema. Table columns, filters and form controls all follow the schema.
- **Four layouts** — `navbar`, `sidebar`, `mobile`, `native`, selected with `VITE_APP_LAYOUT`.
  `native` is one adaptive shell: a tab bar, large titles and an edge-swipe back on a phone, a
  persistent sidebar on a desktop. Register your own in `src/overrides/layouts.ts` and name it in
  the same env var. Only the selected layout is bundled.
- **Theming** — Tailwind v4 tokens in `src/index.css`, light/dark/system, full RTL.
- **i18n** — English and Arabic, with your translations merged over the framework's.
- **Hybrid** — Capacitor is pre-configured; the same codebase builds for Android and iOS.
- **Integrations** — Triggers for notifications, ImageKit for uploads.

Built-in wallet, users and notification pages ship behind `VITE_ENABLE_*` flags, all **off by
default**.

## Shaping the UI from the backend

Layout, labels, control types and which columns are filterable are declared on the backend, as
zod `.meta()` on your schema fields:

```ts
fname: z.string().max(50).meta({
  group: "fullName",                        // same row as its neighbours
  groupClassName: "grid grid-cols-2 gap-4", // the group's layout
  label: "First Name",
}),
gender: z.enum(Gender).optional().meta({ canFilter: true }),
user: $objectId.meta({ ref: "users", refLabel: ["name", "email"] }),
```

`.group("Label")` on the backend router decides the navigation group. See
[`llms.txt`](./llms.txt) for the complete `.meta()` reference and a worked schema.

## Customization

Everything in `src/overrides/` is a registry that core reads at startup:

| File | Replaces |
| --- | --- |
| `crud/lists.tsx` | a whole list page |
| `crud/cards.tsx` | adds a card view beside the table |
| `crud/forms.tsx` | a whole form |
| `crud/views.tsx` | a detail page |
| `icons.tsx` | the nav icon, per module or group |
| `layouts.ts` | registers your own layouts, loaded on demand |
| `routes.tsx` | add routes, or hide/reorder/replace generated and built-in ones |

## Scripts

```bash
npm run dev           # dev server
npm run build         # production build → www/
npm run build:mobile  # build + npx cap sync
npm run typecheck     # tsc -b
npm run lint          # eslint
npm run i18n:check    # report missing or untranslated keys
```

## Configuration

All variables are prefixed `VITE_`. [`.env.example`](./.env.example) is the annotated list.

## Reference

[`llms.txt`](./llms.txt) is the full reference for this project — route generation, the
schema → form pipeline, every extension point, theming, i18n, integrations and the mobile
build.
