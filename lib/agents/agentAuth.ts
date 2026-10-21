import type { ObjectId } from "mongodb";
import type z from "zod";
import { Response } from "@/core/http/response.ts";
import { BoundedCache } from "@/lib/core/boundedCache.ts";
import { safetyLimit } from "@/lib/limits/safety.ts";
import {
  canonicalRequest,
  fingerprintOf,
  importSignPublicKey,
  MAX_CLOCK_SKEW_MS,
  verify,
} from "@/lib/agents/signing.ts";
import { AGENT_HEADERS } from "@/schemas/protocol/agent.ts";
import { serverModel } from "@/schemas/infrastructure/server.ts";

export type TAgentIdentity = {
  server: ObjectId;
  tenant: ObjectId;
  key: CryptoKey;
};

/**
 * Public keys by fingerprint (PLAN §20.4: 20k entries, 10 min). Signature
 * checks need no DB read; revocation is enforced by the lease filter.
 */
const identities = new BoundedCache<string, TAgentIdentity>({
  maxEntries: 20_000,
  ttlMs: 10 * 60_000,
});

export const forgetAgent = (fingerprint: string) =>
  identities.delete(fingerprint);

const readSignedRequest = async (req: Request) => {
  const fingerprint = req.headers.get(AGENT_HEADERS.key);
  const timestamp = req.headers.get(AGENT_HEADERS.timestamp);
  const signature = req.headers.get(AGENT_HEADERS.signature);

  if (!fingerprint || !timestamp || !signature) {
    throw Response.unauthorized("Missing agent signature headers");
  }

  if (Math.abs(Date.now() - Number(timestamp)) > MAX_CLOCK_SKEW_MS) {
    throw Response.unauthorized("Agent clock skew is over 60 s");
  }

  const body = await req.text();
  const maxBytes = (await safetyLimit("SAFETY_EVENT_BATCH_MAX_KB")) * 1024;
  if (body.length > maxBytes) throw Response.badRequest("Body too large");

  const url = new URL(req.url);
  const data = await canonicalRequest(
    req.method,
    url.pathname + url.search,
    timestamp,
    body,
  );

  return { fingerprint, signature, data, body };
};

const parseBody = <S extends z.ZodType>(schema: S, body: string) => {
  try {
    return schema.parse(JSON.parse(body || "{}")) as z.output<S>;
  } catch (error) {
    if (error instanceof SyntaxError) throw Response.badRequest("Invalid JSON");
    throw error;
  }
};

/** `hello` carries its own public key: the signature proves possession of it. */
export const authenticateHello = async <
  S extends z.ZodType<{ signPublicKey: string }>,
>(req: Request, schema: S) => {
  const signed = await readSignedRequest(req);
  const body = parseBody(schema, signed.body);

  if (signed.fingerprint !== await fingerprintOf(body.signPublicKey)) {
    throw Response.unauthorized("Key fingerprint does not match");
  }

  const key = await importSignPublicKey(body.signPublicKey).catch(() => {
    throw Response.badRequest("Invalid public key");
  });

  if (!await verify(key, signed.signature, signed.data)) {
    throw Response.unauthorized("Invalid agent signature");
  }

  return { body, fingerprint: signed.fingerprint };
};

export const authenticateAgent = async <S extends z.ZodType>(
  req: Request,
  schema: S,
) => {
  const signed = await readSignedRequest(req);
  let identity = identities.get(signed.fingerprint);

  if (!identity) {
    const server = await serverModel.findOne(
      { "identity.fingerprint": signed.fingerprint },
      { projection: { tenant: 1, "identity.signPublicKey": 1 } },
    );
    if (!server) throw Response.unauthorized("Unknown agent key");

    identity = {
      server: server._id,
      tenant: server.tenant,
      key: await importSignPublicKey(server.identity.signPublicKey),
    };
    identities.set(signed.fingerprint, identity);
  }

  if (!await verify(identity.key, signed.signature, signed.data)) {
    throw Response.unauthorized("Invalid agent signature");
  }

  return {
    identity,
    fingerprint: signed.fingerprint,
    body: parseBody(schema, signed.body),
  };
};
