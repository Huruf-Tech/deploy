import z from "zod";
import { Router } from "@/core/http/router.ts";
import { bodyAsJson } from "@/core/http/utils.ts";
import { $objectId } from "@/core/utils/createCRUD.ts";
import { Response } from "@/core/http/response.ts";
import { withTenant } from "@/plugins/Huruf-Tech/thunder-core/utils/withTenant.ts";
import { aiAllowance } from "@/lib/ai/model.ts";
import { applyFix, draftTemplate, fixDeployment } from "@/lib/ai/templates.ts";
import { $templateContent, $templateKind } from "@/schemas/build/template.ts";

/**
 * The AI template assistant (PLAN Phase 12): drafts templates and proposes
 * fixes for failed deployments. Nothing it returns is saved or deployed until
 * the user accepts it.
 */
export default new Router("/api", function ai(router) {
  router.get("/status", function status() {
    return {
      shape: () => ({
        return: z.object({
          enabled: z.boolean(),
          limit: z.number(),
          used: z.number(),
        }),
      }),
      handler: async (req) =>
        Response.json(await aiAllowance((await withTenant(req)).tenant._id)),
    };
  });

  router.post("/draft", function draft() {
    const $body = z.object({
      description: z.string().min(3).max(4_000),
      repo: z.object({
        integration: $objectId,
        installation: z.number().int(),
        repo: z.string().regex(/^[\w.-]+\/[\w.-]+$/),
        branch: z.string().min(1).max(255),
      }).optional(),
    });
    return {
      shape: () => ({
        body: $body,
        return: z.object({
          kind: $templateKind,
          name: z.string(),
          description: z.string(),
          explanation: z.string(),
          content: $templateContent,
        }),
      }),
      handler: async (req) => {
        const body = $body.parse(await bodyAsJson(req));
        const { tenant, user } = await withTenant(req);
        return Response.json(
          await draftTemplate({ tenant: tenant._id, user: user._id, ...body }),
        );
      },
    };
  });

  router.post("/fix", function fix() {
    const $body = z.object({
      deployment: $objectId,
      log: z.string().max(200_000).optional(),
    });
    return {
      shape: () => ({
        body: $body,
        return: z.object({
          project: z.string(),
          explanation: z.string(),
          template: z.string().optional(),
          baseVersion: z.number().optional(),
          content: $templateContent.optional(),
        }),
      }),
      handler: async (req) => {
        const body = $body.parse(await bodyAsJson(req));
        const { tenant } = await withTenant(req);
        return Response.json(
          await fixDeployment({ tenant: tenant._id, ...body }),
        );
      },
    };
  });

  router.post("/fix/apply", function applyAiFix() {
    const $body = z.object({ project: $objectId, content: $templateContent });
    return {
      shape: () => ({
        body: $body,
        return: z.object({ template: z.string(), version: z.number() }),
      }),
      handler: async (req) => {
        const body = $body.parse(await bodyAsJson(req));
        const { tenant, user } = await withTenant(req);
        return Response.json(
          await applyFix({ tenant: tenant._id, user: user._id, ...body }),
        );
      },
    };
  });
}).group("Build");
