import z from "zod";
import { Router } from "@/core/http/router.ts";
import { bodyAsJson, paramsAsJson } from "@/core/http/utils.ts";
import { $objectId, createCRUD } from "@/core/utils/createCRUD.ts";
import { withTenant } from "@/plugins/Huruf-Tech/thunder-core/utils/withTenant.ts";
import {
  acceptServer,
  issueCommand,
  rejectServer,
  releaseServer,
  serverLiveness,
} from "@/lib/agents/servers.ts";
import {
  $server,
  $serverUpdate,
  serverModel,
} from "@/schemas/infrastructure/server.ts";

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
      beforeDel: async ({ _id, session }, req) =>
        releaseServer(_id, (await withTenant(req)).tenant._id, session),
    },
  });

  router.post("/:id/accept", function accept() {
    const $body = z.object({ pairingCode: z.string().min(6).max(6) });

    return {
      shape: () => ({ params: $params, body: $body }),
      handler: async (req) => {
        const { id } = $params.parse(paramsAsJson(req));
        const { pairingCode } = $body.parse(await bodyAsJson(req));
        const { tenant, user } = await withTenant(req);

        await acceptServer({
          server: id,
          tenant: tenant._id,
          user,
          pairingCode,
        });
        return Response.json({ ok: true });
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
