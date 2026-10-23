import z from "zod";
import { Router } from "@/core/http/router.ts";
import { queryAsJson } from "@/core/http/utils.ts";
import { controlPlaneOverview } from "@/lib/monitoring/controlPlane.ts";

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
}).group("Admin");
