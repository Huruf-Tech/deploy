# Huruf Deploy

Deploy and run apps on **your own servers** with Docker, from one dashboard. Think of it as a self-hosted AWS: keep adding machines to a pool as you grow, and place projects on them.

- **We host the control plane** (dashboard + API), a serverless [Thunder](https://github.com/Huruf-Tech/thunder) app on Deno Deploy with MongoDB.
- **You bring the machines** (Ubuntu VMs, EC2, bare metal) and run a small agent on them.
- **Builds and workloads run on your machines.** Logs, metrics and secrets stay there; the control plane stores as little as possible.

> **Status:** early development (Phase 0 of the [plan](docs/PLAN.md)). Not usable yet.

## How it works

1. The agent (Go) polls the control plane over HTTPS. Each poll renews a 10 s lease, so the control plane knows which servers are online without a gateway or persistent connections.
2. You describe what should run where. The control plane precomputes a sealed **desired state** per server, and each agent converges to it.
3. Rollouts across servers are orchestrated by the control plane, event by event: rolling, all at once (blue-green) or stop first.

Details: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), full spec in [docs/PLAN.md](docs/PLAN.md), key decisions in [docs/adr/](docs/adr/).

## Repository layout

```
routes/      HTTP adapters (one router per resource; sub-folders are organizational only)
lib/core/    shared building blocks (BoundedCache, Keyring, QuotaGuard, ...)
lib/<domain> domain services
schemas/     zod schemas + models: the single source of truth
scripts/     setup (indexes, permissions, seeds) and checks
tests/       Deno tests
public/app/  dashboard (thunder-ui, React); its build output public/app/www is committed
core/, plugins/   framework and thunder-core plugin: managed by update tasks, never edited
```

## Getting started

Requirements: Deno 2, Node 22 (dashboard only), and a MongoDB **replica set** (transactions and TTL indexes need one).

```bash
git clone https://github.com/Huruf-Tech/huruf-deploy.git
cd huruf-deploy
deno task setup        # git hooks; never run `deno task init`, it resets git history
```

Create `.env`:

```bash
DATABASE_URL=mongodb://localhost:27017/huruf-deploy?replicaSet=rs0
BASE_URL=http://localhost:8000
SECRET_KEY=<random string>
BETTER_AUTH_CAPABILITIES=email,signup
DEPLOY_MASTER_KEY=<32 random bytes, base64>   # must differ from SECRET_KEY
```

Then:

```bash
deno task setup:dev    # indexes, permissions, Free plan (idempotent)
deno task dev          # API on http://localhost:8000, dashboard on /app
```

Dashboard work happens in `public/app` (`npm install`, `npm run dev`). See [CONTRIBUTING.md](CONTRIBUTING.md).

## Commands

| Command | What it does |
|---|---|
| `deno task dev` | API with hot reload |
| `deno task check` | format + lint |
| `deno task test` | tests (some need MongoDB) |
| `deno task check:layers` | dependency-direction check |
| `deno task setup:dev` / `setup:prod` | database setup for an environment |
| `deno task generate:sdk -v 0.0.1 --overwrite` | regenerate the SDK after a schema or route change, then `npm run build` in `public/app` |

The framework's own README is kept as `thunder.README.md` (refreshed by `deno task update:core`).

## License

[MIT](LICENSE). The agent uses the same license.
