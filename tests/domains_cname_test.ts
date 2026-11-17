import { assertEquals } from "@std/assert";
// First: loads the server, whose bootstrap patches zod before schemas exist.
import { testSession } from "./_session.ts";
import { ObjectId } from "mongodb";
import { Env } from "@/core/utils/env.ts";
import { mongodb } from "@/database.ts";
import { resolver } from "@/lib/domains/dns.ts";
import { checkDue } from "@/lib/domains/domains.ts";
import { domainModel } from "@/schemas/applications/domain.ts";

// A platform on Huruf Deploy (a storefront) adding its customers' domains
// through the API (PLAN §14): a CNAME at its own verified name proves them.

Deno.test({
  name: "domains: a CNAME at the workspace's verified name proves ownership",
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async (t) => {
    const config = Env.getAll<Record<string, string>>();
    config.INGRESS_HOSTNAME = "ingress.platform.test";
    config.INGRESS_IPV4 = "203.0.113.10";

    const dns = {
      txt: {} as Record<string, string[]>,
      a: {} as Record<string, string[]>,
      cname: {} as Record<string, string[]>,
    };
    const real = { ...resolver };
    resolver.txt = (name) => Promise.resolve(dns.txt[name] ?? []);
    resolver.a = (name) => Promise.resolve(dns.a[name] ?? []);
    resolver.cname = (name) => Promise.resolve(dns.cname[name] ?? []);

    const a = await testSession("cname-a");
    const b = await testSession("cname-b");
    // The admin lets `a` add more domains than its plan's 3.
    config.DOMAIN_LIMITS = `other=1, ${a.tenantId}=10`;
    const stamp = Date.now();
    const brand = `brand-${stamp}.test`;
    const projectOf = async (tenant: ObjectId) => {
      const _id = new ObjectId();
      await mongodb.db().collection("projects").insertOne({
        _id,
        tenant,
        name: "store",
        slug: `store-${_id}`,
        placedOn: [],
      });
      return String(_id);
    };
    const pa = await projectOf(a.tenantId);
    const pb = await projectOf(b.tenantId);
    // The storefront's own zone, verified earlier.
    await domainModel.insertOne({
      tenant: a.tenantId,
      project: new ObjectId(pa),
      hostname: brand,
      token: "t",
      status: "active",
      verifiedAt: new Date(),
      createdBy: a.user,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const target = `ingress.${brand}`;
    const pointed = (hostname: string) => {
      dns.cname[hostname] = [`${target}.`];
      dns.a[hostname] = ["203.0.113.10"];
    };
    const statusOf = async (id: string) =>
      (await domainModel.findOne({ _id: new ObjectId(id) }))!;

    try {
      // The storefront's backend: an API key allowed domains only.
      const secret = `sk-store-${stamp}`;
      const created = await a.call("POST", "/apiKeys/api", {
        name: "storefront",
        secret,
        scopes: ["domainApi"],
        resourceGrant: { [a.tenant]: ["domainApi"] },
      });
      assertEquals(created.status, 200, JSON.stringify(created.json));
      const api = (method: string, path: string, body?: unknown) =>
        a.call(method, path, body, { "x-api-key": secret, cookie: "" });

      let customer = "";
      await t.step("pointed at the storefront: verified, no TXT", async () => {
        const host = `shop-${stamp}.example.test`;
        pointed(host);
        const res = await api("POST", "/domains/api", {
          project: pa,
          hostname: host,
        });
        assertEquals(res.status, 200, JSON.stringify(res.json));
        customer = res.json._id;
        // Records already in place: verified as it's added.
        assertEquals((await statusOf(customer)).status, "issuing");
      });

      await t.step("added first, pointed later: Check now", async () => {
        const host = `late-${stamp}.example.test`;
        const res = await api("POST", "/domains/api", {
          project: pa,
          hostname: host,
        });
        const id = res.json._id;
        assertEquals((await statusOf(id)).status, "pending");
        await api("POST", `/domains/api/${id}/check`, {});
        const before = await statusOf(id);
        assertEquals(before.status, "checking");
        assertEquals(
          before.checks?.detail?.includes("CNAME at a domain you've verified"),
          true,
          before.checks?.detail,
        );
        pointed(host);
        await domainModel.updateOne({ _id: before._id }, {
          $set: { nextCheckAt: new Date(0) },
        });
        await checkDue();
        assertEquals((await statusOf(id)).status, "issuing");
      });

      await t.step(
        "another account can't use the storefront's name",
        async () => {
          const host = `other-${stamp}.example.test`;
          pointed(host);
          const res = await b.call("POST", "/domains/api", {
            project: pb,
            hostname: host,
          });
          assertEquals(res.status, 200, JSON.stringify(res.json));
          assertEquals((await statusOf(res.json._id)).status, "pending");
          await b.call("POST", `/domains/api/${res.json._id}/check`, {});
          const after = await statusOf(res.json._id);
          assertEquals(after.status, "checking");
          assertEquals(after.checks?.ownership, false);
        },
      );

      await t.step("the admin's limit replaces the plan's", async () => {
        // 3 so far (the brand was inserted directly): up to 10.
        for (let i = 0; i < 8; i++) {
          const res = await api("POST", "/domains/api", {
            project: pa,
            hostname: `more-${i}-${stamp}.example.test`,
          });
          assertEquals(res.status, i < 8 ? 200 : 403, `domain ${i}`);
        }
        const over = await api("POST", "/domains/api", {
          project: pa,
          hostname: `over-${stamp}.example.test`,
        });
        assertEquals(over.status, 403, JSON.stringify(over.json));
        // `b` keeps its plan's 3.
        for (let i = 0; i < 2; i++) {
          await b.call("POST", "/domains/api", {
            project: pb,
            hostname: `b-${i}-${stamp}.example.test`,
          });
        }
        const bOver = await b.call("POST", "/domains/api", {
          project: pb,
          hostname: `b-over-${stamp}.example.test`,
        });
        assertEquals(bOver.status, 403);
      });
    } finally {
      Object.assign(resolver, real);
      delete config.DOMAIN_LIMITS;
      await domainModel.deleteMany({
        tenant: { $in: [a.tenantId, b.tenantId] },
      });
      await mongodb.db().collection("projects").deleteMany({
        _id: { $in: [new ObjectId(pa), new ObjectId(pb)] },
      });
      await mongodb.db().collection("apiKeys").deleteMany({
        createdBy: a.user,
      });
      await a.cleanup();
      await b.cleanup();
    }
  },
});
