import {
  exportJWK,
  generateKeyPair,
  importJWK,
  type JWTPayload,
  jwtVerify,
  SignJWT,
} from "jose";
import { Env } from "@/core/utils/env.ts";
import { createHashBase64 } from "@/core/utils/hash.ts";
import { oauthClientModel } from "../schemas/oauthClient.ts";
import { ObjectId, WithId } from "mongodb";
import z from "zod";
import { isDuplicateKeyError } from "@/database.ts";
import {
  oauthConsentModel,
  oauthConsentSchema,
} from "../schemas/oauthConsent.ts";
import { jwkModel, jwkSchema } from "../schemas/jwk.ts";

export type TAuthTokenPayload = {
  clientId: string;
  userId: string;
  sid: string;
  consentId: string;
  codeChallenge: string;
  codeChallengeMethod: string;
  redirectUri: string;
  version: number;
  nonce?: string;
};

export type TJwks = {
  kid: string;
  publicJwk: JsonWebKey;
  privateJwk: JsonWebKey;
};

/**
 * How long a just-superseded refresh token keeps working.
 *
 * Rotation makes a refresh token single-use, which breaks two ordinary
 * situations: an app firing several requests that all 401 at once and each
 * starting a refresh, and a refresh whose response never reaches the client.
 * Both would otherwise strand the session with a token the server has already
 * retired. Inside this window the superseded token is accepted and returns the
 * current tokens instead of rotating again.
 */
export const OAUTH_REFRESH_GRACE_MS = 60_000;

/**
 * Session entries older than the longest-lived refresh token are dead weight
 * and get pruned, so a consent does not grow forever as a user signs in.
 */
const OAUTH_SESSION_TTL_MS = 60 * 60 * 24 * 31 * 1000;

type TConsent = WithId<z.infer<typeof oauthConsentSchema>>;

export class OAuth2 {
  /**
   * Encodes a session id for use as a MongoDB field name, which cannot
   * contain `.` or start with `$`. Injective: `%` is escaped first, so no two
   * distinct session ids can collide on one key.
   */
  static sessionKey(sid: string) {
    return sid
      .replaceAll("%", "%25")
      .replaceAll("$", "%24")
      .replaceAll(".", "%2E");
  }

  /** The rotation version a session is currently at, if it has one. */
  static sessionVersion(consent: Pick<TConsent, "sessions">, sid: string) {
    return consent.sessions?.[this.sessionKey(sid)]?.version;
  }

  static async resolveJWKs(): Promise<TJwks> {
    // Oldest wins, so every instance agrees which key is canonical even if
    // duplicates already exist from before this was made atomic. Without the
    // sort, `findOne` could hand out a key that /jwks does not publish.
    const existing = await jwkModel.find().sort({ createdAt: 1, _id: 1 })
      .limit(1).next();

    if (existing) return existing as unknown as TJwks;

    const { publicKey, privateKey } = await generateKeyPair("RS256", {
      modulusLength: 2048,
      extractable: true,
    });

    const kid = crypto.randomUUID();

    const publicJwk = {
      ...(await exportJWK(publicKey)),
      kid,
      use: "sig",
      alg: "RS256",
    };

    const privateJwk = {
      ...(await exportJWK(privateKey)),
      kid,
      use: "sig",
      alg: "RS256",
    };

    const doc = jwkSchema.parse({
      kid,
      publicJwk,
      privateJwk,
    });

    try {
      await jwkModel.insertOne(doc);

      return doc as TJwks;
    } catch (error) {
      // Lost the race with another cold start. Its key is the canonical one;
      // ours is discarded unused.
      if (!isDuplicateKeyError(error)) throw error;

      const winner = await jwkModel.find().sort({ createdAt: 1, _id: 1 })
        .limit(1).next();

      if (!winner) throw error;

      return winner as unknown as TJwks;
    }
  }

  static async createOAuthConfig() {
    const baseUrl = await Env.get("BASE_URL");
    const authUrl = new URL("/oauth", baseUrl).toString();

    return {
      issuer: baseUrl,
      authorization_endpoint: `${authUrl}/authorize`,
      token_endpoint: `${authUrl}/token`,
      revocation_endpoint: `${authUrl}/revoke`,
      grant_types_supported: [
        "authorization_code",
        "refresh_token",
      ],
      jwks_uri: `${authUrl}/jwks`,
      response_types_supported: ["code"],
      subject_types_supported: ["public"],
      id_token_signing_alg_values_supported: ["RS256"],
      scopes_supported: ["openid", "offline_access"],
      token_endpoint_auth_methods_supported: [
        "client_secret_basic",
        "none",
      ],
      claims_supported: [
        "sub",
        "iss",
        "aud",
        "exp",
        "iat",
        "nonce",
        "sid",
      ],
      code_challenge_methods_supported: ["S256"],
    };
  }

  static async validateOAuthParams(clientId: string, params: {
    scope: string;
    redirect_uri: string;
  }) {
    const client = await oauthClientModel.findOne({
      _id: new ObjectId(clientId),
    });

    if (!client) {
      throw new Error("Invalid client_id");
    }

    if (
      client.redirectUris &&
      !client.redirectUris.includes(params.redirect_uri.split("?")[0])
    ) {
      throw new Error("Invalid redirect_uri");
    }

    if (
      !client.allowedScopes.includes("*") &&
      !params.scope.split(/\s+/).every((s) => client.allowedScopes.includes(s))
    ) {
      throw new Error("Invalid scope");
    }

    return client;
  }

  static async validateConfidentialClient(
    clientId?: string,
    credentials?: null | { username: string; password: string },
  ) {
    if (!clientId && !credentials) {
      throw new Error("Either client_id or credentials must be provided");
    }

    const client = await oauthClientModel.findOne({
      _id: new ObjectId(clientId ?? credentials?.username),
    });

    if (!client) {
      throw new Error("Invalid client_id");
    }

    if (client.type === "confidential") {
      if (!credentials) {
        throw new Error("Missing credentials");
      }

      if (client.secret !== credentials.password) {
        throw new Error("Invalid credentials");
      }
    }

    return client;
  }

  static async signJWT(payload: JWTPayload, cfg: {
    secret?: string;
    subject: string;
    issuer?: string;
    audience?: string | string[];
    ttl: number;
  }) {
    const now = Math.floor(Date.now() / 1000);
    const secret = new TextEncoder().encode(
      await Env.get("SECRET_KEY") + cfg.secret,
    );

    const iss = await Env.get("BASE_URL");

    return await new SignJWT(payload)
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setSubject(cfg.subject)
      .setIssuer(cfg.issuer || iss)
      .setAudience(cfg.audience || iss)
      .setIssuedAt(now)
      .setExpirationTime(now + cfg.ttl)
      .sign(secret);
  }

  static async verifyJWT<T extends JWTPayload>(token: string, cfg: {
    secret?: string;
    issuer?: string;
    audience?: string | string[];
  }) {
    const iss = await Env.get("BASE_URL");

    const secret = new TextEncoder().encode(
      await Env.get("SECRET_KEY") + cfg.secret,
    );

    return await jwtVerify<T>(token, secret, {
      issuer: cfg.issuer || iss,
      audience: cfg.audience || iss,
    });
  }

  static async signIdToken(
    payload: JWTPayload,
    cfg: {
      subject: string;
      issuer: string;
      audience: string | string[];
      ttl: number;
    },
  ): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    const jwks = await this.resolveJWKs();

    return await new SignJWT({
      ...payload,
      authTime: now,
    })
      .setProtectedHeader({ alg: "RS256", typ: "JWT", kid: jwks.kid })
      .setSubject(cfg.subject)
      .setIssuer(cfg.issuer)
      .setAudience(cfg.audience)
      .setIssuedAt(now)
      .setExpirationTime(now + cfg.ttl)
      .sign(await importJWK(jwks.privateJwk, "RS256"));
  }

  static async generateAuthorizationCode(
    payload: TAuthTokenPayload,
  ) {
    const baseUrl = await Env.get("BASE_URL");

    return await this.signJWT({
      type: "authorization_code",
      ...payload,
    }, {
      subject: payload.userId,
      issuer: baseUrl,
      audience: baseUrl,
      ttl: 60 * 5, // 5 minutes
    });
  }

  static async verifyCodeChallenge(
    method: string,
    challenge: string,
    verifier: string,
  ) {
    if (method === "S256") {
      const hash = await createHashBase64("SHA-256", verifier);
      return hash === challenge;
    }

    throw new Error("Unsupported code challenge method");
  }

  /**
   * Drops session entries that can no longer hold a usable refresh token.
   */
  protected static async pruneSessions(consent: TConsent) {
    const cutoff = Date.now() - OAUTH_SESSION_TTL_MS;

    const stale = Object.entries(consent.sessions ?? {}).filter(
      ([, session]) => {
        const at = session?.rotatedAt
          ? new Date(session.rotatedAt).getTime()
          : 0;

        // No timestamp means we cannot judge its age; leave it alone.
        return at > 0 && at < cutoff;
      },
    );

    if (!stale.length) return;

    await oauthConsentModel.updateOne({ _id: consent._id }, {
      $unset: Object.fromEntries(
        stale.map(([key]) => [`sessions.${key}`, ""]),
      ),
    });
  }

  /**
   * Spends the rotation version a grant token carries, returning the version
   * the newly issued tokens should carry.
   *
   * Rotation is per session, so one device refreshing cannot invalidate
   * another's tokens. `allowGrace` must be false for an authorization code:
   * codes have to stay strictly single-use, and replaying one inside a grace
   * window would be a code-replay hole.
   */
  protected static async consumeVersion(opts: {
    consentId: ObjectId;
    sid?: string;
    version: number;
    allowGrace: boolean;
  }): Promise<{ consent: TConsent; version: number } | null> {
    const now = new Date();

    // A token minted before `sid` was carried: fall back to the consent-wide
    // counter, which is all such tokens ever had.
    if (!opts.sid) {
      const consent = await oauthConsentModel.findOneAndUpdate(
        { _id: opts.consentId, version: opts.version },
        { $inc: { version: 1 } },
        { returnDocument: "after" },
      );

      return consent ? { consent, version: consent.version } : null;
    }

    const path = `sessions.${this.sessionKey(opts.sid)}`;

    /** The token we just superseded, still inside the grace window. */
    const tryGrace = async () => {
      if (!opts.allowGrace) return null;

      const graced = await oauthConsentModel.findOne({
        _id: opts.consentId,
        [`${path}.version`]: opts.version + 1,
        [`${path}.rotatedAt`]: {
          $gt: new Date(now.getTime() - OAUTH_REFRESH_GRACE_MS),
        },
      });

      // Issue the current tokens without rotating again, so parallel
      // refreshes all end up holding the same valid refresh token.
      return graced ? { consent: graced, version: opts.version + 1 } : null;
    };

    // 1. Normal rotation.
    const rotated = await oauthConsentModel.findOneAndUpdate(
      { _id: opts.consentId, [`${path}.version`]: opts.version },
      {
        $inc: { [`${path}.version`]: 1 },
        $set: { [`${path}.rotatedAt`]: now },
      },
      { returnDocument: "after" },
    );

    if (rotated) {
      await this.pruneSessions(rotated);

      return { consent: rotated, version: opts.version + 1 };
    }

    const graced = await tryGrace();

    if (graced) return graced;

    // 2. First use of this session: an authorization code being exchanged, or
    //    a refresh token issued before per-session rotation existed.
    const adopted = await oauthConsentModel.findOneAndUpdate(
      { _id: opts.consentId, [path]: { $exists: false } },
      { $set: { [path]: { version: opts.version + 1, rotatedAt: now } } },
      { returnDocument: "after" },
    );

    if (adopted) return { consent: adopted, version: opts.version + 1 };

    // Another request adopted this session while we were trying to; if it did
    // so just now, the grace window covers us.
    return await tryGrace();
  }

  static async exchangeToken(opts: {
    grantType: "authorization_code" | "refresh_token";
    token: string;
    clientId?: string;
    redirectUri?: string;
    codeVerifier?: string;
  }) {
    const baseUrl = await Env.get("BASE_URL");

    const { payload } = await this.verifyJWT<TAuthTokenPayload>(opts.token, {
      issuer: baseUrl,
      audience: baseUrl,
    });

    if (payload.type !== opts.grantType) {
      throw new Error("Invalid token grant type");
    }

    if (payload.type === "authorization_code") {
      if (payload.clientId !== opts.clientId) {
        throw new Error("Invalid client_id");
      }

      if (payload.redirectUri !== opts.redirectUri) {
        throw new Error("Invalid redirect_uri");
      }

      if (
        !opts.codeVerifier ||
        !await this.verifyCodeChallenge(
          payload.codeChallengeMethod,
          payload.codeChallenge,
          opts.codeVerifier,
        )
      ) {
        throw new Error("Invalid grant");
      }
    }

    const consumed = await this.consumeVersion({
      consentId: new ObjectId(payload.consentId),
      sid: payload.sid,
      version: payload.version,
      // An authorization code must stay single-use; only a refresh token may
      // be replayed inside the grace window.
      allowGrace: payload.type === "refresh_token",
    });

    if (!consumed) {
      throw new Error("Consent not found or has been revoked");
    }

    const { consent } = consumed;

    const basePayload: Omit<
      TAuthTokenPayload,
      "codeChallenge" | "codeChallengeMethod" | "redirectUri"
    > = {
      clientId: payload.clientId,
      userId: payload.userId,
      sid: payload.sid,
      consentId: payload.consentId,
      version: consumed.version,
      nonce: payload.nonce,
    };

    const baseCfg = {
      subject: payload.userId,
      issuer: baseUrl,
      audience: baseUrl,
    };

    const accessTokenExpiresIn = 60 * 60; // 1 hour
    const refreshTokenExpiresIn = 60 * 60 * 24 * 30; // 30 days
    const idTokenExpiresIn = 60 * 60;

    const accessToken = await this.signJWT({
      type: "access_token",
      ...basePayload,
      scopes: consent.scopes,
    }, {
      ...baseCfg,
      ttl: accessTokenExpiresIn,
    });

    let refreshToken: string | undefined;

    if (consent.scopes.includes("offline_access")) {
      refreshToken = await this.signJWT({
        type: "refresh_token",
        ...basePayload,
      }, {
        ...baseCfg,
        ttl: refreshTokenExpiresIn,
      });
    }

    let idToken: string | undefined;

    if (consent.scopes.includes("openid")) {
      idToken = await this.signIdToken({
        type: "id_token",
        ...basePayload,
      }, {
        ...baseCfg,
        audience: payload.clientId,
        ttl: idTokenExpiresIn,
      });
    }

    return {
      token_type: "Bearer" as const,
      access_token: accessToken,
      refresh_token: refreshToken,
      id_token: idToken,
      expires_in: accessTokenExpiresIn,
    };
  }

  static async revoke(opts: {
    tokenTypeHint?: "access_token" | "refresh_token";
    token: string;
    /**
     * Sign out every session on the consent rather than just the one this
     * token belongs to. Deleting the consent means the user has to grant
     * again, so it is the "sign out everywhere" switch, not the default.
     */
    allSessions?: boolean;
  }) {
    const baseUrl = await Env.get("BASE_URL");

    const { payload } = await this.verifyJWT<TAuthTokenPayload>(opts.token, {
      issuer: baseUrl,
      audience: baseUrl,
    });

    const consentId = new ObjectId(payload.consentId);

    if (opts.allSessions || !payload.sid) {
      await oauthConsentModel.deleteOne({ _id: consentId });

      return;
    }

    const now = new Date();

    // Revoking one device's token must not sign out the others, which all
    // share this consent. Tombstone the session rather than erasing it: an
    // absent entry reads as a first use and would be adopted, letting the
    // revoked token straight back in.
    const consent = await oauthConsentModel.findOneAndUpdate(
      { _id: consentId },
      {
        $set: {
          [`sessions.${this.sessionKey(payload.sid)}`]: {
            version: 0,
            rotatedAt: now,
            revokedAt: now,
          },
        },
      },
      { returnDocument: "after" },
    );

    const live = Object.values(consent?.sessions ?? {}).filter(
      (session) => session.version > 0,
    );

    // Nothing live left: drop the consent so a fresh grant is required, which
    // is what revoking used to do unconditionally.
    if (consent && !live.length) {
      await oauthConsentModel.deleteOne({ _id: consentId });
    }
  }

  static async verifyAccessToken(token: string) {
    const baseUrl = await Env.get("BASE_URL");

    const { payload } = await this.verifyJWT<TAuthTokenPayload>(token, {
      issuer: baseUrl,
      audience: baseUrl,
    });

    if (payload.type !== "access_token") throw new Error("Invalid token");

    const consent = await oauthConsentModel.findOne({
      _id: new ObjectId(payload.consentId),
    });

    if (!consent) throw new Error("Unauthorized");

    return {
      consent,
      payload,
    };
  }
}
