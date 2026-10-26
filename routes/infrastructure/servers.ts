import z from "zod";
import { Router } from "@/core/http/router.ts";
import { Response } from "@/core/http/response.ts";
import { payments } from "@/lib/services.ts";
import { bodyAsJson, paramsAsJson } from "@/core/http/utils.ts";
import { $objectId, createCRUD } from "@/core/utils/createCRUD.ts";
import { withTenant } from "@/plugins/Huruf-Tech/thunder-core/utils/withTenant.ts";
import {
  acceptServer,
  rejectServer,
  releaseServer,
  serverLiveness,
} from "@/lib/agents/servers.ts";
import {
  commandOutcome,
  issueCommand,
  prepareHost,
} from "@/lib/agents/commands.ts";
import { $hostCleanupPayload } from "@/schemas/protocol/agent.ts";
import {
  createOwnPartition,
  onServerDeleted,
  partitionsOf,
  removeOwnPartition,
  resizeOwnPartition,
} from "@/lib/pool/partitions.ts";
import { subscriptionModel } from "@/schemas/billing/subscription.ts";
import type { ObjectId } from "mongodb";
import { latestAgent, requestAgentUpdate } from "@/lib/agents/updates.ts";
import {
  agentEndpoints,
  bootstrapStatus,
  startBootstrap,
} from "@/lib/agents/bootstrap.ts";
import {
  $server,
  $serverUpdate,
  serverModel,
} from "@/schemas/infrastructure/server.ts";

/**
 * A rented partition goes when its rental is canceled (PLAN §26.9), and a
 * pool machine only once no rental lives on it (draining, PLAN §26.7).
 */
async function assertRemovable(id: ObjectId, tenant: ObjectId) {
  const doc = await serverModel.findOne({ _id: id, tenant }, {
    projection: { "provider.kind": 1, "pool.status": 1 },
  });
  if (doc?.provider?.kind === "rented") {
    throw Response.badRequest(
      "This is a rented server: cancel the rental on its page instead",
    );
  }
  const rented = doc?.pool && await subscriptionModel.countDocuments({
    kind: "server",
    status: { $in: ["active", "pastDue", "suspended"] },
    $or: [{ "rental.host": id }, { "rental.move.to": id }],
  });
  if (rented) {
    throw Response.badRequest(
      `${rented} rented partition${
        rented === 1 ? "" : "s"
      } live on this pool machine: stop it taking rentals and move them to other machines first`,
    );
  }
}

export default new Router("/api", function servers(router) {
  const $params = z.object({ id: $objectId });

  createCRUD({
    router,
    schema: $server,
    updateSchema: $serverUpdate,
    model: serverModel,
  }, {
    // Servers are created by the agent's hello, never by a form.
    disable: { create: true },
    // The pairing code must only be read from the agent's own output; serving
    // it here would let a user accept a machine they cannot see.
    projection: {
      pairingCode: 0,
      "identity.signPublicKey": 0,
      "identity.boxPublicKey": 0,
    },
    isolationFields: async (req) => ({
      tenant: (await withTenant(req)).tenant._id,
    }),
    hooks: {
      beforeDel: async ({ _id, session }, req) => {
        const tenant = (await withTenant(req)).tenant._id;
        await assertRemovable(_id, tenant);
        await onServerDeleted(_id, tenant);
        await releaseServer(_id, tenant, session);
      },
    },
  });

  // A machine's partitions (PLAN §27.2): the part of it Huruf Deploy gets.
  const $size = z.object({
    cpus: z.number().min(0.5).max(512),
    memMb: z.number().int().min(512),
    diskGb: z.number().int().min(5),
  });
  const $partitionParams = z.object({
    id: $objectId,
    name: z.string().regex(/^p[0-9a-f]{11}$/),
  });

  router.get("/:id/partitions", function partitions() {
    const $return = z.array(z.object({
      name: z.string(),
      server: z.object({ _id: z.string(), name: z.string() }).optional(),
      joining: z.boolean().describe("Its agent hasn't joined yet"),
    }));

    return {
      shape: () => ({ params: $params, return: $return }),
      handler: async (req) => {
        const { id } = $params.parse(paramsAsJson(req));
        const { tenant } = await withTenant(req);
        return Response.json(await partitionsOf(tenant._id, id));
      },
    };
  });

  router.post("/:id/partitions", function createPartition() {
    const $body = z.object({
      name: z.string().max(64).optional().describe("The server's name"),
      size: $size,
    });
    const $return = z.object({ name: z.string() });

    return {
      shape: () => ({ params: $params, body: $body, return: $return }),
      handler: async (req) => {
        const { id } = $params.parse(paramsAsJson(req));
        const body = $body.parse(await bodyAsJson(req));
        const { tenant, user } = await withTenant(req);
        return Response.json(
          await createOwnPartition({
            tenant: tenant._id,
            machine: id,
            user: user._id,
            label: body.name,
            size: body.size,
          }),
        );
      },
    };
  });

  router.patch("/:id/partitions/:name", function resizePartition() {
    const $body = z.object({ size: $size });

    return {
      shape: () => ({ params: $partitionParams, body: $body }),
      handler: async (req) => {
        const { id, name } = $partitionParams.parse(paramsAsJson(req));
        const { size } = $body.parse(await bodyAsJson(req));
        const { tenant } = await withTenant(req);
        await resizeOwnPartition({
          tenant: tenant._id,
          machine: id,
          name,
          size,
        });
        return Response.json({ ok: true });
      },
    };
  });

  router.del("/:id/partitions/:name", function removePartition() {
    const $return = z.object({
      command: z.string().describe("The machine's partition.remove"),
    });

    return {
      shape: () => ({ params: $partitionParams, return: $return }),
      handler: async (req) => {
        const { id, name } = $partitionParams.parse(paramsAsJson(req));
        const { tenant } = await withTenant(req);
        return Response.json(
          await removeOwnPartition({ tenant: tenant._id, machine: id, name }),
        );
      },
    };
  });

  // The published agent per architecture, to tell which servers can update.
  router.get("/agent/latest", function agentRelease() {
    const $return = z.object({
      sums: z.record(z.string(), z.string()).describe("arch -> SHA-256"),
    });

    return {
      shape: () => ({ return: $return }),
      handler: async () => {
        const { sums } = await latestAgent().catch(() => ({ sums: {} }));
        return Response.json({ sums });
      },
    };
  });

  // The agent replaces itself with the published binary, then host setup runs.
  router.post("/:id/updateAgent", function updateAgent() {
    return {
      shape: () => ({ params: $params }),
      handler: async (req) => {
        const { id } = $params.parse(paramsAsJson(req));
        const { tenant, user } = await withTenant(req);
        await requestAgentUpdate({
          tenant: tenant._id,
          server: id,
          user: user._id,
        });
        return Response.json({ ok: true });
      },
    };
  });

  router.post("/:id/accept", function accept() {
    const $body = z.object({ pairingCode: z.string().min(6).max(6) });

    return {
      shape: () => ({ params: $params, body: $body }),
      handler: async (req) => {
        const { id } = $params.parse(paramsAsJson(req));
        const { pairingCode } = $body.parse(await bodyAsJson(req));
        const { tenant, user } = await withTenant(req);
        // A saved card first, Free included (PLAN §25.10, 4).
        await payments.requireCard(tenant._id);

        const accepted = await acceptServer({
          server: id,
          tenant: tenant._id,
          user,
          pairingCode,
        });
        return Response.json({
          ok: true,
          server: accepted.server.toString(),
          name: accepted.name,
          superseded: accepted.superseded,
        });
      },
    };
  });

  router.post("/:id/reject", function reject() {
    return {
      shape: () => ({ params: $params }),
      handler: async (req) => {
        const { id } = $params.parse(paramsAsJson(req));
        await rejectServer(id, (await withTenant(req)).tenant._id);
        return Response.json({ ok: true });
      },
    };
  });

  // Retries host setup (Docker, network, edge proxy); the agent's steps are idempotent.
  router.post("/:id/prepare", function prepare() {
    const $return = z.object({ command: z.string(), seq: z.number() });

    return {
      shape: () => ({ params: $params, return: $return }),
      handler: async (req) => {
        const { id } = $params.parse(paramsAsJson(req));
        const { tenant, user } = await withTenant(req);
        const { command, seq } = await prepareHost(id, tenant._id, user._id);
        return Response.json({ command: command.toString(), seq });
      },
    };
  });

  router.post("/:id/ping", function ping() {
    const $return = z.object({ command: z.string(), seq: z.number() });

    return {
      shape: () => ({ params: $params, return: $return }),
      handler: async (req) => {
        const { id } = $params.parse(paramsAsJson(req));
        const { tenant, user } = await withTenant(req);
        const { command, seq } = await issueCommand({
          server: id,
          tenant: tenant._id,
          type: "ping",
          createdBy: user._id,
        });
        return Response.json({ command: command.toString(), seq });
      },
    };
  });

  // Remove server: the agent lists what uninstalling removes and keeps
  // (dryRun), or schedules the uninstall. Results come from `command`.
  router.post("/:id/cleanup", function cleanup() {
    const $body = $hostCleanupPayload;
    const $return = z.object({ command: z.string() });

    return {
      shape: () => ({ params: $params, body: $body, return: $return }),
      handler: async (req) => {
        const { id } = $params.parse(paramsAsJson(req));
        const payload = $body.parse(await bodyAsJson(req));
        const { tenant, user } = await withTenant(req);
        if (!payload.dryRun) await assertRemovable(id, tenant._id);
        const { command } = await issueCommand({
          server: id,
          tenant: tenant._id,
          type: "host.cleanup",
          payload,
          createdBy: user._id,
        });
        return Response.json({ command: command.toString() });
      },
    };
  });

  router.get("/:id/commands/:command", function command() {
    const $commandParams = z.object({ id: $objectId, command: $objectId });
    const $return = z.object({
      status: z.enum(["pending", "delivered", "done", "failed"]),
      result: z.record(z.string(), z.unknown()).optional(),
      error: z.string().optional(),
    });

    return {
      shape: () => ({ params: $commandParams, return: $return }),
      handler: async (req) => {
        const { id, command } = $commandParams.parse(paramsAsJson(req));
        const { tenant } = await withTenant(req);
        return Response.json(
          await commandOutcome({ tenant: tenant._id, server: id, command }),
        );
      },
    };
  });

  router.post("/bootstrap", function bootstrap() {
    const $body = z.object({
      host: z.string().min(1).max(253),
      port: z.number().int().min(1).max(65_535).default(22),
      username: z.string().min(1).max(64),
      password: z.string().max(1_000).optional(),
      privateKey: z.string().max(20_000).optional(),
      passphrase: z.string().max(1_000).optional(),
    }).refine((b) => !!b.password !== !!b.privateKey, {
      message: "Provide either a password or a private key",
    });
    const $return = z.object({ session: z.string() });

    return {
      shape: () => ({ body: $body, return: $return }),
      handler: async (req) => {
        const body = $body.parse(await bodyAsJson(req));
        const { tenant, user } = await withTenant(req);
        // A saved card first, Free included (PLAN §25.10, 4).
        await payments.requireCard(tenant._id);

        const session = await startBootstrap({
          tenant: tenant._id,
          user,
          host: body.host.trim(),
          port: body.port,
          username: body.username,
          credentials: body.password
            ? { password: body.password }
            : { privateKey: body.privateKey!, passphrase: body.passphrase },
        });
        return Response.json({ session: session.toString() });
      },
    };
  });

  router.get("/bootstrap/:id", function bootstrapProgress() {
    const $return = z.object({
      status: z.enum(["installing", "registered", "online", "failed"]),
      steps: z.array(z.object({ at: z.string(), message: z.string() })),
      error: z.string().optional(),
      server: z.string().optional(),
    });

    return {
      shape: () => ({ params: $params, return: $return }),
      handler: async (req) => {
        const { id } = $params.parse(paramsAsJson(req));
        return Response.json(
          await bootstrapStatus(id, (await withTenant(req)).tenant._id),
        );
      },
    };
  });

  router.get("/install/command", function installCommand() {
    const $return = z.object({ command: z.string() });

    return {
      shape: () => ({ return: $return }),
      handler: async (req) => {
        const { tenant } = await withTenant(req);
        const { controlPlaneUrl, downloadBase } = await agentEndpoints();
        const args = [
          `--url ${controlPlaneUrl}`,
          `--tenant ${tenant._id.toHexString()}`,
          `--download-base ${downloadBase}`,
        ].join(" ");
        return Response.json({
          command:
            `curl -fsSL ${controlPlaneUrl}/agents/api/install.sh | sudo sh -s -- ${args}`,
        });
      },
    };
  });

  router.get("/live/status", function liveness() {
    const $return = z.array(z.object({
      server: z.string(),
      online: z.boolean(),
      lastSeenAt: z.string(),
      offlineSince: z.string().optional(),
    }));

    return {
      shape: () => ({ return: $return }),
      handler: async (req) =>
        Response.json(
          await serverLiveness((await withTenant(req)).tenant._id),
        ),
    };
  });
}).group("Infrastructure");
