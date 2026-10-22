import z from "zod";
import { Router } from "@/core/http/router.ts";
import { queryAsJson } from "@/core/http/utils.ts";
import { withTenant } from "@/plugins/Huruf-Tech/thunder-core/utils/withTenant.ts";
import { listEvents } from "@/lib/monitoring/rules.ts";
import { $alertEvent } from "@/schemas/monitoring/alert.ts";

/** Alert history (PLAN §13): episodes with their delivery state. */
export default new Router("/api", function alertEvents(router) {
  const $query = z.object({
    open: z.enum(["true", "false"]).optional().transform((v) => v === "true"),
    limit: z.coerce.number().int().min(1).max(200).default(50),
  });
  const $view = $alertEvent.omit({
    tenant: true,
    key: true,
    deliveredChannels: true,
    open: true,
  }).extend({
    _id: z.string(),
    open: z.boolean(),
    serverName: z.string().optional(),
    projectName: z.string().optional(),
  });

  router.get("/", function list() {
    return {
      shape: () => ({ query: $query, return: z.array($view) }),
      handler: async (req) => {
        const query = $query.parse(queryAsJson(req));
        const { tenant } = await withTenant(req);
        return Response.json(await listEvents(tenant._id, query));
      },
    };
  });
}).group("Monitoring");
