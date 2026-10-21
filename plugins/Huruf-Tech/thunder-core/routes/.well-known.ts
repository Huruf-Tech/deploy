import { Router } from "@/core/http/router.ts";
import z from "zod";
import { OAuth2 } from "../lib/oauth2.ts";

export default new Router(function wellKnown({ get }) {
  get("/oauth-authorization-server{/*endpoint}", function oauthServerMeta() {
    const $params = z.object({
      endpoint: z.array(z.string()).optional(),
    });

    return {
      shape: () => ({
        params: $params,
      }),
      handler: async () => {
        return Response.json(await OAuth2.createOAuthConfig());
      },
    };
  });

  get("/openid-configuration{/*endpoint}", function openidConfig() {
    const $params = z.object({
      endpoint: z.array(z.string()).optional(),
    });

    return {
      shape: () => ({
        params: $params,
      }),
      handler: async () => {
        return Response.json(await OAuth2.createOAuthConfig());
      },
    };
  });
}).group("Default");
