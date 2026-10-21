import { Router } from "@/core/http/router.ts";
import { bodyAsJson, parseBasicAuth, queryAsJson } from "@/core/http/utils.ts";
import z from "zod";
import { withAuthSession } from "@/utils/withAuthSession.ts";
import { Response } from "@/core/http/response.ts";
import {
  oauthConsentModel,
  oauthConsentSchema,
  resourceGrantSchema,
} from "../schemas/oauthConsent.ts";
import { OAuth2 } from "../lib/oauth2.ts";
import { ObjectId } from "mongodb";

export default new Router("/", function oauth(router) {
  const $queryWithRedirectUri = z.object({
    redirect_uri: z.url(),
  });

  const $query = z.object({
    response_type: z.literal("code"),
    client_id: z.string().min(1),
    scope: z.string(),
    state: z.string().optional(),
    code_challenge: z.string().min(1),
    code_challenge_method: z.literal("S256"),
    nonce: z.string().optional(),
  }).extend($queryWithRedirectUri.shape);

  router.get("/authorize", function authorize() {
    return {
      shape: () => ({
        query: $query,
      }),
      handler: async (req: Request) => {
        const { redirect_uri } = $queryWithRedirectUri.parse(queryAsJson(req));

        try {
          const query = $query.parse(queryAsJson(req));

          const url = new URL(req.url);

          const client = await OAuth2.validateOAuthParams(
            query.client_id,
            query,
          );

          const session = await withAuthSession(req, true);

          if (!session?.session) {
            return Response.redirect(
              new URL("/auth/" + url.search, url.origin),
            );
          }

          const consent = await oauthConsentModel.findOne({
            createdBy: session.user._id,
            client: client._id,
          });

          if (!consent) {
            return Response.redirect(
              new URL("/auth/consent" + url.search, url.origin),
            );
          }

          const code = await OAuth2.generateAuthorizationCode({
            clientId: client._id.toString(),
            userId: session.user._id.toString(),
            consentId: consent._id.toString(),
            codeChallenge: query.code_challenge,
            codeChallengeMethod: query.code_challenge_method,
            redirectUri: query.redirect_uri,
            version: consent.version,
            sid: session.session._id.toString(),
            nonce: query.nonce,
          });

          const redirectUrl = new URL(redirect_uri);

          redirectUrl.searchParams.set("code", code);
          redirectUrl.searchParams.set("state", query.state ?? "");

          return Response.redirect(redirectUrl);
        } catch (error) {
          const redirectUrl = new URL(redirect_uri);
          redirectUrl.searchParams.set(
            "error",
            error instanceof z.ZodError
              ? error.issues.map((e) =>
                `[${e.path.join(".") || "input"}]: ${e.message}`
              ).join(", ")
              : error instanceof Error
              ? error.message
              : String(error),
          );

          return Response.redirect(redirectUrl);
        }
      },
    };
  });

  router.post("/consent", function consent() {
    const $body = z.object({
      resourceGrant: resourceGrantSchema,
    });
    const $return = z.object({
      _id: z.string(),
    });

    return {
      shape: () => ({
        query: $query,
        body: $body,
        return: $return,
      }),
      handler: async (req: Request) => {
        const query = $query.parse(queryAsJson(req));
        const body = $body.parse(await bodyAsJson(req));

        const session = await withAuthSession(req);

        const { insertedId } = await oauthConsentModel.insertOne(
          oauthConsentSchema.strictParse({
            ...body,
            client: new ObjectId(query.client_id),
            createdBy: session.user._id,
            scopes: query.scope.split(" "),
          }),
        );

        return Response.json(
          {
            _id: insertedId.toString(),
          } satisfies z.infer<typeof $return>,
        );
      },
    };
  });

  router.post("/token", function token() {
    const $body = z.object({
      grant_type: z.enum(["authorization_code", "refresh_token"]),
      client_id: z.string().min(1),
      code: z.string().optional(),
      code_verifier: z.string().optional(),
      redirect_uri: z.url().optional(),
      refresh_token: z.string().optional(),
    });
    const $return = z.object({
      token_type: z.literal("Bearer"),
      refresh_token: z.string().optional(),
      access_token: z.string(),
      id_token: z.string().optional(),
      expires_in: z.number(),
    });

    return {
      shape: () => ({
        body: $body,
        return: $return,
      }),
      handler: async (req: Request) => {
        const body = $body.parse(await bodyAsJson(req));

        await OAuth2.validateConfidentialClient(
          body.client_id,
          parseBasicAuth(req),
        );

        return Response.json(
          await OAuth2.exchangeToken({
            grantType: body.grant_type,
            token: body.code ?? body.refresh_token ?? "",
            clientId: body.client_id,
            redirectUri: body.redirect_uri,
            codeVerifier: body.code_verifier,
          }) satisfies z.infer<typeof $return>,
        );
      },
    };
  });

  router.post("/revoke", function revoke() {
    const $body = z.object({
      client_id: z.string().optional(),
      token_type_hint: z.enum(["refresh_token", "access_token"]).optional(),
      token: z.string(),
    });

    return {
      shape: () => ({
        body: $body,
      }),
      handler: async (req: Request) => {
        const body = $body.parse(await bodyAsJson(req));

        await OAuth2.validateConfidentialClient(
          body.client_id,
          parseBasicAuth(req),
        );

        await OAuth2.revoke({
          tokenTypeHint: body.token_type_hint,
          token: body.token,
        });

        return Response.ok();
      },
    };
  });

  router.get("/jwks", function jwks() {
    return async () => {
      const jwks = await OAuth2.resolveJWKs();

      return Response.json({
        keys: [jwks.publicJwk],
      });
    };
  });
}).group("OAuth");
