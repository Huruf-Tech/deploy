import { assertEquals } from "@std/assert";
// First: loads the server, whose bootstrap patches zod before schemas exist.
import { testSession } from "./_session.ts";
import { ObjectId } from "mongodb";
import { Env } from "@/core/utils/env.ts";
import { mongodb } from "@/database.ts";
import { ownershipName, probeName, resolver } from "@/lib/domains/dns.ts";
import { checkDue } from "@/lib/domains/domains.ts";
import { healthHost, hostRule } from "@/lib/domains/ingress.ts";
import {
  cloudflareConnectionModel,
  domainModel,
} from "@/schemas/applications/domain.ts";

// Wildcard custom domains (PLAN §14): `*.example.com`, DNS on Cloudflare.

Deno.test({
  name: "domains: a wildcard needs Cloudflare, never covers the platform",
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async (t) => {
    const config = Env.getAll<Record<string, string>>();
    config.INGRESS_HOSTNAME = "ingress.platform.test";
    config.INGRESS_IPV4 = "203.0.113.10";
    config.APP_DOMAIN = "apps.test";

    const dns = {
      txt: {} as Record<string, string[]>,
      a: {} as Record<string, string[]>,
    };
    const real = { ...resolver };
    resolver.txt = (name) => Promise.resolve(dns.txt[name] ?? []);
    resolver.a = (name) => Promise.resolve(dns.a[name] ?? []);
    dns.a["ingress.platform.test"] = ["203.0.113.11"];

    const a = await testSession("wildcard-a");
    const project = new ObjectId();
    await mongodb.db().collection("projects").insertOne({
      _id: project,
      tenant: a.tenantId,
      name: "store",
      slug: `store-${project}`,
      placedOn: [],
    });
    const zone = `shop-${Date.now()}.test`;
    const add = (hostname: string) =>
      a.call("POST", "/domains/api", { project: String(project), hostname });

    try {
      await t.step("names: one leftmost label, stand-ins, rules", () => {
        assertEquals(ownershipName(`*.${zone}`), `_huruf.${zone}`);
        assertEquals(probeName(`*.${zone}`), `huruf-check.${zone}`);
        assertEquals(probeName(`www.${zone}`), `www.${zone}`);
        assertEquals(
          hostRule("*.elvorro.com"),
          "HostRegexp(`(?i)^[a-z0-9-]+\\.elvorro\\.com$`)",
        );
        assertEquals(hostRule("elvorro.com"), "Host(`elvorro.com`)");
        // A storefront answers 404 for an unknown store (huruf-check): the
        // health check prefers its test domain, then an exact one.
        const wild = { hostname: "*.shintro.site" };
        const exact = { hostname: "editor.shintro.com" };
        const test = { hostname: "shop-1a2b3c.apps.test", appDomain: true };
        assertEquals(healthHost([wild, exact, test]), "shop-1a2b3c.apps.test");
        assertEquals(healthHost([wild, exact]), "editor.shintro.com");
        assertEquals(healthHost([wild]), "huruf-check.shintro.site");
        assertEquals(healthHost([]), undefined);
      });

      await t.step("without Cloudflare: refused, saying why", async () => {
        const res = await add(`*.${zone}`);
        assertEquals(res.status, 400);
        assertEquals(
          JSON.stringify(res.json).includes("Cloudflare"),
          true,
          JSON.stringify(res.json),
        );
      });

      await cloudflareConnectionModel.insertOne({
        _id: a.tenantId,
        tokenEnc: "unused",
        zones: 1,
        connectedBy: a.user,
        connectedAt: new Date(),
      });

      await t.step("bad wildcards and the platform's names", async () => {
        for (
          const hostname of [
            "*.test", // over a TLD
            `a.*.${zone}`, // not leftmost
            `*.*.${zone}`,
            "*.platform.test", // covers ingress.platform.test
            "*.apps.test", // the free test domains
            "*.x.apps.test",
          ]
        ) {
          assertEquals((await add(hostname)).status, 400, hostname);
        }
      });

      await t.step(
        "added, with its records on the name it covers",
        async () => {
          const res = await add(`*.${zone.toUpperCase()}`);
          assertEquals(res.status, 200, JSON.stringify(res.json));
          const [d] = (await a.call(
            "GET",
            `/domains/api?project=${project}`,
          )).json;
          assertEquals(d.hostname, `*.${zone}`);
          assertEquals(d.records.ownership.name, `_huruf.${zone}`);

          // Checked like any other: the TXT on the zone, a name under it.
          await a.call("POST", `/domains/api/${d._id}/check`, {});
          dns.txt[`_huruf.${zone}`] = [d.records.ownership.value];
          dns.a[`huruf-check.${zone}`] = ["203.0.113.10"];
          await domainModel.updateOne({ _id: new ObjectId(d._id) }, {
            $set: { nextCheckAt: new Date(0) },
          });
          await checkDue();
          const after = await domainModel.findOne({ _id: new ObjectId(d._id) });
          assertEquals(after?.status, "issuing", after?.checks?.detail);
        },
      );
    } finally {
      Object.assign(resolver, real);
      await domainModel.deleteMany({ tenant: a.tenantId });
      await cloudflareConnectionModel.deleteOne({ _id: a.tenantId });
      await mongodb.db().collection("projects").deleteOne({ _id: project });
      await a.cleanup();
    }
  },
});
