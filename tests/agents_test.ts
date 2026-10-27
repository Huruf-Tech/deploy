import { assert, assertEquals } from "@std/assert";
import { ObjectId } from "mongodb";
import handler from "@/serve.base.ts";
import { mongodb } from "@/database.ts";
import { acceptServer } from "@/lib/agents/servers.ts";
import { issueCommand } from "@/lib/agents/commands.ts";
import { sweepShard } from "@/lib/agents/sweep.ts";
import { createState, SimAgent } from "@/tools/agent-sim/agent.ts";
import { serverModel } from "@/schemas/infrastructure/server.ts";
import { serverLeaseModel } from "@/schemas/infrastructure/serverLease.ts";
import { agentCommandModel } from "@/schemas/infrastructure/agentCommand.ts";
import { tenantUsageModel } from "@/schemas/limits/tenantUsage.ts";
import { tenantModel } from "@/plugins/Huruf-Tech/thunder-core/schemas/tenant.ts";
import { bootstrapSessionModel } from "@/schemas/infrastructure/bootstrapSession.ts";
import { createHash, SupportedHashAlg } from "@/core/utils/hash.ts";
import {
  openStream,
  pendingTerminalInput,
  readStream,
  writeTerminalInput,
} from "@/lib/agents/streams.ts";
import {
  streamChunkModel,
  streamSessionModel,
} from "@/schemas/infrastructure/stream.ts";

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
        // A machine hosts partitions and takes no plan slot (PLAN §27.2).
        const usage = await tenantUsageModel.findOne({ tenant });
        assertEquals(usage?.servers ?? 0, 0);
      });

      await t.step(
        "accepting sets the machine up for partitions",
        async () => {
          const { json } = await poll({ summary: true });
          const [command] = json.commands as {
            type: string;
            payload: Record<string, unknown>;
          }[];
          assertEquals(command.type, "pool.ensure");
          assertEquals(Object.keys(command.payload), ["reserve", "isolated"]);

          const doc = await serverModel.findOne({ _id: server });
          assertEquals(doc?.provider.kind, "machine");
        },
      );

      await t.step(
        "polling pace comes from the control plane's config",
        async () => {
          assertEquals(agent.config?.poll.idleMs, 5_000);

          // Right after a command the server polls at the active pace.
          const { status, json } = await poll();
          assertEquals(status, 200);
          assertEquals(json.nextPollMs, agent.config?.poll.activeMs);
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
          const before = seq - 1;
          await poll({ cursor: before });
          const replay = await poll({ cursor: before });
          assertEquals((replay.json.commands as { seq: number }[])[0].seq, seq);
          assertEquals(agent.executed.filter((s) => s === seq).length, 1);

          // Acking with the real cursor delivers nothing new.
          const acked = await poll();
          assertEquals(acked.json.commands, []);

          const command = await agentCommandModel.findOne({ server, seq });
          assertEquals(command?.status, "done");
          assert(command?.result?.pong);
        },
      );

      await t.step(
        "terminal: keystrokes reach only this server's agent, once each",
        async () => {
          const session = await openStream({
            tenant,
            server,
            user: user._id,
            kind: "terminal",
            params: { cols: 80, rows: 24 },
          });

          // The agent picks up stream.open; the server is now at terminal pace.
          const opened = await poll();
          assertEquals(opened.json.nextPollMs, agent.config?.poll.terminalMs);
          assert(agent.terminals.has(session.toHexString()));

          await writeTerminalInput(session, tenant, [
            { seq: 1, data: "ls -la\r" },
            { seq: 2, cols: 120, rows: 40 },
          ]);
          // A retried browser batch is stored once.
          await writeTerminalInput(session, tenant, [{
            seq: 1,
            data: "ls -la\r",
          }]);

          const delivered = await poll();
          const input = (delivered.json.streamInput as Record<
            string,
            { seq: number }[]
          >)[session.toHexString()];
          assertEquals(input.map((i) => i.seq), [1, 2]);

          // Acked: the next poll delivers nothing new.
          const acked = await poll();
          assertEquals(acked.json.streamInput, undefined);

          const { chunks } = await readStream(session, tenant, 0);
          assertEquals(chunks.map((c) => c.data), ["ls -la\r"]);

          // Another server's agent asking for this session gets nothing.
          const other = await pendingTerminalInput(new ObjectId(), {
            [session.toHexString()]: 0,
          });
          assertEquals(other, undefined);

          // Input is refused for a session of another tenant.
          const foreign = await writeTerminalInput(session, new ObjectId(), [
            { seq: 3, data: "x" },
          ]).catch((r: Response) => r.status);
          assertEquals(foreign, 404);
        },
      );

      await t.step(
        "streams: output reaches readers; idle and foreign sessions are refused",
        async () => {
          const session = await openStream({
            tenant,
            server,
            user: user._id,
            kind: "logs",
            params: { container: "web", tail: 10 },
          });

          // The agent picks up stream.open on its next poll and sends output.
          await poll();
          const { chunks } = await readStream(session, tenant, 0);
          assertEquals(chunks.map((c) => c.seq), [1, 2]);
          assert(chunks[0].data.includes("simulated log line"));

          // Another tenant cannot read it.
          const foreign = await readStream(session, new ObjectId(), 0)
            .catch((r: Response) => r.status);
          assertEquals(foreign, 404);

          // A session nobody reads any more is closed, and the agent is told to stop.
          await streamSessionModel.updateOne({ _id: session }, {
            $set: { lastReadAt: new Date(Date.now() - 60_000) },
          });
          const late = await agent.sendEvents([{
            id: `late-${session}`,
            type: "stream.chunk",
            data: { session: session.toHexString(), seq: 3, data: "late\n" },
          }]);
          assertEquals(late.json.close, [session.toHexString()]);
          assertEquals(late.json.applied, 0);
          assertEquals(
            (await streamSessionModel.findOne({ _id: session }))?.status,
            "closed",
          );
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

      await t.step(
        "an SSH wizard join token activates a server without pairing, once",
        async () => {
          const token = "test-join-token";
          await bootstrapSessionModel.insertOne({
            tenant,
            createdBy: user._id,
            host: "203.0.113.10",
            port: 22,
            username: "root",
            status: "installing",
            tokenHash: await createHash(SupportedHashAlg.SHA_256, token),
            steps: [],
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 60_000),
          });

          const joiner = (name: string) =>
            createState(name).then((state) =>
              new SimAgent(state, {
                baseUrl: "http://localhost",
                tenant: tenant.toHexString(),
                joinToken: token,
                send: (req) => Promise.resolve(handler(req)),
              })
            );

          const first = await (await joiner("ssh-host")).hello();
          assertEquals(first.json.status, "active");
          assertEquals(first.json.pairingCode, undefined);

          const session = await bootstrapSessionModel.findOne({ tenant });
          assertEquals(session?.status, "registered");
          assertEquals(session?.server?.toString(), first.json.server);

          // The token is spent: another machine presenting it must pair normally.
          const second = await (await joiner("intruder")).hello();
          assertEquals(second.json.status, "pending");
        },
      );
    } finally {
      await Promise.all([
        bootstrapSessionModel.deleteMany({ tenant }),
        streamSessionModel.find({ tenant }).toArray().then((s) =>
          streamChunkModel.deleteMany({ session: { $in: s.map((x) => x._id) } })
        ).then(() => streamSessionModel.deleteMany({ tenant })),
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
