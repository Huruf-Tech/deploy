import z from "zod";
import type { ObjectId } from "mongodb";
import { Router } from "@/core/http/router.ts";
import { bodyAsJson, paramsAsJson, queryAsJson } from "@/core/http/utils.ts";
import { $objectId } from "@/core/utils/createCRUD.ts";
import { withTenant } from "@/plugins/Huruf-Tech/thunder-core/utils/withTenant.ts";
import {
  closeStream,
  openStream,
  readStream,
  writeTerminalInput,
} from "@/lib/agents/streams.ts";
import { $terminalInput } from "@/schemas/protocol/agent.ts";

/**
 * Live views of data that stays on the agent (PLAN §3.6). Each kind has its own
 * handler, so RBAC can grant them separately: exec runs commands in containers.
 */
export default new Router("/api", function streams(router) {
  const $params = z.object({ id: $objectId });
  const $opened = z.object({ session: z.string() });
  const $container = z.string().min(1).max(128).regex(/^[\w.-]+$/);

  const open = (
    kind: "logs" | "metrics" | "exec" | "terminal",
    $body: z.ZodObject,
  ) => ({
    shape: () => ({ body: $body, return: $opened }),
    handler: async (req: Request) => {
      const { server, ...params } = $body.parse(await bodyAsJson(req)) as
        & { server: ObjectId }
        & Record<string, unknown>;
      const { tenant, user } = await withTenant(req);
      const session = await openStream({
        tenant: tenant._id,
        server,
        user: user._id,
        kind,
        params,
      });
      return Response.json({ session: session.toHexString() });
    },
  });

  router.post("/logs", function openLogs() {
    return open(
      "logs",
      z.object({
        server: $objectId,
        container: $container,
        tail: z.number().int().min(0).max(5_000).default(200),
        since: z.string().regex(/^\d+[smh]$/).optional().describe(
          "e.g. 10m",
        ),
      }),
    );
  });

  router.post("/metrics", function openMetrics() {
    return open("metrics", z.object({ server: $objectId }));
  });

  router.post("/exec", function openExec() {
    return open(
      "exec",
      z.object({
        server: $objectId,
        container: $container,
        command: z.array(z.string().max(1_000)).min(1).max(32),
      }),
    );
  });

  const $size = {
    cols: z.number().int().min(10).max(1_000).default(80),
    rows: z.number().int().min(5).max(500).default(24),
  };

  // A shell inside a container.
  router.post("/terminal", function openTerminal() {
    return open(
      "terminal",
      z.object({ server: $objectId, container: $container, ...$size }),
    );
  });

  // A root shell on the host itself: a separate permission from container shells.
  router.post("/terminal/host", function openHostTerminal() {
    return open("terminal", z.object({ server: $objectId, ...$size }));
  });

  router.post("/:id/input", function input() {
    const $body = z.object({ items: z.array($terminalInput).min(1).max(64) });

    return {
      shape: () => ({ params: $params, body: $body }),
      handler: async (req) => {
        const { id } = $params.parse(paramsAsJson(req));
        const { items } = $body.parse(await bodyAsJson(req));
        await writeTerminalInput(id, (await withTenant(req)).tenant._id, items);
        return Response.json({ ok: true });
      },
    };
  });

  router.get("/:id/chunks", function read() {
    const $query = z.object({
      after: z.coerce.number().int().min(0).default(0),
    });
    const $return = z.object({
      chunks: z.array(z.object({
        seq: z.number(),
        data: z.string(),
        done: z.boolean().optional(),
        error: z.string().optional(),
      })),
    });

    return {
      shape: () => ({ params: $params, query: $query, return: $return }),
      handler: async (req) => {
        const { id } = $params.parse(paramsAsJson(req));
        const { after } = $query.parse(queryAsJson(req));
        const { tenant } = await withTenant(req);
        return Response.json(await readStream(id, tenant._id, after));
      },
    };
  });

  router.post("/:id/close", function close() {
    return {
      shape: () => ({ params: $params }),
      handler: async (req) => {
        const { id } = $params.parse(paramsAsJson(req));
        await closeStream(id, (await withTenant(req)).tenant._id);
        return Response.json({ ok: true });
      },
    };
  });
}).group("Streams");
