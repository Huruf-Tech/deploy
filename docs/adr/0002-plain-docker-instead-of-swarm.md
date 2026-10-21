# 2. Plain Docker managed by our agent; no Docker Swarm

- **Status:** accepted
- **Spec:** PLAN D13, §8.6

## Context

Workloads span several user servers. Docker Swarm offers scheduling and an overlay network, but needs every node to reach every node (a problem behind NAT), has no native blue-green, and becomes a second source of truth next to our database.

## Decision

Each agent manages plain Docker on its server and reconciles it to the desired state. Docker's restart policy handles crashed containers; the control plane orchestrates rollouts across servers. Cross-server networking is an optional WireGuard mesh per server.

## Consequences

- Servers work standalone, including behind NAT; the private network is opt-in.
- Rollouts, health-gated routing and blue-green are ours end to end and debuggable.
- We own more code (reconciler, DNS, mesh, rollouts): roughly 3–5 extra weeks, accepted for control and simplicity.
