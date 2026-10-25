import { ObjectId, type WithId } from "mongodb";
import { encodeHex } from "@std/encoding/hex";
import { join } from "@std/path";
import * as x509 from "@peculiar/x509";
import { cache } from "@/core/utils/cache.ts";
import { isDuplicateKeyError } from "@/database.ts";
import { keyring } from "@/lib/services.ts";
import { readTextSetting } from "@/lib/core/settings.ts";
import { tunnelCertModel } from "@/schemas/applications/domain.ts";
import { PLATFORM_OWNER } from "@/schemas/monitoring/alert.ts";
import { serverModel, type TServer } from "@/schemas/infrastructure/server.ts";
import type { TDesiredSpec } from "@/schemas/protocol/agent.ts";

/**
 * Reverse tunnels (PLAN §14): each server's agent runs frpc to every control
 * plane instance's frps, so Traefik reaches servers anywhere without a port
 * opened on them. frps asks `frpDecision` before accepting a login or a proxy.
 */
export const TUNNEL_PORTS = { min: 20_000, max: 39_999 };
/** The name in frps' certificate, which agents check. */
export const TUNNEL_SERVER_NAME = "huruf-tunnel";
/** What frps listens on for agents; publish it on every instance. */
export const FRPS_PORT = 7000;
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

const PLATFORM = { kind: "tenant" as const, ref: PLATFORM_OWNER };
const CERT_ID = "frps";

/**
 * frps' self-signed certificate, made once and shared by every instance
 * (its key sealed), so agents check every instance against the same one.
 */
export const tunnelCert = cache(async (): Promise<string> => {
  const found = await tunnelCertModel.findOne({ _id: CERT_ID });
  if (found) return found.cert;

  const alg = { name: "ECDSA", namedCurve: "P-256", hash: "SHA-256" };
  const keys = await crypto.subtle.generateKey(alg, true, ["sign", "verify"]);
  x509.cryptoProvider.set(crypto);
  const cert = await x509.X509CertificateGenerator.createSelfSigned({
    serialNumber: encodeHex(crypto.getRandomValues(new Uint8Array(8))),
    name: `CN=${TUNNEL_SERVER_NAME}`,
    notBefore: new Date(Date.now() - 60_000),
    notAfter: new Date(Date.now() + 20 * 365 * 86_400_000),
    keys,
    signingAlgorithm: alg,
    extensions: [
      new x509.BasicConstraintsExtension(true, undefined, true),
      new x509.SubjectAlternativeNameExtension([{
        type: "dns",
        value: TUNNEL_SERVER_NAME,
      }]),
    ],
  });
  const key = x509.PemConverter.encode(
    await crypto.subtle.exportKey("pkcs8", keys.privateKey),
    "PRIVATE KEY",
  );
  try {
    await tunnelCertModel.insertOne({
      _id: CERT_ID,
      cert: cert.toString("pem"),
      keyEnc: await keyring.encrypt(PLATFORM, key, `tunnel:${CERT_ID}`),
      createdAt: new Date(),
    });
    return cert.toString("pem");
  } catch (error) {
    if (!isDuplicateKeyError(error)) throw error;
    return (await tunnelCertModel.findOne({ _id: CERT_ID }))!.cert;
  }
}, 60_000);

const writeIfChanged = async (path: string, text: string, mode = 0o644) => {
  const current = await Deno.readTextFile(path).catch(() => undefined);
  if (current !== text) await Deno.writeTextFile(path, text, { mode });
};

/**
 * frps' files, written by this instance into `FRPS_DIR` (shared with its
 * frps, which runs from that directory): config, certificate and key. frps
 * restarts until they exist.
 */
export async function syncFrps() {
  const dir = await readTextSetting("FRPS_DIR", "");
  if (!dir) return;
  await tunnelCert();
  const doc = (await tunnelCertModel.findOne({ _id: CERT_ID }))!;
  const plugin = new URL(
    await readTextSetting("INGRESS_PLATFORM_URL", "http://web:8000"),
  ).host;
  await Deno.mkdir(dir, { recursive: true });
  await writeIfChanged(join(dir, "frps.crt"), doc.cert);
  await writeIfChanged(
    join(dir, "frps.key"),
    await keyring.decrypt(PLATFORM, doc.keyEnc, `tunnel:${CERT_ID}`),
    0o600,
  );
  await writeIfChanged(
    join(dir, "frps.toml"),
    `bindPort = ${FRPS_PORT}
allowPorts = [{ start = ${TUNNEL_PORTS.min}, end = ${TUNNEL_PORTS.max} }]
transport.tls.force = true
transport.tls.certFile = "frps.crt"
transport.tls.keyFile = "frps.key"

[[httpPlugins]]
name = "huruf"
addr = "${plugin}"
path = "/ingress/api/frp"
ops = ["Login", "NewProxy"]
`,
  );
}

/** The spec's `ingress`: absent until the platform's tunnels are configured. */
export async function ingressSpecFor(
  server: WithId<TServer>,
): Promise<Pick<TDesiredSpec, "ingress">> {
  if (server.status !== "active") return {};
  const servers = (await readTextSetting("INGRESS_TUNNEL_ADDRS", ""))
    .split(",").map((s) => s.trim()).filter(Boolean);
  const token = await tunnelToken(server._id);
  if (!servers.length || !token) return {};
  return {
    ingress: {
      user: server._id.toHexString(),
      token,
      tunnelPort: await ensureTunnelPort(server),
      servers,
      ca: await tunnelCert(),
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
