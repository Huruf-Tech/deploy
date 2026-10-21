import { assert, assertEquals } from "@std/assert";
import { ObjectId } from "mongodb";
import handler from "@/serve.base.ts";
import { mongodb } from "@/database.ts";
import { acceptServer, issueCommand } from "@/lib/agents/servers.ts";
import { sweepShard } from "@/lib/agents/sweep.ts";
import { createState, SimAgent } from "@/tools/agent-sim/agent.ts";
import { serverModel } from "@/schemas/infrastructure/server.ts";
import { serverLeaseModel } from "@/schemas/infrastructure/serverLease.ts";
import { agentCommandModel } from "@/schemas/infrastructure/agentCommand.ts";
import { tenantUsageModel } from "@/schemas/limits/tenantUsage.ts";
import { tenantModel } from "@/plugins/Huruf-Tech/thunder-core/schemas/tenant.ts";

// End-to-end over the real handler, in process (needs MongoDB + `deno task setup:dev`).

// Real agents never poll faster than SAFETY_MIN_POLL_INTERVAL_MS (250 ms); neither does this test.
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
Deno.test({
  name: "agent protocol: pairing, polling, exactly-once commands, offline",
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async (t) => {
    const tenant = new ObjectId();
    const user = { _id: new ObjectId(), emailVerified: true };
    await tenantModel.insertOne({
      _id: tenant,
      name: "agents-test",
      createdBy: user._id,
      createdAt: new Date(),
    });

    const agent = new SimAgent(await createState("test-host"), {
      baseUrl: "http://localhost",
      tenant: tenant.toHexString(),
      send: (req) => Promise.resolve(handler(req)),
    });
    let server!: ObjectId;
    const poll = async (opts?: Parameters<typeof agent.poll>[0]) => {
      await sleep(260);
      return agent.poll(opts);
    };

    try {
      await t.step(
        "hello registers a pending server with a pairing code",
        async () => {
          const { status, json } = await agent.hello();
          assertEquals(status, 200);
          assertEquals(json.status, "pending");
          assertEquals(json.pairingCode?.length, 6);
          server = ObjectId.createFromHexString(json.server);

          const again = await agent.hello();
          assertEquals(again.json.server, json.server);
        },
      );

      await t.step("a pending server cannot poll", async () => {
        const { status, json } = await poll();
        assertEquals(status, 403);
        assertEquals(json.status, "pending");
      });

      await t.step("accept requires the matching pairing code", async () => {
        const { json } = await agent.hello();
        const wrong = await acceptServer({
          server,
          tenant,
          user,
          pairingCode: "AAAAAA",
        }).catch((r: Response) => r.status);
        assertEquals(wrong, 400);

        await acceptServer({
          server,
          tenant,
          user,
          pairingCode: json.pairingCode!,
        });
        const usage = await tenantUsageModel.findOne({ tenant });
        assertEquals(usage?.servers, 1);
      });

      await t.step(
        "polling pace comes from the control plane's config",
        async () => {
          assertEquals(agent.config?.poll.idleMs, 5_000);

          const { status, json } = await poll({ summary: true });
          assertEquals(status, 200);
          assertEquals(json.nextPollMs, agent.config?.poll.idleMs);
          assertEquals(json.configVersion, agent.configVersion);
          assertEquals(json.commands, []);

          // A stale config version makes the agent refetch it.
          agent.configVersion = "stale";
          await poll();
          assertEquals(agent.configVersion, json.configVersion);
        },
      );

      await t.step(
        "commands are delivered exactly once despite a lost response",
        async () => {
          const { seq } = await issueCommand({ server, tenant, type: "ping" });

          // The agent receives the command but the response is "lost": it
          // replays the old cursor and gets the same command again.
          await poll({ cursor: 0 });
          const replay = await poll({ cursor: 0 });
          assertEquals((replay.json.commands as { seq: number }[])[0].seq, seq);
          assertEquals(agent.executed, [seq]);

          // Acking with the real cursor delivers nothing new.
          const acked = await poll();
          assertEquals(acked.json.commands, []);

          const command = await agentCommandModel.findOne({ server, seq });
          assertEquals(command?.status, "done");
          assert(command?.result?.pong);
        },
      );

      await t.step("duplicate events are not applied twice", async () => {
        const event = {
          id: "dup-1",
          type: "command.result" as const,
          data: { seq: 999, ok: true },
        };
        const first = await agent.sendEvents([event]);
        const second = await agent.sendEvents([event]);
        assertEquals(first.json.applied, 1);
        assertEquals(second.json.applied, 0);
      });

      await t.step("a forged signature is rejected", async () => {
        const forged = new SimAgent(
          {
            ...agent.state,
            signPrivateKey: (await createState("x")).signPrivateKey,
          },
          {
            baseUrl: "http://localhost",
            tenant: tenant.toHexString(),
            send: (req) => Promise.resolve(handler(req)),
          },
        );
        const { status } = await forged.poll();
        assertEquals(status, 401);
      });

      await t.step(
        "an expired lease is swept offline, and a poll recovers it",
        async () => {
          await serverLeaseModel.updateOne({ _id: server }, {
            $set: { aliveUntil: new Date(Date.now() - 1_000) },
          });
          const lease = await serverLeaseModel.findOne({ _id: server });
          await sweepShard(lease!.shard);
          assertEquals(
            (await serverLeaseModel.findOne({ _id: server }))?.offline,
            true,
          );

          await poll();
          const recovered = await serverLeaseModel.findOne({ _id: server });
          assertEquals(recovered?.offline, false);
          assertEquals(recovered?.offlineSince, undefined);
        },
      );
    } finally {
      await Promise.all([
        tenantModel.deleteOne({ _id: tenant }),
        serverModel.deleteMany({ tenant }),
        serverLeaseModel.deleteMany({ tenant }),
        agentCommandModel.deleteMany({ tenant }),
        tenantUsageModel.deleteOne({ tenant }),
      ]);
      await mongodb.close();
    }
  },
});
