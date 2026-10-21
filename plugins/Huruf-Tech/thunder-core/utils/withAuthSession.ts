// deno-lint-ignore-file no-explicit-any
import z from "zod";
import { ObjectId, WithId } from "mongodb";
import { auth } from "@/lib/auth.ts";
import { Response } from "@/core/http/response.ts";
import { sessionModel, sessionSchema } from "@/schemas/session.ts";
import { userModel, userSchema } from "@/schemas/user.ts";
import { OAuth2 } from "@/lib/oauth2.ts";
import { withCachedOnRequest } from "./withCachedOnRequest.ts";
import { APIKey } from "@/lib/apiKey.ts";

export type TAuthSession = {
  tenantId?: ObjectId;
  auth: typeof auth;
  session?: WithId<z.infer<typeof sessionSchema>>;
  user: WithId<z.infer<typeof userSchema>>;
  scopes?: string[];
};

export type TWithAuthSession = {
  (req: Request, silent: true): Promise<TAuthSession | undefined>;
  (req: Request, silent?: false | undefined): Promise<TAuthSession>;
};

// @ts-expect-error overrides
const _withAuthSession: TWithAuthSession = async (req, silent) => {
  const authorization = req.headers?.get("authorization");
  const accessToken = authorization?.replace(/^Bearer\s+/i, "");
  const xApiKey = req.headers?.get("x-api-key");

  const tenantIdKey = "X-TENANT-ID";
  const tenantId = req.headers.has(tenantIdKey)
    ? new ObjectId(req.headers.get(tenantIdKey)!)
    : undefined;

  if (accessToken) {
    const { payload, consent } = await OAuth2.verifyAccessToken(accessToken)
      .catch(() => {
        throw Response.unauthorized();
      });

    const scopes = tenantId
      ? (consent.resourceGrant[tenantId.toString()] ?? consent.scopes)
      : consent.scopes;

    const session = await sessionModel.findOne(new ObjectId(payload.sid));

    if (!session) throw Response.unauthorized();

    const user = await userModel.findOne(new ObjectId(session?.userId));

    if (!user) throw Response.unauthorized();

    return {
      tenantId,
      session,
      user,
      auth,
      scopes,
    };
  }

  if (xApiKey) {
    const apiKey = await APIKey.resolve(xApiKey);

    if (!apiKey) throw Response.unauthorized();

    const scopes = tenantId
      ? (apiKey.resourceGrant[tenantId.toString()] ?? apiKey.scopes)
      : apiKey.scopes;

    const user = await userModel.findOne(new ObjectId(apiKey.createdBy));

    if (!user) throw Response.unauthorized();

    return {
      tenantId,
      user,
      auth,
      scopes,
    };
  }

  const gotSession = await auth.api.getSession({ headers: req.headers });

  if (!gotSession) {
    if (silent) return;

    throw Response.unauthorized();
  }

  return {
    tenantId,
    session: {
      _id: new ObjectId(gotSession.session.id),
      ...gotSession.session,
    },
    user: {
      _id: new ObjectId(gotSession.user.id),
      role: "user",
      ...gotSession.user,
    },
    auth,
  };
};

export const withAuthSession: TWithAuthSession = (req, silent) => {
  return withCachedOnRequest(
    req,
    "authSession:" + silent,
    (req) => _withAuthSession(req, silent as true) as any,
  );
};
