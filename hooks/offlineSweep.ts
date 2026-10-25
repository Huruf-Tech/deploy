import type { THook } from "@/core/http/hooks.ts";
import { offlineSweep } from "@/lib/agents/sweep.ts";
import { domainChecks } from "@/lib/domains/domains.ts";
import { deliverInBackground } from "@/lib/monitoring/alerts.ts";

/**
 * Dashboard and API requests also carry the offline sweep (PLAN §3.4): one
 * random shard each, an in-memory check unless that shard is due. Agent polls
 * tick their own shards inside the poll handler. They also carry the alert
 * outbox, in the background so a slow webhook never slows the request, and
 * the domain rechecks (PLAN §14).
 */
export default {
  priority: -50,
  post: async ({ scope }) => {
    if (scope !== "agents") {
      await offlineSweep.tickRandom();
      void domainChecks.tick(0); // DNS lookups: never on the request path
      deliverInBackground();
    }
  },
} satisfies THook;
