/**
 * Runs simulated agents against a control plane:
 *
 *   deno task dev:agents --tenant <tenantId> [--count 1] [--url http://localhost:8000]
 *
 * Identities persist in `.agent-sim/`, so restarting keeps the same servers.
 * Every interval comes from the control plane's config; the only built-in
 * value is the retry delay used while the control plane cannot be reached.
 */
import { parseArgs } from "@std/cli/parse-args";
import { join } from "@std/path";
import { createState, SimAgent } from "./agent.ts";

const UNREACHABLE_RETRY_CAP_MS = 60_000;

const args = parseArgs(Deno.args, {
  string: ["tenant", "url", "state"],
  default: { url: "http://localhost:8000", state: ".agent-sim", count: 1 },
});

if (!args.tenant) {
  console.error(
    "Usage: deno task dev:agents --tenant <tenantId> [--count N] [--url URL]",
  );
  Deno.exit(1);
}

await Deno.mkdir(args.state, { recursive: true });

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const run = async (index: number) => {
  const path = join(args.state, `agent-${index}.json`);
  const state = await Deno.readTextFile(path)
    .then(JSON.parse)
    .catch(() =>
      createState(`sim-${crypto.randomUUID().slice(0, 4)}-${index}`)
    );
  const persist = (s: unknown) =>
    Deno.writeTextFile(path, JSON.stringify(s, null, 2));
  await persist(state);

  const agent = new SimAgent(state, {
    baseUrl: args.url,
    tenant: args.tenant!,
    onStateChange: persist,
  });
  const log = (msg: string) => console.log(`[${state.hostname}] ${msg}`);

  const jitter = (ms: number) => {
    const spread = (agent.config?.jitterPercent ?? 0) / 100;
    return ms * (1 - spread + Math.random() * 2 * spread);
  };

  let lastStatus = "";
  let lastSummaryAt = 0;
  let failures = 0;
  let registered = false;

  while (true) {
    try {
      if (!registered) {
        const { status, json } = await agent.hello();
        if (status !== 200) {
          throw new Error(`hello ${status}: ${JSON.stringify(json)}`);
        }
        if (json.status === "pending") {
          log(`pending approval. Pairing code: ${json.pairingCode}`);
        }
        registered = true;
      }

      const config = agent.config!;
      const sendSummary = Date.now() - lastSummaryAt > config.summaryIntervalMs;
      const { status, json } = await agent.poll({ summary: sendSummary });
      failures = 0;

      if (status === 200) {
        if (sendSummary) lastSummaryAt = Date.now();
        if (lastStatus !== "active") log("online");
        lastStatus = "active";
        for (const seq of agent.executed.splice(0)) log(`ran command #${seq}`);
      } else if (status === 403) {
        if (json.status === "rejected") {
          log("rejected by the tenant; stopping");
          return;
        }
        if (json.status === "unknown") registered = false;
        lastStatus = String(json.status);
      } else if (status !== 429) {
        throw new Error(`poll ${status}: ${JSON.stringify(json)}`);
      }

      await sleep(jitter(Number(json.nextPollMs) || config.poll.idleMs));
    } catch (error) {
      failures++;
      const cap = agent.config?.maxBackoffMs ?? UNREACHABLE_RETRY_CAP_MS;
      const backoff = Math.random() * Math.min(cap, 1_000 * 2 ** failures);
      log(`${(error as Error).message}; retrying in ${Math.round(backoff)} ms`);
      await sleep(backoff);
    }
  }
};

await Promise.all(Array.from({ length: Number(args.count) }, (_, i) => run(i)));
