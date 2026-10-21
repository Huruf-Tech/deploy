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
import { ObjectId } from "mongodb";
import { oauthConsentModel } from "../schemas/oauthConsent.ts";
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

export class OAuth2 {
  static async resolveJWKs(): Promise<TJwks> {
    const jwks = await jwkModel.findOne();

    if (jwks) return jwks as unknown as TJwks;

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

    await jwkModel.insertOne(doc);

    return doc as TJwks;
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

    const consent = await oauthConsentModel.findOneAndUpdate(
      {
        _id: new ObjectId(payload.consentId),
        version: payload.version,
      },
      { $inc: { version: 1 } },
      { returnDocument: "after" },
    );

    if (!consent) {
      throw new Error("Consent not found or has been revoked");
    }

    const basePayload: Omit<
      TAuthTokenPayload,
      "codeChallenge" | "codeChallengeMethod" | "redirectUri"
    > = {
      clientId: payload.clientId,
      userId: payload.userId,
      sid: payload.sid,
      consentId: payload.consentId,
      version: consent.version,
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
  }) {
    const baseUrl = await Env.get("BASE_URL");

    const { payload } = await this.verifyJWT<TAuthTokenPayload>(opts.token, {
      issuer: baseUrl,
      audience: baseUrl,
    });

    await oauthConsentModel.deleteOne({ _id: new ObjectId(payload.consentId) });
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
