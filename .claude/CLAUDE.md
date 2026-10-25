# Huruf Deploy — project rules

The root `CLAUDE.md` is framework-managed (`deno task update:core` overwrites it). Project-specific rules live here.

- Product spec and phases: [docs/PLAN.md](../docs/PLAN.md). Backend performance budgets (§20) are mandatory.
- Working agreements, rejected alternatives and handoff notes: [docs/CONTEXT.md](../docs/CONTEXT.md). No code until the owner says go; one phase at a time with review.
- Dashboard UI lives in `public/app` (thunder-ui, `navbar` layout), served at `/app` from its build output `public/app/www`. **Never edit `public/app/src/core/`**; extend via `src/overrides/`, `src/pages/`, `src/components/`. shadcn/ui first for components.
- **Dashboard design system:** [docs/DESIGN.md](../docs/DESIGN.md) — tokens, the `console` shell, the component kit, bklit charts, accessibility and the rules for any UI change. Read it before touching UI, and update it when a rule changes.
- After any backend schema/route change: `deno task generate:sdk -v 0.0.1 --overwrite`, then `npm run build` in `public/app`.
- Managed servers (PLAN D42/§24) are optional and must not be implemented without the owner's explicit consent.
