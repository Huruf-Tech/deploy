import { assert, assertEquals, assertMatch } from "@std/assert";
// First: loads the server, whose bootstrap patches zod before schemas exist.
import "@/serve.base.ts";
import { ObjectId } from "mongodb";
import { Env } from "@/core/utils/env.ts";
import { mongodb } from "@/database.ts";
import { resolver } from "@/lib/domains/dns.ts";
import { reachProbe } from "@/lib/domains/reach.ts";
import { traefikPoll } from "@/lib/domains/ingress.ts";
import { testSession } from "./_session.ts";

// The reachability map (PLAN §14): each hop a visitor's request takes, and
// which one stops it, from what each probe answers.

Deno.test({
  name: "reach: names the hop that stops a visitor",
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async (t) => {
    const config = Env.getAll<Record<string, string>>();
    // Settings are cached a minute: on from the start.
    config.INGRESS_IPV4 = "203.0.113.10";
    config.INGRESS_TUNNEL_HOST = "tunnel.test";

    const session = await testSession("reach");
    const tenant = session.tenantId;
    const db = mongodb.db();
    const [s1, s2, s3, s4, s5] = [1, 2, 3, 4, 5].map(() => new ObjectId());
    const [p1, p2] = [new ObjectId(), new ObjectId()];
    const stamp = Date.now();
    const good = `good-${stamp}.example.test`;
    const astray = `astray-${stamp}.example.test`;
    const waiting = `waiting-${stamp}.example.test`;
    const other = `other-${stamp}.example.test`;

    const realResolver = { ...resolver };
    resolver.a = (name) =>
      Promise.resolve(
        name === astray
          ? ["198.51.100.1"]
          : name.endsWith(".example.test")
          ? ["203.0.113.10"]
          : [],
      );
    const realFetch = reachProbe.fetch;
    const asked: string[] = [];
    reachProbe.fetch = (url) => {
      asked.push(url);
      if (url.includes(":21001/")) {
        return Promise.resolve(new Response("ok", { status: 200 }));
      }
      if (url.includes(":21002/")) {
        return Promise.resolve(
          new Response("No healthy replicas", { status: 503 }),
        );
      }
      if (url.includes(":21004/")) {
        return Promise.reject(
          new TypeError("Connection refused (os error 111)"),
        );
      }
      if (url.includes(":21005/")) {
        return Promise.resolve(
          new Response("Unknown project", { status: 404 }),
        );
      }
      if (url.startsWith("https://")) {
        return Promise.resolve(new Response("hi", { status: 200 }));
      }
      return Promise.reject(new Error(`unexpected ${url}`));
    };

    const server = (_id: ObjectId, tunnelPort?: number, publicIp?: string) => ({
      _id,
      tenant,
      name: `srv-${String(_id).slice(-4)}`,
      status: "active",
      identity: { fingerprint: String(_id) },
      inventory: publicIp ? { publicIp } : {},
      ...(tunnelPort ? { tunnelPort } : {}),
    });
    const notAfter = new Date(stamp + 30 * 86_400_000);
    const domain = (
      project: ObjectId,
      hostname: string,
      certified: boolean,
    ) => ({
      _id: new ObjectId(),
      tenant,
      project,
      hostname,
      token: "t",
      status: certified ? "active" : "pending",
      ...(certified
        ? {
          verifiedAt: new Date(),
          certificate: {
            pem: "C",
            keyEnc: "K",
            issuedAt: new Date(),
            notAfter,
          },
        }
        : {}),
      createdBy: new ObjectId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    try {
      await db.collection("servers").insertMany([
        server(s1, 21001),
        server(s2, 21002),
        server(s3, 21003),
        // A private address its agent reported: never probed.
        server(s4, 21004, "10.0.0.1"),
        server(s5, 21005),
      ]);
      await db.collection("serverLeases").insertMany(
        [s1, s2, s3, s4, s5].map((_id) => ({
          _id,
          tenant,
          offline: _id === s3,
        })),
      );
      await db.collection("projects").insertMany([
        {
          _id: p1,
          tenant,
          name: "shop",
          slug: `shop-${p1}`,
          placedOn: [s1, s2, s3],
          replicasPerServer: 1,
          runtime: { healthcheckPath: "/health" },
        },
        {
          _id: p2,
          tenant,
          name: "api",
          slug: `api-${p2}`,
          placedOn: [s4, s5],
          replicasPerServer: 1,
          publicPort: 8080,
          runtime: {},
        },
      ]);
      await db.collection("domains").insertMany([
        domain(p1, good, true),
        domain(p1, astray, true),
        domain(p1, waiting, false),
        domain(p2, other, true),
      ]);

      await t.step("every hop of a domain, and of each server", async () => {
        traefikPoll.at = Date.now();
        const { status, json } = await session.call(
          "GET",
          `/projects/api/${p1}/reach`,
        );
        assertEquals(status, 200, JSON.stringify(json));
        assertEquals(json.ingress.traefik.state, "ok");
        assertEquals(json.healthcheckPath, "/health");

        const by = (hostname: string) =>
          json.domains.find((d: { hostname: string }) =>
            d.hostname === hostname
          );
        const states = (d: Record<string, { state: string }>) =>
          ["dns", "certificate", "route", "https"].map((k) => d[k].state);
        assertEquals(states(by(good)), ["ok", "ok", "ok", "ok"]);
        assertEquals(states(by(astray)), ["failed", "ok", "ok", "skipped"]);
        assertMatch(by(astray).dns.detail, /points to 198\.51\.100\.1/);
        assertEquals(states(by(waiting)), [
          "ok",
          "failed",
          "skipped",
          "skipped",
        ]);

        const srv = (id: ObjectId) =>
          json.servers.find((s: { _id: string }) => s._id === String(id));
        const hops = (s: Record<string, { state: string }>) =>
          ["route", "tunnel", "edge", "app"].map((k) => s[k].state);
        assertEquals(hops(srv(s1)), ["ok", "ok", "ok", "ok"]);
        assertEquals(hops(srv(s2)), ["ok", "ok", "ok", "failed"]);
        assertMatch(srv(s2).app.detail, /No healthy replicas/);
        assertEquals(hops(srv(s3)), [
          "skipped",
          "failed",
          "skipped",
          "skipped",
        ]);
        assertMatch(srv(s3).tunnel.detail, /offline/);
        // The check is Traefik's: the health path, the project's header.
        assert(asked.includes("http://tunnel.test:21001/health"), asked.join());
      });

      await t.step(
        "a dead tunnel, a missing edge route, Traefik silent",
        async () => {
          traefikPoll.at = undefined;
          const { status, json } = await session.call(
            "GET",
            `/projects/api/${p2}/reach`,
          );
          assertEquals(status, 200, JSON.stringify(json));
          assertEquals(json.ingress.traefik.state, "failed");
          const [four, five] = [s4, s5].map((id) =>
            json.servers.find((s: { _id: string }) => s._id === String(id))
          );
          assertEquals(four.tunnel.state, "failed");
          assertMatch(four.tunnel.detail, /tunnel isn't connected/);
          assertEquals([five.tunnel.state, five.edge.state], ["ok", "failed"]);
          assertMatch(five.edge.detail, /no route for this project/);
          // The public port: a private address is never asked.
          assertEquals(four.publicPort.state, "failed");
          assert(!asked.some((u) => u.includes("10.0.0.1")), asked.join());
        },
      );
    } finally {
      Object.assign(resolver, realResolver);
      reachProbe.fetch = realFetch;
      traefikPoll.at = undefined;
      delete config.INGRESS_IPV4;
      delete config.INGRESS_TUNNEL_HOST;
      await db.collection("domains").deleteMany({ tenant });
      await db.collection("projects").deleteMany({ tenant });
      await db.collection("serverLeases").deleteMany({ tenant });
      await db.collection("servers").deleteMany({ tenant });
      await session.cleanup();
    }
  },
});
