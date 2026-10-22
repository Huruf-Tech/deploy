import { ObjectId, type WithId } from "mongodb";
import { Response } from "@/core/http/response.ts";
import { isDuplicateKeyError } from "@/database.ts";
import { Logger } from "@/core/utils/logger.ts";
import { entitlements, rateLimiter } from "@/lib/services.ts";
import { readNumberSetting, readTextSetting } from "@/lib/core/settings.ts";
import { sealTo } from "@/lib/agents/sealing.ts";
import { issueCommand } from "@/lib/agents/commands.ts";
import { getTemplate } from "@/lib/build/templates.ts";
import { renderContent, TemplateError } from "@/lib/build/render.ts";
import { ComposeError, parseCompose } from "@/lib/deploy/compose.ts";
import { defaultRef, sourceOf, type TCommit } from "@/lib/deploy/sources.ts";
import { refreshSpecs, sealReleaseSpec } from "@/lib/deploy/specs.ts";
import { isSecretInput, toEnvKey } from "@/lib/deploy/projects.ts";
import { forStage, resolveVariableSet } from "@/lib/variables/variables.ts";
import { projectModel, type TProject } from "@/schemas/applications/project.ts";
import {
  deploymentModel,
  releaseModel,
  type TDeployment,
  type TRelease,
  type TServiceSpec,
} from "@/schemas/applications/deployment.ts";
import { serverModel } from "@/schemas/infrastructure/server.ts";
import { serverLeaseModel } from "@/schemas/infrastructure/serverLease.ts";
import { registryModel } from "@/schemas/infrastructure/serverSpec.ts";
import { tenantModel } from "@/plugins/Huruf-Tech/thunder-core/schemas/tenant.ts";
import type { TBuildRunPayload } from "@/schemas/protocol/agent.ts";
import { keyring } from "@/lib/services.ts";

/**
 * Deployments (PLAN §9.3, §10): queue → build → rollout → healthy or failed.
 * There is no background job: each step runs inside the request that caused
 * it (a deploy click, a build result, a workload status event), and deadlines
 * are checked whenever deployments are read.
 */

type TProjectDoc = WithId<TProject>;
type TDeploymentDoc = WithId<TDeployment>;

const ACTIVE = ["building", "deploying"] as const;

const log = {
  info: (text: string) => Logger.info(`[deploy] ${text}`),
  warn: (text: string) => Logger.warn(`[deploy] ${text}`),
};

const now = () => new Date();

const owner = async (tenant: ObjectId) =>
  (await tenantModel.findOne({ _id: tenant }, {
    projection: { createdBy: 1 },
  }))!
    .createdBy;

const message = (error: unknown) =>
  error instanceof Response
    ? "Request failed"
    : (error as Error)?.message?.slice(0, 480) ?? String(error);

/** Starts a deployment, or queues it behind the running one; newer queued ones supersede older. */
export async function deploy(opts: {
  tenant: ObjectId;
  project: ObjectId;
  user?: ObjectId;
  trigger: TDeployment["trigger"];
  ref?: string;
  commit?: TCommit;
  noCache?: boolean;
  release?: ObjectId;
}) {
  const project = await projectModel.findOne({
    _id: opts.project,
    tenant: opts.tenant,
  });
  if (!project) throw Response.notFound("Project not found");

  const { limits } = await entitlements.resolve(opts.tenant);
  if (
    !await rateLimiter.hit(
      `deploys:${opts.tenant}`,
      limits.deploysPerHour,
      3_600,
    )
  ) {
    throw Response.json(
      { message: `Your plan allows ${limits.deploysPerHour} deploys per hour` },
      { status: 429 },
    );
  }

  const _id = new ObjectId();
  await deploymentModel.insertOne({
    _id,
    tenant: opts.tenant,
    project: project._id,
    trigger: opts.trigger,
    strategy: project.deployStrategy,
    status: "queued",
    servers: project.servers,
    builds: [],
    ...(opts.release ? { release: opts.release } : {}),
    ...(opts.ref ? { ref: opts.ref } : {}),
    ...(opts.commit ? { commit: opts.commit } : {}),
    noCache: !!opts.noCache,
    ...(opts.user ? { triggeredBy: opts.user } : {}),
    createdAt: now(),
  });
  // Supersede: only the newest queued deployment of a project waits.
  await deploymentModel.updateMany(
    { project: project._id, status: "queued", _id: { $ne: _id } },
    {
      $set: {
        status: "cancelled",
        finishedAt: now(),
        errorSummary: "Superseded by a newer deployment",
      },
    },
  );
  await startNext(project._id);
  return _id;
}

/** Claims the oldest queued deployment when none is running (one per project). */
export async function startNext(project: ObjectId) {
  await expireStale(project);
  const next = await deploymentModel.findOne(
    { project, status: "queued" },
    { sort: { createdAt: 1 } },
  );
  if (!next) return;
  try {
    const claimed = await deploymentModel.findOneAndUpdate(
      { _id: next._id, status: "queued" },
      { $set: { status: "building", active: true, startedAt: now() } },
      { returnDocument: "after" },
    );
    if (!claimed) return;
    await projectModel.updateOne({ _id: project }, {
      $set: { status: "deploying" },
    });
    await start(claimed);
  } catch (error) {
    if (isDuplicateKeyError(error)) return; // another deployment is running
    await fail(next._id, message(error));
  }
}

async function start(deployment: TDeploymentDoc) {
  const project = await projectModel.findOne({ _id: deployment.project });
  if (!project) return await fail(deployment._id, "The project was deleted");

  if (deployment.trigger === "rollback") {
    const release = await releaseModel.findOne({
      _id: deployment.release,
      project: project._id,
    });
    if (!release) {
      return await fail(deployment._id, "That release is no longer kept");
    }
    await deploymentModel.updateOne({ _id: deployment._id }, {
      $set: {
        releaseNumber: release.number,
        ...(release.commit ? { commit: release.commit } : {}),
      },
    });
    return await beginRollout(deployment._id);
  }

  const source = sourceOf(project);
  const commit = deployment.commit ??
    await source.commit(project, deployment.ref ?? defaultRef(project));
  const variables = await resolveVariableSet({
    user: await owner(project.tenant),
    tenant: project.tenant,
    project: project._id,
  });
  const runtime = forStage(variables, "runtime");
  const buildEnv = forStage(variables, "build").env;

  const counter = await projectModel.findOneAndUpdate(
    { _id: project._id },
    { $inc: { releaseCounter: 1 } },
    { returnDocument: "after", projection: { releaseCounter: 1 } },
  );
  const number = counter!.releaseCounter;
  const tag = `huruf/${project.slug}:${number}${
    commit ? `-${commit.sha.slice(0, 7)}` : ""
  }`;
  const cacheKey = `${project._id}-${project.cacheEpoch}`;

  const { services, dockerfile } = await serviceSpecs(project, {
    tag,
    commit,
    cacheKey,
    runtime,
    secretInputs: Object.fromEntries(variables.map((v) => [v.key, v.value])),
  });

  const builds = project.build.mode === "template" ||
    project.build.mode === "dockerfile";
  const releaseId = new ObjectId();
  const release: TRelease = {
    tenant: project.tenant,
    project: project._id,
    number,
    ...(builds ? { image: tag } : {}),
    builtOn: [],
    ...(commit ? { commit } : {}),
    specEnc: await sealReleaseSpec(project.tenant, releaseId, services),
    services: services.map((s) => s.name),
    deployment: deployment._id,
    ...(deployment.triggeredBy ? { createdBy: deployment.triggeredBy } : {}),
    createdAt: now(),
  };

  if (!builds) {
    await releaseModel.insertOne({ _id: releaseId, ...release });
    await deploymentModel.updateOne({ _id: deployment._id }, {
      $set: {
        release: releaseId,
        releaseNumber: number,
        ...(commit ? { commit } : {}),
      },
    });
    return await beginRollout(deployment._id);
  }

  // Image distribution (PLAN §8.4).
  const registry = await registryFor(project);
  const distribution = deployment.servers.length === 1 && !registry
    ? "local"
    : registry
    ? "registry"
    : "perServer";
  const builders = distribution === "registry"
    ? [await pickBuilder(deployment.servers)]
    : deployment.servers;
  if (registry) {
    release.registry = registry._id;
    release.pushedImage = registry.kind === "dockerhub"
      ? `docker.io/${registry.namespace}/${tag.slice("huruf/".length)}`
      : `${registry.namespace}/${tag.slice("huruf/".length)}`;
  }
  await releaseModel.insertOne({ _id: releaseId, ...release });

  const noCache = deployment.noCache || !!project.noCacheNext;
  if (project.noCacheNext) {
    await projectModel.updateOne({ _id: project._id }, {
      $unset: { noCacheNext: "" },
    });
  }
  const timeoutSec = await readNumberSetting("DEPLOY_BUILD_TIMEOUT_SEC", 1_800);
  const payload: TBuildRunPayload = {
    deployment: deployment._id.toHexString(),
    project: project._id.toHexString(),
    release: number,
    repo: await source.repo(
      project,
      commit?.sha ?? deployment.ref ?? defaultRef(project)!,
    ),
    rootDir: project.build.rootDir,
    ...(dockerfile
      ? { dockerfile }
      : { dockerfilePath: project.build.dockerfilePath }),
    image: tag,
    labels: {
      "deploy.huruf.project": project._id.toHexString(),
      "deploy.huruf.release": String(number),
    },
    buildEnv,
    noCache,
    timeoutSec,
    gitImage: await readTextSetting("AGENT_GIT_IMAGE", "alpine/git:latest"),
    ...(registry && release.pushedImage
      ? {
        push: {
          image: release.pushedImage,
          registry: registry.kind === "dockerhub" ? "docker.io" : registry.url!,
          username: registry.username,
          password: await keyring.decrypt(
            { kind: "tenant", ref: registry.tenant },
            registry.secretEnc,
            `registry:${registry._id}`,
          ),
        },
      }
      : {}),
  };

  const boxKeys = await serverModel.find(
    { _id: { $in: builders } },
    { projection: { "identity.boxPublicKey": 1 } },
  ).toArray();
  const issued = [];
  for (const server of builders) {
    const key = boxKeys.find((s) =>
      s._id.equals(server)
    )!.identity.boxPublicKey;
    const { seq } = await issueCommand({
      server,
      tenant: project.tenant,
      type: "build.run",
      payload: { sealed: await sealTo(key, JSON.stringify(payload)) },
      createdBy: deployment.triggeredBy,
    });
    issued.push({ server, seq, status: "running" as const });
  }

  await deploymentModel.updateOne({ _id: deployment._id }, {
    $set: {
      release: releaseId,
      releaseNumber: number,
      distribution,
      noCache,
      builds: issued,
      deadlineAt: new Date(Date.now() + (timeoutSec + 120) * 1000),
      ...(commit ? { commit } : {}),
    },
  });
}

/**
 * The release's services: the app itself, or every compose service. Variables
 * become env and files; template inputs come from the project and, for
 * secrets, from its variables.
 */
async function serviceSpecs(project: TProjectDoc, opts: {
  tag: string;
  commit?: TCommit;
  cacheKey: string;
  runtime: { env: Record<string, string>; files: Record<string, string> };
  secretInputs: Record<string, string>;
}) {
  const appVolumes = project.volumes.map((v) => ({
    name: `huruf-${project._id}-${v.name}`,
    mountPath: v.mountPath,
  }));
  const app = (image: string): TServiceSpec => ({
    name: "app",
    image,
    env: {
      ...(project.runtime.port ? { PORT: String(project.runtime.port) } : {}),
      ...opts.runtime.env,
    },
    files: opts.runtime.files,
    ...(project.runtime.command?.length
      ? { command: project.runtime.command }
      : {}),
    ...(project.runtime.port ? { port: project.runtime.port } : {}),
    ...(project.runtime.healthcheckPath
      ? { healthcheckPath: project.runtime.healthcheckPath }
      : {}),
    volumes: appVolumes,
  });

  const rendered = async () => {
    const { template, content } = await getTemplate(
      project.template!.template,
      project.tenant,
      project.template!.version,
    );
    const inputs: Record<string, unknown> = { ...project.templateInputs };
    for (const field of content.inputs) {
      if (isSecretInput(field)) {
        inputs[field.key] = opts.secretInputs[toEnvKey(field.key)] ?? "";
      }
    }
    try {
      return renderContent(template.kind, content, inputs, {
        cacheKey: opts.cacheKey,
      }).files;
    } catch (error) {
      if (error instanceof TemplateError) {
        throw new Error(`Template: ${error.message}`);
      }
      throw error;
    }
  };

  switch (project.build.mode) {
    case "none": {
      const source = project.source as Extract<
        TProject["source"],
        { type: "image" }
      >;
      return { services: [app(source.image)] };
    }
    case "dockerfile":
      return { services: [app(opts.tag)] };
    case "template":
      return {
        services: [app(opts.tag)],
        dockerfile: (await rendered()).Dockerfile,
      };
    case "compose": {
      const text = project.template
        ? (await rendered())["compose.yaml"]
        : await sourceOf(project).readFile(
          project,
          opts.commit!.sha,
          project.build.composePath,
        );
      try {
        return {
          services: parseCompose(text, `huruf-${project._id}-`).map((
            s,
          ): TServiceSpec => ({
            name: s.name,
            image: s.image,
            env: { ...s.env, ...opts.runtime.env },
            files: opts.runtime.files,
            ...(s.command ? { command: s.command } : {}),
            ...(s.port ? { port: s.port } : {}),
            ...(s.healthcheckCommand
              ? { healthcheckCommand: s.healthcheckCommand }
              : {}),
            volumes: s.volumes,
          })),
        };
      } catch (error) {
        if (error instanceof ComposeError) {
          throw new Error(`Compose: ${error.message}`);
        }
        throw error;
      }
    }
  }
}

async function registryFor(project: TProjectDoc) {
  if (project.distribution === "perServer") return undefined;
  const registry = project.registry
    ? await registryModel.findOne({
      _id: project.registry,
      tenant: project.tenant,
    })
    : await registryModel.findOne({ tenant: project.tenant, isDefault: true });
  if (!registry && project.distribution === "registry") {
    throw new Error(
      "This project builds once and pushes to a registry, but none is connected",
    );
  }
  return registry ?? undefined;
}

/** The least loaded online target, preferring servers labelled builder=true (PLAN §8.4). */
async function pickBuilder(servers: ObjectId[]) {
  const [docs, leases] = await Promise.all([
    serverModel.find({ _id: { $in: servers } }, {
      projection: { labels: 1, resources: 1 },
    }).toArray(),
    serverLeaseModel.find({ _id: { $in: servers } }, {
      projection: { aliveUntil: 1 },
    }).toArray(),
  ]);
  const online = docs.filter((d) =>
    leases.some((l) =>
      l._id.equals(d._id) && l.aliveUntil.getTime() > Date.now()
    )
  );
  const pool = online.length ? online : docs;
  pool.sort((a, b) =>
    Number(b.labels?.builder === "true") -
      Number(a.labels?.builder === "true") ||
    (a.resources?.cpu ?? 1) - (b.resources?.cpu ?? 1)
  );
  return pool[0]._id;
}

/** `build.run` results (from the events request). */
export async function onBuildResult(
  server: ObjectId,
  seq: number,
  outcome: { ok: boolean; result?: Record<string, unknown>; error?: string },
) {
  const deployment = await deploymentModel.findOneAndUpdate(
    { status: "building", builds: { $elemMatch: { server, seq } } },
    {
      $set: {
        "builds.$.status": outcome.ok ? "done" : "failed",
        ...(outcome.error
          ? { "builds.$.error": outcome.error.slice(0, 480) }
          : {}),
        ...(typeof outcome.result?.durationMs === "number"
          ? { "builds.$.durationMs": outcome.result.durationMs }
          : {}),
      },
    },
    { returnDocument: "after" },
  );
  if (!deployment) return;

  if (!outcome.ok) {
    const name =
      (await serverModel.findOne({ _id: server }, { projection: { name: 1 } }))
        ?.name;
    return await fail(
      deployment._id,
      `Build failed on ${name ?? "a server"}: ${
        outcome.error ?? "unknown error"
      }`,
    );
  }
  if (deployment.builds.some((b) => b.status !== "done")) return;

  // Generic Git: the builder resolved the branch, so the commit arrives with the result.
  const result = outcome.result ?? {};
  const commit = !deployment.commit && typeof result.commit === "string"
    ? {
      sha: result.commit,
      ...(typeof result.message === "string"
        ? { message: result.message.slice(0, 300) }
        : {}),
      ...(typeof result.author === "string" ? { author: result.author } : {}),
    }
    : undefined;
  await releaseModel.updateOne({ _id: deployment.release }, {
    $set: {
      builtOn: deployment.builds.map((b) => b.server),
      ...(commit ? { commit } : {}),
    },
  });
  if (commit) {
    await deploymentModel.updateOne({ _id: deployment._id }, {
      $set: { commit },
    });
  }
  await beginRollout(deployment._id);
}

const stepSeconds = async (project: ObjectId) => {
  const doc = await projectModel.findOne({ _id: project }, {
    projection: { "runtime.healthTimeoutSec": 1 },
  });
  return (doc?.runtime.healthTimeoutSec ?? 120) + 120;
};

/** Rolling and stop-first go server by server; all at once prepares every server first. */
async function beginRollout(id: ObjectId) {
  const deployment = await deploymentModel.findOne({ _id: id });
  if (!deployment) return;
  const phase = deployment.strategy === "allAtOnce" ? "prepare" : "rolling";
  const servers = deployment.servers.map((server, i) => ({
    server,
    state: phase === "prepare" || i === 0
      ? "applying" as const
      : "pending" as const,
    healthy: [] as string[],
  }));
  const step = await stepSeconds(deployment.project);

  await deploymentModel.updateOne({ _id: id }, {
    $set: {
      status: "deploying",
      rollout: { phase, servers },
      deadlineAt: new Date(
        Date.now() + step * 1000 * (phase === "prepare" ? 2 : servers.length),
      ),
    },
  });
  await applyTo(
    id,
    servers.filter((s) => s.state === "applying").map((s) => s.server),
  );
}

/** Pushes new specs to these servers and records the versions statuses must reach. */
async function applyTo(id: ObjectId, servers: ObjectId[]) {
  const versions = await refreshSpecs(servers);
  for (const server of servers) {
    const version = versions.get(server.toHexString());
    if (version === undefined) {
      return await fail(id, "A target server is no longer active");
    }
    await deploymentModel.updateOne(
      { _id: id },
      { $set: { "rollout.servers.$[s].specVersion": version } },
      { arrayFilters: [{ "s.server": server }] },
    );
  }
}

/** `workload.status` events: advance the rollout (PLAN §10). */
export async function onWorkloadStatus(
  server: ObjectId,
  status: {
    version: number;
    project: string;
    workload: string;
    release: number;
    state: string;
    error?: string;
  },
) {
  if (status.state === "starting" || !ObjectId.isValid(status.project)) return;
  const project = new ObjectId(status.project);
  const deployment = await deploymentModel.findOne({
    project,
    status: "deploying",
    releaseNumber: status.release,
    rollout: { $exists: true },
  });
  const step = deployment?.rollout?.servers.find((s) =>
    s.server.equals(server)
  );
  if (
    !deployment || !step || step.state !== "applying" ||
    status.version < (step.specVersion ?? Infinity)
  ) {
    return;
  }

  if (status.state === "failed") {
    const name =
      (await serverModel.findOne({ _id: server }, { projection: { name: 1 } }))
        ?.name;
    return await fail(
      deployment._id,
      `${name ?? "A server"}: ${
        status.error ?? "the new release didn't become healthy"
      }`,
    );
  }

  const updated = await deploymentModel.findOneAndUpdate(
    { _id: deployment._id, status: "deploying" },
    { $addToSet: { "rollout.servers.$[s].healthy": status.workload } },
    {
      arrayFilters: [{ "s.server": server, "s.state": "applying" }],
      returnDocument: "after",
    },
  );
  const entry = updated?.rollout?.servers.find((s) => s.server.equals(server));
  if (!updated || !entry) return;

  const release = await releaseModel.findOne({ _id: updated.release }, {
    projection: { services: 1 },
  });
  const slug =
    (await projectModel.findOne({ _id: project }, { projection: { slug: 1 } }))
      ?.slug;
  const expected = release!.services.length === 1
    ? [slug]
    : release!.services.map((s) => `${slug}-${s}`);
  if (!expected.every((w) => entry.healthy.includes(w!))) return;

  const marked = await deploymentModel.updateOne(
    { _id: deployment._id, status: "deploying" },
    { $set: { "rollout.servers.$[s].state": "healthy" } },
    { arrayFilters: [{ "s.server": server, "s.state": "applying" }] },
  );
  if (marked.modifiedCount) await advance(deployment._id);
}

async function advance(id: ObjectId) {
  const deployment = await deploymentModel.findOne({
    _id: id,
    status: "deploying",
  });
  const rollout = deployment?.rollout;
  if (!deployment || !rollout) return;
  const allHealthy = rollout.servers.every((s) => s.state === "healthy");

  if (rollout.phase === "rolling") {
    const next = rollout.servers.find((s) => s.state === "pending");
    if (next) {
      const claimed = await deploymentModel.updateOne(
        { _id: id, status: "deploying" },
        { $set: { "rollout.servers.$[s].state": "applying" } },
        { arrayFilters: [{ "s.server": next.server, "s.state": "pending" }] },
      );
      if (claimed.modifiedCount) await applyTo(id, [next.server]);
      return;
    }
    if (allHealthy) await complete(id);
    return;
  }

  if (!allHealthy) return;
  if (rollout.phase === "prepare") {
    // Every server runs the new set: switch traffic everywhere in one round.
    const switched = await deploymentModel.updateOne(
      { _id: id, status: "deploying", "rollout.phase": "prepare" },
      {
        $set: {
          "rollout.phase": "switch",
          "rollout.servers": rollout.servers.map((s) => ({
            ...s,
            state: "applying",
            healthy: [],
          })),
        },
      },
    );
    if (switched.modifiedCount) {
      await applyTo(
        id,
        rollout.servers.map((s) => s.server),
      );
    }
    return;
  }
  await complete(id);
}

async function complete(id: ObjectId) {
  const finished = now();
  const deployment = await deploymentModel.findOneAndUpdate(
    { _id: id, status: "deploying" },
    {
      $set: { status: "healthy", finishedAt: finished },
      $unset: { active: "", deadlineAt: "" },
    },
    { returnDocument: "after" },
  );
  if (!deployment) return;
  await deploymentModel.updateOne({ _id: id }, {
    $set: {
      durationMs: finished.getTime() -
        (deployment.startedAt ?? deployment.createdAt).getTime(),
    },
  });

  const before = await projectModel.findOneAndUpdate(
    { _id: deployment.project },
    {
      $set: {
        activeRelease: deployment.release!,
        placedOn: deployment.servers,
        status: "running",
        updatedAt: finished,
      },
    },
    { returnDocument: "before", projection: { placedOn: 1, tenant: 1 } },
  );
  // Servers the project left drop it; the others drop the finished rollout's extra state.
  await refreshSpecs([...deployment.servers, ...(before?.placedOn ?? [])]);
  if (before) {
    await pruneReleases(deployment.project, before.tenant, deployment.release!);
  }
  log.info(`Deployment ${id} is healthy`);
  await startNext(deployment.project);
}

/** Keeps the newest N releases (plan `releasesKept`) plus the active one. */
async function pruneReleases(
  project: ObjectId,
  tenant: ObjectId,
  active: ObjectId,
) {
  const { limits } = await entitlements.resolve(tenant);
  const kept = await releaseModel.find({ project }, {
    sort: { number: -1 },
    limit: limits.releasesKept,
    projection: { _id: 1 },
  }).toArray();
  await releaseModel.deleteMany({
    project,
    _id: { $nin: [active, ...kept.map((r) => r._id)] },
  });
}

/**
 * Fails a deployment and reverts: servers already switched get the active
 * release back through their spec (auto-revert, PLAN §10).
 */
export async function fail(id: ObjectId, error: string) {
  const deployment = await deploymentModel.findOneAndUpdate(
    { _id: id, status: { $in: ["queued", ...ACTIVE] } },
    {
      $set: {
        status: "failed",
        finishedAt: now(),
        errorSummary: error.slice(0, 480),
      },
      $unset: { active: "", deadlineAt: "" },
    },
    { returnDocument: "before" },
  );
  if (!deployment) return;
  log.warn(`Deployment ${id} failed: ${error}`);

  if (deployment.rollout) await refreshSpecs(deployment.servers);
  const project = await projectModel.findOne({ _id: deployment.project }, {
    projection: { activeRelease: 1 },
  });
  // A release that never ran is useless for rollbacks; a rollback's release stays.
  if (
    deployment.release && deployment.trigger !== "rollback" &&
    !project?.activeRelease?.equals(deployment.release)
  ) {
    await releaseModel.deleteOne({ _id: deployment.release });
  }
  if (project) {
    await projectModel.updateOne({ _id: deployment.project }, {
      $set: { status: project.activeRelease ? "running" : "failed" },
    });
    await startNext(deployment.project);
  }
}

/** Builds and rollouts past their deadline fail (a server went offline, a build hung). */
export async function expireStale(project?: ObjectId) {
  const stale = await deploymentModel.find(
    {
      ...(project ? { project } : {}),
      status: { $in: [...ACTIVE] },
      deadlineAt: { $lt: now() },
    },
    { projection: { status: 1 }, limit: 20 },
  ).toArray();
  for (const d of stale) {
    await fail(
      d._id,
      d.status === "building"
        ? "The build didn't finish in time (is the build server online?)"
        : "Servers didn't report healthy in time (are they online?)",
    );
  }
}

export async function cancel(tenant: ObjectId, id: ObjectId) {
  const deployment = await deploymentModel.findOne({ _id: id, tenant });
  if (!deployment) throw Response.notFound("Deployment not found");
  if (deployment.status === "queued") {
    await deploymentModel.updateOne({ _id: id, status: "queued" }, {
      $set: {
        status: "cancelled",
        finishedAt: now(),
        errorSummary: "Cancelled",
      },
    });
    return;
  }
  if (!ACTIVE.includes(deployment.status as typeof ACTIVE[number])) {
    throw Response.badRequest("This deployment has finished");
  }
  await fail(id, "Cancelled");
  await deploymentModel.updateOne({ _id: id }, {
    $set: { status: "cancelled" },
  });
}

/** Rollback = a deployment of a kept release, without rebuilding (PLAN §10). */
export async function rollback(opts: {
  tenant: ObjectId;
  project: ObjectId;
  release: ObjectId;
  user: ObjectId;
}) {
  const [project, release] = await Promise.all([
    projectModel.findOne({ _id: opts.project, tenant: opts.tenant }),
    releaseModel.findOne({ _id: opts.release, project: opts.project }),
  ]);
  if (!project || !release) throw Response.notFound("Release not found");
  // A per-server build only exists on the servers that built it.
  if (release.image && !release.pushedImage) {
    const missing = project.servers.filter((s) =>
      !release.builtOn.some((b) => b.equals(s))
    );
    if (missing.length) {
      throw Response.badRequest(
        `Release ${release.number} was built on other servers; deploy again to build it for the current ones`,
      );
    }
  }
  return await deploy({
    tenant: opts.tenant,
    project: opts.project,
    user: opts.user,
    trigger: "rollback",
    release: release._id,
  });
}

/** "Clear build cache": a new cache id, and the next build skips the layer cache (PLAN §9.2). */
export async function clearBuildCache(tenant: ObjectId, project: ObjectId) {
  const { matchedCount } = await projectModel.updateOne(
    { _id: project, tenant },
    { $inc: { cacheEpoch: 1 }, $set: { noCacheNext: true } },
  );
  if (!matchedCount) throw Response.notFound("Project not found");
}

/** GitHub `push` webhook: deploy every auto-deploy project on that branch (PLAN §16 6c). */
export async function deployOnPush(
  integration: ObjectId,
  tenant: ObjectId,
  push: {
    ref?: string;
    after?: string;
    deleted?: boolean;
    repository?: { full_name?: string };
    head_commit?: { message?: string; author?: { name?: string } } | null;
  },
) {
  const branch = push.ref?.startsWith("refs/heads/")
    ? push.ref.slice("refs/heads/".length)
    : undefined;
  if (!branch || push.deleted || !push.after || !push.repository?.full_name) {
    return 0;
  }

  const projects = await projectModel.find({
    tenant,
    "source.type": "github",
    "source.gitIntegration": integration,
    "source.repo": push.repository.full_name,
    "source.branch": branch,
    autoDeploy: true,
  }, { projection: { _id: 1 }, limit: 50 }).toArray();

  for (const project of projects) {
    await deploy({
      tenant,
      project: project._id,
      trigger: "push",
      commit: {
        sha: push.after,
        ...(push.head_commit?.message
          ? { message: push.head_commit.message.split("\n")[0].slice(0, 300) }
          : {}),
        ...(push.head_commit?.author?.name
          ? { author: push.head_commit.author.name }
          : {}),
      },
    }).catch((error) =>
      log.warn(`Push deploy of ${project._id} refused: ${message(error)}`)
    );
  }
  return projects.length;
}
