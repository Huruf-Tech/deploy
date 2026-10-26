// @ts-types="@types/ssh2"
import { Client } from "ssh2";
import type { ObjectId } from "mongodb";
import { encodeBase64Url } from "@std/encoding/base64url";
import { Response } from "@/core/http/response.ts";
import { Env } from "@/core/utils/env.ts";
import { memoize } from "@/core/utils/cache.ts";
import { createHash, SupportedHashAlg } from "@/core/utils/hash.ts";
import { readTextSetting } from "@/lib/core/settings.ts";
import { rateLimiter } from "@/lib/services.ts";
import { safetyFlag, safetyLimit } from "@/lib/limits/safety.ts";
import { assertCanAddServers, serverLiveness } from "@/lib/agents/servers.ts";
import { isPublicAddress } from "@/lib/agents/addresses.ts";
import { bootstrapSessionModel } from "@/schemas/infrastructure/bootstrapSession.ts";

const SESSION_TTL_MS = 2 * 60 * 60_000;
const INSTALL_TIMEOUT_MS = 15 * 60_000;
const SSH_TIMEOUT_MS = 15_000;
const REMOTE_SCRIPT = "/tmp/huruf-deploy-install.sh";
const REMOTE_LOG = "/var/log/huruf-deploy-install.log";

export type TSshCredentials =
  | { password: string }
  | { privateKey: string; passphrase?: string };

/** The installer is served and uploaded from one file, so both paths always match. */
export const installerScript = memoize(
  () =>
    Deno.readTextFile(
      new URL("../../agent/packaging/install.sh", import.meta.url),
    ),
  () => "installer",
);

/** Where agents reach the control plane, and where the installer downloads binaries. */
export const agentEndpoints = async () => ({
  controlPlaneUrl: await readTextSetting(
    "AGENT_CONTROL_PLANE_URL",
    Env.getSync("BASE_URL"),
  ),
  downloadBase: await readTextSetting(
    "AGENT_DOWNLOAD_BASE",
    "https://github.com/Huruf-Tech/huruf-deploy/releases/latest/download",
  ),
});

const shellQuote = (value: string) => `'${value.replaceAll("'", `'\\''`)}'`;

/** Resolves once and connects to that IP, so DNS rebinding cannot swap the target. */
const resolveTarget = async (host: string) => {
  const literal = /^[\d.]+$/.test(host) || host.includes(":");
  const addresses = literal ? [host] : await Promise.all([
    Deno.resolveDns(host, "A").catch(() => [] as string[]),
    Deno.resolveDns(host, "AAAA").catch(() => [] as string[]),
  ]).then((all) => all.flat());

  if (!addresses.length) throw Response.badRequest(`Cannot resolve ${host}`);

  if (!await safetyFlag("SAFETY_SSH_ALLOW_PRIVATE_TARGETS")) {
    const blocked = addresses.find((ip) => !isPublicAddress(ip));
    if (blocked) {
      throw Response.badRequest(
        `${host} resolves to a private or reserved address (${blocked}). The server must be reachable on a public address.`,
      );
    }
  }
  return addresses[0];
};

const connect = (
  ip: string,
  port: number,
  username: string,
  credentials: TSshCredentials,
) =>
  new Promise<Client>((resolve, reject) => {
    const client = new Client();
    client
      .on("ready", () => resolve(client))
      .on("error", (error) => reject(error))
      .connect({
        host: ip,
        port,
        username,
        readyTimeout: SSH_TIMEOUT_MS,
        ...("password" in credentials ? { password: credentials.password } : {
          privateKey: credentials.privateKey,
          passphrase: credentials.passphrase,
        }),
      });
  });

const exec = (client: Client, command: string, stdin?: string) =>
  new Promise<{ code: number; output: string }>((resolve, reject) => {
    client.exec(command, (error, stream) => {
      if (error) return reject(error);
      let output = "";
      const collect = (
        chunk: Uint8Array,
      ) => (output = (output + new TextDecoder().decode(chunk)).slice(-2_000));
      stream.on("data", collect);
      stream.stderr.on("data", collect);
      stream.on("close", (code: number) => resolve({ code, output }));
      stream.end(stdin);
    });
  });

/**
 * A one-time join token for `tenant` (PLAN §4.3): an agent installed with it
 * activates without pairing. The SSH wizard and pool partitions (PLAN §26.5)
 * both install this way; the session records where it went.
 */
export const createJoinToken = async (opts: {
  tenant: ObjectId;
  createdBy: ObjectId;
  host: string;
  port: number;
  username: string;
}) => {
  const token = encodeBase64Url(crypto.getRandomValues(new Uint8Array(32)));
  const now = new Date();
  const { insertedId: session } = await bootstrapSessionModel.insertOne({
    ...opts,
    status: "installing",
    tokenHash: await createHash(SupportedHashAlg.SHA_256, token),
    steps: [],
    createdAt: now,
    expiresAt: new Date(now.getTime() + SESSION_TTL_MS),
  });
  return { session, token };
};

/**
 * `POST /servers/api/bootstrap` (PLAN §4.3): SSH in once, start the installer
 * detached with a one-time join token, disconnect. Credentials live only in
 * this call's memory and are never stored or logged.
 */
export const startBootstrap = async (opts: {
  tenant: ObjectId;
  user: { _id: ObjectId; emailVerified?: boolean };
  host: string;
  port: number;
  username: string;
  credentials: TSshCredentials;
}) => {
  await assertCanAddServers(opts.user);

  const limit = await safetyLimit("SAFETY_SSH_BOOTSTRAPS_PER_TENANT_PER_HOUR");
  if (!await rateLimiter.hit(`ssh:${opts.tenant}`, limit, 3_600)) {
    throw Response.forbidden(
      `At most ${limit} SSH installs per hour; try again later`,
    );
  }

  const ip = await resolveTarget(opts.host);
  const { session, token } = await createJoinToken({
    tenant: opts.tenant,
    createdBy: opts.user._id,
    host: opts.host,
    port: opts.port,
    username: opts.username,
  });

  const step = (message: string) =>
    bootstrapSessionModel.updateOne({ _id: session }, {
      $push: { steps: { at: new Date(), message } },
    });
  const fail = async (error: string) => {
    await bootstrapSessionModel.updateOne({ _id: session }, {
      $set: { status: "failed", error },
    });
    return session;
  };

  let client: Client | undefined;
  try {
    client = await connect(ip, opts.port, opts.username, opts.credentials);

    const probe = await exec(
      client,
      "uname -sm; id -u; command -v curl >/dev/null && echo curl-ok; command -v systemctl >/dev/null && echo systemd-ok",
    );
    const [system = "", uid = ""] = probe.output.split("\n");
    if (!system.startsWith("Linux")) {
      return await fail(`Unsupported system: ${system || "unknown"}`);
    }
    if (!probe.output.includes("curl-ok")) {
      return await fail("curl is required on the server");
    }
    if (!probe.output.includes("systemd-ok")) {
      return await fail("systemd is required on the server");
    }
    await step(`Connected to ${opts.host} (${system.trim()})`);

    const upload = await exec(
      client,
      `cat > ${REMOTE_SCRIPT} && chmod 0700 ${REMOTE_SCRIPT}`,
      await installerScript(),
    );
    if (upload.code !== 0) return await fail("Could not upload the installer");

    const { controlPlaneUrl, downloadBase } = await agentEndpoints();
    const args = [
      "--url",
      controlPlaneUrl,
      "--tenant",
      opts.tenant.toHexString(),
      "--join-token",
      token,
      "--download-base",
      downloadBase,
    ].map(shellQuote).join(" ");
    const run = shellQuote(
      `nohup sh ${REMOTE_SCRIPT} ${args} > ${REMOTE_LOG} 2>&1 &`,
    );

    const root = uid.trim() === "0";
    const usePassword = !root && "password" in opts.credentials;
    const launch = await exec(
      client,
      root
        ? `sh -c ${run}`
        : usePassword
        ? `sudo -S -p '' sh -c ${run}`
        : `sudo -n sh -c ${run}`,
      usePassword
        ? (opts.credentials as { password: string }).password + "\n"
        : undefined,
    );
    if (launch.code !== 0) {
      return await fail(
        root
          ? "Could not start the installer"
          : "Could not start the installer with sudo: the user needs sudo rights",
      );
    }

    await step("Installer started");
    return session;
  } catch (error) {
    const message = error instanceof Response
      ? await error.text()
      : (error as Error).message;
    return await fail(`SSH failed: ${message}`);
  } finally {
    client?.end();
  }
};

/** Progress for the wizard: installing → registered → online, or failed. */
export const bootstrapStatus = async (session: ObjectId, tenant: ObjectId) => {
  const doc = await bootstrapSessionModel.findOne(
    { _id: session, tenant },
    { projection: { tokenHash: 0 } },
  );
  if (!doc) throw Response.notFound("Unknown install session");

  const online = doc.server &&
    (await serverLiveness(tenant)).some((l) =>
      l.server === doc.server!.toString() && l.online
    );
  const timedOut = doc.status === "installing" &&
    Date.now() - doc.createdAt.getTime() > INSTALL_TIMEOUT_MS;

  return {
    status: online
      ? "online" as const
      : timedOut
      ? "failed" as const
      : doc.status,
    steps: doc.steps.map((s) => ({
      at: s.at.toISOString(),
      message: s.message,
    })),
    error: timedOut
      ? `The agent did not register within 15 minutes. Check ${REMOTE_LOG} on the server.`
      : doc.error,
    server: doc.server?.toString(),
  };
};
