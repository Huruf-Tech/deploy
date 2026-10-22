import z from "zod";
import type { ObjectId } from "mongodb";
import { Router } from "@/core/http/router.ts";
import { bodyAsJson, paramsAsJson, queryAsJson } from "@/core/http/utils.ts";
import { $objectId } from "@/core/utils/createCRUD.ts";
import { Response } from "@/core/http/response.ts";
import { withTenant } from "@/plugins/Huruf-Tech/thunder-core/utils/withTenant.ts";
import {
  createProject,
  deleteProject,
  getProject,
  placement,
  updateProject,
} from "@/lib/deploy/projects.ts";
import {
  cancel,
  clearBuildCache,
  deploy,
  expireStale,
  rollback,
} from "@/lib/deploy/deployments.ts";
import {
  $deployStrategy,
  $projectInput,
  $projectRuntime,
  $projectSource,
  $projectUpdate,
  $projectVolume,
  projectModel,
} from "@/schemas/applications/project.ts";
import {
  $commit,
  deploymentModel,
  releaseModel,
} from "@/schemas/applications/deployment.ts";
import { serverModel } from "@/schemas/infrastructure/server.ts";

/** Projects and their deployments (PLAN §9.3, §10, §15.6). */
export default new Router("/api", function projects(router) {
  const $params = z.object({ id: $objectId });
  const $deploymentParams = z.object({ deployment: $objectId });
  const $status = z.enum(["new", "deploying", "running", "failed"]);
  const $deploymentStatus = z.enum([
    "queued",
    "building",
    "deploying",
    "healthy",
    "failed",
    "cancelled",
  ]);

  const names = async (ids: ObjectId[]) =>
    new Map(
      (await serverModel.find({ _id: { $in: ids } }, {
        projection: { name: 1 },
      }).toArray())
        .map((s) => [s._id.toHexString(), s.name]),
    );

  router.get("/", function list() {
    const $return = z.array(z.object({
      _id: z.string(),
      name: z.string(),
      slug: z.string(),
      kind: z.enum(["app", "service"]),
      status: $status,
      source: z.string().describe("Short description, e.g. acme/shop@main"),
      sourceType: z.enum(["github", "git", "image", "template"]),
      servers: z.number(),
      publicPort: z.number().optional(),
      release: z.number().optional(),
      lastDeployment: z.object({
        status: $deploymentStatus,
        createdAt: z.string(),
        commit: $commit.optional(),
      }).optional(),
      updatedAt: z.string(),
    }));

    return {
      shape: () => ({ return: $return }),
      handler: async (req) => {
        const { tenant } = await withTenant(req);
        const projects = await projectModel.find({ tenant: tenant._id }, {
          projection: { deployKeyEnc: 0 },
          sort: { name: 1 },
          limit: 500,
        }).toArray();
        const ids = projects.map((p) => p._id);
        const [latest, releases] = await Promise.all([
          deploymentModel.aggregate<
            { _id: ObjectId; status: string; createdAt: Date; commit?: unknown }
          >([
            { $match: { project: { $in: ids } } },
            { $sort: { createdAt: -1 } },
            {
              $group: {
                _id: "$project",
                status: { $first: "$status" },
                createdAt: { $first: "$createdAt" },
                commit: { $first: "$commit" },
              },
            },
          ]).toArray(),
          releaseModel.find(
            {
              _id: {
                $in: projects.flatMap((p) =>
                  p.activeRelease ? [p.activeRelease] : []
                ),
              },
            },
            { projection: { number: 1 } },
          ).toArray(),
        ]);

        return Response.json(projects.map((p) => {
          const last = latest.find((d) => d._id.equals(p._id));
          return {
            _id: p._id,
            name: p.name,
            slug: p.slug,
            kind: p.kind,
            status: p.status,
            source: p.source.type === "github"
              ? `${p.source.repo}@${p.source.branch}`
              : p.source.type === "git"
              ? `${p.source.url}@${p.source.branch}`
              : p.source.type === "image"
              ? p.source.image
              : "template",
            sourceType: p.source.type,
            servers: p.servers.length,
            publicPort: p.publicPort,
            release: releases.find((r) => r._id.equals(p.activeRelease!))
              ?.number,
            ...(last
              ? {
                lastDeployment: {
                  status: last.status,
                  createdAt: last.createdAt,
                  commit: last.commit,
                },
              }
              : {}),
            updatedAt: p.updatedAt,
          };
        }));
      },
    };
  });

  router.get("/placement", function placementInfo() {
    const $return = z.array(z.object({
      server: z.string(),
      name: z.string(),
      labels: z.record(z.string(), z.string()),
      online: z.boolean(),
      cpuCores: z.number(),
      memoryMb: z.number(),
      cpuReserved: z.number(),
      memReservedMb: z.number(),
      cpuFree: z.number(),
      memFreeMb: z.number(),
      publicPorts: z.array(z.number()),
    }));

    return {
      shape: () => ({ return: $return }),
      handler: async (req) =>
        Response.json(await placement((await withTenant(req)).tenant._id)),
    };
  });

  router.get("/:id", function get() {
    const $return = z.object({
      _id: z.string(),
      name: z.string(),
      slug: z.string(),
      kind: z.enum(["app", "service"]),
      group: z.string().optional(),
      status: $status,
      source: $projectSource,
      build: z.object({
        mode: z.string(),
        rootDir: z.string(),
        dockerfilePath: z.string(),
        composePath: z.string(),
      }),
      template: z.object({ template: z.string(), version: z.number() })
        .optional(),
      templateInputs: z.record(
        z.string(),
        z.union([z.string(), z.number(), z.boolean()]),
      ),
      runtime: $projectRuntime,
      servers: z.array(z.object({
        _id: z.string(),
        name: z.string(),
        publicIp: z.string().optional(),
      })),
      placedOn: z.array(z.string()),
      replicasPerServer: z.number(),
      publicPort: z.number().optional(),
      volumes: z.array($projectVolume),
      deployStrategy: $deployStrategy,
      autoDeploy: z.boolean(),
      distribution: z.string(),
      registry: z.string().optional(),
      deployKeyPublic: z.string().optional(),
      release: z.object({
        _id: z.string(),
        number: z.number(),
        commit: $commit.optional(),
      }).optional(),
      containers: z.array(z.object({
        server: z.string(),
        serverName: z.string(),
        name: z.string(),
        service: z.string(),
      })).describe("The active release's containers, for logs and shells"),
      createdAt: z.string(),
      updatedAt: z.string(),
    });

    return {
      shape: () => ({ params: $params, return: $return }),
      handler: async (req) => {
        const { id } = $params.parse(paramsAsJson(req));
        const { tenant } = await withTenant(req);
        const project = await getProject(tenant._id, id);
        const release = project.activeRelease
          ? await releaseModel.findOne(
            { _id: project.activeRelease },
            { projection: { number: 1, commit: 1, services: 1 } },
          )
          : null;
        const serverDocs = await serverModel.find(
          { _id: { $in: [...project.servers, ...project.placedOn] } },
          { projection: { name: 1, "inventory.publicIp": 1 } },
        ).toArray();
        const serverNames = new Map(
          serverDocs.map((s) => [s._id.toHexString(), s.name]),
        );

        // Container names follow the agent's scheme: huruf-<workload>-<release>-<replica>.
        const containers = !release
          ? []
          : project.placedOn.flatMap((server) =>
            release.services.flatMap((service) => {
              const workload = release.services.length === 1
                ? project.slug
                : `${project.slug}-${service}`;
              return Array.from(
                { length: project.replicasPerServer },
                (_, i) => ({
                  server: server.toHexString(),
                  serverName: serverNames.get(server.toHexString()) ?? "server",
                  name: `huruf-${workload}-${release.number}-${i}`,
                  service,
                }),
              );
            })
          );

        const { deployKeyEnc: _, tenant: __, createdBy: ___, ...rest } =
          project as typeof project & {
            deployKeyEnc?: string;
          };
        return Response.json({
          ...rest,
          servers: project.servers.map((s) => {
            const doc = serverDocs.find((d) => d._id.equals(s));
            return {
              _id: s,
              name: doc?.name ?? "Removed server",
              ...(doc?.inventory.publicIp
                ? { publicIp: doc.inventory.publicIp }
                : {}),
            };
          }),
          ...(release
            ? {
              release: {
                _id: release._id,
                number: release.number,
                commit: release.commit,
              },
            }
            : {}),
          containers,
        });
      },
    };
  });

  router.post("/", function create() {
    const $return = z.object({
      _id: z.string(),
      deployKeyPublic: z.string().optional(),
    });

    return {
      shape: () => ({ body: $projectInput, return: $return }),
      handler: async (req) => {
        const input = $projectInput.parse(await bodyAsJson(req));
        const { tenant, user } = await withTenant(req);
        const { _id, deployKeyPublic } = await createProject({
          tenant: tenant._id,
          user: user._id,
          input,
        });
        return Response.json({ _id: _id.toString(), deployKeyPublic });
      },
    };
  });

  router.patch("/:id", function update() {
    const $return = z.object({
      redeploy: z.boolean().describe("Servers changed: deploy to move it"),
    });

    return {
      shape: () => ({ params: $params, body: $projectUpdate, return: $return }),
      handler: async (req) => {
        const { id } = $params.parse(paramsAsJson(req));
        const patch = $projectUpdate.parse(await bodyAsJson(req));
        const { tenant } = await withTenant(req);
        return Response.json(
          await updateProject({ tenant: tenant._id, id, patch }),
        );
      },
    };
  });

  router.del("/:id", function del() {
    return {
      shape: () => ({ params: $params }),
      handler: async (req) => {
        const { id } = $params.parse(paramsAsJson(req));
        await deleteProject((await withTenant(req)).tenant._id, id);
        return Response.json({ ok: true });
      },
    };
  });

  router.post("/:id/deploy", function deployProject() {
    const $body = z.object({
      noCache: z.boolean().default(false),
      ref: z.string().max(255).optional().describe(
        "Branch or commit; the project's branch by default",
      ),
    });
    const $return = z.object({ deployment: z.string() });

    return {
      shape: () => ({ params: $params, body: $body, return: $return }),
      handler: async (req) => {
        const { id } = $params.parse(paramsAsJson(req));
        const body = $body.parse(await bodyAsJson(req));
        const { tenant, user } = await withTenant(req);
        const deployment = await deploy({
          tenant: tenant._id,
          project: id,
          user: user._id,
          trigger: "manual",
          ...body,
        });
        return Response.json({ deployment: deployment.toString() });
      },
    };
  });

  router.post("/:id/rollback", function rollbackProject() {
    const $body = z.object({ release: $objectId });
    const $return = z.object({ deployment: z.string() });

    return {
      shape: () => ({ params: $params, body: $body, return: $return }),
      handler: async (req) => {
        const { id } = $params.parse(paramsAsJson(req));
        const { release } = $body.parse(await bodyAsJson(req));
        const { tenant, user } = await withTenant(req);
        const deployment = await rollback({
          tenant: tenant._id,
          project: id,
          release,
          user: user._id,
        });
        return Response.json({ deployment: deployment.toString() });
      },
    };
  });

  router.post("/:id/clearCache", function clearCache() {
    return {
      shape: () => ({ params: $params }),
      handler: async (req) => {
        const { id } = $params.parse(paramsAsJson(req));
        await clearBuildCache((await withTenant(req)).tenant._id, id);
        return Response.json({ ok: true });
      },
    };
  });

  router.get("/:id/releases", function releases() {
    const $return = z.array(z.object({
      _id: z.string(),
      number: z.number(),
      commit: $commit.optional(),
      image: z.string().optional(),
      active: z.boolean(),
      createdAt: z.string(),
    }));

    return {
      shape: () => ({ params: $params, return: $return }),
      handler: async (req) => {
        const { id } = $params.parse(paramsAsJson(req));
        const project = await getProject(
          (await withTenant(req)).tenant._id,
          id,
        );
        const list = await releaseModel.find({ project: id }, {
          projection: { number: 1, commit: 1, image: 1, createdAt: 1 },
          sort: { number: -1 },
          limit: 100,
        }).toArray();
        return Response.json(list.map((r) => ({
          ...r,
          active: !!project.activeRelease?.equals(r._id),
        })));
      },
    };
  });

  const $deploymentSummary = z.object({
    _id: z.string(),
    status: $deploymentStatus,
    trigger: z.enum(["manual", "push", "rollback"]),
    strategy: $deployStrategy,
    releaseNumber: z.number().optional(),
    commit: $commit.optional(),
    noCache: z.boolean(),
    errorSummary: z.string().optional(),
    createdAt: z.string(),
    startedAt: z.string().optional(),
    finishedAt: z.string().optional(),
    durationMs: z.number().optional(),
  });

  router.get("/:id/deployments", function deployments() {
    const $query = z.object({
      page: z.coerce.number().int().min(1).max(100).default(1),
    });

    return {
      shape: () => ({
        params: $params,
        query: $query,
        return: z.array($deploymentSummary),
      }),
      handler: async (req) => {
        const { id } = $params.parse(paramsAsJson(req));
        const { page } = $query.parse(queryAsJson(req));
        const { tenant } = await withTenant(req);
        await getProject(tenant._id, id);
        await expireStale(id);
        return Response.json(
          await deploymentModel.find({ project: id }, {
            projection: { builds: 0, rollout: 0, servers: 0 },
            sort: { createdAt: -1 },
            skip: (page - 1) * 20,
            limit: 20,
          }).toArray(),
        );
      },
    };
  });

  router.get("/deployments/:deployment", function deployment() {
    const $return = $deploymentSummary.extend({
      project: z.string(),
      distribution: z.string().optional(),
      servers: z.array(z.object({
        _id: z.string(),
        name: z.string(),
        build: z.enum(["running", "done", "failed"]).optional(),
        buildError: z.string().optional(),
        buildMs: z.number().optional(),
        rollout: z.enum(["pending", "applying", "healthy", "failed"])
          .optional(),
      })),
      phase: z.enum(["rolling", "prepare", "switch"]).optional(),
    });

    return {
      shape: () => ({ params: $deploymentParams, return: $return }),
      handler: async (req) => {
        const { deployment: id } = $deploymentParams.parse(paramsAsJson(req));
        const { tenant } = await withTenant(req);
        let d = await deploymentModel.findOne({ _id: id, tenant: tenant._id });
        if (!d) throw Response.notFound("Deployment not found");
        await expireStale(d.project);
        d = (await deploymentModel.findOne({ _id: id }))!;
        const serverNames = await names(d.servers);
        const { builds, rollout, servers, tenant: _, ...rest } = d;
        return Response.json({
          ...rest,
          phase: rollout?.phase,
          servers: servers.map((s) => {
            const build = builds.find((b) => b.server.equals(s));
            const step = rollout?.servers.find((r) => r.server.equals(s));
            return {
              _id: s,
              name: serverNames.get(s.toHexString()) ?? "Removed server",
              ...(build
                ? {
                  build: build.status,
                  buildError: build.error,
                  buildMs: build.durationMs,
                }
                : {}),
              ...(step ? { rollout: step.state } : {}),
            };
          }),
        });
      },
    };
  });

  router.post("/deployments/:deployment/cancel", function cancelDeployment() {
    return {
      shape: () => ({ params: $deploymentParams }),
      handler: async (req) => {
        const { deployment } = $deploymentParams.parse(paramsAsJson(req));
        await cancel((await withTenant(req)).tenant._id, deployment);
        return Response.json({ ok: true });
      },
    };
  });
}).group("Applications");
