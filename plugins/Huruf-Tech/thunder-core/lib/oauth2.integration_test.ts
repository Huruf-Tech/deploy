/**
 * Integration tests for OAuth2 token rotation.
 *
 * These need a real MongoDB: the whole mechanism is atomic compare-and-swap
 * on a consent document, and the bugs they pin down were all races.
 *
 * Setup and the safety guard are the same as `lib/wallet.integration_test.ts`
 * — see that file's header. Run with `deno task test:integration`.
 */
import assert from "node:assert/strict";
import { ObjectId } from "mongodb";
import { Env } from "@/core/utils/env.ts";

const databaseUrl = Env.getSync("DATABASE_URL", true) ?? "";
const isLocal = /(127\.0\.0\.1|localhost)/.test(databaseUrl);
const enabled = Env.getType() === "test" && isLocal;

/** Lazy: the models bind to `mongodb.db()` the moment they are imported. */
const load = async () => {
  await import("@/core/bootstrap.ts");

  const [oauth, consent, jwk] = await Promise.all([
    import("@/lib/oauth2.ts"),
    import("@/schemas/oauthConsent.ts"),
    import("@/schemas/jwk.ts"),
  ]);

  return { ...oauth, ...consent, ...jwk };
};

type Loaded = Awaited<ReturnType<typeof load>>;

let mod: Loaded;

const test = (name: string, fn: () => Promise<void>) =>
  Deno.test({
    name,
    ignore: !enabled,
    sanitizeOps: false,
    sanitizeResources: false,
    async fn() {
      mod ??= await load();

      await mod.oauthConsentModel.deleteMany({});

      await fn();
    },
  });

/** A consent as `/oauth/consent` would leave it: no sessions yet. */
const makeConsent = async () => {
  const user = new ObjectId();
  const client = new ObjectId();

  const { insertedId } = await mod.oauthConsentModel.insertOne({
    client,
    scopes: ["openid", "offline_access"],
    resourceGrant: {},
    version: 1,
    createdBy: user,
    createdAt: new Date(),
  });

  return { consentId: insertedId, user, client };
};

const refreshToken = (
  ctx: { consentId: ObjectId; user: ObjectId; client: ObjectId },
  sid: string,
  version: number,
) =>
  mod.OAuth2.signJWT({
    type: "refresh_token",
    clientId: ctx.client.toString(),
    userId: ctx.user.toString(),
    sid,
    consentId: ctx.consentId.toString(),
    version,
  }, { subject: ctx.user.toString(), ttl: 60 * 60 * 24 });

const refresh = (token: string) =>
  mod.OAuth2.exchangeToken({ grantType: "refresh_token", token });

test("parallel refreshes with one token all succeed", async () => {
  // An app firing several requests that 401 together, each starting a
  // refresh. Before the grace window, every loser was signed out.
  const ctx = await makeConsent();
  const token = await refreshToken(ctx, "sid-a", 1);

  const results = await Promise.all([
    refresh(token),
    refresh(token),
    refresh(token),
  ]);

  results.forEach((result, i) =>
    assert.ok(result.access_token, `refresh #${i + 1} should have succeeded`)
  );
});

test("two devices on one consent do not evict each other", async () => {
  // `uniqueConsentPerClient` gives a user one consent per client, so phone
  // and laptop share it. Rotation has to be per session or the first to
  // refresh kills the other.
  const ctx = await makeConsent();

  const phone = await refreshToken(ctx, "sid-phone", 1);
  const laptop = await refreshToken(ctx, "sid-laptop", 1);

  await refresh(phone);

  const second = await refresh(laptop);

  assert.ok(second.access_token, "the laptop must still be able to refresh");
});

test("a superseded refresh token dies once the grace window passes", async () => {
  const ctx = await makeConsent();
  const token = await refreshToken(ctx, "sid-old", 1);

  await refresh(token);

  await mod.oauthConsentModel.updateOne({ _id: ctx.consentId }, {
    $set: {
      [`sessions.${mod.OAuth2.sessionKey("sid-old")}.rotatedAt`]: new Date(
        Date.now() - mod.OAUTH_REFRESH_GRACE_MS - 1_000,
      ),
    },
  });

  await assert.rejects(() => refresh(token), /revoked/);
});

test("an authorization code is still single-use", async () => {
  // The grace window must not extend to codes, or it becomes a replay hole.
  const ctx = await makeConsent();

  const code = await mod.OAuth2.signJWT({
    type: "authorization_code",
    clientId: ctx.client.toString(),
    userId: ctx.user.toString(),
    sid: "sid-code",
    consentId: ctx.consentId.toString(),
    version: 1,
    codeChallenge: "challenge",
    codeChallengeMethod: "S256",
    redirectUri: "https://app.test/cb",
  }, { subject: ctx.user.toString(), ttl: 300 });

  const original = mod.OAuth2.verifyCodeChallenge;
  mod.OAuth2.verifyCodeChallenge = () => Promise.resolve(true);

  const exchange = () =>
    mod.OAuth2.exchangeToken({
      grantType: "authorization_code",
      token: code,
      clientId: ctx.client.toString(),
      redirectUri: "https://app.test/cb",
      codeVerifier: "verifier",
    });

  try {
    await exchange();
    await assert.rejects(exchange, /revoked/);
  } finally {
    mod.OAuth2.verifyCodeChallenge = original;
  }
});

test("revoking one session leaves the others signed in", async () => {
  const ctx = await makeConsent();

  const phone = await refresh(await refreshToken(ctx, "sid-p", 1));
  const laptop = await refresh(await refreshToken(ctx, "sid-l", 1));

  await mod.OAuth2.revoke({ token: phone.refresh_token! });

  // Tombstoned, not erased: an erased session reads as a first use and the
  // revoked token would be adopted straight back in.
  await assert.rejects(() => refresh(phone.refresh_token!), /revoked/);

  const after = await refresh(laptop.refresh_token!);

  assert.ok(after.access_token, "the laptop must be untouched");
});

test("revoking the last session drops the consent", async () => {
  const ctx = await makeConsent();
  const only = await refresh(await refreshToken(ctx, "sid-only", 1));

  await mod.OAuth2.revoke({ token: only.refresh_token! });

  assert.equal(
    await mod.oauthConsentModel.countDocuments({ _id: ctx.consentId }),
    0,
    "a full sign-out should require granting again",
  );
});

test("allSessions revokes every device at once", async () => {
  const ctx = await makeConsent();

  const phone = await refresh(await refreshToken(ctx, "sid-p3", 1));
  const laptop = await refresh(await refreshToken(ctx, "sid-l3", 1));

  await mod.OAuth2.revoke({
    token: phone.refresh_token!,
    allSessions: true,
  });

  await assert.rejects(() => refresh(laptop.refresh_token!), /revoked/);
});

test("concurrent cold starts settle on one signing key", async () => {
  const { syncDBIndexes } = await import("@/scripts/syncDBIndexes.ts");

  // The unique index cannot build over pre-existing duplicates.
  await mod.jwkModel.deleteMany({});
  await syncDBIndexes();

  const keys = await Promise.all([
    mod.OAuth2.resolveJWKs(),
    mod.OAuth2.resolveJWKs(),
    mod.OAuth2.resolveJWKs(),
  ]);

  // Signing a token with a key /jwks does not publish breaks verification
  // for the client, intermittently and confusingly.
  assert.equal(
    new Set(keys.map((key) => key.kid)).size,
    1,
    "every caller must get the same kid",
  );
  assert.equal(await mod.jwkModel.countDocuments({}), 1);

  await mod.jwkModel.deleteMany({});
});
