import z from "zod";
import { Router } from "@/core/http/router.ts";
// The native Response.redirect has immutable headers, which the CORS hook must set.
import { Response } from "@/core/http/response.ts";
import { paramsAsJson } from "@/core/http/utils.ts";
import { $objectId } from "@/core/utils/createCRUD.ts";
import {
  completeInstall,
  completeManifest,
  dashboardUrl,
  handleWebhook,
} from "@/lib/github/integrations.ts";
import { deployOnPush } from "@/lib/deploy/deployments.ts";

/**
 * What GitHub calls: the App-creation and install redirects, and webhooks.
 * Open to guests: the browser arrives from github.com without our tenant
 * header (and, with a Strict cookie, without a session), so the redirects are
 * authorized by the signed `state` and webhooks by their HMAC signature.
 */
export default new Router("/api", function githubHooks(router) {
  router.get("/manifest", function manifest() {
    return async (req) => {
      const url = new URL(req.url);
      const code = url.searchParams.get("code");
      return Response.redirect(
        code
          ? await completeManifest(code, url.searchParams.get("state"))
          : await dashboardUrl(),
      );
    };
  });

  router.get("/setup", function setup() {
    return async (req) =>
      Response.redirect(
        await completeInstall(new URL(req.url).searchParams.get("state")),
      );
  });

  router.post("/webhook/:id", function webhook() {
    const $params = z.object({ id: $objectId });

    return async (req) => {
      const { id } = $params.parse(paramsAsJson(req));
      const result = await handleWebhook(
        id,
        req.headers.get("x-github-event"),
        req.headers.get("x-hub-signature-256"),
        await req.text(),
      );
      if (result?.push) await deployOnPush(id, result.tenant, result.push);
      return new Response(null, { status: 204 });
    };
  });
});
