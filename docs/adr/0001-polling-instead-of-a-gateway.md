# 1. Agents poll; no gateway or persistent connections

- **Status:** accepted
- **Spec:** PLAN D2, §3

## Context

Agents run on user machines, often behind NAT, and must receive work from the control plane. The control plane is serverless (Thunder on Deno Deploy), where long-lived connections are not a reliable primitive. A stateful gateway holding agent WebSockets would add infrastructure to run, scale and keep highly available.

## Decision

Agents poll the control plane over HTTPS and push results to an events endpoint. Every request is signed with the agent's Ed25519 key. The control plane chooses the next poll interval in each response (idle, active, terminal modes).

## Consequences

- No extra infrastructure; works through NAT and firewalls with outbound HTTPS only.
- Request volume grows with servers × poll frequency, so the poll path has a strict budget (one DB operation when idle) and the interval is server-controlled.
- Interactive features (terminal) are slower than over a socket: about 0.4–1 s echo. Long-polling is a backlog spike.
