import z from "zod";
import { Router } from "@/core/http/router.ts";
import { bodyAsJson, paramsAsJson, queryAsJson } from "@/core/http/utils.ts";
import { $objectId } from "@/core/utils/createCRUD.ts";
import { Response } from "@/core/http/response.ts";
import { withTenant } from "@/plugins/Huruf-Tech/thunder-core/utils/withTenant.ts";
import { getProject } from "@/lib/deploy/projects.ts";
import {
  addDomain,
  domainRecords,
  removeDomain,
  startCheck,
} from "@/lib/domains/domains.ts";
import {
  $domainChecks,
  $domainStatus,
  cloudflareConnectionModel,
  domainModel,
} from "@/schemas/applications/domain.ts";
import { tenantOwner } from "@/lib/billing/owner.ts";
import {
  connectCloudflare,
  setUpInCloudflare,
} from "@/lib/domains/cloudflare.ts";

/**
 * A project's custom domains (PLAN §14, D43): the user adds a domain, creates
 * the DNS records shown, then clicks Check now.
 */
export default new Router("/api", function domains(router) {
  const $params = z.object({ id: $objectId });
  const $view = z.object({
    _id: z.string(),
    project: z.string(),
    hostname: z.string(),
    status: $domainStatus,
    checks: $domainChecks.extend({ checkedAt: z.string() }).optional(),
    checkUntil: z.string().optional(),
    verifiedAt: z.string().optional(),
    error: z.string().optional(),
    certificate: z.object({ notAfter: z.string(), issuedAt: z.string() })
      .optional(),
    records: z.object({
      ownership: z.object({
        type: z.literal("TXT"),
        name: z.string(),
        value: z.string(),
      }),
      cname: z.string().optional(),
      ipv4: z.array(z.string()).optional(),
    }),
    createdAt: z.string(),
  });

  router.get("/", function list() {
    const $query = z.object({ project: $objectId });
    return {
      shape: () => ({ query: $query, return: z.array($view) }),
      handler: async (req) => {
        const { project } = $query.parse(queryAsJson(req));
        const { tenant } = await withTenant(req);
        await getProject(tenant._id, project);
        const domains = await domainModel.find(
          { tenant: tenant._id, project },
          {
            projection: {
              tenant: 0,
              createdBy: 0,
              nextCheckAt: 0,
              "certificate.pem": 0,
              "certificate.keyEnc": 0,
              issueAt: 0,
              issueLockedUntil: 0,
              issueFailures: 0,
              issueOrders: 0,
            },
            sort: { hostname: 1 },
            limit: 100,
          },
        ).toArray();
        return Response.json(
          await Promise.all(
            domains.map(async ({ token, ...d }) => ({
              ...d,
              records: await domainRecords({ hostname: d.hostname, token }),
            })),
          ),
        );
      },
    };
  });

  router.post("/", function create() {
    const $body = z.object({
      project: $objectId,
      hostname: z.string().min(1).max(253),
    });
    return {
      shape: () => ({ body: $body, return: z.object({ _id: z.string() }) }),
      handler: async (req) => {
        const { project, hostname } = $body.parse(await bodyAsJson(req));
        const { tenant, user } = await withTenant(req);
        const _id = await addDomain(tenant._id, user._id, project, hostname);
        return Response.json({ _id: _id.toString() });
      },
    };
  });

  router.post("/:id/check", function check() {
    return {
      shape: () => ({ params: $params }),
      handler: async (req) => {
        const { id } = $params.parse(paramsAsJson(req));
        const { tenant } = await withTenant(req);
        await startCheck(tenant._id, id);
        return Response.json({ ok: true });
      },
    };
  });

  // Cloudflare (PLAN §14): the workspace's token creates domains' records.
  router.get("/cloudflare/connection", function cloudflareConnection() {
    const $return = z.object({
      connected: z.boolean(),
      zones: z.number().optional(),
      connectedAt: z.date().optional(),
    });
    return {
      shape: () => ({ return: $return }),
      handler: async (req) => {
        const { tenant } = await withTenant(req);
        const doc = await cloudflareConnectionModel.findOne({
          _id: tenant._id,
        }, { projection: { zones: 1, connectedAt: 1 } });
        return Response.json(
          doc
            ? {
              connected: true,
              zones: doc.zones,
              connectedAt: doc.connectedAt,
            }
            : { connected: false },
        );
      },
    };
  });

  router.put("/cloudflare/connection", function connectCloudflareToken() {
    const $body = z.object({ token: z.string().trim().min(20).max(200) });
    return {
      shape: () => ({
        body: $body,
        return: z.object({ zones: z.number() }),
      }),
      handler: async (req) => {
        const { token } = $body.parse(await bodyAsJson(req));
        const { tenant, user } = await tenantOwner(req, "connect Cloudflare");
        return Response.json(
          await connectCloudflare(tenant._id, user._id, token),
        );
      },
    };
  });

  router.del("/cloudflare/connection", function disconnectCloudflare() {
    return {
      shape: () => ({}),
      handler: async (req) => {
        const { tenant } = await tenantOwner(req, "disconnect Cloudflare");
        await cloudflareConnectionModel.deleteOne({ _id: tenant._id });
        return Response.json({ ok: true });
      },
    };
  });

  router.post("/:id/cloudflare", function setUpCloudflare() {
    const $body = z.object({
      replace: z.boolean().optional().describe(
        "Replace records pointing elsewhere (the owner only)",
      ),
    });
    const $return = z.object({
      applied: z.boolean(),
      created: z.array(z.string()).optional(),
      zone: z.string().optional(),
      conflicts: z.array(z.object({
        type: z.string(),
        content: z.string(),
        proxied: z.boolean(),
      })).optional(),
    });
    return {
      shape: () => ({ params: $params, body: $body, return: $return }),
      handler: async (req) => {
        const { id } = $params.parse(paramsAsJson(req));
        const { replace } = $body.parse(await bodyAsJson(req));
        // Replacing changes what the owner's zone already serves: theirs to do.
        const { tenant } = replace
          ? await tenantOwner(req, "replace DNS records")
          : await withTenant(req);
        return Response.json(await setUpInCloudflare(tenant._id, id, replace));
      },
    };
  });

  router.del("/:id", function del() {
    return {
      shape: () => ({ params: $params }),
      handler: async (req) => {
        const { id } = $params.parse(paramsAsJson(req));
        const { tenant } = await withTenant(req);
        await removeDomain(tenant._id, id);
        return Response.json({ ok: true });
      },
    };
  });
}).group("Applications");
