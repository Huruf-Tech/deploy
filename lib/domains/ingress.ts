import { join } from "@std/path";
import { stringify } from "@std/yaml";
import type { ObjectId } from "mongodb";
import { cache } from "@/core/utils/cache.ts";
import { Env } from "@/core/utils/env.ts";
import { Logger } from "@/core/utils/logger.ts";
import { keyring } from "@/lib/services.ts";
import { readFlagSetting, readTextSetting } from "@/lib/core/settings.ts";
import {
  appCertificateModel,
  domainModel,
} from "@/schemas/applications/domain.ts";
import { appDomain } from "@/lib/domains/appDomain.ts";
import { PLATFORM_OWNER } from "@/schemas/monitoring/alert.ts";
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

/**
 * Always served: Let's Encrypt's challenges for custom domains, and HTTP to
 * HTTPS for everything else. The platform's own hostname (its certificate
 * from Traefik's `platform` resolver) only with `INGRESS_SERVE_PLATFORM`:
 * behind another proxy (e.g. nginx keeping the dashboard), Traefik must not
 * try to get a certificate for it.
 */
async function platformConfig() {
  const url = await readTextSetting("INGRESS_PLATFORM_URL", "http://web:8000");
  const host = await readFlagSetting("INGRESS_SERVE_PLATFORM")
    ? new URL(Env.getSync("BASE_URL", true) || "http://localhost").hostname
    : "localhost";
  return {
    routers: {
      ...(host !== "localhost"
        ? {
          platform: {
            rule: `Host(\`${host}\`)`,
            entryPoints: ["websecure"],
            service: "platform",
            tls: { certResolver: "platform" },
          },
        }
        : {}),
      "acme-challenge": {
        rule: "PathPrefix(`/.well-known/acme-challenge/`)",
        entryPoints: ["web"],
        priority: 10_000,
        middlewares: ["acme-challenge"],
        service: "platform",
      },
      "to-https": {
        rule: "PathPrefix(`/`)",
        entryPoints: ["web"],
        priority: 1,
        middlewares: ["to-https"],
        service: "noop@internal",
      },
    },
    services: { platform: { loadBalancer: { servers: [{ url }] } } },
    middlewares: {
      "acme-challenge": {
        replacePathRegex: {
          regex: "^/\\.well-known/acme-challenge/(.*)",
          replacement: "/ingress/api/acme-challenge/$1",
        },
      },
      "to-https": { redirectScheme: { scheme: "https", permanent: true } },
      "huruf-retry": { retry: { attempts: 2 } },
    },
  };
}

const ids = (list: ObjectId[]) => [...new Set(list.map(String))];

async function buildConfig() {
  const app = await appDomain();
  const domains = (await domainModel.find(
    // Served while verifying too: that check is a request through here.
    {
      status: { $in: ["active", "verifying"] },
      $or: [
        { "certificate.notAfter": { $gt: new Date() } },
        // Free test domains: the wildcard certificate, from the file.
        { appDomain: true },
      ],
    },
    { projection: { hostname: 1, project: 1, appDomain: 1 } },
  ).toArray()).filter((d) =>
    // Only while the platform still hands them out (APP_DOMAIN unset: off).
    !d.appDomain || (!!app && d.hostname.endsWith(`.${app}`))
  );

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

  // frps' container: tunnel ports are only reachable on Traefik's network.
  const tunnelHost = await readTextSetting("INGRESS_TUNNEL_HOST", "frps");
  const platform = await platformConfig();
  const routers: Record<string, unknown> = platform.routers;
  const services: Record<string, unknown> = platform.services;
  const middlewares: Record<string, unknown> = platform.middlewares;

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
          servers: [{ url: `http://${tunnelHost}:${port}` }],
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
        // Sticky sessions (PLAN §14): a visitor stays on its server; the
        // server's edge keeps it on its replica (cookie `huruf_replica`).
        sticky: {
          cookie: {
            name: "huruf_server",
            secure: true,
            httpOnly: true,
            sameSite: "lax",
          },
        },
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
 * writes the active ones into `TRAEFIK_CERTS_DIR/certificates.yml`, watched
 * by Traefik's file provider. The PEMs are inline, so the file means the same
 * wherever it's mounted; it's replaced atomically, and only on a change.
 */
let written: string | undefined;
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
    {
      status: { $in: ["active", "verifying"] },
      "certificate.notAfter": { $gt: new Date() },
    },
    { projection: { "certificate.issuedAt": 1 }, sort: { _id: 1 } },
  ).toArray();
  const app = await appDomain();
  const wildcard = app
    ? await appCertificateModel.findOne({
      _id: app,
      notAfter: { $gt: new Date() },
    })
    : null;
  const version = [
    ...domains.map((d) => `${d._id}-${d.certificate!.issuedAt.getTime()}`),
    ...(wildcard ? [`*.${app}-${wildcard.issuedAt!.getTime()}`] : []),
  ].join(",");
  if (version === written) return;

  const full = await domainModel.find(
    { _id: { $in: domains.map((d) => d._id) } },
    {
      projection: { hostname: 1, tenant: 1, certificate: 1 },
      sort: { _id: 1 },
    },
  ).toArray();
  const certificates = await Promise.all(full.map(async (d) => ({
    certFile: d.certificate!.pem,
    keyFile: await keyring.decrypt(
      { kind: "tenant", ref: d.tenant },
      d.certificate!.keyEnc,
      `certificate:${d.hostname}`,
    ),
  })));
  if (wildcard?.pem && wildcard.keyEnc) {
    certificates.push({
      certFile: wildcard.pem,
      keyFile: await keyring.decrypt(
        { kind: "tenant", ref: PLATFORM_OWNER },
        wildcard.keyEnc,
        `certificate:*.${app}`,
      ),
    });
  }

  await Deno.mkdir(dir, { recursive: true });
  const tmp = join(dir, ".certificates.yml.tmp");
  await Deno.writeTextFile(tmp, stringify({ tls: { certificates } }), {
    mode: 0o600,
  });
  await Deno.rename(tmp, join(dir, "certificates.yml"));
  written = version;
}
