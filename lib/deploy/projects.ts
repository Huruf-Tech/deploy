import { ObjectId, type WithId } from "mongodb";
import { Response } from "@/core/http/response.ts";
import { isDuplicateKeyError } from "@/database.ts";
import { entitlements, keyring, quotaGuard } from "@/lib/services.ts";
import { removeProjectDomains } from "@/lib/domains/domains.ts";
import { getTemplate } from "@/lib/build/templates.ts";
import {
  renderContent,
  resolveInputs,
  TemplateError,
} from "@/lib/build/render.ts";
import {
  ComposeError,
  interpolate,
  parseCompose,
} from "@/lib/deploy/compose.ts";
import { generateDeployKey } from "@/lib/deploy/deployKeys.ts";
import { usableIntegration } from "@/lib/github/integrations.ts";
import {
  createVariable,
  deleteProjectVariables,
  importVariables,
} from "@/lib/variables/variables.ts";
import { refreshSpecs } from "@/lib/deploy/specs.ts";
import { dropBuiltinImages } from "@/lib/deploy/registryCleanup.ts";
import { storageModel } from "@/schemas/infrastructure/storage.ts";
import {
  $projectRuntime,
  hasLocalVolumes,
  projectModel,
  type TProject,
  type TProjectInput,
  type TProjectUpdate,
} from "@/schemas/applications/project.ts";
import {
  deploymentModel,
  releaseModel,
} from "@/schemas/applications/deployment.ts";
import { serverModel } from "@/schemas/infrastructure/server.ts";
import { serverLeaseModel } from "@/schemas/infrastructure/serverLease.ts";
import { registryModel } from "@/schemas/infrastructure/serverSpec.ts";
import { tenantModel } from "@/plugins/Huruf-Tech/thunder-core/schemas/tenant.ts";
import type { TTemplateInput } from "@/schemas/build/template.ts";

/** Ports the edge proxy can't take: SSH, DNS, Caddy's admin API. */
const RESERVED_PORTS = [22, 53, 2019];
const MiB = 1024 * 1024;

/** A project of the tenant, by id or slug (404 otherwise). */
export async function projectIn(tenant: ObjectId, ref: ObjectId | string) {
  const filter = ref instanceof ObjectId || ObjectId.isValid(ref)
    ? { _id: new ObjectId(ref), tenant }
    : { slug: ref, tenant };
  const project = await projectModel.findOne(filter, {
    projection: { _id: 1 },
  });
  if (!project) throw Response.notFound("Project not found");
  return project._id;
}

export async function getProject(tenant: ObjectId, id: ObjectId) {
  const project = await projectModel.findOne({ _id: id, tenant }, {
    projection: { deployKeyEnc: 0 },
  });
  if (!project) throw Response.notFound("Project not found");
  return project;
}

// A pasted compose file often holds passwords: encrypted, bound to its project.
const composeOwner = (tenant: ObjectId) => ({
  kind: "tenant" as const,
  ref: tenant,
});
export const openCompose = (
  project: Pick<WithId<TProject>, "_id" | "tenant" | "composeEnc">,
) =>
  keyring.decrypt(
    composeOwner(project.tenant),
    project.composeEnc!,
    `compose:${project._id}`,
  );
const sealCompose = (tenant: ObjectId, id: ObjectId, text: string) =>
  keyring.encrypt(composeOwner(tenant), text, `compose:${id}`);

/** camelCase input keys become UPPER_SNAKE variable keys: rootPassword → ROOT_PASSWORD. */
export const toEnvKey = (key: string) =>
  key.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toUpperCase();

/** Secret inputs live in project variables, never in the project document. */
export const isSecretInput = (input: TTemplateInput) =>
  input.type === "secret" || !!input.generate;

const tenantOwner = async (tenant: ObjectId) =>
  (await tenantModel.findOne({ _id: tenant }, {
    projection: { createdBy: 1 },
  }))!
    .createdBy;

const asBadRequest = async <T>(fn: () => T | Promise<T>) => {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof TemplateError || error instanceof ComposeError) {
      throw Response.badRequest(error.message);
    }
    throw error;
  }
};

/**
 * Free-to-allocate per server = capacity − reservations of the projects
 * placed there (PLAN §7). Throws when this project's reservation doesn't fit.
 */
async function assertFits(opts: {
  tenant: ObjectId;
  servers: ObjectId[];
  cpu: number;
  memMb: number;
  except?: ObjectId;
}) {
  const [servers, placed] = await Promise.all([
    serverModel.find(
      { _id: { $in: opts.servers }, tenant: opts.tenant, status: "active" },
      { projection: { name: 1, inventory: 1, "provider.kind": 1 } },
    ).toArray(),
    projectModel.find(
      {
        tenant: opts.tenant,
        servers: { $in: opts.servers },
        ...(opts.except ? { _id: { $ne: opts.except } } : {}),
      },
      {
        projection: {
          servers: 1,
          runtime: 1,
          replicasPerServer: 1,
          autoscale: 1,
        },
        limit: 1_000,
      },
    ).toArray(),
  ]);
  // Projects run in partitions; a machine only hosts them (PLAN §27.2).
  const machine = servers.find((s) => s.provider?.kind === "machine");
  if (machine) {
    throw Response.badRequest(
      `${machine.name} is a machine: deploy to one of its partitions`,
    );
  }
  if (servers.length !== opts.servers.length) {
    throw Response.badRequest("Pick active servers of this tenant");
  }

  for (const server of servers) {
    const here = placed.filter((p) =>
      p.servers.some((s) => s.equals(server._id))
    );
    const cpuUsed = here.reduce(
      (sum, p) => sum + p.runtime.cpuReserve * reservedReplicas(p),
      0,
    );
    const memUsed = here.reduce(
      (sum, p) => sum + p.runtime.memReserveMb * reservedReplicas(p),
      0,
    );
    const cpuFree = server.inventory.cpuCores - cpuUsed;
    const memFree = server.inventory.memory / MiB - memUsed;
    if (opts.cpu > cpuFree + 1e-9 || opts.memMb > memFree) {
      throw Response.badRequest(
        `${server.name} has ${Math.max(0, cpuFree).toFixed(2)} CPU and ${
          Math.max(0, Math.floor(memFree))
        } MiB free to allocate; this needs ${
          opts.cpu.toFixed(2)
        } CPU and ${opts.memMb} MiB. Lower the reservation or the replicas, or pick another server.`,
      );
    }
  }
}

async function assertPortFree(opts: {
  tenant: ObjectId;
  servers: ObjectId[];
  port?: number;
  except?: ObjectId;
}) {
  if (!opts.port) return;
  if (RESERVED_PORTS.includes(opts.port)) {
    throw Response.badRequest(`Port ${opts.port} is reserved on servers`);
  }
  // A partition shares its machine's ports: custom domains only (PLAN §26 D).
  const rented = await serverModel.findOne({
    _id: { $in: opts.servers },
    "provider.kind": "rented",
  }, { projection: { name: 1 } });
  if (rented) {
    throw Response.badRequest(
      `${rented.name} is rented from Huruf: use a custom domain instead of a public port`,
    );
  }
  // Partitions of one machine share its ports (PLAN §27.3).
  const hosts = (await serverModel.find(
    { _id: { $in: opts.servers }, "provider.host": { $exists: true } },
    { projection: { "provider.host": 1 } },
  ).toArray()).map((s) => s.provider.host!);
  const siblings = hosts.length
    ? (await serverModel.find({ "provider.host": { $in: hosts } }, {
      projection: { _id: 1 },
    }).toArray()).map((s) => s._id)
    : [];
  const taken = await projectModel.findOne({
    tenant: opts.tenant,
    servers: { $in: [...opts.servers, ...siblings] },
    publicPort: opts.port,
    ...(opts.except ? { _id: { $ne: opts.except } } : {}),
  }, { projection: { name: 1 } });
  if (taken) {
    throw Response.badRequest(
      `${taken.name} already uses port ${opts.port} on one of these servers or another partition of their machine`,
    );
  }
}

/** Local volumes pin a project to one server and default to stop-first (PLAN §10, §11). */
function assertVolumeRules(opts: {
  hasVolumes: boolean;
  servers: ObjectId[];
  strategy: TProject["deployStrategy"];
  acknowledged?: boolean;
}) {
  if (!opts.hasVolumes) return;
  if (opts.servers.length > 1) {
    throw Response.badRequest("Projects with local volumes run on one server");
  }
  if (opts.strategy !== "stopFirst" && !opts.acknowledged) {
    throw Response.badRequest(
      "Two containers writing the same volume can corrupt data. Use stop-first, or confirm the risk.",
    );
  }
}

/** Volumes have unique names and mount paths, and S3 ones use this tenant's storage. */
async function assertVolumes(tenant: ObjectId, volumes: TProject["volumes"]) {
  const unique = (key: "name" | "mountPath") =>
    new Set(volumes.map((v) => v[key])).size === volumes.length;
  if (!unique("name") || !unique("mountPath")) {
    throw Response.badRequest("Each volume needs its own name and mount path");
  }
  const ids = [
    ...new Set(volumes.flatMap((v) => v.storage ? [String(v.storage)] : [])),
  ];
  if (
    ids.length &&
    await storageModel.countDocuments({
        _id: { $in: ids.map((id) => new ObjectId(id)) },
        tenant,
      }) !== ids.length
  ) {
    throw Response.badRequest("Storage connection not found");
  }
}

async function assertRegistry(tenant: ObjectId, registry?: ObjectId | null) {
  if (
    registry &&
    !await registryModel.findOne({ _id: registry, tenant }, {
      projection: { _id: 1 },
    })
  ) {
    throw Response.badRequest("Registry not found");
  }
}

export async function createProject(opts: {
  tenant: ObjectId;
  user: ObjectId;
  input: TProjectInput;
}) {
  const { tenant, user, input } = opts;
  const _id = new ObjectId();

  if (input.source.type === "github") {
    const integration = await usableIntegration(
      input.source.gitIntegration,
      tenant,
      user,
    );
    if (
      !integration.installations.some((i) =>
        i.id === (input.source as { installation: number }).installation
      )
    ) {
      throw Response.badRequest("That GitHub installation isn't connected");
    }
  }
  await assertRegistry(tenant, input.registry);

  // Template: render once now, so a broken template or input fails here, not on deploy.
  let template: TProject["template"];
  const templateInputs: TProject["templateInputs"] = {};
  const secrets: Record<string, string> = {};
  let kind: TProject["kind"] = "app";
  let runtime = { ...input.runtime };
  let composeVolumes = false;
  if (input.template) {
    const { template: doc, content } = await getTemplate(
      input.template.template,
      tenant,
      input.template.version,
    );
    template = { template: doc._id, version: content.version };
    kind = doc.kind;
    if (kind === "service" && input.source.type !== "template") {
      throw Response.badRequest(
        "One-click services take everything from their template",
      );
    }
    if (kind === "app" && !["github", "git"].includes(input.source.type)) {
      throw Response.badRequest(
        "App templates build from a GitHub or Git repository",
      );
    }

    const { values } = await asBadRequest(() =>
      resolveInputs(content.inputs, input.inputs)
    );
    for (const field of content.inputs) {
      if (isSecretInput(field)) {
        secrets[toEnvKey(field.key)] = String(values[field.key]);
      } else templateInputs[field.key] = values[field.key];
    }
    const { files } = await asBadRequest(() =>
      renderContent(doc.kind, content, values, { cacheKey: "validate" })
    );
    if (kind === "service") {
      const services = await asBadRequest(() =>
        parseCompose(files["compose.yaml"], `huruf-${_id}-`)
      );
      composeVolumes = services.some((s) => s.volumes.length > 0);
    }
    runtime = {
      port: content.defaults.port,
      healthcheckPath: content.defaults.healthcheckPath,
      cpuLimit: content.defaults.cpuLimit,
      memLimitMb: content.defaults.memLimitMb,
      ...runtime,
    };
  } else if (input.source.type === "template") {
    throw Response.badRequest("Pick the service template");
  } else if (input.source.type === "compose") {
    if (!input.compose?.trim()) {
      throw Response.badRequest("Paste the compose file");
    }
    kind = "service";
    composeVolumes = (await checkCompose(input.compose, _id)).some((s) =>
      s.volumes.length > 0
    );
  }

  const mode: TProject["build"]["mode"] = template
    ? (kind === "service" ? "compose" : "template")
    : input.source.type === "compose"
    ? "compose"
    : input.source.type === "image"
    ? "none"
    : input.build?.mode === "compose"
    ? "compose"
    : "dockerfile";
  if (mode === "compose" && input.source.type === "git") {
    throw Response.badRequest(
      "Compose files are read from GitHub repositories",
    );
  }

  await assertVolumes(tenant, input.volumes);
  const hasVolumes = hasLocalVolumes(input.volumes) || composeVolumes;
  const strategy = input.deployStrategy ??
    (hasVolumes ? "stopFirst" : "rolling");
  assertVolumeRules({
    hasVolumes,
    servers: input.servers,
    strategy,
    acknowledged: input.acknowledgeVolumeRisk,
  });

  const parsedRuntime = $projectRuntime.parse(runtime);
  if (input.publicPort && !parsedRuntime.port && kind === "app") {
    throw Response.badRequest(
      "Set the port the app listens on to expose it publicly",
    );
  }
  await assertPortFree({
    tenant,
    servers: input.servers,
    port: input.publicPort,
  });
  assertAutoscale(input.autoscale, hasVolumes);
  await assertFits({
    tenant,
    servers: input.servers,
    cpu: parsedRuntime.cpuReserve * reservedReplicas(input),
    memMb: parsedRuntime.memReserveMb * reservedReplicas(input),
  });

  let deployKey: { publicKey: string; privateKey: string } | undefined;
  // SSH URLs (ssh://… or user@host:path) need a key; https:// and git:// are public.
  if (
    input.source.type === "git" &&
    /^(ssh:\/\/|[\w.-]+@[\w.-]+:)/.test(input.source.url)
  ) {
    deployKey = await generateDeployKey(`huruf-deploy-${input.slug}`);
  }

  const { limits } = await entitlements.resolve(tenant);
  if (!await quotaGuard.acquire(tenant, "projects", limits.projects)) {
    throw Response.forbidden(`Your plan allows ${limits.projects} projects`);
  }
  const now = new Date();
  try {
    await projectModel.insertOne({
      _id,
      tenant,
      ...(input.group ? { group: input.group } : {}),
      name: input.name,
      slug: input.slug,
      kind,
      source: input.source,
      build: {
        mode,
        rootDir: input.build?.rootDir ?? ".",
        dockerfilePath: input.build?.dockerfilePath ?? "Dockerfile",
        composePath: input.build?.composePath ?? "compose.yaml",
      },
      ...(template ? { template } : {}),
      templateInputs,
      runtime: parsedRuntime,
      servers: input.servers,
      placedOn: [],
      replicasPerServer: input.replicasPerServer,
      ...(input.autoscale ? { autoscale: input.autoscale } : {}),
      ...(input.publicPort ? { publicPort: input.publicPort } : {}),
      volumes: input.volumes,
      deployStrategy: strategy,
      autoDeploy: input.autoDeploy,
      needsPrivateNetwork: input.needsPrivateNetwork,
      distribution: input.distribution,
      ...(input.registry ? { registry: input.registry } : {}),
      ...(input.source.type === "compose"
        ? { composeEnc: await sealCompose(tenant, _id, input.compose!) }
        : {}),
      ...(deployKey
        ? {
          deployKeyPublic: deployKey.publicKey,
          deployKeyEnc: await keyring.encrypt(
            { kind: "tenant", ref: tenant },
            deployKey.privateKey,
            `deployKey:${_id}`,
          ),
        }
        : {}),
      releaseCounter: 0,
      cacheEpoch: 0,
      status: "new",
      createdBy: user,
      createdAt: now,
      updatedAt: now,
    });
  } catch (error) {
    await quotaGuard.release(tenant, "projects");
    if (isDuplicateKeyError(error)) {
      throw Response.badRequest(
        `A project with the slug ${input.slug} already exists`,
      );
    }
    throw error;
  }

  const viewer = { user: await tenantOwner(tenant), tenant, project: _id };
  const owner = { scope: "project" as const, tenant, project: _id };
  // The user's own variables first: they win over generated template inputs.
  if (input.variables.length) {
    await importVariables({
      viewer,
      owner,
      items: input.variables,
      overwrite: false,
      by: user,
    });
  }
  const given = new Set(input.variables.map((v) => v.key));

  // Generated and secret template inputs (PLAN §9.1).
  for (const [key, value] of Object.entries(secrets)) {
    if (given.has(key)) continue;
    await createVariable({
      viewer,
      owner,
      key,
      value,
      settings: {
        isSecret: true,
        kind: "env",
        stage: "runtime",
        description: "Template input",
      },
      by: user,
    });
  }

  return { _id, deployKeyPublic: deployKey?.publicKey };
}

export async function updateProject(opts: {
  tenant: ObjectId;
  id: ObjectId;
  patch: TProjectUpdate;
}) {
  const { tenant, id, patch } = opts;
  const project = await getProject(tenant, id);
  const servers = patch.servers ?? project.servers;
  const replicas = patch.replicasPerServer ?? project.replicasPerServer;
  const runtime = { ...project.runtime, ...patch.runtime };
  const publicPort = patch.publicPort === null
    ? undefined
    : patch.publicPort ?? project.publicPort;
  const strategy = patch.deployStrategy ?? project.deployStrategy;
  const autoscale = patch.autoscale === null
    ? undefined
    : patch.autoscale ?? project.autoscale;

  await assertRegistry(tenant, patch.registry);
  if (patch.compose && project.source.type === "compose") {
    await checkCompose(patch.compose, id);
  }
  const volumes = patch.volumes ?? project.volumes;
  await assertVolumes(tenant, volumes);
  const hasVolumes = hasLocalVolumes(volumes) ||
    await hasComposeVolumes(project, patch.compose);
  assertVolumeRules({
    hasVolumes,
    servers,
    strategy,
    acknowledged: patch.acknowledgeVolumeRisk ??
      project.deployStrategy === strategy,
  });
  await assertPortFree({ tenant, servers, port: publicPort, except: id });
  assertAutoscale(autoscale, hasVolumes);
  const reserved = reservedReplicas({ replicasPerServer: replicas, autoscale });
  await assertFits({
    tenant,
    servers,
    cpu: runtime.cpuReserve * reserved,
    memMb: runtime.memReserveMb * reserved,
    except: id,
  });

  const $set: Partial<TProject> = {
    updatedAt: new Date(),
    runtime,
    servers,
    replicasPerServer: replicas,
    deployStrategy: strategy,
  };
  const $unset: Record<string, ""> = {};
  if (patch.name) $set.name = patch.name;
  if (patch.group === null) $unset.group = "";
  else if (patch.group) $set.group = patch.group;
  if (publicPort) $set.publicPort = publicPort;
  else $unset.publicPort = "";
  if (autoscale) $set.autoscale = autoscale;
  else $unset.autoscale = $unset.autoscaled = "";
  if (patch.volumes) $set.volumes = patch.volumes;
  if (patch.autoDeploy !== undefined) $set.autoDeploy = patch.autoDeploy;
  if (patch.needsPrivateNetwork !== undefined) {
    $set.needsPrivateNetwork = patch.needsPrivateNetwork;
  }
  if (patch.distribution) $set.distribution = patch.distribution;
  if (patch.registry === null) $unset.registry = "";
  else if (patch.registry) $set.registry = patch.registry;
  if (
    patch.branch &&
    (project.source.type === "github" || project.source.type === "git")
  ) {
    $set.source = { ...project.source, branch: patch.branch };
  }
  if ((patch.template || patch.templateVersion) && project.template) {
    const { template, content } = await getTemplate(
      patch.template ?? project.template.template,
      tenant,
      patch.templateVersion,
    );
    const current = await getTemplate(project.template.template, tenant)
      .catch(() => undefined);
    if (current && current.template.kind !== template.kind) {
      throw Response.badRequest("The template must be of the same kind");
    }
    $set.template = { template: template._id, version: content.version };
  }
  if (patch.inputs) {
    $set.templateInputs = { ...project.templateInputs, ...patch.inputs };
  }
  if (patch.compose && project.source.type === "compose") {
    $set.composeEnc = await sealCompose(tenant, id, patch.compose);
  }

  await projectModel.updateOne({ _id: id, tenant }, {
    $set,
    ...(Object.keys($unset).length ? { $unset } : {}),
  });
  // Replicas, limits and the public port apply now; code and servers on the next deploy.
  await refreshSpecs(project.placedOn);
  return {
    // Servers and volumes are part of a release: they change on the next deploy.
    redeploy: project.placedOn.length > 0 &&
      (!sameServers(servers, project.placedOn) ||
        (!!patch.volumes &&
          JSON.stringify(patch.volumes) !== JSON.stringify(project.volumes))),
  };
}

/** Placement reserves for the worst case: autoscale max (PLAN §7.1). */
export const reservedReplicas = (
  p: Pick<TProject, "replicasPerServer" | "autoscale">,
) => p.autoscale?.max ?? p.replicasPerServer;

function assertAutoscale(
  autoscale: TProject["autoscale"],
  hasVolumes: boolean,
) {
  if (autoscale && hasVolumes) {
    throw Response.badRequest(
      "Projects with local volumes can't autoscale: their replicas would share the volume",
    );
  }
}

const sameServers = (a: ObjectId[], b: ObjectId[]) =>
  a.length === b.length && a.every((x) => b.some((y) => y.equals(x)));

/** Validates a pasted compose file; `${VAR}`s may be set as variables later. */
const checkCompose = (text: string, id: ObjectId) =>
  asBadRequest(() =>
    parseCompose(interpolate(text, {}, { lenient: true }), `huruf-${id}-`)
  );

async function hasComposeVolumes(project: WithId<TProject>, pasted?: string) {
  if (project.source.type === "compose") {
    const text = pasted ?? await openCompose(project);
    return (await checkCompose(text, project._id)).some((s) =>
      s.volumes.length > 0
    );
  }
  if (project.build.mode !== "compose" || !project.template) return false;
  const { content } = await getTemplate(
    project.template.template,
    project.tenant,
    project.template.version,
  );
  return /^\s*volumes:\s*$/m.test(content.compose ?? "");
}

/**
 * Removes the project: running containers go away on the next spec, then
 * releases, deployments and project variables are deleted.
 */
/**
 * A server is gone (PLAN §27.4): projects that ran only there go with it
 * (their containers and data went with the server); the others drop it.
 */
export async function detachServer(tenant: ObjectId, server: ObjectId) {
  const projects = await projectModel.find({
    tenant,
    $or: [{ servers: server }, { placedOn: server }],
  }, { projection: { servers: 1 }, limit: 1_000 }).toArray();
  for (const p of projects) {
    if (p.servers.every((s) => s.equals(server))) {
      await deleteProject(tenant, p._id);
    } else {
      await projectModel.updateOne({ _id: p._id }, {
        $pull: { servers: server, placedOn: server },
      });
    }
  }
}

export async function deleteProject(tenant: ObjectId, id: ObjectId) {
  const project = await getProject(tenant, id);
  const active = await deploymentModel.find(
    { project: id, status: { $in: ["queued", "building", "deploying"] } },
    { projection: { servers: 1 } },
  ).toArray();

  await projectModel.deleteOne({ _id: id, tenant });
  await quotaGuard.release(tenant, "projects");
  await deploymentModel.updateMany(
    { project: id, status: { $in: ["queued", "building", "deploying"] } },
    {
      $set: {
        status: "cancelled",
        finishedAt: new Date(),
        errorSummary: "Project deleted",
      },
    },
  );
  await refreshSpecs([
    ...project.placedOn,
    ...active.flatMap((d) => d.servers),
  ]);
  const releases = await releaseModel.find({ project: id }, {
    projection: { pushedImage: 1, builtinRegistry: 1 },
    limit: 1_000,
  }).toArray();
  await dropBuiltinImages(tenant, releases);
  await Promise.all([
    releaseModel.deleteMany({ project: id }),
    deploymentModel.deleteMany({ project: id }),
    deleteProjectVariables(tenant, id),
    removeProjectDomains(tenant, id),
  ]);
}

/** Servers for the wizard, emptiest first (PLAN §7). */
export async function placement(tenant: ObjectId) {
  const [servers, projects, leases] = await Promise.all([
    // Machines only host partitions (PLAN §27.2).
    serverModel.find({
      tenant,
      status: "active",
      "provider.kind": { $ne: "machine" },
    }, {
      projection: { name: 1, inventory: 1, labels: 1, provider: 1 },
      limit: 200,
    }).toArray(),
    projectModel.find({ tenant }, {
      projection: {
        servers: 1,
        runtime: 1,
        replicasPerServer: 1,
        autoscale: 1,
        publicPort: 1,
      },
      limit: 2_000,
    }).toArray(),
    serverLeaseModel.find({ tenant }, { projection: { aliveUntil: 1 } })
      .toArray(),
  ]);
  const now = Date.now();

  return servers.map((server) => {
    const here = projects.filter((p) =>
      p.servers.some((s) => s.equals(server._id))
    );
    const cpuReserved = here.reduce(
      (s, p) => s + p.runtime.cpuReserve * reservedReplicas(p),
      0,
    );
    const memReservedMb = here.reduce(
      (s, p) => s + p.runtime.memReserveMb * reservedReplicas(p),
      0,
    );
    const lease = leases.find((l) => l._id.equals(server._id));
    return {
      server: server._id,
      rented: server.provider?.kind === "rented",
      name: server.name,
      labels: server.labels,
      online: !!lease && lease.aliveUntil.getTime() > now,
      cpuCores: server.inventory.cpuCores,
      memoryMb: Math.floor(server.inventory.memory / MiB),
      cpuReserved,
      memReservedMb,
      cpuFree: server.inventory.cpuCores - cpuReserved,
      memFreeMb: Math.floor(server.inventory.memory / MiB - memReservedMb),
      publicPorts: here.flatMap((p) => p.publicPort ? [p.publicPort] : []),
    };
  }).sort((a, b) => b.cpuFree / b.cpuCores - a.cpuFree / a.cpuCores);
}
