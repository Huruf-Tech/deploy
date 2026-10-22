import type { ObjectId, WithId } from "mongodb";
import { createHashSync, SupportedHashAlg } from "@/core/utils/hash.ts";
import { isDuplicateKeyError } from "@/database.ts";
import { keyring } from "@/lib/services.ts";
import { readNumberSetting } from "@/lib/core/settings.ts";
import { sealTo } from "@/lib/agents/sealing.ts";
import { PROJECT_NETWORK } from "@/lib/agents/commands.ts";
import { builtinRegistry, meshSpecFor } from "@/lib/network/mesh.ts";
import { projectModel } from "@/schemas/applications/project.ts";
import {
  deploymentModel,
  releaseModel,
  type TDeployment,
  type TRelease,
  type TServiceSpec,
} from "@/schemas/applications/deployment.ts";
import { serverModel } from "@/schemas/infrastructure/server.ts";
import { AGENT_METRICS, alertRuleModel } from "@/schemas/monitoring/alert.ts";
import { serverLeaseModel } from "@/schemas/infrastructure/serverLease.ts";
import {
  registryModel,
  serverSpecModel,
} from "@/schemas/infrastructure/serverSpec.ts";
import type {
  TAlertSpec,
  TDesiredSpec,
  TWorkload,
  TWorkloadRelease,
} from "@/schemas/protocol/agent.ts";

/** Release specs carry variables: encrypted with the tenant key, bound to the release. */
export const sealReleaseSpec = (
  tenant: ObjectId,
  release: ObjectId,
  services: TServiceSpec[],
) =>
  keyring.encrypt(
    { kind: "tenant", ref: tenant },
    JSON.stringify(services),
    `release:${release}`,
  );

export const openReleaseSpec = async (release: WithId<TRelease>) =>
  JSON.parse(
    await keyring.decrypt(
      { kind: "tenant", ref: release.tenant },
      release.specEnc,
      `release:${release._id}`,
    ),
  ) as TServiceSpec[];

const has = (list: ObjectId[] | undefined, id: ObjectId) =>
  !!list?.some((x) => x.equals(id));

type TEntry = { release: WithId<TRelease>; routed: boolean };

/**
 * Which releases of a project this server runs, from the rollout state
 * (PLAN §10). Rolling and stop-first replace one server at a time; all at
 * once first starts the new set unrouted everywhere, then switches.
 */
function entriesFor(
  server: ObjectId,
  active: WithId<TRelease> | undefined,
  deployment: WithId<TDeployment> | undefined,
  next: WithId<TRelease> | undefined,
): TEntry[] {
  const current = active ? [{ release: active, routed: true }] : [];
  const step = deployment?.rollout?.servers.find((s) =>
    s.server.equals(server)
  );
  if (!deployment?.rollout || !next || !step) return current;

  const started = step.state === "applying" || step.state === "healthy";
  switch (deployment.rollout.phase) {
    case "rolling":
      return started ? [{ release: next, routed: true }] : current;
    case "prepare":
      return started
        ? [...current.filter((e) => !e.release._id.equals(next._id)), {
          release: next,
          routed: false,
        }]
        : current;
    case "switch":
      return [{ release: next, routed: true }];
  }
}

/** Everything one server should run, without its version (PLAN §4.4). */
export async function computeSpec(
  server: ObjectId,
): Promise<Omit<TDesiredSpec, "version">> {
  const serverDoc = await serverModel.findOne({ _id: server });
  const deployments = await deploymentModel.find(
    { servers: server, status: "deploying" },
    {
      projection: { project: 1, release: 1, rollout: 1, strategy: 1 },
      limit: 500,
    },
  ).toArray();
  const projects = await projectModel.find(
    {
      $or: [{ placedOn: server }, {
        _id: { $in: deployments.map((d) => d.project) },
      }],
    },
    { projection: { deployKeyEnc: 0 }, limit: 500 },
  ).toArray();

  const releaseIds = [
    ...projects.flatMap((p) =>
      p.activeRelease && has(p.placedOn, server) ? [p.activeRelease] : []
    ),
    ...deployments.flatMap((d) => d.release ? [d.release] : []),
  ];
  const releases = await releaseModel.find({ _id: { $in: releaseIds } })
    .toArray();
  const specs = new Map(
    await Promise.all(
      releases.map(async (r) =>
        [r._id.toHexString(), await openReleaseSpec(r)] as const
      ),
    ),
  );
  const byId = (id?: ObjectId) => id && releases.find((r) => r._id.equals(id));

  const registryIds = releases.flatMap((r) =>
    r.registry && !has(r.builtOn, server) ? [r.registry] : []
  );
  const registries = new Map(
    await Promise.all(
      (await registryModel.find({ _id: { $in: registryIds } }).toArray()).map(
        async (r) =>
          [r._id.toHexString(), {
            registry: r.kind === "dockerhub" ? "docker.io" : r.url!,
            username: r.username,
            password: await keyring.decrypt(
              { kind: "tenant", ref: r.tenant },
              r.secretEnc,
              `registry:${r._id}`,
            ),
          }] as const,
      ),
    ),
  );

  // Built-in registry pulls (PLAN §8.4), over the mesh.
  const builtin = serverDoc && releases.some((r) => r.builtinRegistry)
    ? await builtinRegistry(serverDoc.tenant)
    : undefined;

  const workloads: TWorkload[] = [];
  for (const project of projects) {
    const deployment = deployments.find((d) => d.project.equals(project._id));
    const active = has(project.placedOn, server)
      ? byId(project.activeRelease)
      : undefined;
    const entries = entriesFor(
      server,
      active,
      deployment,
      byId(deployment?.release),
    );
    if (!entries.length) continue;

    const services = specs.get(entries.at(-1)!.release._id.toHexString())!;
    const primary = services.find((s) => s.port) ?? services[0];
    for (const service of services) {
      const single = services.length === 1;
      workloads.push({
        project: project._id.toHexString(),
        name: single ? project.slug : `${project.slug}-${service.name}`,
        dnsNames: [
          single
            ? `${project.slug}.internal`
            : `${service.name}.${project.slug}.internal`,
        ],
        strategy: deployment?.strategy ?? project.deployStrategy,
        ...(project.publicPort && service === primary
          ? { publicPort: project.publicPort }
          : {}),
        reserve: {
          cpu: project.runtime.cpuReserve,
          memMb: project.runtime.memReserveMb,
        },
        base: {
          cpu: project.runtime.cpuLimit || project.runtime.cpuReserve || 1,
          memMb: project.runtime.memLimitMb || project.runtime.memReserveMb ||
            512,
        },
        ...(project.autoscale
          ? {
            autoscale: {
              min: project.autoscale.min,
              max: project.autoscale.max,
              ...(project.autoscale.cpuPercent
                ? { cpuPercent: project.autoscale.cpuPercent }
                : {}),
              ...(project.autoscale.memPercent
                ? { memPercent: project.autoscale.memPercent }
                : {}),
              cooldownSec: project.autoscale.cooldownSec,
            },
          }
          : {}),
        releases: entries.flatMap(({ release, routed }): TWorkloadRelease[] => {
          const spec = specs.get(release._id.toHexString())!.find((s) =>
            s.name === service.name
          );
          if (!spec) return [];
          const local = has(release.builtOn, server) || !release.pushedImage;
          const pull = local
            ? undefined
            : release.builtinRegistry && builtin
            ? {
              registry: builtin.host,
              username: builtin.username,
              password: builtin.password,
            }
            : release.registry
            ? registries.get(release.registry.toHexString())
            : undefined;
          return [{
            release: release.number,
            image: local ? spec.image : release.pushedImage!,
            routed,
            replicas: project.replicasPerServer,
            env: spec.env,
            files: spec.files,
            ...(spec.command ? { command: spec.command } : {}),
            ...(spec.port ? { port: spec.port } : {}),
            healthcheck: {
              ...(spec.healthcheckPath ? { path: spec.healthcheckPath } : {}),
              ...(spec.healthcheckCommand
                ? { command: spec.healthcheckCommand }
                : {}),
              timeoutSec: project.runtime.healthTimeoutSec,
            },
            ...(project.runtime.cpuLimit
              ? { cpus: project.runtime.cpuLimit }
              : {}),
            ...(project.runtime.memLimitMb
              ? { memoryMb: project.runtime.memLimitMb }
              : {}),
            volumes: spec.volumes,
            ...(pull ? { pull } : {}),
          }];
        }),
      });
    }
  }

  // Built images of every kept release stay on the server for rollbacks (PLAN §9.3).
  const kept = await releaseModel.find(
    { project: { $in: projects.map((p) => p._id) }, image: { $exists: true } },
    { projection: { image: 1 }, limit: 5_000 },
  ).toArray();

  return {
    network: PROJECT_NETWORK,
    drainMs: await readNumberSetting("AGENT_DRAIN_MS", 3_000),
    workloads: workloads.sort((a, b) => a.name.localeCompare(b.name)),
    keepImages: [...new Set(kept.map((r) => r.image!))].sort(),
    alerts: serverDoc
      ? await alertSpecsFor(serverDoc, [
        ...new Set(workloads.map((w) => w.project)),
      ])
      : [],
    ...(serverDoc ? await meshSpecFor(serverDoc) : {}),
  };
}

/**
 * Metric rules this server's agent evaluates (PLAN §13). A project rule for
 * every project is expanded per project here, as `rule:project`.
 */
async function alertSpecsFor(
  server: WithId<{ tenant: ObjectId }>,
  projects: string[],
): Promise<TAlertSpec[]> {
  const rules = await alertRuleModel.find({
    tenant: server.tenant,
    enabled: true,
    metric: { $in: [...AGENT_METRICS] },
  }, { limit: 200 }).toArray();
  return rules.flatMap((rule): TAlertSpec[] => {
    const base = {
      metric: rule.metric as TAlertSpec["metric"],
      threshold: rule.threshold,
      forSec: rule.forSec,
    };
    const id = rule._id.toHexString();
    if (rule.target.kind === "server") {
      return !rule.target.ref || rule.target.ref.equals(server._id)
        ? [{ rule: id, ...base }]
        : [];
    }
    if (rule.target.ref) {
      const project = rule.target.ref.toHexString();
      return projects.includes(project) ? [{ rule: id, project, ...base }] : [];
    }
    return projects.map((project) => ({
      rule: `${id}:${project}`,
      project,
      ...base,
    }));
  }).sort((a, b) => a.rule.localeCompare(b.rule));
}

/**
 * Recomputes and seals the specs of these servers, bumping `desiredVersion`
 * only when a spec changed. Returns each server's current version.
 */
export async function refreshSpecs(servers: ObjectId[]) {
  const versions = new Map<string, number>();
  const unique = [
    ...new Map(servers.map((s) => [s.toHexString(), s])).values(),
  ];

  for (const server of unique) {
    const doc = await serverModel.findOne(
      { _id: server, status: "active" },
      { projection: { tenant: 1, "identity.boxPublicKey": 1 } },
    );
    if (!doc) continue;

    const spec = await computeSpec(server);
    const hash = createHashSync(SupportedHashAlg.SHA_1, JSON.stringify(spec));
    const current = await serverSpecModel.findOne({ _id: server }, {
      projection: { hash: 1, version: 1 },
    });
    if (current?.hash === hash) {
      versions.set(server.toHexString(), current.version);
      continue;
    }

    const lease = await serverLeaseModel.findOneAndUpdate(
      { _id: server },
      // The agent picks it up on its next poll; keep that poll fast.
      {
        $inc: { desiredVersion: 1 },
        $set: { fastPollUntil: new Date(Date.now() + 60_000) },
      },
      { returnDocument: "after", projection: { desiredVersion: 1 } },
    );
    if (!lease) continue;
    const version = lease.desiredVersion;
    const sealed = await sealTo(
      doc.identity.boxPublicKey,
      JSON.stringify({ version, ...spec }),
    );

    try {
      // Concurrent refreshes: only a newer version may replace the stored one.
      await serverSpecModel.updateOne(
        { _id: server, version: { $lt: version } },
        {
          $set: {
            tenant: doc.tenant,
            version,
            sealed,
            hash,
            updatedAt: new Date(),
          },
        },
        { upsert: true },
      );
    } catch (error) {
      if (!isDuplicateKeyError(error)) throw error;
    }
    versions.set(server.toHexString(), version);
  }
  return versions;
}
