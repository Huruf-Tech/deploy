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

    try {
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
