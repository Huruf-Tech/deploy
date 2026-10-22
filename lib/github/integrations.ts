import { ObjectId } from "mongodb";
import { Response } from "@/core/http/response.ts";
import { Env } from "@/core/utils/env.ts";
import { OAuth2 } from "@/plugins/Huruf-Tech/thunder-core/lib/oauth2.ts";
import { BoundedCache } from "@/lib/core/boundedCache.ts";
import {
  entitlements,
  githubApi,
  keyring,
  quotaGuard,
} from "@/lib/services.ts";
import { appJwt, GitHubError, hasNextPage } from "@/lib/github/githubApi.ts";
import {
  gitIntegrationModel,
  secretFields,
  type TGitIntegration,
  type TInstallation,
} from "@/schemas/build/gitIntegration.ts";

/** Signed `state` for the GitHub redirects (PLAN §16 Phase 5). */
type TFlowState = { tenant: string; user: string; integration: string };
const STATE_SECRET = "github-app-flow";
const STATE_TTL_SEC = 3_600;

const signState = (state: TFlowState) =>
  OAuth2.signJWT(state, {
    secret: STATE_SECRET,
    subject: state.user,
    ttl: STATE_TTL_SEC,
  });

const verifyState = async (token: string | null) => {
  if (!token) return null;
  try {
    const { payload } = await OAuth2.verifyJWT<TFlowState>(token, {
      secret: STATE_SECRET,
    });
    return payload;
  } catch {
    return null;
  }
};

const encrypt = (
  tenant: ObjectId,
  id: ObjectId,
  field: string,
  value: string,
) =>
  keyring.encrypt(
    { kind: "tenant", ref: tenant },
    value,
    `gitIntegration:${id}:${field}`,
  );

const decrypt = (
  doc: { _id: ObjectId; tenant: ObjectId },
  field: string,
  value: string,
) =>
  keyring.decrypt(
    { kind: "tenant", ref: doc.tenant },
    value,
    `gitIntegration:${doc._id}:${field}`,
  );

/** Where the browser lands after GitHub: the dashboard's integrations page. */
export const dashboardUrl = async (
  tenant?: string,
  params: Record<string, string> = {},
) => {
  const base = await Env.get("BASE_URL");
  const url = new URL(
    tenant ? `/app/${tenant}/build/gitIntegrations` : "/app",
    base,
  );
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return url.toString();
};

/**
 * Step 1 (click 1): the manifest the browser POSTs to GitHub. The webhook URL
 * carries the future integration's id, so it is reserved here.
 */
export async function startConnect(opts: {
  tenant: ObjectId;
  user: ObjectId;
  org?: string;
}) {
  const base = await Env.get("BASE_URL");
  const integration = new ObjectId();
  const state = await signState({
    tenant: opts.tenant.toHexString(),
    user: opts.user.toHexString(),
    integration: integration.toHexString(),
  });
  // GitHub can't deliver webhooks to a local address; installs are then synced on redirect.
  const reachable = !/^https?:\/\/(localhost|127\.|\[::1\])/.test(base);
  const suffix = integration.toHexString().slice(-6);

  const manifest = {
    // App names are global on GitHub and capped at 34 characters.
    name: `Huruf Deploy ${suffix}`,
    url: base,
    hook_attributes: {
      url: `${base}/githubHooks/api/webhook/${integration}`,
      active: reachable,
    },
    redirect_url: `${base}/githubHooks/api/manifest`,
    setup_url: `${base}/githubHooks/api/setup`,
    setup_on_update: true,
    public: false,
    default_permissions: { contents: "read", metadata: "read" },
    default_events: reachable ? ["push"] : [],
  };
  const path = opts.org
    ? `/organizations/${encodeURIComponent(opts.org)}/settings/apps/new`
    : "/settings/apps/new";

  return {
    action: `https://github.com${path}?state=${encodeURIComponent(state)}`,
    manifest: JSON.stringify(manifest),
  };
}

/**
 * Step 2 (after click 2, "Create GitHub App"): exchange GitHub's one-time code
 * for the App's credentials, store them encrypted, and send the browser on to
 * install the App (click 3). Returns the redirect target.
 */
export async function completeManifest(
  code: string,
  stateToken: string | null,
) {
  const state = await verifyState(stateToken);
  if (!state) return await dashboardUrl(undefined, { error: "expired" });

  const tenant = ObjectId.createFromHexString(state.tenant);
  const _id = ObjectId.createFromHexString(state.integration);
  const fail = (error: string) => dashboardUrl(state.tenant, { error });
  const install = async (slug: string) =>
    `https://github.com/apps/${slug}/installations/new?state=${
      encodeURIComponent(await signState(state))
    }`;

  // A reloaded redirect: GitHub's code is single-use, but the App already exists.
  const existing = await gitIntegrationModel.findOne({ _id, tenant }, {
    projection: { appSlug: 1 },
  });
  if (existing) return await install(existing.appSlug);

  const { limits } = await entitlements.resolve(tenant);
  if (
    !await quotaGuard.acquire(tenant, "gitIntegrations", limits.gitIntegrations)
  ) {
    return await fail("quota");
  }

  try {
    const { data: app } = await githubApi.call<{
      id: number;
      slug: string;
      name: string;
      html_url: string;
      client_id: string;
      client_secret: string;
      webhook_secret: string;
      pem: string;
      owner: { login: string; type: string };
    }>(`/app-manifests/${encodeURIComponent(code)}/conversions`, {
      method: "POST",
    });

    await gitIntegrationModel.insertOne({
      _id,
      tenant,
      owner: ObjectId.createFromHexString(state.user),
      provider: "github",
      appId: app.id,
      appSlug: app.slug,
      appName: app.name,
      htmlUrl: app.html_url,
      clientId: app.client_id,
      clientSecretEnc: await encrypt(
        tenant,
        _id,
        "clientSecret",
        app.client_secret,
      ),
      privateKeyEnc: await encrypt(tenant, _id, "privateKey", app.pem),
      webhookSecretEnc: await encrypt(
        tenant,
        _id,
        "webhookSecret",
        app.webhook_secret ?? "",
      ),
      account: { login: app.owner.login, type: app.owner.type },
      installations: [],
      sharedWithTenant: false,
      createdAt: new Date(),
    });

    return await install(app.slug);
  } catch (error) {
    await quotaGuard.release(tenant, "gitIntegrations");
    if (error instanceof GitHubError) return await fail("github");
    throw error;
  }
}

const appTokens = new BoundedCache<string, string>({
  maxEntries: 5_000,
  ttlMs: 8 * 60_000,
});
const installationTokens = new BoundedCache<string, string>({
  maxEntries: 20_000,
  // GitHub's tokens last an hour; refreshed well before that.
  ttlMs: 50 * 60_000,
});

const appToken = async (doc: TIntegrationRef) => {
  const key = doc._id.toHexString();
  let token = appTokens.get(key);
  if (!token) {
    const full = await gitIntegrationModel.findOne({ _id: doc._id }, {
      projection: { appId: 1, privateKeyEnc: 1, tenant: 1 },
    });
    if (!full) throw Response.notFound("Integration not found");
    token = appJwt(
      full.appId,
      await decrypt(full, "privateKey", full.privateKeyEnc),
    );
    appTokens.set(key, token);
  }
  return token;
};

type TIntegrationRef = { _id: ObjectId; tenant: ObjectId };

/** An installation token, minted with the App's JWT and cached (PLAN §9.3). */
export async function installationToken(
  doc: TIntegrationRef,
  installation: number,
) {
  const key = `${doc._id}:${installation}`;
  let token = installationTokens.get(key);
  if (!token) {
    const { data } = await githubApi.call<{ token: string }>(
      `/app/installations/${installation}/access_tokens`,
      { method: "POST", auth: await appToken(doc) },
    );
    token = data.token;
    installationTokens.set(key, token);
  }
  return token;
}

type TGitHubInstallation = {
  id: number;
  account: { login: string; type: string } | null;
  repository_selection?: "all" | "selected";
  suspended_at?: string | null;
};

const toInstallation = (i: TGitHubInstallation): TInstallation => ({
  id: i.id,
  account: {
    login: i.account?.login ?? "unknown",
    type: i.account?.type ?? "User",
  },
  repositorySelection: i.repository_selection,
  suspended: !!i.suspended_at,
});

/** Replaces the stored installations with GitHub's current list. */
export async function syncInstallations(doc: TIntegrationRef) {
  const installations: TInstallation[] = [];
  // ponytail: one page of 100 installations; paginate if an App is installed on more accounts.
  const { data } = await githubApi.call<TGitHubInstallation[]>(
    "/app/installations?per_page=100",
    { auth: await appToken(doc) },
  );
  installations.push(...data.map(toInstallation));
  await gitIntegrationModel.updateOne({ _id: doc._id }, {
    $set: { installations },
  });
  return installations;
}

/**
 * Step 3 (after click 3, "Install"): GitHub redirects here with the
 * installation id. Without our state (installed from GitHub directly) the
 * tenant is unknown, so the dashboard's refresh picks it up instead.
 */
export async function completeInstall(stateToken: string | null) {
  const state = await verifyState(stateToken);
  if (!state) return await dashboardUrl();

  const doc = await gitIntegrationModel.findOne({
    _id: ObjectId.createFromHexString(state.integration),
    tenant: ObjectId.createFromHexString(state.tenant),
  }, { projection: { _id: 1, tenant: 1 } });
  if (!doc) return await dashboardUrl(state.tenant, { error: "missing" });

  try {
    await syncInstallations(doc);
  } catch (error) {
    if (error instanceof GitHubError) {
      return await dashboardUrl(state.tenant, { error: "github" });
    }
    throw error;
  }
  return await dashboardUrl(state.tenant, { connected: state.integration });
}

/** Integrations the user can use: their own, plus those shared with the tenant. */
export function visibleFilter(tenant: ObjectId, user: ObjectId) {
  return { tenant, $or: [{ owner: user }, { sharedWithTenant: true }] };
}

export async function listIntegrations(tenant: ObjectId, user: ObjectId) {
  return await gitIntegrationModel.find(visibleFilter(tenant, user), {
    projection: secretFields,
    sort: { createdAt: 1 },
  }).toArray();
}

/** An integration the user may use, or 404. */
export async function usableIntegration(
  id: ObjectId,
  tenant: ObjectId,
  user: ObjectId,
) {
  const doc = await gitIntegrationModel.findOne(
    { _id: id, ...visibleFilter(tenant, user) },
    { projection: { _id: 1, tenant: 1, installations: 1 } },
  );
  if (!doc) throw Response.notFound("Integration not found");
  return doc;
}

const ownedFilter = (id: ObjectId, tenant: ObjectId, user: ObjectId) => ({
  _id: id,
  tenant,
  owner: user,
});

export async function setShared(
  id: ObjectId,
  tenant: ObjectId,
  user: ObjectId,
  sharedWithTenant: boolean,
) {
  const { matchedCount } = await gitIntegrationModel.updateOne(
    ownedFilter(id, tenant, user),
    { $set: { sharedWithTenant } },
  );
  if (!matchedCount) {
    throw Response.forbidden("Only the owner can change sharing");
  }
}

/** Forgets the App here; the user deletes it on GitHub (the UI links there). */
export async function removeIntegration(
  id: ObjectId,
  tenant: ObjectId,
  user: ObjectId,
) {
  const { deletedCount } = await gitIntegrationModel.deleteOne(
    ownedFilter(id, tenant, user),
  );
  if (!deletedCount) throw Response.forbidden("Only the owner can remove it");
  await quotaGuard.release(tenant, "gitIntegrations");
  appTokens.delete(id.toHexString());
  webhookSecrets.delete(id.toHexString());
}

const assertInstallation = (
  doc: Pick<TGitIntegration, "installations">,
  installation: number,
) => {
  if (!doc.installations.some((i) => i.id === installation)) {
    throw Response.notFound("Installation not found");
  }
};

export async function listRepositories(
  doc: TIntegrationRef & Pick<TGitIntegration, "installations">,
  installation: number,
  page: number,
) {
  assertInstallation(doc, installation);
  const { data, headers } = await githubApi.call<{
    repositories: {
      id: number;
      name: string;
      full_name: string;
      owner: { login: string };
      private: boolean;
      default_branch: string;
      pushed_at: string | null;
      description: string | null;
    }[];
  }>(`/installation/repositories?per_page=100&page=${page}`, {
    auth: await installationToken(doc, installation),
  });

  return {
    repositories: data.repositories.map((r) => ({
      id: r.id,
      name: r.name,
      fullName: r.full_name,
      owner: r.owner.login,
      private: r.private,
      defaultBranch: r.default_branch,
      pushedAt: r.pushed_at ?? undefined,
      description: r.description ?? undefined,
    })),
    hasMore: hasNextPage(headers),
  };
}

export async function listBranches(
  doc: TIntegrationRef & Pick<TGitIntegration, "installations">,
  installation: number,
  repo: string,
  page: number,
) {
  assertInstallation(doc, installation);
  const { data, headers } = await githubApi.call<
    { name: string; commit: { sha: string } }[]
  >(`/repos/${repo}/branches?per_page=100&page=${page}`, {
    auth: await installationToken(doc, installation),
  });
  return {
    branches: data.map((b) => ({ name: b.name, sha: b.commit.sha })),
    hasMore: hasNextPage(headers),
  };
}

// Unknown ids are cached as { key: null }, so junk deliveries don't reach Mongo each time.
const webhookSecrets = new BoundedCache<string, { key: CryptoKey | null }>({
  maxEntries: 10_000,
  ttlMs: 10 * 60_000,
});

const webhookKey = async (id: ObjectId) => {
  const cached = webhookSecrets.get(id.toHexString());
  if (cached) return cached.key;

  const doc = await gitIntegrationModel.findOne({ _id: id }, {
    projection: { tenant: 1, webhookSecretEnc: 1 },
  });
  const secret = doc &&
    await decrypt(doc, "webhookSecret", doc.webhookSecretEnc);
  const cryptoKey = secret
    ? await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    )
    : null;
  webhookSecrets.set(id.toHexString(), { key: cryptoKey });
  return cryptoKey;
};

const fromHex = (hex: string) =>
  Uint8Array.from(hex.match(/../g) ?? [], (b) => parseInt(b, 16));

export type TPushEvent = {
  ref?: string;
  after?: string;
  deleted?: boolean;
  repository?: { full_name?: string };
  head_commit?: { message?: string; author?: { name?: string } } | null;
};

/**
 * GitHub webhook (PLAN §17): HMAC-SHA256 verified with this integration's own
 * secret (constant-time via WebCrypto). Keeps installations in sync and
 * returns `push` events for the caller to deploy.
 */
export async function handleWebhook(
  id: ObjectId,
  event: string | null,
  signature: string | null,
  body: string,
) {
  const key = await webhookKey(id);
  const hex = signature?.match(/^sha256=([0-9a-f]{64})$/)?.[1];
  if (
    !key || !hex ||
    !await crypto.subtle.verify(
      "HMAC",
      key,
      fromHex(hex),
      new TextEncoder().encode(body),
    )
  ) throw Response.unauthorized("Invalid signature");

  if (event === "push") {
    // Deploys start in the route (lib/deploy), so this module stays below it.
    const integration = await gitIntegrationModel.findOne({ _id: id }, {
      projection: { tenant: 1 },
    });
    return integration
      ? { push: JSON.parse(body) as TPushEvent, tenant: integration.tenant }
      : undefined;
  }
  if (event !== "installation") return;

  const payload = JSON.parse(body) as {
    action: string;
    installation: TGitHubInstallation;
  };
  const installation = toInstallation(payload.installation);
  if (payload.action === "deleted") {
    await gitIntegrationModel.updateOne({ _id: id }, {
      $pull: { installations: { id: installation.id } },
    });
    return;
  }
  // created, suspend, unsuspend, new_permissions_accepted: store the latest state.
  await gitIntegrationModel.bulkWrite([
    {
      updateOne: {
        filter: { _id: id },
        update: { $pull: { installations: { id: installation.id } } },
      },
    },
    {
      updateOne: {
        filter: { _id: id },
        update: { $push: { installations: installation } },
      },
    },
  ]);
}

/** An integration by id within the tenant, for deploys (push deploys have no user). */
export async function integrationInTenant(id: ObjectId, tenant: ObjectId) {
  const doc = await gitIntegrationModel.findOne(
    { _id: id, tenant },
    { projection: { _id: 1, tenant: 1, installations: 1 } },
  );
  if (!doc) {
    throw Response.notFound("The project's GitHub connection was removed");
  }
  return doc;
}

/** A branch's (or SHA's) head commit. */
export async function resolveCommit(
  doc: TIntegrationRef & Pick<TGitIntegration, "installations">,
  installation: number,
  repo: string,
  ref: string,
) {
  assertInstallation(doc, installation);
  const { data } = await githubApi.call<{
    sha: string;
    commit: { message: string; author: { name: string } | null };
  }>(`/repos/${repo}/commits/${encodeURIComponent(ref)}`, {
    auth: await installationToken(doc, installation),
  });
  return {
    sha: data.sha,
    message: data.commit.message.split("\n")[0].slice(0, 300),
    author: data.commit.author?.name,
  };
}

/** One file of the repo at a commit (compose sources). */
export async function readRepoFile(
  doc: TIntegrationRef & Pick<TGitIntegration, "installations">,
  installation: number,
  repo: string,
  sha: string,
  path: string,
) {
  assertInstallation(doc, installation);
  const clean = path.replace(/^\.?\//, "");
  const { data } = await githubApi.call<{ content: string; encoding: string }>(
    `/repos/${repo}/contents/${
      clean.split("/").map(encodeURIComponent).join("/")
    }?ref=${sha}`,
    { auth: await installationToken(doc, installation) },
  );
  return new TextDecoder().decode(
    Uint8Array.from(
      atob(data.content.replace(/\s/g, "")),
      (c) => c.charCodeAt(0),
    ),
  );
}

export const cloneUrl = (repo: string) =>
  `${githubApi.cloneBaseUrl}/${repo}.git`;
