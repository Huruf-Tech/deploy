import { assert, assertEquals } from "@std/assert";
// First: loads the server, whose bootstrap patches zod before schemas exist.
import { testSession } from "./_session.ts";
import handler from "@/serve.base.ts";
import { ObjectId } from "mongodb";
import { mongodb } from "@/database.ts";
import { issueCommand } from "@/lib/agents/commands.ts";
import { longPollOptions } from "@/lib/agents/poll.ts";
import { readStream } from "@/lib/agents/streams.ts";
import { stopWatching } from "@/lib/agents/wakeups.ts";
import { flush, INSTANCE } from "@/lib/monitoring/controlPlane.ts";
import { controlPlaneSampleModel } from "@/schemas/monitoring/controlPlane.ts";
import { createState, SimAgent } from "@/tools/agent-sim/agent.ts";
import { joinAsPartition } from "./_partition.ts";

// Long polling (PLAN Phase 13): held polls and reads, woken by new work.

const HOLD_MS = 1_500;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
type TPoll = {
  headers: Headers;
  status: number;
  json: { nextPollMs: number; commands: { seq: number }[] };
};
const timed = async <T>(fn: () => Promise<T>) => {
  const start = Date.now();
  const result = await fn();
  return { result, ms: Date.now() - start };
};

Deno.test({
  name: "long polling: held polls and reads wake on new work",
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async (t) => {
    longPollOptions.maxHoldMs = HOLD_MS;
    const session = await testSession("longpoll");
    const { tenant, tenantId, user } = session;
    const db = mongodb.db();
    const agent = new SimAgent(await createState("longpoll"), {
      baseUrl: "http://localhost",
      tenant,
      send: (req) => Promise.resolve(handler(req)),
    });
    const { json } = await joinAsPartition(agent, tenantId, user);
    const server = new ObjectId(json.server);
    // Catch up: host setup and the first spec arrive on the first polls.
    for (let i = 0; i < 3; i++) {
      await sleep(120);
      await agent.poll();
    }

    try {
      await t.step(
        "an idle poll is held, then says: poll again now",
        async () => {
          await sleep(120);
          const { result, ms } = await timed(() =>
            agent.poll({ wait: true }) as Promise<TPoll>
          );
          assertEquals(result.status, 200);
          assertEquals(result.json.nextPollMs, 0);
          assertEquals(result.json.commands, []);
          assert(ms >= HOLD_MS - 50, `held only ${ms} ms`);
          const lease = await db.collection("serverLeases").findOne({
            _id: server,
          });
          // Alive for the hold plus the usual lease, so it never looks offline.
          assert(lease!.aliveUntil.getTime() > Date.now() + 5_000);
        },
      );

      await t.step("a command wakes the held poll", async () => {
        await sleep(120);
        const held = timed(() => agent.poll({ wait: true }) as Promise<TPoll>);
        await sleep(200);
        const { seq } = await issueCommand({
          tenant: tenantId,
          server,
          type: "ping",
          createdBy: user,
        });
        const { result, ms } = await held;
        assertEquals(result.json.commands.map((c: { seq: number }) => c.seq), [
          seq,
        ]);
        assert(ms < HOLD_MS - 300, `woke after ${ms} ms`);
        assert(result.json.nextPollMs > 0, "comes back at the normal pace");
      });

      await t.step(
        "another instance's command wakes it (change stream)",
        async () => {
          await sleep(120);
          const held = timed(() =>
            agent.poll({ wait: true }) as Promise<TPoll>
          );
          await sleep(200);
          // Written straight to the database, as another instance would:
          // no in-process wake, only the change stream.
          const lease = await db.collection("serverLeases").findOneAndUpdate(
            { _id: server },
            { $inc: { commandSeq: 1 } },
            { returnDocument: "after" },
          );
          await db.collection("agentCommands").insertOne({
            tenant: tenantId,
            server,
            seq: lease!.commandSeq,
            type: "ping",
            payload: {},
            status: "pending",
            createdBy: user,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 60_000),
          });
          const { result, ms } = await held;
          assertEquals(result.json.commands.length, 1);
          assert(ms < HOLD_MS - 300, `woke after ${ms} ms`);
        },
      );

      await t.step("terminal echo through held polls and reads", async () => {
        // The agent long-polls in a loop, at the pace the server asks for.
        let running = true;
        const loop = (async () => {
          while (running) {
            const r = await agent.poll({ wait: true }) as TPoll;
            await sleep(r.json.nextPollMs ?? 100);
          }
        })();
        try {
          const opened = await session.call(
            "POST",
            "/streams/api/terminal/host",
            {
              server: String(server),
              cols: 80,
              rows: 24,
            },
          );
          assertEquals(opened.status, 200, JSON.stringify(opened.json));
          const id = opened.json.session;
          await sleep(500); // the agent opens the terminal
          const latencies: number[] = [];
          let after = 0;
          for (let i = 1; i <= 10; i++) {
            const start = Date.now();
            await session.call("POST", `/streams/api/${id}/input`, {
              items: [{ seq: i, data: `k${i}` }],
            });
            let echoed = "";
            while (!echoed.includes(`k${i}`) && Date.now() - start < 5_000) {
              const read = await session.call(
                "GET",
                `/streams/api/${id}/chunks?after=${after}&wait=true`,
              );
              for (const chunk of read.json.chunks) {
                after = chunk.seq;
                echoed += chunk.data;
              }
            }
            latencies.push(Date.now() - start);
            await sleep(30 + Math.random() * 100); // typing
          }
          latencies.sort((a, b) => a - b);
          const p95 = latencies[Math.ceil(latencies.length * 0.95) - 1];
          console.log("terminal echo ms:", latencies.join(", "));
          assert(p95 <= 300, `echo p95 ${p95} ms`);
        } finally {
          running = false;
          await loop;
        }
      });

      await t.step("held time isn't counted as poll time", async () => {
        await flush(); // start from an empty window
        await sleep(120);
        const { ms } = await timed(() =>
          agent.poll({ wait: true }) as Promise<TPoll>
        );
        assert(ms >= HOLD_MS - 50, "it was held");
        await flush();
        const sample = await controlPlaneSampleModel.findOne(
          { instance: INSTANCE },
          { sort: { at: -1 } },
        );
        const poll = sample!.routes.find((r) => r.route === "agents.poll");
        assert(poll, "the poll was recorded");
        assert(poll.maxMs < 500, `recorded ${poll.maxMs} ms`);
        await controlPlaneSampleModel.deleteMany({ instance: INSTANCE });
      });

      await t.step("an agent that doesn't ask isn't held", async () => {
        await sleep(120);
        const { result, ms } = await timed(() =>
          agent.poll() as Promise<TPoll>
        );
        assert(ms < 500, `took ${ms} ms`);
        assert(result.json.nextPollMs > 0);
      });

      await t.step("a browser read waits for output", async () => {
        const stream = new ObjectId();
        const now = new Date();
        await db.collection("streamSessions").insertOne({
          _id: stream,
          tenant: tenantId,
          server,
          kind: "logs",
          params: {},
          status: "open",
          createdBy: user,
          createdAt: now,
          lastReadAt: now,
          expiresAt: new Date(Date.now() + 60_000),
        });
        const held = timed(() => readStream(stream, tenantId, 0, true));
        await sleep(200);
        await db.collection("streamChunks").insertOne({
          session: stream,
          seq: 1,
          data: "hello",
          expiresAt: new Date(Date.now() + 60_000),
        });
        const { result, ms } = await held;
        assertEquals(result.chunks.map((c) => c.data), ["hello"]);
        assert(ms < 2_000, `woke after ${ms} ms`);

        const idle = await timed(() => readStream(stream, tenantId, 1, false));
        assertEquals(idle.result.chunks, []);
        assert(idle.ms < 500, "without wait, an empty read answers at once");
      });
    } finally {
      longPollOptions.maxHoldMs = undefined;
      await stopWatching();
      await Promise.all([
        db.collection("servers").deleteMany({ tenant: tenantId }),
        db.collection("serverLeases").deleteMany({ tenant: tenantId }),
        db.collection("serverSpecs").deleteMany({ _id: server }),
        db.collection("agentCommands").deleteMany({ tenant: tenantId }),
        db.collection("agentEvents").deleteMany({ server }),
        db.collection("streamSessions").deleteMany({ tenant: tenantId }),
      ]);
      await session.cleanup();
    }
  },
});
