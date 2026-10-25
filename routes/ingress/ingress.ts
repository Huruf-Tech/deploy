import z from "zod";
import { Router } from "@/core/http/router.ts";
import { paramsAsJson } from "@/core/http/utils.ts";
import { Response } from "@/core/http/response.ts";
import { challengeAnswer } from "@/lib/domains/acme.ts";

/**
 * What the ingress (Traefik) calls (PLAN §14). Open to guests: Let's Encrypt
 * fetches challenges anonymously, rewritten here from
 * `/.well-known/acme-challenge/*` on port 80.
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
}).group("Ingress");
