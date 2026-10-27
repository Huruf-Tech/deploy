import { assert, assertEquals } from "@std/assert";
import { ObjectId } from "mongodb";
import "@/serve.base.ts";
import { mongodb } from "@/database.ts";
import { Env } from "@/core/utils/env.ts";
import { createHash, SupportedHashAlg } from "@/core/utils/hash.ts";
import { openSealed } from "@/lib/agents/sealing.ts";
import { ingestEvents } from "@/lib/agents/poll.ts";
import {
  createPartition,
  partitionName,
  removePartition,
  resizePartition,
  setUpMachine,
} from "@/lib/pool/pool.ts";
import { serverModel } from "@/schemas/infrastructure/server.ts";
import { serverLeaseModel } from "@/schemas/infrastructure/serverLease.ts";
import { agentCommandModel } from "@/schemas/infrastructure/agentCommand.ts";
import { bootstrapSessionModel } from "@/schemas/infrastructure/bootstrapSession.ts";
import { $resourceSummary } from "@/schemas/protocol/agent.ts";
import { seedKeys } from "./sealing_test.ts";
import { testSession } from "./_session.ts";

// Pool machines and partitions on the control plane (PLAN §26.5, Phase 16c).

Deno.test({
  name: "pool: make a pool machine, create and manage partitions",
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async (t) => {
    const platform = await testSession("pool-platform");
    const customer = await testSession("pool-customer");
    const config = Env.getAll<Record<string, string>>();
    const previous = config.PLATFORM_TENANT;
    config.PLATFORM_TENANT = platform.tenantId.toHexString();
    const { privateKey, publicKey } = await seedKeys();

    const server = async (tenant: ObjectId) => {
      const _id = new ObjectId();
      await serverModel.insertOne({
        _id,
        tenant,
        name: `pool-${_id}`,
        status: "active",
        identity: {
          signPublicKey: "x",
          boxPublicKey: publicKey,
          fingerprint: `pool-${_id}`,
        },
        // deno-lint-ignore no-explicit-any
      } as any);
      await serverLeaseModel.insertOne({
        _id,
        tenant,
        status: "active",
        aliveUntil: new Date(),
        offline: false,
        shard: 0,
        desiredVersion: 0,
        commandSeq: 0,
        deliveredSeq: 0,
      });
      return _id;
    };
    const host = await server(platform.tenantId);
    const theirs = await server(customer.tenantId);
    const latest = async (
      type:
        | "pool.ensure"
        | "partition.create"
        | "partition.resize"
        | "partition.remove",
    ) =>
      (await agentCommandModel.findOne({ server: host, type }, {
        sort: { seq: -1 },
      }))!;
    const refused = (fn: () => Promise<unknown>) =>
      fn().then(() => null, (e) => e as Response);

    try {
      await t.step(
        "a machine's host setup leaves its Docker where it is",
        async () => {
          await setUpMachine(host);
          const command = await latest("pool.ensure");
          const payload = command.payload as Record<string, unknown>;
          assertEquals(Object.keys(payload), ["reserve"]);
          assertEquals(
            (payload.reserve as Record<string, number>).memMb,
            512,
          );
          assertEquals(
            (await serverModel.findOne({ _id: host }))!.pool!.status,
            "pending",
          );
          // A customer's machine is set up the same way (PLAN §27, §28).
          await setUpMachine(theirs);
        },
      );

      await t.step(
        "a partition waits for the machine to be ready",
        async () => {
          assertEquals(
            (await refused(() =>
              createPartition({
                host,
                name: "pearly",
                tenant: customer.tenantId,
                size: { cpus: 1, memMb: 2304, diskGb: 25 },
                createdBy: platform.user,
              })
            ))?.status,
            400,
          );
          // The agent reports `pool.ensure`: the machine is ready, with its capacity.
          const command = await latest("pool.ensure");
          await ingestEvents(
            { server: host, tenant: platform.tenantId } as never,
            [{
              id: `result-${command.seq}`,
              type: "command.result",
              data: {
                seq: command.seq,
                ok: true,
                result: {
                  allocatable: { cpus: 1.75, memMb: 7168, diskGb: 90 },
                },
              },
            }],
          );
          const doc = (await serverModel.findOne({ _id: host }))!;
          assertEquals(doc.pool!.status, "ready");
          assertEquals(doc.pool!.allocatable!.memMb, 7168);
          assertEquals(doc.setup, undefined, "a machine runs no projects");
        },
      );

      await t.step(
        "a partition joins its tenant",
        async () => {
          const name = partitionName(new ObjectId());
          assertEquals(name.length, 12);
          await createPartition({
            host,
            name,
            tenant: customer.tenantId,
            size: { cpus: 1, memMb: 2304, diskGb: 25 },
            createdBy: platform.user,
          });
          const command = await latest("partition.create");
          const sealed = (command.payload as { sealed: string }).sealed;
          assert(
            !sealed.includes(customer.tenantId.toHexString()),
            "the payload is sealed",
          );
          const payload = JSON.parse(
            await openSealed(privateKey, publicKey, sealed),
          );
          assertEquals(payload.name, name);
          assertEquals(payload.size.memMb, 2304);
          assertEquals(payload.install.tenant, customer.tenantId.toHexString());
          // The join token is a live bootstrap session for the customer's tenant.
          const session = await bootstrapSessionModel.findOne({
            tokenHash: await createHash(
              SupportedHashAlg.SHA_256,
              payload.install.joinToken,
            ),
          });
          assert(
            session && session.tenant.equals(customer.tenantId) &&
              session.status === "installing",
          );

          await resizePartition(host, name, {
            cpus: 2,
            memMb: 4096,
            diskGb: 50,
          });
          assertEquals((await latest("partition.resize")).payload, {
            name,
            size: { cpus: 2, memMb: 4096, diskGb: 50 },
          });
          await removePartition(host, name);
          assertEquals((await latest("partition.remove")).payload, { name });
        },
      );

      await t.step("partition usage travels with the summary", () => {
        const summary = $resourceSummary.parse({
          cpu: 0.2,
          memFree: 1,
          diskFree: 1,
          partitions: [{
            name: "huruf",
            state: "running",
            size: { cpus: 1, memMb: 4864, diskGb: 65 },
            cpuMicros: 1,
            memUsed: 2,
            diskUsed: 3,
            rxBytes: 4,
            txBytes: 5,
          }],
        });
        assertEquals(summary.partitions![0].size.memMb, 4864);
      });
    } finally {
      config.PLATFORM_TENANT = previous;
      const d = mongodb.db();
      await Promise.all([
        ...["servers", "serverLeases", "agentCommands", "bootstrapSessions"]
          .map((c) =>
            d.collection(c).deleteMany({
              tenant: { $in: [platform.tenantId, customer.tenantId] },
            })
          ),
      ]);
      await Promise.all([platform.cleanup(), customer.cleanup()]);
    }
  },
});
