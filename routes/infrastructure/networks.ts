import z from "zod";
import { Router } from "@/core/http/router.ts";
import { bodyAsJson, paramsAsJson } from "@/core/http/utils.ts";
import { $objectId } from "@/core/utils/createCRUD.ts";
import { Response } from "@/core/http/response.ts";
import { withTenant } from "@/plugins/Huruf-Tech/thunder-core/utils/withTenant.ts";
import {
  networkOverview,
  setPrimaryServer,
  updateMeshMember,
} from "@/lib/network/network.ts";

/**
 * The private network (PLAN §8.2–8.4): WireGuard between the tenant's
 * servers, container subnets routed over it, and the built-in registry on
 * the primary server.
 */
export default new Router("/api", function networks(router) {
  router.get("/", function get() {
    const $return = z.object({
      primaryServer: z.string().optional(),
      servers: z.array(z.object({
        _id: z.string(),
        name: z.string(),
        enabled: z.boolean(),
        meshIp: z.string(),
        subnet: z.string(),
        endpoint: z.string().optional(),
        endpointOverride: z.string().optional(),
        joined: z.boolean().describe("Its agent reported a WireGuard key"),
        online: z.boolean(),
        error: z.string().optional(),
        reportedAt: z.string().optional(),
      })),
      reachability: z.array(z.object({
        from: z.string(),
        to: z.string(),
        reachable: z.boolean().nullable().describe(
          "null when either side is out of the mesh",
        ),
      })),
    });

    return {
      shape: () => ({ return: $return }),
      handler: async (req) =>
        Response.json(
          await networkOverview((await withTenant(req)).tenant._id),
        ),
    };
  });

  router.patch("/servers/:id", function updateMember() {
    const $params = z.object({ id: $objectId });
    const $body = z.object({
      enabled: z.boolean().optional(),
      endpoint: z.string().regex(/^[\w.-]+:\d{1,5}$/, "host:port").nullable()
        .optional()
        .describe(
          "How peers reach this server; null returns to the detected address",
        ),
    });

    return {
      shape: () => ({ params: $params, body: $body }),
      handler: async (req) => {
        const { id } = $params.parse(paramsAsJson(req));
        const body = $body.parse(await bodyAsJson(req));
        await updateMeshMember((await withTenant(req)).tenant._id, id, body);
        return Response.json({ ok: true });
      },
    };
  });

  router.post("/primary", function setPrimary() {
    const $body = z.object({ server: $objectId.nullable() });

    return {
      shape: () => ({ body: $body }),
      handler: async (req) => {
        const { server } = $body.parse(await bodyAsJson(req));
        await setPrimaryServer((await withTenant(req)).tenant._id, server);
        return Response.json({ ok: true });
      },
    };
  });
}).group("Infrastructure");
