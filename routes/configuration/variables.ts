import z from "zod";
import { Router } from "@/core/http/router.ts";
import { Response } from "@/core/http/response.ts";
import { bodyAsJson, paramsAsJson, queryAsJson } from "@/core/http/utils.ts";
import { $objectId } from "@/core/utils/createCRUD.ts";
import { withTenant } from "@/plugins/Huruf-Tech/thunder-core/utils/withTenant.ts";
import {
  createVariable,
  deleteVariable,
  importVariables,
  listVariables,
  resolveVariables,
  revealVariable,
  type TVariableOwner,
  type TViewer,
  updateVariable,
} from "@/lib/variables/variables.ts";
import { projectIn } from "@/lib/deploy/projects.ts";
import {
  $variableKey,
  $variableScope,
  $variableSettings,
  $variableSettingsUpdate,
  $variableValue,
} from "@/schemas/configuration/variable.ts";

/**
 * Encrypted variables (PLAN §12). `global` belongs to the caller, `tenant` to
 * the active tenant. Each action is its own handler, so an API key can be
 * limited to `resolve` (the `variableApi` policy).
 */
export default new Router("/api", function variables(router) {
  const $params = z.object({ id: $objectId });
  const $scoped = z.object({
    scope: $variableScope,
    project: $objectId.optional().describe("Required for the project scope"),
  });
  type TScoped = z.output<typeof $scoped>;

  const context = async (req: Request, { scope, project }: TScoped) => {
    const { user, tenant } = await withTenant(req);
    // A workspace resolves with its owner's account variables, whoever asks
    // (owner's decision); members override them with project variables.
    const viewer: TViewer = {
      user: scope === "global" ? user._id : tenant.createdBy,
      tenant: tenant._id,
    };
    let owner: TVariableOwner;
    if (scope === "global") owner = { scope, user: user._id };
    else if (scope === "tenant") owner = { scope, tenant: tenant._id };
    else {
      if (!project) throw Response.badRequest("project is required");
      viewer.project = await projectIn(tenant._id, project);
      owner = { scope, tenant: tenant._id, project: viewer.project };
    }
    return { viewer, owner, by: user._id };
  };

  router.get("/", function list() {
    const $return = z.array($variableSettings.extend({
      _id: z.string(),
      key: z.string(),
      /** Absent for secrets: read them with reveal. */
      value: z.string().optional(),
      version: z.number(),
      updatedAt: z.string(),
    }));

    return {
      shape: () => ({ query: $scoped, return: $return }),
      handler: async (req) => {
        const { owner } = await context(req, $scoped.parse(queryAsJson(req)));
        return Response.json(
          (await listVariables(owner)).map((v) => ({
            _id: v._id,
            key: v.key,
            value: v.value,
            isSecret: v.isSecret,
            kind: v.kind,
            stage: v.stage,
            description: v.description,
            version: v.version,
            updatedAt: v.updatedAt,
          })),
        );
      },
    };
  });

  router.post("/", function create() {
    const $body = $variableSettings.extend($scoped.shape).extend({
      key: $variableKey,
      value: $variableValue,
    });
    const $return = z.object({ _id: z.string() });

    return {
      shape: () => ({ body: $body, return: $return }),
      handler: async (req) => {
        const { scope, project, key, value, ...settings } = $body.parse(
          await bodyAsJson(req),
        );
        const _id = await createVariable({
          ...await context(req, { scope, project }),
          key,
          value,
          settings,
        });
        return Response.json({ _id: _id.toString() });
      },
    };
  });

  // A pasted or uploaded .env file.
  router.post("/import", function importEnv() {
    const $body = $scoped.extend({
      variables: z.array(z.object({
        key: $variableKey,
        value: $variableValue,
        isSecret: z.boolean().default(false),
      })).min(1).max(200),
      overwrite: z.boolean().default(false).describe(
        "Replace the values of keys that already exist",
      ),
    });
    const $return = z.object({
      created: z.array(z.string()),
      updated: z.array(z.string()),
      skipped: z.array(z.string()).describe("Existing keys left as they were"),
    });

    return {
      shape: () => ({ body: $body, return: $return }),
      handler: async (req) => {
        const { scope, project, variables, overwrite } = $body.parse(
          await bodyAsJson(req),
        );
        return Response.json(
          await importVariables({
            ...await context(req, { scope, project }),
            items: variables,
            overwrite,
          }),
        );
      },
    };
  });

  router.patch("/:id", function update() {
    const $body = $variableSettingsUpdate.extend($scoped.shape).extend({
      value: $variableValue.optional(),
    });

    return {
      shape: () => ({ params: $params, body: $body }),
      handler: async (req) => {
        const { id } = $params.parse(paramsAsJson(req));
        const { scope, project, value, ...settings } = $body.parse(
          await bodyAsJson(req),
        );
        await updateVariable({
          ...await context(req, { scope, project }),
          id,
          value,
          settings,
        });
        return Response.json({ ok: true });
      },
    };
  });

  router.del("/:id", function del() {
    return {
      shape: () => ({ params: $params, query: $scoped }),
      handler: async (req) => {
        const { id } = $params.parse(paramsAsJson(req));
        const { owner } = await context(req, $scoped.parse(queryAsJson(req)));
        await deleteVariable(owner, id);
        return Response.json({ ok: true });
      },
    };
  });

  router.post("/:id/reveal", function reveal() {
    const $return = z.object({ value: z.string() });

    return {
      shape: () => ({ params: $params, body: $scoped, return: $return }),
      handler: async (req) => {
        const { id } = $params.parse(paramsAsJson(req));
        const { owner } = await context(
          req,
          $scoped.parse(await bodyAsJson(req)),
        );
        return Response.json({ value: await revealVariable(owner, id) });
      },
    };
  });

  // For scripts and CI: `X-Api-Key` + `X-TENANT-ID` (PLAN §12).
  router.get("/resolve", function resolve() {
    const $query = z.object({
      stage: z.enum(["build", "runtime"]).optional(),
      project: z.string().max(40).optional().describe(
        "A project's slug: include its variables (they win)",
      ),
    });
    const $return = z.object({
      env: z.record(z.string(), z.string()),
      files: z.record(z.string(), z.string()),
    });

    return {
      shape: () => ({ query: $query, return: $return }),
      handler: async (req) => {
        const { stage, project } = $query.parse(queryAsJson(req));
        const { viewer } = await context(req, { scope: "tenant" });
        if (project) viewer.project = await projectIn(viewer.tenant, project);
        return Response.json(await resolveVariables(viewer, stage));
      },
    };
  });
}).group("Configuration");
