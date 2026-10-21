# Contributing to Huruf Deploy

Thanks for helping. This guide covers how work is organized and the rules every change follows. By participating you agree to the [Code of Conduct](CODE_OF_CONDUCT.md).

## Before you start

- Read [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), then the relevant section of [docs/PLAN.md](docs/PLAN.md).
- Check [docs/adr/](docs/adr/) and [docs/CONTEXT.md](docs/CONTEXT.md) §3 before proposing an alternative design: several were already considered and rejected, with reasons.
- Work is built **one phase or sub-phase at a time** (PLAN §16). Keep a PR inside one.

Setup is in the [README](README.md#getting-started).

## Rules that are easy to miss

**Framework**
- Never edit `core/`, `plugins/` or `public/app/src/core/`. Update tasks overwrite them. Extend through `routes/`, `lib/`, `schemas/`, `scripts/`, and `public/app/src/{overrides,pages,components}`.
- Read [`llms.txt`](llms.txt) (framework), [`plugins/Huruf-Tech/thunder-core/llms.extension.txt`](plugins/Huruf-Tech/thunder-core/llms.extension.txt) and [`public/app/llms.txt`](public/app/llms.txt) (dashboard) before writing code against them.
- Routers and handlers are **named functions**; imports use the `@/` alias; zod schemas live in the prepare phase.

**Architecture** (PLAN §23)
- Layers point downward only: `routes/` → `lib/<domain>/` → `lib/core/` → `schemas/`. `deno task check:layers` enforces it.
- No duplication: the second time logic appears, extract it into a building block. CI runs a duplication check.
- Variants are strategy classes, not `if`/`switch` branches spread across the code.
- Types come from zod schemas; never re-declare them.

**Performance** (PLAN §20, mandatory)
- Nothing expensive on the agent poll path. Every query is index-covered and bounded.
- Every in-memory cache keyed by an unbounded identity uses `BoundedCache` and gets a row in PLAN §20.4.
- Admin settings are read through `lib/core/settings.ts`, never `Env` directly on a request path (its database fallback is uncached).

**Data**
- Indexes go in `scripts/syncDeployIndexes.ts`, permissions in `scripts/syncDeployAccessControl.ts`. Nothing runs at startup.
- Reference fields are named after the entity (`tenant`, not `tenantId`).

## Workflow

1. Branch from `master`.
2. `deno task check`, `deno task test`, and for dashboard changes `npm run typecheck && npm run lint && npm run i18n:check` in `public/app`.
3. After a schema or route change: `deno task generate:sdk -v 0.0.1 --overwrite`, then `npm run build` in `public/app`, and commit `public/app/www`.
4. Commit with [Conventional Commits](https://www.conventionalcommits.org/) (`feat(agents): ...`); the `commit-msg` hook enforces it. Note that the `pre-commit` hook stages **all** changes.
5. Open a PR and fill in its checklist.

Every user-facing string goes through `t()` with keys in both `src/locals/en` and `src/locals/ar`. New dependencies need a one-line justification in the PR.

## Reporting bugs and ideas

Use the issue templates. For security issues, do not open a public issue; contact the maintainers privately.
