/**
 * Load test for the agent protocol (PLAN §16 Phase 1, §20.2):
 *
 *   deno task load:agents --count 1000 --duration 60 [--url http://localhost:8000] [--kill 100]
 *
 * Creates a throwaway tenant with `count` servers already accepted (written
 * straight to the database, so setup is instant), runs one simulated agent per
 * server at the control plane's pace, then stops `kill` agents and measures how
 * long the sweep takes to flag them offline. Everything is deleted afterwards.
 *
 * Client-side latency includes signing and HTTP on this machine, so it is an
 * upper bound for the server's own time.
 */
import { parseArgs } from "@std/cli/parse-args";
import { ObjectId } from "mongodb";
import { mongodb } from "@/database.ts";
import { fingerprintOf } from "@/lib/agents/signing.ts";
import { shardOf } from "@/lib/agents/sweep.ts";
import { createState, SimAgent } from "./agent.ts";

const args = parseArgs(Deno.args, {
  string: ["url"],
  default: {
    url: "http://localhost:8000",
    count: 1000,
    duration: 60,
    kill: 100,
  },
});
const count = Number(args.count);
const durationMs = Number(args.duration) * 1000;
const killCount = Math.min(Number(args.kill), count);

const db = mongodb.db();
const tenant = new ObjectId();
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

console.log(`Creating ${count} accepted servers...`);
await db.collection("tenants").insertOne({
  _id: tenant,
  name: "load-test",
  createdBy: new ObjectId(),
  createdAt: new Date(),
});

const agents: { agent: SimAgent; server: ObjectId; stop: boolean }[] = [];
const servers = [];
const leases = [];
const now = new Date();

for (let i = 0; i < count; i++) {
  const state = await createState(`load-${i}`);
  const server = new ObjectId();
  servers.push({
    _id: server,
    tenant,
    name: state.hostname,
    labels: {},
    status: "active",
    identity: {
      signPublicKey: state.signPublicKey,
      boxPublicKey: state.boxPublicKey,
      fingerprint: await fingerprintOf(state.signPublicKey),
    },
    installMethod: "manual",
    provider: { kind: "byo" },
    inventory: {
      hostname: state.hostname,
      os: "load",
      arch: "amd64",
      cpuCores: 1,
      memory: 2 ** 30,
      disk: 2 ** 34,
      agentVersion: "load",
    },
    createdAt: now,
  });
  leases.push({
    _id: server,
    tenant,
    shard: shardOf(server),
    status: "active",
    aliveUntil: new Date(now.getTime() + 10_000), // a normal lease: agents renew it on their first poll
    offline: false,
    desiredVersion: 0,
    commandSeq: 0,
    deliveredSeq: 0,
  });
  agents.push({
    agent: new SimAgent(state, {
      baseUrl: args.url,
      tenant: tenant.toHexString(),
    }),
    server,
    stop: false,
  });
}
await db.collection("servers").insertMany(servers);
await db.collection("serverLeases").insertMany(leases);

const latencies: number[] = [];
const statuses = new Map<number, number>();
let errors = 0;
let recording = true;

const loop = async (entry: (typeof agents)[number]) => {
  await entry.agent.hello(); // gets the control plane's config
  const idleMs = entry.agent.config?.poll.idleMs ?? 5_000;
  await sleep(Math.random() * idleMs); // spread the first polls

  while (!entry.stop) {
    const started = performance.now();
    try {
      const { status, json } = await entry.agent.poll();
      if (recording) {
        latencies.push(performance.now() - started);
        statuses.set(status, (statuses.get(status) ?? 0) + 1);
      }
      const spread = (entry.agent.config?.jitterPercent ?? 20) / 100;
      const next = Number(json.nextPollMs) || idleMs;
      await sleep(next * (1 - spread + Math.random() * 2 * spread));
    } catch {
      if (recording) errors++;
      await sleep(1_000);
    }
  }
};

console.log(
  `Running ${count} agents for ${durationMs / 1000}s against ${args.url}...`,
);
const runs = agents.map(loop);
await sleep(durationMs);
recording = false;

const sorted = latencies.sort((a, b) => a - b);
const pct = (p: number) =>
  sorted[Math.floor((sorted.length - 1) * p)]?.toFixed(1);
console.log(
  `\nPolls: ${sorted.length} (${
    (sorted.length / (durationMs / 1000)).toFixed(0)
  }/s), errors: ${errors}`,
);
console.log(`Status codes: ${JSON.stringify(Object.fromEntries(statuses))}`);
console.log(
  `Client latency ms: p50=${pct(0.5)} p95=${pct(0.95)} p99=${pct(0.99)} max=${
    pct(1)
  }`,
);

if (killCount) {
  const killed = agents.slice(0, killCount);
  killed.forEach((entry) => (entry.stop = true));
  const killedAt = Date.now();
  const ids = killed.map((e) => e.server);
  console.log(
    `\nStopped ${killCount} agents; waiting for the sweep to flag them offline...`,
  );

  let flagged = 0;
  while (Date.now() - killedAt < 60_000) {
    flagged = await db.collection("serverLeases").countDocuments({
      _id: { $in: ids },
      offline: true,
    });
    if (flagged === killCount) break;
    await sleep(500);
  }
  console.log(
    flagged === killCount
      ? `All ${killCount} flagged offline after ${
        ((Date.now() - killedAt) / 1000).toFixed(1)
      }s (target ≤ 15s)`
      : `Only ${flagged}/${killCount} flagged offline after 60s`,
  );
}

agents.forEach((entry) => (entry.stop = true));
await Promise.allSettled(runs);
await Promise.all([
  db.collection("tenants").deleteOne({ _id: tenant }),
  db.collection("servers").deleteMany({ tenant }),
  db.collection("serverLeases").deleteMany({ tenant }),
]);
await mongodb.close();
console.log("Cleaned up.");
Deno.exit();
