import type { THook } from "@/core/http/hooks.ts";
import { recordRequest } from "@/lib/monitoring/controlPlane.ts";
import { HELD_HEADER } from "@/lib/agents/wakeups.ts";

/**
 * Times every request for the control plane metrics (PLAN §20.2 "our own
 * observability"). First in, so the time covers the other hooks too; the
 * counting is in memory, one database write per instance a minute.
 */
const started = new WeakMap<Request, number>();

export default {
  priority: 1_000,
  pre: ({ req }) => {
    started.set(req, performance.now());
  },
  post: ({ req, res, scope, name }) => {
    const at = started.get(req);
    if (at === undefined) return;
    // Long polling (PLAN Phase 13): time spent waiting isn't time working.
    const held = Number(res.headers.get(HELD_HEADER) ?? 0);
    recordRequest(
      `${scope}.${name ?? "?"}`,
      res.status,
      Math.max(0, performance.now() - at - held),
    );
  },
} satisfies THook;
