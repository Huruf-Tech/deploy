import { Router } from "@/core/http/router.ts";
import { Env } from "@/core/utils/env.ts";
import { mongodb } from "@/database.ts";

export default new Router("/api/", function home(router) {
  router.get("/", function status() {
    return () => {
      return Response.json({
        environment: Env.getType(),
        msg: "Thunder api is listening the requests...",
      });
    };
  });

  // For uptime monitors and load balancers: 503 when the database doesn't
  // answer. A down control plane can't alert about itself, so watch this
  // from outside.
  router.get("/health", function health() {
    return async () => {
      const at = performance.now();
      try {
        await Promise.race([
          mongodb.db().command({ ping: 1 }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("timeout")), 3_000)
          ),
        ]);
        return Response.json({
          ok: true,
          dbMs: Math.round(performance.now() - at),
        });
      } catch {
        return Response.json({ ok: false, db: "unreachable" }, {
          status: 503,
        });
      }
    };
  });
}).group("Default");
