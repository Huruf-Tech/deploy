import z from "zod";
import { Router } from "@/core/http/router.ts";
import { bodyAsJson, paramsAsJson } from "@/core/http/utils.ts";
import { Response } from "@/core/http/response.ts";
import { challengeAnswer } from "@/lib/domains/acme.ts";
import {
  INGRESS_TOKEN_HEADER,
  isIngressToken,
  syncCertificates,
  traefikConfig,
} from "@/lib/domains/ingress.ts";
import { frpDecision } from "@/lib/domains/tunnels.ts";

/**
 * What the ingress (Traefik) calls (PLAN §14). Open to guests: Let's Encrypt
 * fetches challenges anonymously, rewritten here from
 * `/.well-known/acme-challenge/*` on port 80; Traefik's config poll carries
 * the ingress token; frps' plugin calls only get decisions on tunnel tokens.
 */
export default new Router("/api", function ingress(router) {
  router.get("/acme-challenge/:token", function acmeChallenge() {
    const $params = z.object({ token: z.string().regex(/^[\w-]{1,128}$/) });
    return {
      shape: () => ({ params: $params }),
      handler: async (req) => {
        const { token } = $params.parse(paramsAsJson(req));
        const answer = await challengeAnswer(token);
        if (!answer) throw Response.notFound("Unknown challenge");
        return Response.ok(answer, {
          headers: { "content-type": "text/plain" },
        });
      },
    };
  });

  // Traefik's HTTP provider, from this instance's own Traefik.
  router.get("/traefik", function traefik() {
    return {
      shape: () => ({ return: z.record(z.string(), z.unknown()) }),
      handler: async (req) => {
        if (!await isIngressToken(req.headers.get(INGRESS_TOKEN_HEADER))) {
          throw Response.unauthorized("Invalid ingress token");
        }
        await syncCertificates();
        return Response.json(await traefikConfig());
      },
    };
  });

  // frps' server plugin, from this instance's own frps: approve tunnels.
  router.post("/frp", function frp() {
    const $body = z.object({
      op: z.string().optional(),
      content: z.record(z.string(), z.unknown()).optional(),
    });
    return {
      shape: () => ({ body: $body, return: z.record(z.string(), z.unknown()) }),
      handler: async (req) =>
        Response.json(await frpDecision($body.parse(await bodyAsJson(req)))),
    };
  });
}).group("Ingress");
