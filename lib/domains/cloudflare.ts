import type { ObjectId } from "mongodb";
import { Response } from "@/core/http/response.ts";
import { keyring } from "@/lib/services.ts";
import { domainRecords, startCheck } from "@/lib/domains/domains.ts";
import {
  cloudflareConnectionModel,
  domainModel,
} from "@/schemas/applications/domain.ts";

/**
 * Cloudflare DNS for custom domains (PLAN §14): with a workspace's API token
 * (Zone → DNS → Edit), a domain's records are created in its zone, DNS only,
 * instead of copied by hand. Nothing else is read or changed there.
 */

const API = "https://api.cloudflare.com/client/v4";

type TRecord = {
  id: string;
  type: string;
  name: string;
  content: string;
  proxied?: boolean;
};

/** Tests replace it. */
export const cloudflareApi = {
  fetch: (url: string, init: RequestInit) => fetch(url, init),
};

async function cf<T>(
  token: string,
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<T> {
  let res: globalThis.Response;
  try {
    res = await cloudflareApi.fetch(`${API}${path}`, {
      method: init.method ?? "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      ...(init.body ? { body: JSON.stringify(init.body) } : {}),
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw Response.badRequest("Cloudflare didn't answer: try again");
  }
  const body = await res.json().catch(() => ({})) as {
    success?: boolean;
    result?: T;
    errors?: { message?: string }[];
  };
  if (!res.ok || !body.success) {
    const why = body.errors?.map((e) => e.message).filter(Boolean).join("; ");
    if (res.status === 401 || res.status === 403) {
      throw Response.badRequest(
        `Cloudflare refused the token${
          why ? ` (${why})` : ""
        }: it needs Zone → DNS → Edit on this domain's zone`,
      );
    }
    throw Response.badRequest(`Cloudflare: ${why || `HTTP ${res.status}`}`);
  }
  return body.result as T;
}

/** Checks the token reaches at least one zone, and stores it sealed. */
export async function connectCloudflare(
  tenant: ObjectId,
  user: ObjectId,
  token: string,
) {
  const zones = await cf<unknown[]>(token, "/zones?per_page=50");
  if (!zones.length) {
    throw Response.badRequest(
      "The token reaches no zone: give it Zone → DNS → Edit on your domains' zones",
    );
  }
  await cloudflareConnectionModel.updateOne({ _id: tenant }, {
    $set: {
      tokenEnc: await keyring.encrypt(
        { kind: "tenant", ref: tenant },
        token,
        `cloudflare:${tenant}`,
      ),
      zones: zones.length,
      connectedBy: user,
      connectedAt: new Date(),
    },
  }, { upsert: true });
  return { zones: zones.length };
}

async function tokenOf(tenant: ObjectId) {
  const doc = await cloudflareConnectionModel.findOne({ _id: tenant });
  if (!doc) throw Response.badRequest("Connect Cloudflare first");
  return await keyring.decrypt(
    { kind: "tenant", ref: tenant },
    doc.tokenEnc,
    `cloudflare:${tenant}`,
  );
}

/** The hostname's zone: the longest of its parent names the token reaches. */
async function zoneOf(token: string, hostname: string) {
  const labels = hostname.split(".");
  for (let i = 0; i < labels.length - 1; i++) {
    const name = labels.slice(i).join(".");
    const [zone] = await cf<{ id: string; name: string }[]>(
      token,
      `/zones?name=${encodeURIComponent(name)}`,
    );
    if (zone) return zone;
  }
  throw Response.badRequest(
    `None of your Cloudflare zones holds ${hostname}, or the token can't reach it`,
  );
}

const unquote = (s: string) => s.replace(/^"|"$/g, "");

/**
 * Creates a domain's records in its Cloudflare zone: the ownership TXT and
 * the hostname pointed at the ingress (CNAME, or A records at a zone's apex
 * when the platform has IPs), DNS only. Records already pointing elsewhere
 * are conflicts: listed, and replaced only with `replace` (the owner's call).
 * Then the domain's check starts.
 */
export async function setUpInCloudflare(
  tenant: ObjectId,
  id: ObjectId,
  replace = false,
) {
  const domain = await domainModel.findOne({ _id: id, tenant });
  if (!domain) throw Response.notFound("Domain not found");
  const token = await tokenOf(tenant);
  const zone = await zoneOf(token, domain.hostname);
  const records = await domainRecords(domain);
  const apex = domain.hostname === zone.name;
  // As the dashboard shows them: A at the apex or without a CNAME target.
  const wanted = records.ipv4?.length && (apex || !records.cname)
    ? records.ipv4.map((ip) => ({ type: "A", content: ip }))
    : records.cname
    ? [{ type: "CNAME", content: records.cname }]
    : [];
  if (!wanted.length) {
    throw Response.badRequest(
      "The platform's ingress isn't configured yet: ask the platform admin",
    );
  }

  const list = (name: string) =>
    cf<TRecord[]>(
      token,
      `/zones/${zone.id}/dns_records?per_page=100&name=${
        encodeURIComponent(name)
      }`,
    );
  const [atHost, atOwnership] = await Promise.all([
    list(domain.hostname),
    list(records.ownership.name),
  ]);
  const matches = (r: TRecord) =>
    !r.proxied &&
    wanted.some((w) =>
      w.type === r.type && w.content === r.content.toLowerCase()
    );
  const conflicts = atHost.filter((r) =>
    ["A", "AAAA", "CNAME"].includes(r.type) && !matches(r)
  );
  if (conflicts.length && !replace) {
    return {
      applied: false as const,
      conflicts: conflicts.map((r) => ({
        type: r.type,
        content: r.content,
        proxied: !!r.proxied,
      })),
    };
  }
  for (const r of conflicts) {
    await cf(token, `/zones/${zone.id}/dns_records/${r.id}`, {
      method: "DELETE",
    });
  }
  const created: string[] = [];
  const hasTxt = atOwnership.some((r) =>
    r.type === "TXT" && unquote(r.content) === records.ownership.value
  );
  if (!hasTxt) {
    await cf(token, `/zones/${zone.id}/dns_records`, {
      method: "POST",
      body: {
        type: "TXT",
        name: records.ownership.name,
        content: `"${records.ownership.value}"`,
        ttl: 1,
        comment: "Huruf Deploy: domain ownership",
      },
    });
    created.push(`TXT ${records.ownership.name}`);
  }
  for (const w of wanted) {
    if (
      atHost.some((r) =>
        matches(r) && r.type === w.type && r.content.toLowerCase() === w.content
      )
    ) continue;
    await cf(token, `/zones/${zone.id}/dns_records`, {
      method: "POST",
      body: {
        ...w,
        name: domain.hostname,
        ttl: 1,
        proxied: false,
        comment: "Huruf Deploy",
      },
    });
    created.push(`${w.type} ${domain.hostname}`);
  }
  await startCheck(tenant, id);
  return { applied: true as const, created, zone: zone.name };
}
