import { ObjectId, type WithId } from "mongodb";
import { encodeHex } from "@std/encoding/hex";
import { cache } from "@/core/utils/cache.ts";
import { isDuplicateKeyError } from "@/database.ts";
import { readTextSetting } from "@/lib/core/settings.ts";
import { serverModel, type TServer } from "@/schemas/infrastructure/server.ts";
import type { TDesiredSpec } from "@/schemas/protocol/agent.ts";

/**
 * Reverse tunnels (PLAN §14): each server's agent runs frpc to every control
 * plane instance's frps, so Traefik reaches servers anywhere without a port
 * opened on them. frps asks `frpDecision` before accepting a login or a proxy.
 */
export const TUNNEL_PORTS = { min: 20_000, max: 39_999 };
/** The SAN in frps' certificate (made at setup, PLAN §14). */
export const TUNNEL_SERVER_NAME = "huruf-tunnel";
export const FRPC_IMAGE = "fatedier/frpc:v0.65.0";

const hmacKey = cache(async (secret: string) =>
  await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  ), 60_000);

/** A server's tunnel login: derived, so there's nothing to store or leak per server. */
export async function tunnelToken(server: ObjectId) {
  const secret = await readTextSetting("INGRESS_CONFIG_TOKEN", "");
  if (!secret) return undefined;
  const signature = await crypto.subtle.sign(
    "HMAC",
    await hmacKey(secret),
    new TextEncoder().encode(`tunnel:${server}`),
  );
  return encodeHex(new Uint8Array(signature));
}

/** The server's tunnel port, unique across the platform, allocated once. */
export async function ensureTunnelPort(server: WithId<TServer>) {
  if (server.tunnelPort) return server.tunnelPort;
  const span = TUNNEL_PORTS.max - TUNNEL_PORTS.min + 1;
  for (let attempt = 0; attempt < 20; attempt++) {
    const port = TUNNEL_PORTS.min + Math.floor(Math.random() * span);
    try {
      await serverModel.updateOne(
        { _id: server._id, tunnelPort: { $exists: false } },
        { $set: { tunnelPort: port } },
      );
    } catch (error) {
      if (isDuplicateKeyError(error)) continue; // taken: try another
      throw error;
    }
    const doc = await serverModel.findOne({ _id: server._id }, {
      projection: { tunnelPort: 1 },
    });
    if (doc?.tunnelPort) return doc.tunnelPort;
  }
  throw new Error("No free tunnel port");
}

const readCa = cache(async (path: string) => {
  try {
    return (await Deno.readTextFile(path)).trim();
  } catch {
    return "";
  }
}, 60_000);

/** The spec's `ingress`: absent until the platform's tunnels are configured. */
export async function ingressSpecFor(
  server: WithId<TServer>,
): Promise<Pick<TDesiredSpec, "ingress">> {
  if (server.status !== "active") return {};
  const servers = (await readTextSetting("INGRESS_TUNNEL_ADDRS", ""))
    .split(",").map((s) => s.trim()).filter(Boolean);
  const caFile = await readTextSetting("INGRESS_TUNNEL_CA_FILE", "");
  const [token, ca] = await Promise.all([
    tunnelToken(server._id),
    caFile ? readCa(caFile) : "",
  ]);
  if (!servers.length || !token || !ca) return {};
  return {
    ingress: {
      user: server._id.toHexString(),
      token,
      tunnelPort: await ensureTunnelPort(server),
      servers,
      ca,
      serverName: TUNNEL_SERVER_NAME,
      image: FRPC_IMAGE,
    },
  };
}

type TFrpRequest = {
  op?: string;
  content?: {
    user?: string | { user?: string; metas?: Record<string, string> };
    metas?: Record<string, string>;
    proxy_type?: string;
    remote_port?: number;
  };
};

/**
 * frps' server plugin (Login, NewProxy): only an active server with its own
 * token logs in, and it may open one TCP proxy, on its own tunnel port.
 */
export async function frpDecision(body: TFrpRequest) {
  const reject = (reason: string) => ({ reject: true, reject_reason: reason });
  const content = body.content ?? {};
  const login = typeof content.user === "object" ? content.user : content;
  const user = typeof login.user === "string" ? login.user : undefined;
  const token = login.metas?.token;
  if (!user || !ObjectId.isValid(user) || !token) {
    return reject("unknown server");
  }

  const id = new ObjectId(user);
  const server = await serverModel.findOne({ _id: id, status: "active" }, {
    projection: { tunnelPort: 1 },
  });
  if (!server || token !== await tunnelToken(id)) {
    return reject("unknown server");
  }
  if (body.op === "NewProxy") {
    if (
      content.proxy_type !== "tcp" || !server.tunnelPort ||
      content.remote_port !== server.tunnelPort
    ) {
      return reject("only this server's tunnel port");
    }
  } else if (body.op !== "Login") {
    return reject("unsupported operation");
  }
  return { reject: false, unchange: true };
}
