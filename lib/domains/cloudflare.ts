import { ObjectId } from "mongodb";
import { Response } from "@/core/http/response.ts";
import { Env } from "@/core/utils/env.ts";
import { OAuth2 } from "@/plugins/Huruf-Tech/thunder-core/lib/oauth2.ts";
import { readTextSetting } from "@/lib/core/settings.ts";
import { keyring } from "@/lib/services.ts";
import { domainRecords, verifyByProvider } from "@/lib/domains/domains.ts";
import {
  cloudflareConnectionModel,
  domainModel,
} from "@/schemas/applications/domain.ts";

/**
 * Cloudflare DNS for custom domains (PLAN §14): the workspace owner signs in
 * with Cloudflare once (or pastes an API token where the platform has no
 * OAuth app), then a domain's records are created in its zone, DNS only,
 * instead of copied by hand. Nothing else is read or changed there.
 */

const API = "https://api.cloudflare.com/client/v4";

/** Cloudflare serves new records within seconds; ordered after this. */
const ISSUE_DELAY_MS = 30_000;

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

const seal = (tenant: ObjectId, value: string, field = "") =>
  keyring.encrypt(
    { kind: "tenant", ref: tenant },
    value,
    `cloudflare:${tenant}${field}`,
  );
const open = (tenant: ObjectId, value: string, field = "") =>
  keyring.decrypt(
    { kind: "tenant", ref: tenant },
    value,
    `cloudflare:${tenant}${field}`,
  );

/** The zones a token reaches: at least one, or it's no use here. */
async function zonesOf(token: string) {
  const zones = await cf<unknown[]>(token, "/zones?per_page=50");
  if (!zones.length) {
    throw Response.badRequest(
      "Cloudflare gave access to no zone: allow the zones your domains are in",
    );
  }
  return zones.length;
}

/** Without the platform's OAuth app: a pasted API token, checked and sealed. */
export async function connectCloudflare(
  tenant: ObjectId,
  user: ObjectId,
  token: string,
) {
  const zones = await zonesOf(token);
  await cloudflareConnectionModel.updateOne({ _id: tenant }, {
    $set: {
      tokenEnc: await seal(tenant, token),
      zones,
      connectedBy: user,
      connectedAt: new Date(),
    },
    $unset: { refreshTokenEnc: "", expiresAt: "" },
  }, { upsert: true });
  return { zones };
}

// --- Signing in with Cloudflare (OAuth, PLAN §14) ---

const AUTHORIZE = "https://dash.cloudflare.com/oauth2/auth";
const TOKEN = "https://dash.cloudflare.com/oauth2/token";
const REVOKE = "https://dash.cloudflare.com/oauth2/revoke";

/**
 * The platform's Cloudflare OAuth app. Set, connecting is a sign-in on
 * Cloudflare; unset (e.g. a self-hosted platform), a pasted API token.
 */
export async function oauthClient() {
  const [id, secret, scopes] = await Promise.all([
    readTextSetting("CLOUDFLARE_OAUTH_CLIENT_ID", ""),
    readTextSetting("CLOUDFLARE_OAUTH_CLIENT_SECRET", ""),
    readTextSetting(
      "CLOUDFLARE_OAUTH_SCOPES",
      "offline_access zone.read dns.read dns.write",
    ),
  ]);
  return id && secret ? { id, secret, scopes } : null;
}

const callbackUrl = async () =>
  `${await Env.get("BASE_URL")}/domains/api/cloudflare/callback`;

/** Signed `state`: who started it, and the dashboard page to go back to. */
type TState = { tenant: string; user: string; back: string };
const STATE_SECRET = "cloudflare-oauth";

const verifyState = async (token: string | null) => {
  if (!token) return null;
  try {
    return (await OAuth2.verifyJWT<TState>(token, { secret: STATE_SECRET }))
      .payload;
  } catch {
    return null;
  }
};

/** Cloudflare's consent page for the owner; `back` is a dashboard path. */
export async function authorizeUrl(
  tenant: ObjectId,
  user: ObjectId,
  back: string,
) {
  const client = await oauthClient();
  if (!client) {
    throw Response.badRequest("Signing in with Cloudflare isn't set up here");
  }
  const state = await OAuth2.signJWT(
    { tenant: String(tenant), user: String(user), back } satisfies TState,
    { secret: STATE_SECRET, subject: String(user), ttl: 15 * 60 },
  );
  const url = new URL(AUTHORIZE);
  url.search = new URLSearchParams({
    response_type: "code",
    client_id: client.id,
    redirect_uri: await callbackUrl(),
    scope: client.scopes,
    state,
  }).toString();
  return url.toString();
}

type TTokens = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
};

async function tokenRequest(
  client: NonNullable<Awaited<ReturnType<typeof oauthClient>>>,
  body: Record<string, string>,
) {
  let res: globalThis.Response;
  try {
    res = await cloudflareApi.fetch(TOKEN, {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${client.id}:${client.secret}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(body).toString(),
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw Response.badRequest("Cloudflare didn't answer: try again");
  }
  const json = await res.json().catch(() => ({})) as Partial<TTokens> & {
    error?: string;
    error_description?: string;
  };
  if (!res.ok || !json.access_token) {
    throw Response.badRequest(
      `Cloudflare: ${
        json.error_description ?? json.error ?? `HTTP ${res.status}`
      }`,
    );
  }
  return json as TTokens;
}

const tokenFields = async (tenant: ObjectId, t: TTokens) => ({
  tokenEnc: await seal(tenant, t.access_token),
  ...(t.refresh_token
    ? { refreshTokenEnc: await seal(tenant, t.refresh_token, ":refresh") }
    : {}),
  ...(t.expires_in
    ? { expiresAt: new Date(Date.now() + t.expires_in * 1000) }
    : {}),
});

const reason = async (e: unknown) => {
  if (!(e instanceof globalThis.Response)) return String(e);
  const text = await e.clone().text();
  try {
    return String(JSON.parse(text)?.error ?? text);
  } catch {
    return text;
  }
};

/**
 * Cloudflare sends the owner back here: the code becomes tokens (checked
 * against their zones and sealed), then the dashboard page they left.
 * Returns where to redirect.
 */
export async function completeOAuth(
  code: string | null,
  stateToken: string | null,
) {
  const base = await Env.get("BASE_URL");
  const state = await verifyState(stateToken);
  // Only back into the dashboard, whatever the state says.
  const back = new URL(
    state?.back.startsWith("/app/") ? state.back : "/app",
    base,
  );
  const done = (params: Record<string, string>) => {
    for (const [k, v] of Object.entries(params)) back.searchParams.set(k, v);
    return back.toString();
  };
  if (!state || !code) {
    return done({
      cloudflare: "Signing in with Cloudflare expired: try again",
    });
  }
  try {
    const client = await oauthClient();
    if (!client) {
      throw Response.badRequest("Signing in with Cloudflare isn't set up here");
    }
    const tokens = await tokenRequest(client, {
      grant_type: "authorization_code",
      code,
      redirect_uri: await callbackUrl(),
    });
    const tenant = ObjectId.createFromHexString(state.tenant);
    const zones = await zonesOf(tokens.access_token);
    await cloudflareConnectionModel.updateOne({ _id: tenant }, {
      $set: {
        ...await tokenFields(tenant, tokens),
        zones,
        connectedBy: ObjectId.createFromHexString(state.user),
        connectedAt: new Date(),
      },
    }, { upsert: true });
    return done({ cloudflare: "connected" });
  } catch (e) {
    return done({ cloudflare: await reason(e) });
  }
}

/** Its access token, refreshed when it's about to expire. */
async function tokenOf(tenant: ObjectId) {
  const doc = await cloudflareConnectionModel.findOne({ _id: tenant });
  if (!doc) throw Response.badRequest("Connect Cloudflare first");
  if (
    !doc.refreshTokenEnc || !doc.expiresAt ||
    doc.expiresAt.getTime() - Date.now() > 60_000
  ) {
    return await open(tenant, doc.tokenEnc);
  }
  const client = await oauthClient();
  try {
    if (!client) throw new Error("no OAuth app");
    const tokens = await tokenRequest(client, {
      grant_type: "refresh_token",
      refresh_token: await open(tenant, doc.refreshTokenEnc, ":refresh"),
    });
    await cloudflareConnectionModel.updateOne({ _id: tenant }, {
      $set: await tokenFields(tenant, tokens),
    });
    return tokens.access_token;
  } catch {
    // Another instance may have refreshed first (refresh tokens rotate).
    const now = await cloudflareConnectionModel.findOne({ _id: tenant });
    if (now?.expiresAt && now.expiresAt.getTime() - Date.now() > 60_000) {
      return await open(tenant, now.tokenEnc);
    }
    throw Response.badRequest(
      "Cloudflare's access ran out: connect Cloudflare again",
    );
  }
}

/** Forgets the connection, revoking a sign-in's access at Cloudflare. */
export async function disconnectCloudflare(tenant: ObjectId) {
  const doc = await cloudflareConnectionModel.findOneAndDelete({ _id: tenant });
  const client = await oauthClient();
  if (doc?.refreshTokenEnc && client) {
    await cloudflareApi.fetch(REVOKE, {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${client.id}:${client.secret}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        token: await open(tenant, doc.refreshTokenEnc, ":refresh"),
        token_type_hint: "refresh_token",
      }).toString(),
      signal: AbortSignal.timeout(15_000),
    }).catch(() => {}); // best effort: it's forgotten here either way
  }
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
 * Then the domain is verified and its certificate ordered shortly after.
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
  // Created through the zone owner's own access: verified, no lookups.
  await verifyByProvider(tenant, id, ISSUE_DELAY_MS);
  return { applied: true as const, created, zone: zone.name };
}
