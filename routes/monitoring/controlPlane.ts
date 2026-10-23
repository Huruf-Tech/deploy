import z from "zod";
import { Router } from "@/core/http/router.ts";
import { bodyAsJson, paramsAsJson, queryAsJson } from "@/core/http/utils.ts";
import { $objectId } from "@/core/utils/createCRUD.ts";
import { withAuthSession } from "@/plugins/Huruf-Tech/thunder-core/utils/withAuthSession.ts";
import { controlPlaneOverview } from "@/lib/monitoring/controlPlane.ts";
import { forgetControlPlaneRules } from "@/lib/monitoring/controlPlaneAlerts.ts";
import {
  $alertRuleInput,
  createRule,
  deleteRule,
  listEvents,
  listRules,
  updateRule,
} from "@/lib/monitoring/rules.ts";
import { PLATFORM_OWNER } from "@/schemas/monitoring/alert.ts";

/**
 * Control plane health for platform admins: per-instance CPU and memory,
 * request and poll rates, latency, the database. Root only: no member policy
 * grants this router.
 */
export default new Router("/api", function controlPlane(router) {
  router.get("/overview", function overview() {
    const $query = z.object({
      range: z.enum(["1h", "24h", "7d"]).default("1h"),
    });

    return {
      shape: () => ({ query: $query }),
      handler: async (req) => {
        const { range } = $query.parse(queryAsJson(req));
        return Response.json(await controlPlaneOverview(range));
      },
    };
  });

  // Alert rules on the control plane itself: the workspace alert rules'
  // shape, owned by the platform and evaluated after each minute sample.
  const $params = z.object({ id: $objectId });
  const $input = $alertRuleInput.extend({
    target: z.object({ kind: z.literal("controlPlane") }),
  });

  router.get("/rules", function rules() {
    return {
      handler: async () => Response.json(await listRules(PLATFORM_OWNER)),
    };
  });

  router.post("/rules", function createRuleHandler() {
    return {
      shape: () => ({ body: $input, return: z.object({ _id: z.string() }) }),
      handler: async (req) => {
        const body = $input.parse(await bodyAsJson(req));
        const { user } = await withAuthSession(req);
        const created = await createRule(PLATFORM_OWNER, user._id, body);
        forgetControlPlaneRules();
        return Response.json(created);
      },
    };
  });

  router.patch("/rules/:id", function updateRuleHandler() {
    return {
      shape: () => ({ params: $params, body: $input }),
      handler: async (req) => {
        const { id } = $params.parse(paramsAsJson(req));
        const body = $input.parse(await bodyAsJson(req));
        await updateRule(PLATFORM_OWNER, id, body);
        forgetControlPlaneRules();
        return Response.json({ ok: true });
      },
    };
  });

  router.del("/rules/:id", function deleteRuleHandler() {
    return {
      shape: () => ({ params: $params }),
      handler: async (req) => {
        const { id } = $params.parse(paramsAsJson(req));
        await deleteRule(PLATFORM_OWNER, id);
        forgetControlPlaneRules();
        return Response.json({ ok: true });
      },
    };
  });

  router.get("/alerts", function alerts() {
    const $query = z.object({
      open: z.coerce.boolean().optional(),
      limit: z.coerce.number().int().min(1).max(200).default(50),
    });
    return {
      shape: () => ({ query: $query }),
      handler: async (req) => {
        const query = $query.parse(queryAsJson(req));
        return Response.json(await listEvents(PLATFORM_OWNER, query));
      },
    };
  });
}).group("Admin");
