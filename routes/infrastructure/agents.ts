import z from "zod";
import { Router } from "@/core/http/router.ts";
import {
  authenticateAgent,
  authenticateHello,
} from "@/lib/agents/agentAuth.ts";
import { registerAgent } from "@/lib/agents/servers.ts";
import { ingestEvents, pollAgent } from "@/lib/agents/poll.ts";
import { getAgentConfig } from "@/lib/agents/config.ts";
import { HELD_HEADER } from "@/lib/agents/wakeups.ts";
import { installerScript } from "@/lib/agents/bootstrap.ts";
import {
  $agentConfigResponse,
  $eventsRequest,
  $eventsResponse,
  $helloRequest,
  $helloResponse,
  $pollRequest,
  $pollResponse,
  AGENT_HEADERS,
} from "@/schemas/protocol/agent.ts";

const $configRequest = z.object({});

const clientIp = (req: Request) =>
  req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip");

/**
 * Agent protocol (PLAN §3.3, §4). Open to the `guest` role; every request is
 * authenticated by its Ed25519 signature inside the handler.
 */
export default new Router("/api", function agents(router) {
  router.post("/hello", function hello() {
    return {
      shape: () => ({ body: $helloRequest, return: $helloResponse }),
      handler: async (req) => {
        const { body, fingerprint } = await authenticateHello(
          req,
          $helloRequest,
        );
        return Response.json(
          await registerAgent(body, fingerprint, clientIp(req)),
        );
      },
    };
  });

  router.post("/poll", function poll() {
    return {
      shape: () => ({ body: $pollRequest, return: $pollResponse }),
      handler: async (req) => {
        const started = performance.now();
        const { identity, fingerprint, body } = await authenticateAgent(
          req,
          $pollRequest,
        );
        const result = await pollAgent(identity, fingerprint, body);
        return Response.json(result.body, {
          status: result.status,
          headers: {
            // The agent leaves our time out of its round trip (PLAN §29).
            [AGENT_HEADERS.serverTime]: String(
              Math.round(performance.now() - started),
            ),
            ...(result.heldMs
              ? { [HELD_HEADER]: String(Math.round(result.heldMs)) }
              : {}),
          },
        });
      },
    };
  });

  // The one-line installer (`curl ... | sudo sh`), public like the rest of this router.
  router.get("/install.sh", function installScript() {
    return async () =>
      new Response(await installerScript(), {
        headers: {
          "content-type": "text/x-shellscript; charset=utf-8",
          "cache-control": "public, max-age=300",
        },
      });
  });

  router.post("/config", function config() {
    return {
      shape: () => ({ return: $agentConfigResponse }),
      handler: async (req) => {
        // Pending agents may read it too: only a valid signature is required.
        await authenticateAgent(req, $configRequest);
        const { config, version } = await getAgentConfig();
        return Response.json({ version, config });
      },
    };
  });

  router.post("/events", function events() {
    const $return = $eventsResponse;

    return {
      shape: () => ({ body: $eventsRequest, return: $return }),
      handler: async (req) => {
        const { identity, body } = await authenticateAgent(
          req,
          $eventsRequest,
        );
        return Response.json(await ingestEvents(identity, body.events));
      },
    };
  });
}).group("Agents");
