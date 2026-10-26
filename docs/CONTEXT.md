# Huruf Deploy — Session Context (handoff)

Background from the planning conversation that is **not** in [PLAN.md](PLAN.md). Read PLAN.md for the product and technical spec. This file covers how to work with the project owner, facts about the environment, why alternatives were rejected, and what to do on a new machine.

---

## 1. Working agreements with the project owner

- **No code until explicitly asked.** Planning and discussion come first. When implementation starts, build **one phase or sub-phase at a time** (PLAN.md §16) and stop for review after each.
- **The owner makes product decisions.** Give a clear recommendation with trade-offs, then follow their choice. When their idea has a hidden cost (security, scale, money), say so plainly with numbers. They value that, e.g. the attacker-machine pairing risk, the cost of a 10 s lease, and the hot-lock bottleneck they caught themselves.
- **Priorities, in order:**
  1. **Backend performance** (mandatory; nothing expensive on the agent poll path).
  2. **Code quality** (no duplication; composable modules and classes).
  3. Clean, accessible UI (shadcn-first).
  4. Open-source friendliness.
- **Data minimization:** store as little as possible on our side. Logs, metrics, footprints and capacity history stay on the agent machines.
- **Caps everywhere:** every in-memory cache and buffer must be bounded (the owner raised memory-leak concerns).
- **Trust the owner on Thunder internals.** They corrected two of my assumptions, now fixed in CLAUDE.md and PLAN.md:
  - Route sub-folders are organizational only (`routes/hr/payroll.ts` ≡ `routes/payroll.ts`).
  - The SDK is regenerated with `deno task generate:sdk -v 0.0.1 --overwrite`, followed by `npm run build` in `public/app`.

## 2. Environment facts verified during planning

- **Thunder project** with the **thunder-core** plugin already present in `plugins/Huruf-Tech/thunder-core/`. It's unknown whether its setup lifecycle (indexes + RBAC seed) has been run; if not, run `deno task setup:plugin -n Huruf-Tech/thunder-core`.
- **thunder-ui** is generated in `public/app/`:
  - Its rules are in `public/app/llms.txt`, which matches the upstream copy that was read.
  - The layout is **navbar**, the default, since `VITE_APP_LAYOUT` isn't set in `public/app/.env`.
  - It's served at `/app` from the build output `public/app/www` (`routes/index.ts`, handler `app`). `public/www` holds the API's own static files and `sdk@0.0.1`.
- shadcn config (`public/app/components.json`): style `base-luma` (Base UI primitives), Tabler icons, RTL on, extra registries `@reui` and `@coss`.
- Ignore `_temp/` entirely (CLAUDE.md rule; `generate:app` uses it as a clone cache).

## 3. Rejected alternatives (and why). Don't re-propose without new reasons

| Rejected | Reason |
|---|---|
| Stateful **gateway** service holding agent WebSockets | The owner wants no extra infrastructure. Polling plus a webhook fits serverless Thunder on Deno Deploy. |
| **Docker Swarm** | The owner wants full control and simplicity. Swarm needs every node to reach every node (NAT problems) and has no native blue-green. Plain Docker + our reconciler + an optional WireGuard mesh was chosen. |
| **Cron / scheduled tick / `Deno.cron`** | Explicitly refused. Liveness comes from poll leases; the sharded sweep is piggybacked on requests. |
| Long lease (60 s) | The owner wants **10 s** (5 s idle polls). The extra request cost was accepted knowingly. |
| Nixpacks / Railpack auto-detect | Out of scope. Only predefined or custom templates (an AI template assistant comes later). |
| macOS agents | Skipped for the MVP (Docker Desktop VM/licensing, no Swarm need anymore but still deferred). |
| Managing domains / hosting a load balancer ourselves | The deploy app must never host a load balancer. Future direction is Cloudflare (Tunnel or LB); deferred until the owner decides. |
| Footprints stored on our side, platform-wide usage averages | Footprints stay on agents; cross-customer averages dropped. |
| Automatic rescheduling to other servers | Users pick servers explicitly ("self-hosted AWS"), so dead servers raise alerts only. |
| Separate agent repo | Monorepo chosen. The agent uses the same license. |

## 4. Things the owner still has to provide (not decided in the plan)

- **Infrastructure and accounts:**
  - A Deno Deploy project (and region).
  - A MongoDB replica set (e.g. Atlas) in the same region. Transactions and TTL indexes need a replica set.
- **Agent distribution:**
  - The public domain for the control plane and for the agent install script (`https://get.<domain>/agent`).
  - A GitHub org/repo for signed agent releases, plus a signing key.
- **Secrets and settings:**
  - Generated secrets: `SECRET_KEY` (thunder-core) and **a separate** `DEPLOY_MASTER_KEY` (envelope encryption).
  - An **HTTP email provider** for alerts (`Mailer.onSendMail`; SMTP is discouraged on hot paths), plus `SMTP_*` if used elsewhere.
  - The `PLATFORM_TENANT` (the tenant receiving subscription payments) and `DEFAULT_CURRENCY`.
- **Payments (Phase 15, PLAN §25):** the Stripe account is the owner's LLC; the owner enters its test and live keys in the settings (`STRIPE_SECRET_KEY` as a restricted key, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`), and a separate `WALLET_TOPUP_TENANT` (settlement account) beside `PLATFORM_TENANT`.

## 5. Moving to the new machine

1. The initial commit exists on `master` (the intended main branch is `main`). Commit and push before switching machines.
   - Project rules live in `.claude/CLAUDE.md`, because `deno task update:core` overwrites the root `CLAUDE.md`.
2. **`.env` files are git-ignored**, including those inside `public/app/`. This is decided: keep them ignored, because the frontend is built locally. Copy them manually to a new machine.
   - The build output `public/app/www` **is committed** (mandatory for now), even though thunder-ui expects it to be ignored. Rebuild and commit it with every UI change.
3. On the new machine:
   - Clone the repo.
   - Run **`deno task setup`**. **Never `deno task init`**, which resets git history.
   - Restore the `.env` files.
   - Run `npm install` in `public/app`, then `deno task generate:sdk -v 0.0.1 --overwrite` and `npm run build`.
   - Run `deno task dev`.
4. **Claude memory doesn't travel** (it is stored per machine). Its contents are in §1 of this file, which CLAUDE.md links to.

## 6. Where things stand

- **Phases 0–10 are built.** Each has a status note in PLAN.md §16 (verified behavior, deviations, known limits); they await the owner's review.
- **Phase 11 (custom domains, built-in ingress)** is built and live since 2026-10-25 (Traefik and frps replaced nginx on the control plane's EC2).
- **Phase 12 (AI template assistant)** and **Phase 13 (long polling, chosen over WebSockets)** are built and await review; each has a status note in PLAN.md §16, and "Fixes after going live" there lists what changed after deployment.
- **Phase 14 backlog:**
  - Done: agent self-update.
  - Done: uninstall ("Remove server", `huruf-deploy-agent uninstall`). The agent records its host changes in `<state-dir>/ledger.jsonl`, and the installer marks fresh installs. Cleanup undoes only ledger entries and objects matched by label or exact name, never by a `huruf-` prefix, because Dokploy apps can be named `huruf-tech-*`. Servers installed before the ledger existed get conservative rules. Docker and project data volumes are kept unless asked.
  - Skipped because they need the owner's decision or consent: everything else.
- **Owner decisions recorded during the build:**
  - Shells are governed by RBAC.
  - Workspace variables come from the workspace owner at deploy time.
  - No audit logs for now.
  - Volume backups are skipped for now.
  - S3 credentials live in storage connections.
  - Managed servers are not built without explicit consent.
- **Open items for the owner:**
  - Framework (thunder-ui core, not editable here):
    - `src/core/crud/ViewPage.tsx` redirects `<id>` to `form/<id>` with a path that already contains the base, so the router adds `/app` twice. Our cards avoid it by opening `form/<id>`; core's own users or links through `<id>` still hit it.
    - Core's axios interceptor toasts "Request failed with status code …" whenever an error body is plain text (`Response.badRequest("…")`), next to the page's own message.
  - Framework test `tests/router.test.ts` ("500 details are hidden in production") fails under `ENV_TYPE=test`; it belongs to the framework.
  - Verification emails: thunder-core doesn't configure Better Auth's `emailVerification`, so no verification email is sent. The fix belongs in the plugin.
  - Alert channels: confirm that email (needs real SMTP settings) and Slack (needs a workspace webhook) arrive.
  - Capacity: the "fits N more" ±1 check needs a week of real use.
  - Test database: `.env` now points at production, so tests must never read it alone. A gitignored `.env.test` (local Mongo, `huruf-deploy-test`) overrides it whenever `ENV_TYPE=test`, which `deno task test` sets. On a new machine, create it before running tests.
