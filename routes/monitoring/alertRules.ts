import z from "zod";
import { Router } from "@/core/http/router.ts";
import { bodyAsJson, paramsAsJson } from "@/core/http/utils.ts";
import { $objectId } from "@/core/utils/createCRUD.ts";
import { withTenant } from "@/plugins/Huruf-Tech/thunder-core/utils/withTenant.ts";
import {
  $alertRuleInput,
  createRule,
  deleteRule,
  listRules,
  updateRule,
} from "@/lib/monitoring/rules.ts";
import { $alertRule } from "@/schemas/monitoring/alert.ts";

/**
 * Alert rules (PLAN §13): metric rules are evaluated by the agents, offline
 * and deploy-failed by the control plane. Webhook URLs are stored encrypted
 * and shown masked; send a masked URL back unchanged to keep it.
 */
export default new Router("/api", function alertRules(router) {
  const $params = z.object({ id: $objectId });
  const $view = $alertRule.omit({ tenant: true, channels: true }).extend({
    _id: z.string(),
    channels: z.array(z.object({ type: z.string(), target: z.string() })),
  });

  router.get("/", function list() {
    return {
      shape: () => ({ return: z.array($view) }),
      handler: async (req) => {
        const { tenant } = await withTenant(req);
        return Response.json(await listRules(tenant._id));
      },
    };
  });

  router.post("/", function create() {
    return {
      shape: () => ({
        body: $alertRuleInput,
        return: z.object({ _id: z.string() }),
      }),
      handler: async (req) => {
        const body = $alertRuleInput.parse(await bodyAsJson(req));
        const { tenant, user } = await withTenant(req);
        return Response.json(await createRule(tenant._id, user._id, body));
      },
    };
  });

  router.patch("/:id", function update() {
    return {
      shape: () => ({ params: $params, body: $alertRuleInput }),
      handler: async (req) => {
        const { id } = $params.parse(paramsAsJson(req));
        const body = $alertRuleInput.parse(await bodyAsJson(req));
        const { tenant } = await withTenant(req);
        await updateRule(tenant._id, id, body);
        return Response.json({ ok: true });
      },
    };
  });

  router.del("/:id", function del() {
    return {
      shape: () => ({ params: $params }),
      handler: async (req) => {
        const { id } = $params.parse(paramsAsJson(req));
        const { tenant } = await withTenant(req);
        await deleteRule(tenant._id, id);
        return Response.json({ ok: true });
      },
    };
  });
}).group("Monitoring");
