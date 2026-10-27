# Architecture

A short map of the system. The full specification, with numbers and budgets, is [PLAN.md](PLAN.md); section references below point there.

## Components

| Component | Where | Role |
|---|---|---|
| Control plane | this repo (`routes/`, `lib/`, `schemas/`, `scripts/`) | Thunder with MongoDB, stateless and serverless-style (no background jobs). Runs on a dedicated EC2 host from `deploy.docker-compose.yml`, behind Traefik with frps for the ingress ([INGRESS.md](INGRESS.md), setup A). Auth, tenants, RBAC and wallets come from the thunder-core plugin. |
| Agent | `agent/` (Go) | On each machine it is a host: it creates partitions (Sysbox system containers, §27). Each partition runs the same agent as a server: reconciles Docker to the desired state, builds, streams logs on request. |
| Dashboard | `public/app` | thunder-ui (React). Screens are generated from the backend zod schemas through the SDK. |

## Transport (§3)

There is no gateway and no persistent connection. Agents **poll** `POST /agents/api/poll` and push results to `POST /agents/api/events`.

- **The poll is the heartbeat.** It renews a 10 s lease in a tiny `serverLeases` document with one `findOneAndUpdate`. An idle poll costs exactly one database operation.
- **Cursors, not timestamps:** each poll acknowledges the last command sequence and applied desired-state version, so delivery is exactly once even when responses are lost.
- **Adaptive intervals:** 5 s idle, 1 s active, 150 ms with a terminal open (`AGENT_POLL_*` settings). The control plane sets the interval in every response.
- **Long polling (§16 Phase 13):** a poll with nothing to deliver waits up to 25 s and answers as soon as a command, spec or terminal input arrives.
- **Offline detection without cron:** a sweep sharded 64 ways is piggybacked on ordinary requests, with the due check in memory. Alerts leave through an outbox, never inside a poll.

## Desired state (§4.4)

The control plane stores *what should run where*. Whenever something affecting a server changes, its spec is computed once, sealed to that agent's key and stored. The poll path only returns the stored blob: no joins, rendering or decryption per poll.

## Code layers (§23)

```
routes/<group>/   HTTP adapters: shape() + parse → authorize → call a service → respond
lib/<domain>/     domain services: business rules, composed from building blocks
lib/core/         building blocks, domain-agnostic, written once
schemas/<domain>/ zod schemas + models: types, validation, UI metadata, protocol
```

Dependencies point downward only (`deno task check:layers`). `lib/services.ts` is the composition root: services are built once at module load and receive their dependencies through constructors, so tests construct them with fakes.

Building blocks so far: `BoundedCache` (every in-memory cache), `Keyring` (envelope encryption), `settings` (cached admin settings), `QuotaGuard` and `RateLimiter` (plan and safety limits), `Entitlements` (effective plan).

## Data minimization (§3.5)

Stored with us: accounts, tenants, servers, desired specs, deployment metadata, encrypted variables. Logs, metrics, footprints, terminal sessions and plaintext secrets never are: they stay on the user's machines and are streamed on demand.

## Decisions

Recorded in [adr/](adr/). Rejected alternatives with reasons are in [CONTEXT.md](CONTEXT.md) §3.
