import { assert, assertEquals, assertMatch } from "@std/assert";
// First: loads the server, whose bootstrap patches zod before schemas exist.
import handler from "@/serve.base.ts";
import { ObjectId } from "mongodb";
import { join } from "@std/path";
import { Env } from "@/core/utils/env.ts";
import { mongodb } from "@/database.ts";
import { keyring } from "@/lib/services.ts";
import { domainModel } from "@/schemas/applications/domain.ts";

// What Traefik polls (PLAN §14, Phase 11): routes, weighted services and
// certificate files, all from the database.

const TOKEN = "ingress-test-token-0123456789";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

Deno.test({
  name: "ingress: Traefik routes by replicas over online tunnels; cert files",
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async (t) => {
    const dir = await Deno.makeTempDir({ prefix: "huruf-certs-" });
    const config = Env.getAll<Record<string, string>>();
    config.INGRESS_CONFIG_TOKEN = TOKEN;
    config.TRAEFIK_CERTS_DIR = dir;

    const db = mongodb.db();
    const tenant = new ObjectId();
    const [a, b, offline, untunneled] = [1, 2, 3, 4].map(() => new ObjectId());
    const project = new ObjectId();
    const domain = new ObjectId();
    const hostname = `shop-${Date.now()}.example.test`;
    const issuedAt = new Date();

    const server = (_id: ObjectId, tunnelPort?: number) => ({
      _id,
      tenant,
      status: "active",
      identity: { fingerprint: String(_id) },
      ...(tunnelPort ? { tunnelPort } : {}),
    });
    try {
      await db.collection("servers").insertMany([
        server(a, 20001),
        server(b, 20002),
        server(offline, 20003),
        server(untunneled),
      ]);
      await db.collection("serverLeases").insertMany(
        [a, b, offline, untunneled].map((_id) => ({
          _id,
          tenant,
          offline: _id === offline,
        })),
      );
      await db.collection("projects").insertOne({
        _id: project,
        tenant,
        placedOn: [a, b, offline, untunneled],
        replicasPerServer: 1,
        autoscaled: [{ server: b, replicas: 3, reason: "cpu", at: new Date() }],
        runtime: { healthcheckPath: "/health" },
      });
      const certificate = async (at: Date) => ({
        pem: `CERT ${at.getTime()}`,
        keyEnc: await keyring.encrypt(
          { kind: "tenant", ref: tenant },
          `KEY ${at.getTime()}`,
          `certificate:${hostname}`,
        ),
        notAfter: new Date(Date.now() + 90 * 86_400_000),
        issuedAt: at,
      });
      await domainModel.insertOne({
        _id: domain,
        tenant,
        project,
        hostname,
        token: "t",
        status: "active",
        verifiedAt: issuedAt,
        certificate: await certificate(issuedAt),
        createdBy: new ObjectId(),
        createdAt: issuedAt,
        updatedAt: issuedAt,
      });

      const poll = async (token = TOKEN) => {
        const res = await handler(
          new Request("http://localhost/ingress/api/traefik", {
            headers: { "x-ingress-token": token },
          }),
        );
        const text = await res.text();
        return { status: res.status, json: res.ok ? JSON.parse(text) : text };
      };
      const files = async () => {
        const names: string[] = [];
        for await (const e of Deno.readDir(dir)) names.push(e.name);
        return names.sort();
      };

      await t.step("a wrong token gets nothing", async () => {
        assertEquals((await poll("nope")).status, 401);
        assertEquals((await poll("")).status, 401);
      });

      await t.step("weighted by replicas, online tunnels only", async () => {
        const { status, json } = await poll();
        assertEquals(status, 200);
        const { routers, services, middlewares } = json.http;
        assertEquals(routers[`d-${domain}`], {
          rule: `Host(\`${hostname}\`)`,
          entryPoints: ["websecure"],
          service: `p-${project}`,
          middlewares: [`p-${project}`, "huruf-retry"],
          tls: {},
        });
        assertEquals(services[`p-${project}`].weighted.services, [
          { name: `p-${project}-s-${a}`, weight: 1 },
          { name: `p-${project}-s-${b}`, weight: 3 },
        ]);
        const lb = services[`p-${project}-s-${b}`].loadBalancer;
        assertEquals(lb.servers, [{ url: "http://127.0.0.1:20002" }]);
        assertEquals(lb.healthCheck.path, "/health");
        assertEquals(lb.healthCheck.headers, {
          "X-Huruf-Project": String(project),
        });
        assertEquals(
          middlewares[`p-${project}`].headers.customRequestHeaders,
          { "X-Huruf-Project": String(project) },
        );
      });

      await t.step("the certificate is written for Traefik", async () => {
        const base = `${domain}-${issuedAt.getTime()}`;
        assertEquals(await files(), [
          `${base}.crt`,
          `${base}.key`,
          "certificates.yml",
        ]);
        assertEquals(
          await Deno.readTextFile(join(dir, `${base}.key`)),
          `KEY ${issuedAt.getTime()}`,
        );
        assertMatch(
          await Deno.readTextFile(join(dir, "certificates.yml")),
          new RegExp(`${base}\\.crt`),
        );
      });

      await t.step("a renewal swaps the files", async () => {
        const renewed = new Date(issuedAt.getTime() + 1_000);
        await domainModel.updateOne({ _id: domain }, {
          $set: { certificate: await certificate(renewed) },
        });
        await poll();
        const base = `${domain}-${renewed.getTime()}`;
        assertEquals(await files(), [
          `${base}.crt`,
          `${base}.key`,
          "certificates.yml",
        ]);
      });

      await t.step("an expired certificate: no route, no files", async () => {
        await domainModel.updateOne({ _id: domain }, {
          $set: { "certificate.notAfter": new Date(Date.now() - 1_000) },
        });
        await sleep(2_100); // the config is shared for 2 s
        const { json } = await poll();
        assert(!json.http.routers[`d-${domain}`]);
        assertEquals(await files(), ["certificates.yml"]);
      });
    } finally {
      await Promise.all([
        domainModel.deleteMany({ tenant }),
        db.collection("projects").deleteMany({ tenant }),
        db.collection("servers").deleteMany({ tenant }),
        db.collection("serverLeases").deleteMany({ tenant }),
      ]);
      config.TRAEFIK_CERTS_DIR = "";
      await Deno.remove(dir, { recursive: true });
    }
  },
});

Deno.test({
  name: "ingress: tunnels log in with their own token and port only",
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async (t) => {
    const { ensureTunnelPort, ingressSpecFor, tunnelToken, TUNNEL_PORTS } =
      await import("@/lib/domains/tunnels.ts");
    const ca = await Deno.makeTempFile({ suffix: ".pem" });
    await Deno.writeTextFile(ca, "-----BEGIN CERTIFICATE-----\nX\n");
    const config = Env.getAll<Record<string, string>>();
    config.INGRESS_CONFIG_TOKEN = TOKEN;
    config.INGRESS_TUNNEL_ADDRS = "203.0.113.10:7000, 203.0.113.11:7000";
    config.INGRESS_TUNNEL_CA_FILE = ca;

    const db = mongodb.db();
    const tenant = new ObjectId();
    const [active, pending] = [new ObjectId(), new ObjectId()];
    await db.collection("servers").insertMany([
      {
        _id: active,
        tenant,
        status: "active",
        identity: { fingerprint: String(active) },
      },
      {
        _id: pending,
        tenant,
        status: "pending",
        identity: { fingerprint: String(pending) },
      },
    ]);
    const frp = async (op: string, content: object) => {
      const res = await handler(
        new Request("http://localhost/ingress/api/frp?version=0.1.0&op=" + op, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ version: "0.1.0", op, content }),
        }),
      );
      assertEquals(res.status, 200);
      return await res.json();
    };

    try {
      let port = 0;
      await t.step("an active server gets a tunnel in its spec", async () => {
        const server =
          (await db.collection("servers").findOne({ _id: active }))!;
        // deno-lint-ignore no-explicit-any
        const { ingress } = await ingressSpecFor(server as any);
        assert(ingress);
        port = ingress.tunnelPort;
        assert(port >= TUNNEL_PORTS.min && port <= TUNNEL_PORTS.max);
        assertEquals(ingress.servers, [
          "203.0.113.10:7000",
          "203.0.113.11:7000",
        ]);
        assertEquals(ingress.user, String(active));
        assertEquals(ingress.token, await tunnelToken(active));
        assertMatch(ingress.ca, /BEGIN CERTIFICATE/);
        // deno-lint-ignore no-explicit-any
        assertEquals(await ensureTunnelPort(server as any), port, "kept");
        const other =
          (await db.collection("servers").findOne({ _id: pending }))!;
        // deno-lint-ignore no-explicit-any
        assertEquals(await ingressSpecFor(other as any), {});
      });

      await t.step("frps: login and proxy checks", async () => {
        const token = (await tunnelToken(active))!;
        const user = String(active);
        assertEquals(await frp("Login", { user, metas: { token } }), {
          reject: false,
          unchange: true,
        });
        for (
          const bad of [
            { user, metas: { token: "wrong" } },
            { user, metas: {} },
            { user: "not-an-id", metas: { token } },
            {
              user: String(pending),
              metas: { token: await tunnelToken(pending) },
            },
          ]
        ) {
          assertEquals(
            (await frp("Login", bad)).reject,
            true,
            JSON.stringify(bad),
          );
        }
        const proxy = (remote_port: number, proxy_type = "tcp") =>
          frp("NewProxy", {
            user: { user, metas: { token } },
            proxy_name: `${user}.ingress`,
            proxy_type,
            remote_port,
          });
        assertEquals((await proxy(port)).reject, false);
        assertEquals((await proxy(port + 1)).reject, true, "another port");
        assertEquals((await proxy(port, "http")).reject, true, "not tcp");
        assertEquals(
          (await frp("Ping", { user, metas: { token } })).reject,
          true,
        );
      });
    } finally {
      await db.collection("servers").deleteMany({ tenant });
      config.INGRESS_TUNNEL_ADDRS = "";
      await Deno.remove(ca);
    }
  },
});
