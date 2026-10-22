import z from "zod";
import { Router } from "@/core/http/router.ts";
import { bodyAsJson, paramsAsJson, queryAsJson } from "@/core/http/utils.ts";
import { $objectId } from "@/core/utils/createCRUD.ts";
import { withTenant } from "@/plugins/Huruf-Tech/thunder-core/utils/withTenant.ts";
import {
  cloneTemplate,
  createTemplate,
  deleteTemplate,
  getTemplate,
  listTemplates,
  listVersions,
  previewTemplate,
  saveVersion,
  updateTemplateMeta,
} from "@/lib/build/templates.ts";
import {
  $template,
  $templateContent,
  $templateKind,
  $templateMeta,
  $templateVersion,
} from "@/schemas/build/template.ts";

/** Templates (PLAN §9.1): published system templates plus the tenant's own, versioned. */
export default new Router("/api", function templates(router) {
  const $params = z.object({ id: $objectId });
  const $slug = z.string().min(1).max(60).regex(
    /^[a-z0-9-]+$/,
    "Lowercase letters, digits and dashes",
  );
  const $created = z.object({ _id: z.string() });
  const $summary = $template.omit({
    tenant: true,
    createdBy: true,
    clonedFrom: true,
  })
    .extend({
      _id: z.string(),
      createdAt: z.string(),
      updatedAt: z.string(),
      clonedFrom: z.object({ template: z.string(), version: z.number() })
        .optional(),
    });

  router.get("/", function list() {
    return {
      shape: () => ({ return: z.array($summary) }),
      handler: async (req) => {
        const { tenant } = await withTenant(req);
        return Response.json(
          (await listTemplates(tenant._id)).map((
            { tenant: _, createdBy: __, ...t },
          ) => t),
        );
      },
    };
  });

  router.get("/:id", function get() {
    const $query = z.object({
      version: z.coerce.number().int().positive().optional(),
    });
    const $return = z.object({
      template: $summary,
      content: $templateVersion.omit({ template: true, createdBy: true })
        .extend({ createdAt: z.string() }),
    });

    return {
      shape: () => ({ params: $params, query: $query, return: $return }),
      handler: async (req) => {
        const { id } = $params.parse(paramsAsJson(req));
        const { version } = $query.parse(queryAsJson(req));
        const { tenant } = await withTenant(req);
        const { template, content } = await getTemplate(
          id,
          tenant._id,
          version,
        );
        const { tenant: _, createdBy: __, ...summary } = template;
        const { template: ___, createdBy: ____, ...rest } = content;
        return Response.json({ template: summary, content: rest });
      },
    };
  });

  router.get("/:id/versions", function versions() {
    const $return = z.array(z.object({
      version: z.number(),
      changelog: z.string().optional(),
      createdAt: z.string(),
    }));

    return {
      shape: () => ({ params: $params, return: $return }),
      handler: async (req) => {
        const { id } = $params.parse(paramsAsJson(req));
        const { tenant } = await withTenant(req);
        return Response.json(
          (await listVersions(id, tenant._id)).map((v) => ({
            version: v.version,
            changelog: v.changelog,
            createdAt: v.createdAt,
          })),
        );
      },
    };
  });

  router.post("/", function create() {
    const $body = $templateMeta.extend({
      kind: $templateKind,
      slug: $slug,
      content: $templateContent,
    });

    return {
      shape: () => ({ body: $body, return: $created }),
      handler: async (req) => {
        const { content, ...meta } = $body.parse(await bodyAsJson(req));
        const { tenant, user } = await withTenant(req);
        const _id = await createTemplate({
          ...meta,
          tenant: tenant._id,
          user: user._id,
          content,
        });
        return Response.json({ _id: _id.toString() });
      },
    };
  });

  router.post("/:id/clone", function clone() {
    const $body = z.object({ name: $templateMeta.shape.name, slug: $slug });

    return {
      shape: () => ({ params: $params, body: $body, return: $created }),
      handler: async (req) => {
        const { id } = $params.parse(paramsAsJson(req));
        const body = $body.parse(await bodyAsJson(req));
        const { tenant, user } = await withTenant(req);
        const _id = await cloneTemplate({
          id,
          tenant: tenant._id,
          user: user._id,
          ...body,
        });
        return Response.json({ _id: _id.toString() });
      },
    };
  });

  router.post("/:id/versions", function saveTemplateVersion() {
    const $return = z.object({ version: z.number() });

    return {
      shape: () => ({
        params: $params,
        body: $templateContent,
        return: $return,
      }),
      handler: async (req) => {
        const { id } = $params.parse(paramsAsJson(req));
        const content = $templateContent.parse(await bodyAsJson(req));
        const { tenant, user } = await withTenant(req);
        const version = await saveVersion({
          id,
          tenant: tenant._id,
          user: user._id,
          content,
        });
        return Response.json({ version });
      },
    };
  });

  router.patch("/:id", function update() {
    const $body = $templateMeta.partial();

    return {
      shape: () => ({ params: $params, body: $body }),
      handler: async (req) => {
        const { id } = $params.parse(paramsAsJson(req));
        const meta = $body.parse(await bodyAsJson(req));
        await updateTemplateMeta(id, (await withTenant(req)).tenant._id, meta);
        return Response.json({ ok: true });
      },
    };
  });

  router.del("/:id", function del() {
    return {
      shape: () => ({ params: $params }),
      handler: async (req) => {
        const { id } = $params.parse(paramsAsJson(req));
        await deleteTemplate(id, (await withTenant(req)).tenant._id);
        return Response.json({ ok: true });
      },
    };
  });

  router.post("/:id/render", function render() {
    const $body = z.object({
      version: z.number().int().positive().optional(),
      inputs: z.record(z.string(), z.unknown()).default({}),
    });
    const $return = z.object({
      files: z.record(z.string(), z.string()),
      generated: z.array(z.string()),
    });

    return {
      shape: () => ({ params: $params, body: $body, return: $return }),
      handler: async (req) => {
        const { id } = $params.parse(paramsAsJson(req));
        const body = $body.parse(await bodyAsJson(req));
        const { tenant } = await withTenant(req);
        return Response.json(
          await previewTemplate({ id, tenant: tenant._id, ...body }),
        );
      },
    };
  });
}).group("Build");
