import { assert, assertEquals, assertMatch } from "@std/assert";
// First: loads the server, whose bootstrap patches zod before schemas exist.
import { testSession } from "./_session.ts";
import { ObjectId } from "mongodb";
import { Env } from "@/core/utils/env.ts";
import { mongodb } from "@/database.ts";
import { resolver } from "@/lib/domains/dns.ts";
import { CHECK_WINDOW_MS, checkDue } from "@/lib/domains/domains.ts";
import { domainModel } from "@/schemas/applications/domain.ts";

// Custom domains (PLAN §14, Phase 11): add, DNS records, Check now, rechecks.

Deno.test({
  name: "domains: ownership and DNS checks, one tenant per hostname, quota",
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async (t) => {
    // `.env` wins over the `envs` collection, so set it on the loaded config.
    const config = Env.getAll<Record<string, string>>();
    config.INGRESS_HOSTNAME = "ingress.platform.test";
    config.INGRESS_IPV4 = "203.0.113.10";

    const dns = {
      txt: {} as Record<string, string[]>,
      a: {} as Record<string, string[]>,
    };
    const real = { ...resolver };
    resolver.txt = (name) => Promise.resolve(dns.txt[name] ?? []);
    resolver.a = (name) => Promise.resolve(dns.a[name] ?? []);
    dns.a["ingress.platform.test"] = ["203.0.113.11"];

    const a = await testSession("domains-a");
    const b = await testSession("domains-b");
    const projectOf = async (tenant: ObjectId) => {
      const _id = new ObjectId();
      await mongodb.db().collection("projects").insertOne({
        _id,
        tenant,
        name: "web",
        slug: `web-${_id}`,
        placedOn: [],
      });
      return _id.toString();
    };
    const pa = await projectOf(a.tenantId);
    const pb = await projectOf(b.tenantId);
    const host = `app-${Date.now()}.example.test`;
    const get = async (call: typeof a.call, project: string) =>
      (await call("GET", `/domains/api?project=${project}`)).json;
    let id = "";

    try {
      await t.step("bad and platform names are refused", async () => {
        for (
          const hostname of [
            "localhost",
            "*.example.test",
            "1.2.3.4",
            "a..b.test",
            "app.ingress.platform.test",
          ]
        ) {
          const res = await a.call("POST", "/domains/api", {
            project: pa,
            hostname,
          });
          assertEquals(res.status, 400, hostname);
        }
        const other = await a.call("POST", "/domains/api", {
          project: pb,
          hostname: host,
        });
        assertEquals(other.status, 404, "another tenant's project");
      });

      await t.step("added: pending, with the records to create", async () => {
        const res = await a.call("POST", "/domains/api", {
          project: pa,
          hostname: `${host.toUpperCase()}.`,
        });
        assertEquals(res.status, 200, JSON.stringify(res.json));
        id = res.json._id;
        const [d] = await get(a.call, pa);
        assertEquals(d.hostname, host);
        assertEquals(d.status, "pending");
        assertEquals(d.records.ownership.name, `_huruf.${host}`);
        assertMatch(d.records.ownership.value, /^huruf-verify=[0-9a-f]{32}$/);
        assertEquals(d.records.cname, "ingress.platform.test");
        assertEquals(d.records.ipv4, ["203.0.113.10"]);
        assert(!("token" in d));
        const again = await a.call("POST", "/domains/api", {
          project: pa,
          hostname: host,
        });
        assertEquals(again.status, 400);
      });

      await t.step("Check now explains each missing record", async () => {
        assertEquals(
          (await a.call("POST", `/domains/api/${id}/check`)).status,
          200,
        );
        let [d] = await get(a.call, pa);
        assertEquals(d.status, "checking");
        assertEquals(d.checks.ownership, false);
        assertMatch(d.checks.detail, /Add a TXT record/);
        assertMatch(d.checks.detail, /doesn't resolve/);

        dns.a[host] = ["104.16.1.1"];
        await checkDue(new Date(Date.now() + 61_000));
        [d] = await get(a.call, pa);
        assertEquals(d.status, "checking");
        assertMatch(d.checks.detail, /Cloudflare/);
      });

      await t.step("both records pass: verified, then issuing", async () => {
        const [listed] = await get(a.call, pa);
        dns.txt[`_huruf.${host}`] = [listed.records.ownership.value];
        dns.a[host] = ["203.0.113.11"]; // via the CNAME target's address
        await checkDue(new Date(Date.now() + 130_000));
        const [d] = await get(a.call, pa);
        assertEquals(d.status, "issuing", JSON.stringify(d));
        assert(d.verifiedAt);
        assertEquals(d.checks.detail, undefined);
        const recheck = await a.call("POST", `/domains/api/${id}/check`);
        assertEquals(recheck.status, 400);
      });

      await t.step("another tenant can't take a verified name", async () => {
        const res = await b.call("POST", "/domains/api", {
          project: pb,
          hostname: host,
        });
        assertEquals(res.status, 400);
        assertMatch(String(res.json), /another account/);
      });

      await t.step("a check window that runs out fails", async () => {
        const res = await a.call("POST", "/domains/api", {
          project: pa,
          hostname: `late.${host}`,
        });
        await a.call("POST", `/domains/api/${res.json._id}/check`);
        await checkDue(new Date(Date.now() + CHECK_WINDOW_MS + 1_000));
        const d = (await get(a.call, pa)).find((x: { _id: string }) =>
          x._id === res.json._id
        );
        assertEquals(d.status, "failed");
        assertMatch(d.error, /Add a TXT record/);
      });

      await t.step("free plan: 3 domains; removing frees one", async () => {
        const third = await a.call("POST", "/domains/api", {
          project: pa,
          hostname: `third.${host}`,
        });
        assertEquals(third.status, 200);
        const fourth = await a.call("POST", "/domains/api", {
          project: pa,
          hostname: `fourth.${host}`,
        });
        assertEquals(fourth.status, 403);
        assertEquals(
          (await a.call("DELETE", `/domains/api/${third.json._id}`)).status,
          200,
        );
        const retry = await a.call("POST", "/domains/api", {
          project: pa,
          hostname: `fourth.${host}`,
        });
        assertEquals(retry.status, 200);
      });
    } finally {
      Object.assign(resolver, real);
      await domainModel.deleteMany({
        tenant: { $in: [a.tenantId, b.tenantId] },
      });
      await mongodb.db().collection("projects").deleteMany({
        tenant: { $in: [a.tenantId, b.tenantId] },
      });
      await a.cleanup();
      await b.cleanup();
    }
  },
});
