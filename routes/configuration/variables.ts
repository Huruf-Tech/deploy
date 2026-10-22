import z from "zod";
import { Router } from "@/core/http/router.ts";
import { bodyAsJson, paramsAsJson, queryAsJson } from "@/core/http/utils.ts";
import { $objectId } from "@/core/utils/createCRUD.ts";
import { withTenant } from "@/plugins/Huruf-Tech/thunder-core/utils/withTenant.ts";
import {
  createVariable,
  deleteVariable,
  listVariables,
  resolveVariables,
  revealVariable,
  type TVariableOwner,
  updateVariable,
} from "@/lib/variables/variables.ts";
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
  const $scoped = z.object({ scope: $variableScope });

  const context = async (req: Request, scope: "global" | "tenant") => {
    const { user, tenant } = await withTenant(req);
    // A workspace resolves with its owner's account variables, whoever asks
    // (owner's decision); members override them with project variables.
    const viewer = {
      user: scope === "global" ? user._id : tenant.createdBy,
      tenant: tenant._id,
    };
    const owner: TVariableOwner = scope === "global"
      ? { scope, user: viewer.user }
      : { scope, tenant: viewer.tenant };
    return { viewer, owner };
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
        const { scope } = $scoped.parse(queryAsJson(req));
        const { owner } = await context(req, scope);
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
    const $body = $variableSettings.extend({
      scope: $variableScope,
      key: $variableKey,
      value: $variableValue,
    });
    const $return = z.object({ _id: z.string() });

    return {
      shape: () => ({ body: $body, return: $return }),
      handler: async (req) => {
        const { scope, key, value, ...settings } = $body.parse(
          await bodyAsJson(req),
        );
        const _id = await createVariable({
          ...await context(req, scope),
          key,
          value,
          settings,
        });
        return Response.json({ _id: _id.toString() });
      },
    };
  });

  router.patch("/:id", function update() {
    const $body = $variableSettingsUpdate.extend({
      scope: $variableScope,
      value: $variableValue.optional(),
    });

    return {
      shape: () => ({ params: $params, body: $body }),
      handler: async (req) => {
        const { id } = $params.parse(paramsAsJson(req));
        const { scope, value, ...settings } = $body.parse(
          await bodyAsJson(req),
        );
        await updateVariable({
          ...await context(req, scope),
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
        const { scope } = $scoped.parse(queryAsJson(req));
        await deleteVariable((await context(req, scope)).owner, id);
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
        const { scope } = $scoped.parse(await bodyAsJson(req));
        return Response.json({
          value: await revealVariable((await context(req, scope)).owner, id),
        });
      },
    };
  });

  // For scripts and CI: `X-Api-Key` + `X-TENANT-ID` (PLAN §12).
  router.get("/resolve", function resolve() {
    const $query = z.object({ stage: z.enum(["build", "runtime"]).optional() });
    const $return = z.object({
      env: z.record(z.string(), z.string()),
      files: z.record(z.string(), z.string()),
    });

    return {
      shape: () => ({ query: $query, return: $return }),
      handler: async (req) => {
        const { stage } = $query.parse(queryAsJson(req));
        const { viewer } = await context(req, "tenant");
        return Response.json(await resolveVariables(viewer, stage));
      },
    };
  });
}).group("Configuration");
