# 3. Liveness from poll leases and a piggybacked sweep; no cron

- **Status:** accepted
- **Spec:** PLAN D3, D34, §3.4

## Context

The control plane must notice dead servers within seconds, at up to 100k servers, on serverless infrastructure. Writing a timestamp on every poll costs too much at scale, a single lock document becomes a hot spot, and the owner ruled out any scheduler (cron, `Deno.cron`).

## Decision

- Each poll renews a **10 s lease** (`aliveUntil`) in a tiny `serverLeases` document with one unjournaled `findOneAndUpdate`; idle polls run every 5 s.
- Dead servers are found by a **sweep sharded 64 ways**. Each instance keeps the shards' next-run times in memory and touches the database only when a shard looks due; one request wins the claim and does bounded work.
- Sweeps are **piggybacked** on agent polls and dashboard requests. Alerts go to an outbox drained the same way, never inside a poll.

## Consequences

- Offline detection in about 10–15 s; sweep coordination costs about 13 writes/s regardless of server count.
- If no agent and no user is active anywhere, nothing sweeps. Accepted: nobody is there to alert.
- The 5 s idle poll doubles request cost compared with 10 s polls; accepted knowingly.
