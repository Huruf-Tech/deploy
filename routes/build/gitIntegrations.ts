import z from "zod";
import { Router } from "@/core/http/router.ts";
import { bodyAsJson, paramsAsJson, queryAsJson } from "@/core/http/utils.ts";
import { $objectId } from "@/core/utils/createCRUD.ts";
import { withTenant } from "@/plugins/Huruf-Tech/thunder-core/utils/withTenant.ts";
import {
  listBranches,
  listIntegrations,
  listRepositories,
  removeIntegration,
  setShared,
  startConnect,
  syncInstallations,
  usableIntegration,
} from "@/lib/github/integrations.ts";
import {
  $githubAccount,
  $installation,
} from "@/schemas/build/gitIntegration.ts";

/** GitHub Apps owned by users, optionally shared with the tenant (PLAN D19). */
export default new Router("/api", function gitIntegrations(router) {
  const $params = z.object({ id: $objectId });
  const $installationParams = $params.extend({
    // Path params are strings in the SDK; converted with Number() below.
    installation: z.string().regex(/^\d{1,12}$/),
  });
  const $page = z.coerce.number().int().min(1).max(100).default(1);

  router.get("/", function list() {
    const $return = z.array(z.object({
      _id: z.string(),
      appSlug: z.string(),
      appName: z.string(),
      htmlUrl: z.string(),
      account: $githubAccount,
      installations: z.array($installation),
      sharedWithTenant: z.boolean(),
      isOwner: z.boolean(),
      createdAt: z.string(),
    }));

    return {
      shape: () => ({ return: $return }),
      handler: async (req) => {
        const { tenant, user } = await withTenant(req);
        const docs = await listIntegrations(tenant._id, user._id);
        return Response.json(docs.map((d) => ({
          _id: d._id,
          appSlug: d.appSlug,
          appName: d.appName,
          htmlUrl: d.htmlUrl,
          account: d.account,
          installations: d.installations,
          sharedWithTenant: d.sharedWithTenant,
          isOwner: d.owner.equals(user._id),
          createdAt: d.createdAt,
        })));
      },
    };
  });

  // The browser POSTs `manifest` to `action` (a form, as GitHub requires).
  router.post("/connect", function connect() {
    const $body = z.object({
      org: z.string().regex(/^[A-Za-z0-9-]{1,39}$/).optional(),
    });
    const $return = z.object({ action: z.string(), manifest: z.string() });

    return {
      shape: () => ({ body: $body, return: $return }),
      handler: async (req) => {
        const { org } = $body.parse(await bodyAsJson(req));
        const { tenant, user } = await withTenant(req);
        return Response.json(
          await startConnect({ tenant: tenant._id, user: user._id, org }),
        );
      },
    };
  });

  router.patch("/:id", function update() {
    const $body = z.object({ sharedWithTenant: z.boolean() });

    return {
      shape: () => ({ params: $params, body: $body }),
      handler: async (req) => {
        const { id } = $params.parse(paramsAsJson(req));
        const { sharedWithTenant } = $body.parse(await bodyAsJson(req));
        const { tenant, user } = await withTenant(req);
        await setShared(id, tenant._id, user._id, sharedWithTenant);
        return Response.json({ ok: true });
      },
    };
  });

  router.del("/:id", function del() {
    return {
      shape: () => ({ params: $params }),
      handler: async (req) => {
        const { id } = $params.parse(paramsAsJson(req));
        const { tenant, user } = await withTenant(req);
        await removeIntegration(id, tenant._id, user._id);
        return Response.json({ ok: true });
      },
    };
  });

  // Picks up installs GitHub couldn't report (no webhook on a local control plane).
  router.post("/:id/refresh", function refresh() {
    const $return = z.array($installation);

    return {
      shape: () => ({ params: $params, return: $return }),
      handler: async (req) => {
        const { id } = $params.parse(paramsAsJson(req));
        const { tenant, user } = await withTenant(req);
        const doc = await usableIntegration(id, tenant._id, user._id);
        return Response.json(await syncInstallations(doc));
      },
    };
  });

  router.get(
    "/:id/installations/:installation/repositories",
    function repositories() {
      const $query = z.object({ page: $page });
      const $return = z.object({
        repositories: z.array(z.object({
          id: z.number(),
          name: z.string(),
          fullName: z.string(),
          owner: z.string(),
          private: z.boolean(),
          defaultBranch: z.string(),
          pushedAt: z.string().optional(),
          description: z.string().optional(),
        })),
        hasMore: z.boolean(),
      });

      return {
        shape: () => ({
          params: $installationParams,
          query: $query,
          return: $return,
        }),
        handler: async (req) => {
          const { id, installation } = $installationParams.parse(
            paramsAsJson(req),
          );
          const { page } = $query.parse(queryAsJson(req));
          const { tenant, user } = await withTenant(req);
          const doc = await usableIntegration(id, tenant._id, user._id);
          return Response.json(
            await listRepositories(doc, Number(installation), page),
          );
        },
      };
    },
  );

  router.get(
    "/:id/installations/:installation/branches",
    function branches() {
      const $query = z.object({
        repo: z.string().regex(/^[\w.-]+\/[\w.-]+$/),
        page: $page,
      });
      const $return = z.object({
        branches: z.array(z.object({ name: z.string(), sha: z.string() })),
        hasMore: z.boolean(),
      });

      return {
        shape: () => ({
          params: $installationParams,
          query: $query,
          return: $return,
        }),
        handler: async (req) => {
          const { id, installation } = $installationParams.parse(
            paramsAsJson(req),
          );
          const { repo, page } = $query.parse(queryAsJson(req));
          const { tenant, user } = await withTenant(req);
          const doc = await usableIntegration(id, tenant._id, user._id);
          return Response.json(
            await listBranches(doc, Number(installation), repo, page),
          );
        },
      };
    },
  );
}).group("Build");
