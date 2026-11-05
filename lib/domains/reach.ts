import { ObjectId } from "mongodb";
import { cache } from "@/core/utils/cache.ts";
import { readTextSetting } from "@/lib/core/settings.ts";
import { isPublicAddress } from "@/lib/agents/addresses.ts";
import { getProject } from "@/lib/deploy/projects.ts";
import { appDomain } from "@/lib/domains/appDomain.ts";
import { ingressTargets, pointsHere } from "@/lib/domains/dns.ts";
import {
  PROJECT_HEADER,
  traefikConfig,
  traefikPoll,
} from "@/lib/domains/ingress.ts";
import {
  appCertificateModel,
  domainModel,
} from "@/schemas/applications/domain.ts";
import { serverModel } from "@/schemas/infrastructure/server.ts";
import { serverLeaseModel } from "@/schemas/infrastructure/serverLease.ts";

/**
 * The reachability map (PLAN §14): how a visitor reaches a project, hop by
 * hop, checked live from this control plane instance. A domain goes DNS →
 * Traefik (its certificate and route) → the server's tunnel → the server's
 * edge proxy (Caddy) → the app; a public port goes straight to the server's
 * edge proxy. The tunnel hop makes the request Traefik makes, so its answer
 * says which hop stopped it. Only status codes come back, never bodies.
 */

export type THop = {
  state: "ok" | "warning" | "failed" | "skipped";
  detail?: string;
};

const ok = (detail?: string): THop => ({ state: "ok", detail });
const failed = (detail: string): THop => ({ state: "failed", detail });
const SKIPPED: THop = { state: "skipped" };

/** Swapped in tests. */
export const reachProbe = {
  fetch: (url: string, init: RequestInit & { timeoutMs: number }) =>
    fetch(url, {
      ...init,
      redirect: "manual",
      signal: AbortSignal.timeout(init.timeoutMs),
    }),
};

const why = (error: unknown) =>
  String((error as Error)?.message ?? error).slice(0, 200);

/** Traefik checks health with 2xx and 3xx; anything answering is reached. */
const healthy = (status: number) => status >= 200 && status < 400;

/**
 * Through the server's tunnel, as Traefik does: refused is the tunnel; our
 * edge's own answers name its hop; anything else is the app's answer.
 */
async function throughTunnel(opts: {
  url: string;
  project: string;
  host?: string;
  health?: string;
}): Promise<{ tunnel: THop; edge: THop; app: THop }> {
  let res: Response;
  try {
    res = await reachProbe.fetch(opts.url, {
      headers: {
        [PROJECT_HEADER]: opts.project,
        ...(opts.host ? { host: opts.host } : {}),
      },
      timeoutMs: 8_000,
    });
  } catch (error) {
    const message = why(error);
    if (/refused|os error 111/i.test(message)) {
      return {
        tunnel: failed(
          "The server's tunnel isn't connected to the control plane: its agent may be down or can't reach the tunnel port.",
        ),
        edge: SKIPPED,
        app: SKIPPED,
      };
    }
    return {
      tunnel: ok(),
      edge: failed(
        `Nothing answered at the server's end of the tunnel (its edge proxy may be down): ${message}`,
      ),
      app: SKIPPED,
    };
  }
  // Short bodies only: our edge's own answers.
  const body = res.status === 404 || res.status === 503
    ? (await res.text()).slice(0, 100)
    : (await res.body?.cancel(), "");
  if (res.status === 404 && body.includes("Unknown project")) {
    return {
      tunnel: ok(),
      edge: failed(
        "The server's edge proxy has no route for this project yet: it gets one when the agent applies the release.",
      ),
      app: SKIPPED,
    };
  }
  if (res.status === 503 && body.includes("No healthy replicas")) {
    return {
      tunnel: ok(),
      edge: ok(),
      app: failed("No healthy replicas on this server."),
    };
  }
  if (res.status === 502 || res.status === 504) {
    return {
      tunnel: ok(),
      edge: ok(),
      app: failed(
        `The app didn't answer the edge proxy (${res.status}): is it listening on its port?`,
      ),
    };
  }
  if (opts.health && !healthy(res.status)) {
    return {
      tunnel: ok(),
      edge: ok(),
      app: failed(
        `The health check ${opts.health} answered ${res.status}: Traefik takes this server out until it answers 2xx or 3xx.`,
      ),
    };
  }
  return {
    tunnel: ok(),
    edge: ok(),
    app: res.status >= 500
      ? { state: "warning", detail: `The app answered ${res.status}.` }
      : ok(`Answered ${res.status}${opts.health ? ` on ${opts.health}` : ""}.`),
  };
}

async function reachOf(tenantId: string, projectId: string) {
  const tenant = ObjectId.createFromHexString(tenantId);
  const project = await getProject(
    tenant,
    ObjectId.createFromHexString(projectId),
  );
  const id = String(project._id);
  const health = project.runtime?.healthcheckPath;
  const now = new Date();

  const [domains, servers, leases, config, app, targets, tunnelHost] =
    await Promise.all([
      domainModel.find({ project: project._id }, {
        projection: {
          hostname: 1,
          status: 1,
          appDomain: 1,
          error: 1,
          "certificate.notAfter": 1,
        },
        limit: 20,
        sort: { _id: 1 },
      }).toArray(),
      serverModel.find({ _id: { $in: project.placedOn } }, {
        projection: { name: 1, tunnelPort: 1, "inventory.publicIp": 1 },
      }).toArray(),
      serverLeaseModel.find({ _id: { $in: project.placedOn } }, {
        projection: { offline: 1 },
      }).toArray(),
      traefikConfig(),
      appDomain(),
      ingressTargets(),
      readTextSetting("INGRESS_TUNNEL_HOST", "frps"),
    ]);
  const wildcard = app && domains.some((d) => d.appDomain)
    ? await appCertificateModel.findOne({ _id: app }, {
      projection: { notAfter: 1, error: 1 },
    })
    : null;
  const http = config.http as {
    routers: Record<string, unknown>;
    services: Record<string, unknown>;
  };
  const host = domains.find((d) => d.status === "active")?.hostname;

  const polledAgo = traefikPoll.at && Date.now() - traefikPoll.at;
  const traefik: THop = polledAgo === undefined
    ? failed(
      "Traefik on this control plane hasn't asked for its routes since it started: is the ingress profile running?",
    )
    : polledAgo > 60_000
    ? failed(
      `Traefik last asked for its routes ${
        Math.round(polledAgo / 1000)
      } s ago: it may be down.`,
    )
    : ok();

  const serverHops = await Promise.all(
    project.placedOn.map(async (serverId) => {
      const server = servers.find((s) => s._id.equals(serverId));
      const online = leases.find((l) => l._id.equals(serverId))?.offline ===
        false;
      const publicIp = server?.inventory?.publicIp;
      const base = {
        _id: String(serverId),
        name: server?.name ?? String(serverId),
        online,
        ...(publicIp ? { publicIp } : {}),
      };
      const inTraefik = !!http.services[`p-${id}-s-${serverId}`];
      const tunnelUrl = server?.tunnelPort
        ? `http://${tunnelHost}:${server.tunnelPort}${health ?? "/"}`
        : undefined;
      const hops = !online
        ? {
          tunnel: failed("The server is offline."),
          edge: SKIPPED,
          app: SKIPPED,
        }
        : !tunnelUrl
        ? {
          tunnel: failed(
            "The server has no tunnel yet: it gets one when its agent is updated.",
          ),
          edge: SKIPPED,
          app: SKIPPED,
        }
        : await throughTunnel({ url: tunnelUrl, project: id, host, health });

      // A public port is reached on the server's own address.
      let publicPort: THop | undefined;
      if (project.publicPort) {
        if (!publicIp || !isPublicAddress(publicIp)) {
          publicPort = failed("The server has no public address.");
        } else {
          try {
            const res = await reachProbe.fetch(
              `http://${publicIp}:${project.publicPort}/`,
              { timeoutMs: 5_000 },
            );
            await res.body?.cancel();
            publicPort = ok(`Answered ${res.status}.`);
          } catch (error) {
            publicPort = failed(
              `http://${publicIp}:${project.publicPort} doesn't answer from the internet (a firewall?): ${
                why(error)
              }`,
            );
          }
        }
      }
      return {
        ...base,
        // Traefik sends visitors to the servers it has a service for.
        route: !inTraefik && online && tunnelUrl
          ? failed(
            "Traefik doesn't route to this server: it runs no replicas of the live release.",
          )
          : inTraefik
          ? ok()
          : SKIPPED,
        ...hops,
        ...(publicPort ? { publicPort } : {}),
      };
    }),
  );
  const anyServer = serverHops.some((s) => s.route.state === "ok");

  const domainHops = await Promise.all(domains.map(async (d) => {
    const certificate: THop = d.appDomain
      ? wildcard?.notAfter && wildcard.notAfter > now ? ok() : failed(
        `The platform's wildcard certificate for *.${app} isn't ready${
          wildcard?.error ? `: ${wildcard.error}` : "."
        }`,
      )
      : d.certificate?.notAfter && d.certificate.notAfter > now
      ? ok()
      : failed(
        d.error ??
          (d.status === "active"
            ? "Its certificate expired."
            : "It has no certificate yet: it gets one once its DNS checks pass."),
      );
    const routed = !!http.routers[`d-${d._id}`];
    const route: THop = routed
      ? ok()
      : certificate.state !== "ok"
      ? SKIPPED
      : !anyServer
      ? failed("Traefik has no server to send it to.")
      : failed(
        d.appDomain
          ? `Test domains are served only under ${app || "APP_DOMAIN"}.`
          : "Traefik doesn't route it yet.",
      );
    const points = await pointsHere(d.hostname);
    const dns: THop = points.ok
      ? ok(points.ips.join(", "))
      : failed(points.detail ?? "It doesn't point to the platform.");
    // The visitor's way, over the internet: only where it points here.
    let https: THop = SKIPPED;
    if (points.ok && routed) {
      try {
        const res = await reachProbe.fetch(`https://${d.hostname}/`, {
          timeoutMs: 10_000,
        });
        await res.body?.cancel();
        https = res.status === 503 || res.status === 502
          ? failed(
            `https://${d.hostname} answered ${res.status}: see the server hops.`,
          )
          : ok(`Answered ${res.status}.`);
      } catch (error) {
        https = failed(`https://${d.hostname} doesn't answer: ${why(error)}`);
      }
    }
    return {
      _id: String(d._id),
      hostname: d.hostname,
      appDomain: !!d.appDomain,
      status: d.status,
      dns,
      certificate,
      route,
      https,
    };
  }));

  return {
    checkedAt: now.toISOString(),
    ingress: {
      ...(targets.hostname ? { hostname: targets.hostname } : {}),
      ipv4: targets.ipv4,
      traefik,
    },
    ...(health ? { healthcheckPath: health } : {}),
    ...(project.publicPort ? { publicPort: project.publicPort } : {}),
    domains: domainHops,
    servers: serverHops,
  };
}

/** Checked at most every 15 s per project: each check makes real requests. */
const cached = cache(reachOf, 15_000);

export const projectReach = (tenant: ObjectId, project: ObjectId) =>
  cached(String(tenant), String(project));
