import z from "zod";
import { Router } from "@/core/http/router.ts";
import { paramsAsJson, serveAssets } from "@/core/http/utils.ts";
import { Env } from "@/core/utils/env.ts";
import { auth as betterAuth } from "@/lib/auth.ts";

import { fromFileUrl } from "@std/path/from-file-url";

export default new Router(function auth({ all, get }) {
  get("/branding", function branding() {
    const $return = z.object({
      name: z.string().min(1).max(255),
      description: z.string().max(1000).optional(),
      logo: z.string().optional(),
      heroImage: z.string().optional(),
      heroTitle: z.string().max(255).optional(),
      homepageURL: z.string().optional(),
      termsURL: z.string().optional(),
      privacyURL: z.string().optional(),
      theme: z.record(z.string(), z.string()),
      hidePoweredBy: z.boolean().optional(),
    });

    return {
      shape: () => ({
        return: $return,
      }),
      handler: async (_req: Request) => {
        return Response.json(
          {
            name: await Env.get("APP_DISPLAY_NAME", true) ?? "Thunder",
            description: await Env.get("APP_DESCRIPTION", true),
            logo: await Env.get("APP_LOGO", true),
            heroImage: await Env.get("APP_HERO_IMAGE", true),
            heroTitle: await Env.get("APP_HERO_TITLE", true),
            homepageURL: await Env.get("APP_HOMEPAGE_URL", true),
            termsURL: await Env.get("APP_TERMS_URL", true),
            privacyURL: await Env.get("APP_PRIVACY_URL", true),
            theme: await Env.params("APP_THEME", true),
            hidePoweredBy: await Env.enabled("APP_HIDE_POWERED_BY", true),
          } satisfies z.output<typeof $return>,
        );
      },
    };
  });

  get("/api/capabilities", function capabilities() {
    return {
      shape: () => ({
        return: z.object({
          capabilities: z.array(z.string()),
        }),
      }),
      handler: async () => {
        return Response.json({
          capabilities: await Env.list("BETTER_AUTH_CAPABILITIES"),
        });
      },
    };
  });

  all("/api{/*endpoint}", function handleAuth() {
    const $params = z.object({
      endpoint: z.array(z.string()).optional(),
    });

    return {
      shape: () => ({
        params: $params,
      }),
      handler: (req: Request) => betterAuth.handler(req),
    };
  });

  get("{/*endpoint}", function betterAuthUI() {
    const $params = z.object({
      endpoint: z.array(z.string()).optional(),
    });

    return {
      shape: () => ({
        params: $params,
      }),
      handler: (req) => {
        const { endpoint } = $params.parse(paramsAsJson(req));

        return serveAssets(
          req,
          fromFileUrl(import.meta.resolve("../public/auth/www")),
          endpoint?.join("/"),
        );
      },
    };
  });
}).group("Auth");
