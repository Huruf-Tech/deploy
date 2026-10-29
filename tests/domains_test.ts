import { assert, assertEquals, assertMatch } from "@std/assert";
// First: loads the server, whose bootstrap patches zod before schemas exist.
import { testSession } from "./_session.ts";
import { ObjectId } from "mongodb";
import { Env } from "@/core/utils/env.ts";
import { mongodb } from "@/database.ts";
import { resolver } from "@/lib/domains/dns.ts";
import {
  CHECK_WINDOW_MS,
  checkDue,
  ownershipToken,
} from "@/lib/domains/domains.ts";
import {
  cloudflareConnectionModel,
  domainModel,
} from "@/schemas/applications/domain.ts";
import { cloudflareApi, completeOAuth } from "@/lib/domains/cloudflare.ts";
import { appHostname } from "@/lib/domains/appDomain.ts";

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
    // Settings are cached a minute: on from the start.
    config.APP_DOMAIN = "apps.test";

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

      await t.step(
        "re-added: the same TXT record, verified at once",
        async () => {
          const [before] = (await get(a.call, pa)).filter((
            x: { hostname: string },
          ) => x.hostname === host);
          assertEquals(
            (await a.call("DELETE", `/domains/api/${before._id}`)).status,
            200,
          );
          const again = await a.call("POST", "/domains/api", {
            project: pa,
            hostname: host,
          });
          assertEquals(again.status, 200, JSON.stringify(again.json));
          const [after] = (await get(a.call, pa)).filter((
            x: { hostname: string },
          ) => x.hostname === host);
          assertEquals(
            after.records.ownership.value,
            before.records.ownership.value,
          );
          // The records were still in DNS: no "Check now" needed.
          assertEquals(after.status, "issuing");
        },
      );

      await t.step("another tenant gets another TXT record", async () => {
        const shared = `shared-${Date.now()}.example.test`;
        await b.call("POST", "/domains/api", { project: pb, hostname: shared });
        const [d] = (await get(b.call, pb)).filter((x: { hostname: string }) =>
          x.hostname === shared
        );
        assertEquals(d.status, "pending");
        assertEquals(
          d.records.ownership.value,
          `huruf-verify=${await ownershipToken(b.tenantId, shared)}`,
        );
        assert(
          d.records.ownership.value !==
            `huruf-verify=${await ownershipToken(a.tenantId, shared)}`,
        );
      });
      await t.step(
        "Cloudflare: records created in the zone, DNS only",
        async () => {
          // A Cloudflare holding one zone, example.test.
          const records: Record<string, unknown>[] = [{
            id: "old",
            type: "A",
            name: `cf.example.test`,
            content: "198.51.100.7",
            proxied: true,
          }];
          const real = cloudflareApi.fetch;
          cloudflareApi.fetch = (url, init) => {
            const u = new URL(url);
            const ok = (result: unknown) =>
              Promise.resolve(Response.json({ success: true, result }));
            if (
              init.headers &&
              !JSON.stringify(init.headers).includes("cf-token-0123456789")
            ) {
              return Promise.resolve(
                Response.json({
                  success: false,
                  errors: [{ message: "Invalid token" }],
                }, { status: 403 }),
              );
            }
            if (u.pathname.endsWith("/zones")) {
              const name = u.searchParams.get("name");
              return ok(
                !name || name === "example.test"
                  ? [{ id: "z1", name: "example.test" }]
                  : [],
              );
            }
            if (init.method === "DELETE") {
              const at = records.findIndex((r) =>
                u.pathname.endsWith(`/${r.id}`)
              );
              records.splice(at, 1);
              return ok({});
            }
            if (init.method === "POST") {
              records.push({
                id: crypto.randomUUID(),
                ...JSON.parse(String(init.body)),
              });
              return ok({});
            }
            return ok(
              records.filter((r) => r.name === u.searchParams.get("name")),
            );
          };
          try {
            const hostname = "cf.example.test";
            const added = await b.call("POST", "/domains/api", {
              project: pb,
              hostname,
            });
            const setUp = () =>
              b.call("POST", `/domains/api/${added.json._id}/cloudflare`, {});
            assertEquals((await setUp()).status, 400, "not connected");
            const bad = await b.call(
              "PUT",
              "/domains/api/cloudflare/connection",
              {
                token: "wrong-token-0123456789",
              },
            );
            assertEquals(bad.status, 400);
            const connected = await b.call(
              "PUT",
              "/domains/api/cloudflare/connection",
              {
                token: "cf-token-0123456789abcdef",
              },
            );
            assertEquals(connected.json, { zones: 1 });

            // An A record pointing elsewhere (proxied): a conflict, kept.
            const first = await setUp();
            assertEquals(first.json.applied, false);
            assertEquals(first.json.conflicts, [{
              type: "A",
              content: "198.51.100.7",
              proxied: true,
            }]);
            assertEquals(records.length, 1);
            // Replaced on request: the TXT and a CNAME, DNS only.
            const second = await b.call(
              "POST",
              `/domains/api/${added.json._id}/cloudflare`,
              { replace: true },
            );
            assertEquals(
              second.json.applied,
              true,
              JSON.stringify(second.json),
            );
            const [d] = (await get(b.call, pb)).filter((
              x: { hostname: string },
            ) => x.hostname === hostname);
            assertEquals(
              records.map((r) => [r.type, r.name, r.content, r.proxied]).sort(),
              [
                ["CNAME", hostname, "ingress.platform.test", false],
                [
                  "TXT",
                  `_huruf.${hostname}`,
                  `"${d.records.ownership.value}"`,
                  undefined,
                ],
              ],
            );
            assertEquals(d.status, "issuing", "verified without lookups");
            assert(d.verifiedAt);
            const doc = await domainModel.findOne({ hostname });
            const wait = doc!.issueAt!.getTime() - Date.now();
            assert(
              wait > 20_000 && wait <= 30_000,
              `ordered shortly after: ${wait}`,
            );
            // Again: nothing new to create.
            const third = await setUp();
            assertEquals([third.json.applied, third.json.created], [true, []]);
          } finally {
            cloudflareApi.fetch = real;
            await cloudflareConnectionModel.deleteOne({ _id: b.tenantId });
          }
        },
      );

      await t.step(
        "Cloudflare sign-in: consent, tokens, renewal, revoke",
        async () => {
          config.CLOUDFLARE_OAUTH_CLIENT_ID = "cid";
          config.CLOUDFLARE_OAUTH_CLIENT_SECRET = "csecret";
          const revoked: string[] = [];
          const records: Record<string, unknown>[] = [];
          const real = cloudflareApi.fetch;
          const answer = (url: string, init: RequestInit) => {
            const u = new URL(url);
            const auth = new Headers(init.headers).get("Authorization") ?? "";
            if (u.pathname.startsWith("/oauth2/")) {
              assertEquals(auth, `Basic ${btoa("cid:csecret")}`);
              const form = new URLSearchParams(String(init.body));
              if (u.pathname === "/oauth2/revoke") {
                revoked.push(form.get("token")!);
                return Response.json({});
              }
              const grant = form.get("grant_type");
              if (
                grant === "authorization_code" && form.get("code") === "good"
              ) {
                assertMatch(
                  form.get("redirect_uri")!,
                  /\/domains\/api\/cloudflare\/callback$/,
                );
                return Response.json({
                  access_token: "cf-access-1",
                  refresh_token: "r1",
                  expires_in: 3600,
                });
              }
              if (
                grant === "refresh_token" && form.get("refresh_token") === "r1"
              ) {
                return Response.json({
                  access_token: "cf-access-2",
                  refresh_token: "r2",
                  expires_in: 3600,
                });
              }
              return Response.json({ error: "invalid_grant" }, { status: 400 });
            }
            const ok = (result: unknown) =>
              Response.json({ success: true, result });
            // An expired access token is refused.
            if (
              auth !== "Bearer cf-access-1" && auth !== "Bearer cf-access-2"
            ) {
              return Response.json({
                success: false,
                errors: [{ message: "Invalid token" }],
              }, { status: 403 });
            }
            if (u.pathname.endsWith("/zones")) {
              const name = u.searchParams.get("name");
              return ok(
                !name || name === "example.test"
                  ? [{ id: "z1", name: "example.test" }]
                  : [],
              );
            }
            if (init.method === "POST") {
              records.push({ auth, ...JSON.parse(String(init.body)) });
              return ok({});
            }
            return ok([]);
          };
          cloudflareApi.fetch = (url, init) =>
            Promise.resolve(answer(url, init));
          try {
            let conn = await b.call(
              "GET",
              "/domains/api/cloudflare/connection",
            );
            assertEquals(conn.json, { connected: false, signIn: true });
            const back = `/app/${b.tenantId}/projects/${pb}`;
            const auth = await b.call(
              "GET",
              `/domains/api/cloudflare/authorize?back=${
                encodeURIComponent(back)
              }`,
            );
            const consent = new URL(auth.json.url);
            assertEquals(
              consent.origin + consent.pathname,
              "https://dash.cloudflare.com/oauth2/auth",
            );
            assertEquals(consent.searchParams.get("client_id"), "cid");
            assertMatch(consent.searchParams.get("scope")!, /offline_access/);
            const state = consent.searchParams.get("state");

            // A forged or missing state connects nothing.
            assertMatch(
              await completeOAuth("good", "forged"),
              /cloudflare=Signing/,
            );
            // Back from Cloudflare: connected, then the page it left.
            const landed = new URL(await completeOAuth("good", state));
            assertEquals(landed.pathname, back);
            assertEquals(landed.searchParams.get("cloudflare"), "connected");
            conn = await b.call("GET", "/domains/api/cloudflare/connection");
            assertEquals([conn.json.connected, conn.json.zones], [true, 1]);

            // Its access token ran out: renewed when records are created.
            await cloudflareConnectionModel.updateOne({ _id: b.tenantId }, {
              $set: { expiresAt: new Date() },
            });
            const added = await b.call("POST", "/domains/api", {
              project: pb,
              hostname: "signin.example.test",
            });
            const setUp = await b.call(
              "POST",
              `/domains/api/${added.json._id}/cloudflare`,
              {},
            );
            assertEquals(setUp.json.applied, true, JSON.stringify(setUp.json));
            assert(
              records.length > 0 &&
                records.every((r) => r.auth === "Bearer cf-access-2"),
            );
            const doc = await cloudflareConnectionModel.findOne({
              _id: b.tenantId,
            });
            assert(doc!.expiresAt!.getTime() > Date.now() + 60_000, "renewed");

            // Disconnecting revokes the (rotated) refresh token.
            assertEquals(
              (await b.call("DELETE", "/domains/api/cloudflare/connection"))
                .status,
              200,
            );
            assertEquals(revoked, ["r2"]);
            assertEquals(
              await cloudflareConnectionModel.countDocuments({
                _id: b.tenantId,
              }),
              0,
            );
          } finally {
            cloudflareApi.fetch = real;
            delete config.CLOUDFLARE_OAUTH_CLIENT_ID;
            delete config.CLOUDFLARE_OAUTH_CLIENT_SECRET;
            await cloudflareConnectionModel.deleteOne({ _id: b.tenantId });
          }
        },
      );
      await t.step(
        "a free test domain: live at once, one per project",
        async () => {
          assertEquals((await b.call("GET", "/domains/api/app")).json, {
            domain: "apps.test",
          });
          const quota = (await get(b.call, pb)).length;
          const res = await b.call("POST", "/domains/api/app", { project: pb });
          assertEquals(res.status, 200, JSON.stringify(res.json));
          const free = (await get(b.call, pb)).find((d: { _id: string }) =>
            d._id === res.json._id
          );
          assertMatch(free.hostname, /^web-[0-9a-f]{6}\.apps\.test$/);
          assertEquals([free.status, free.appDomain], ["active", true]);
          assertEquals((await get(b.call, pb)).length, quota + 1);
          const again = await b.call("POST", "/domains/api/app", {
            project: pb,
          });
          assertEquals(again.status, 400);
          assertMatch(String(again.json), /already has a test domain/);
          // Never added as a custom domain, nor named to look official.
          const custom = await b.call("POST", "/domains/api", {
            project: pb,
            hostname: "mine.apps.test",
          });
          assertEquals(custom.status, 400);
          assertMatch(
            appHostname("Huruf Login", "apps.test"),
            /^app-[0-9a-f]{6}\.apps\.test$/,
          );
          assertMatch(
            appHostname("My Shop!", "apps.test"),
            /^my-shop-[0-9a-f]{6}\.apps\.test$/,
          );
          // Removing it frees no quota it never took.
          assertEquals(
            (await b.call("DELETE", `/domains/api/${res.json._id}`)).status,
            200,
          );
        },
      );
    } finally {
      delete config.APP_DOMAIN;
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
