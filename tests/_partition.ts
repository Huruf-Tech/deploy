import { ObjectId } from "mongodb";
import { createJoinToken } from "@/lib/agents/bootstrap.ts";
import { partitionName } from "@/lib/pool/pool.ts";
import { serverModel } from "@/schemas/infrastructure/server.ts";
import type { SimAgent } from "@/tools/agent-sim/agent.ts";

/**
 * Projects run in partitions (PLAN §27): a simulated agent that receives
 * projects joins as a partition of a machine of the tenant, through a join
 * token, as a real partition's agent does.
 */
export async function joinAsPartition(
  agent: SimAgent,
  tenant: ObjectId,
  user: ObjectId,
) {
  const machine = await machineOf(tenant);
  const { token } = await createJoinToken({
    tenant,
    createdBy: user,
    host: "machine",
    port: 0,
    username: "partition",
    partition: { host: machine, name: partitionName(new ObjectId()) },
  });
  agent.joinWith(token);
  return await agent.hello();
}

/** The tenant's test machine, set up for partitions. */
async function machineOf(tenant: ObjectId) {
  const existing = await serverModel.findOne({
    tenant,
    "provider.kind": "machine",
    name: "test-machine",
  }, { projection: { _id: 1 } });
  if (existing) return existing._id;
  const _id = new ObjectId();
  await serverModel.insertOne({
    _id,
    tenant,
    name: "test-machine",
    labels: {},
    status: "active",
    identity: {
      signPublicKey: "x",
      boxPublicKey: "x",
      fingerprint: `machine-${_id}`,
    },
    installMethod: "ssh",
    provider: { kind: "machine" },
    inventory: {
      hostname: "test-machine",
      os: "Ubuntu 24.04",
      arch: "amd64",
      cpuCores: 8,
      memory: 16 * 2 ** 30,
      disk: 200 * 2 ** 30,
      agentVersion: "test",
      publicIp: "203.0.113.10",
    },
    pool: {
      status: "ready",
      mode: "machine",
      allocatable: { cpus: 7.75, memMb: 15_872, diskGb: 190 },
      updatedAt: new Date(),
    },
    createdAt: new Date(),
  });
  return _id;
}
