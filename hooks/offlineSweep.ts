import type { THook } from "@/core/http/hooks.ts";
import { offlineSweep } from "@/lib/agents/sweep.ts";

/**
 * Dashboard and API requests also carry the offline sweep (PLAN §3.4): one
 * random shard each, an in-memory check unless that shard is due. Agent polls
 * tick their own shards inside the poll handler.
 */
export default {
  priority: -50,
  post: async ({ scope }) => {
    if (scope !== "agents") await offlineSweep.tickRandom();
  },
} satisfies THook;
