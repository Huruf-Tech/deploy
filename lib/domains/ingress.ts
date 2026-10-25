import { join } from "@std/path";
import { stringify } from "@std/yaml";
import type { ObjectId } from "mongodb";
import { cache } from "@/core/utils/cache.ts";
import { Logger } from "@/core/utils/logger.ts";
import { keyring } from "@/lib/services.ts";
import { readTextSetting } from "@/lib/core/settings.ts";
import { domainModel } from "@/schemas/applications/domain.ts";
import { projectModel } from "@/schemas/applications/project.ts";
import { serverModel } from "@/schemas/infrastructure/server.ts";
import { serverLeaseModel } from "@/schemas/infrastructure/serverLease.ts";

/**
 * What Traefik serves (PLAN §14, D43), polled from each instance's own
 * control plane every few seconds, so a domain or placement change is a
 * database write and never a restart or a redeploy.
 *
 * Each project is a weighted service: one entry per online server running its
 * live release, weighted by replicas, reached through that server's tunnel.
 * Traefik names the project in `X-Huruf-Project`; the server's Caddy routes on
 * it to the project's replicas.
 */
export const PROJECT_HEADER = "X-Huruf-Project";
const TUNNEL_HOST = "127.0.0.1"; // frps binds tunnels next to Traefik

const ids = (list: ObjectId[]) => [...new Set(list.map(String))];

async function buildConfig() {
  const domains = await domainModel.find(
    { status: "active", "certificate.notAfter": { $gt: new Date() } },
    { projection: { hostname: 1, project: 1 } },
  ).toArray();

  const projects = await projectModel.find(
    { _id: { $in: domains.map((d) => d.project) } },
    {
      projection: {
        placedOn: 1,
        replicasPerServer: 1,
        autoscaled: 1,
        "runtime.healthcheckPath": 1,
      },
    },
  ).toArray();
  const serverIds = projects.flatMap((p) => p.placedOn);
  const [servers, online] = await Promise.all([
    serverModel.find(
      {
        _id: { $in: serverIds },
        status: "active",
        tunnelPort: { $exists: true },
      },
      { projection: { tunnelPort: 1 } },
    ).toArray(),
    serverLeaseModel.find(
      { _id: { $in: serverIds }, offline: false },
      { projection: { _id: 1 } },
    ).toArray(),
  ]);
  const up = new Set(ids(online.map((l) => l._id)));
  const ports = new Map(
    servers.filter((s) => up.has(String(s._id))).map((s) => [
      String(s._id),
      s.tunnelPort!,
    ]),
  );

  const routers: Record<string, unknown> = {};
  const services: Record<string, unknown> = {};
  const middlewares: Record<string, unknown> = {
    "huruf-retry": { retry: { attempts: 2 } },
  };

  for (const project of projects) {
    const id = String(project._id);
    const entries = project.placedOn.flatMap((server) => {
      const port = ports.get(String(server));
      const replicas = project.autoscaled?.findLast((a) =>
        a.server.equals(server)
      )?.replicas ?? project.replicasPerServer;
      return port && replicas > 0
        ? [{ server: String(server), port, replicas }]
        : [];
    });
    if (!entries.length) continue; // no route: Traefik answers 404, not a hang

    const health = project.runtime?.healthcheckPath;
    for (const { server, port } of entries) {
      services[`p-${id}-s-${server}`] = {
        loadBalancer: {
          servers: [{ url: `http://${TUNNEL_HOST}:${port}` }],
          passHostHeader: true,
          ...(health
            ? {
              healthCheck: {
                path: health,
                interval: "10s",
                timeout: "3s",
                headers: { [PROJECT_HEADER]: id },
              },
            }
            : {}),
        },
      };
    }
    services[`p-${id}`] = {
      weighted: {
        services: entries.map((e) => ({
          name: `p-${id}-s-${e.server}`,
          weight: e.replicas,
        })),
        ...(health ? { healthCheck: {} } : {}),
      },
    };
    middlewares[`p-${id}`] = {
      headers: { customRequestHeaders: { [PROJECT_HEADER]: id } },
    };
  }

  for (const domain of domains) {
    const project = String(domain.project);
    if (!services[`p-${project}`]) continue;
    routers[`d-${domain._id}`] = {
      rule: `Host(\`${domain.hostname}\`)`,
      entryPoints: ["websecure"],
      service: `p-${project}`,
      middlewares: [`p-${project}`, "huruf-retry"],
      tls: {},
    };
  }

  return { http: { routers, services, middlewares } };
}

/** Shared by the instance's polls; each poll is a few indexed queries. */
export const traefikConfig = cache(buildConfig, 2_000);

const sha256 = async (text: string) =>
  new Uint8Array(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)),
  ).join(",");

/**
 * Traefik's poll carries `X-Ingress-Token: <INGRESS_CONFIG_TOKEN>`; not
 * `Authorization`, which the auth layer takes for an API key.
 */
export const INGRESS_TOKEN_HEADER = "X-Ingress-Token";

export async function isIngressToken(header: string | null) {
  const token = await readTextSetting("INGRESS_CONFIG_TOKEN", "");
  if (!token || !header) return false;
  return await sha256(header) === await sha256(token);
}

/**
 * Traefik only takes certificates from files: on each poll, this instance
 * writes the active certificates into `TRAEFIK_CERTS_DIR`, watched by
 * Traefik's file provider. A new version gets new file names, written before
 * `certificates.yml` points at them; files nothing points at are removed.
 */
const written = new Set<string>();
let seeded = false;
let syncing: Promise<void> | undefined;

/** Never throws: Traefik keeps its last certificates if a sync fails. */
export function syncCertificates() {
  syncing ??= sync().catch((error) =>
    Logger.error("Certificate sync failed", error)
  ).finally(() => syncing = undefined);
  return syncing;
}

async function sync() {
  const dir = await readTextSetting("TRAEFIK_CERTS_DIR", "");
  if (!dir) return;

  const domains = await domainModel.find(
    { status: "active", "certificate.notAfter": { $gt: new Date() } },
    { projection: { hostname: 1, tenant: 1, "certificate.issuedAt": 1 } },
  ).toArray();
  const name = (d: (typeof domains)[number]) =>
    `${d._id}-${d.certificate!.issuedAt.getTime()}`;
  const wanted = new Map(domains.map((d) => [name(d), d]));

  const firstRun = !seeded;
  if (firstRun) {
    // Files from before a restart are reused, and the list rewritten once.
    await Deno.mkdir(dir, { recursive: true });
    for await (const entry of Deno.readDir(dir)) {
      if (entry.name.endsWith(".crt")) written.add(entry.name.slice(0, -4));
    }
    seeded = true;
  }

  const missing = [...wanted].filter(([n]) => !written.has(n));
  for (const [file, d] of missing) {
    const full = await domainModel.findOne({ _id: d._id }, {
      projection: { certificate: 1 },
    });
    if (!full?.certificate) continue;
    const key = await keyring.decrypt(
      { kind: "tenant", ref: d.tenant },
      full.certificate.keyEnc,
      `certificate:${d.hostname}`,
    );
    await Deno.writeTextFile(join(dir, `${file}.key`), key, { mode: 0o600 });
    await Deno.writeTextFile(join(dir, `${file}.crt`), full.certificate.pem);
    written.add(file);
  }

  const stale = [...written].filter((n) => !wanted.has(n));
  if (!firstRun && !missing.length && !stale.length) return;

  const config = stringify({
    tls: {
      certificates: [...wanted.keys()].filter((n) => written.has(n)).map((
        n,
      ) => ({
        certFile: join(dir, `${n}.crt`),
        keyFile: join(dir, `${n}.key`),
      })),
    },
  });
  await Deno.writeTextFile(join(dir, "certificates.yml.tmp"), config);
  await Deno.rename(
    join(dir, "certificates.yml.tmp"),
    join(dir, "certificates.yml"),
  );

  for (const n of stale) {
    for (const ext of [".crt", ".key"]) {
      await Deno.remove(join(dir, n + ext)).catch((error) =>
        Logger.warn(`Couldn't remove certificate file ${n}${ext}`, error)
      );
    }
    written.delete(n);
  }
}
