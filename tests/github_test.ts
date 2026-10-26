import { assert, assertEquals, assertMatch } from "@std/assert";
import { createVerify, generateKeyPairSync } from "node:crypto";
import handler from "@/serve.base.ts";
import { mongodb } from "@/database.ts";
import { githubApi } from "@/lib/services.ts";
import { gitIntegrationModel } from "@/schemas/build/gitIntegration.ts";
import { createState, SimAgent } from "@/tools/agent-sim/agent.ts";
import { joinAsPartition } from "./_partition.ts";
import { testSession } from "./_session.ts";

// Fake GitHub: the App's credentials, its installation, and one private repo.
const { privateKey, publicKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  privateKeyEncoding: { type: "pkcs1", format: "pem" },
  publicKeyEncoding: { type: "spki", format: "pem" },
});
const APP = {
  id: 9001,
  slug: "huruf-deploy-test",
  name: "Huruf Deploy test",
  html_url: "https://github.com/apps/huruf-deploy-test",
  client_id: "Iv1.test",
  client_secret: "client-secret-plaintext",
  webhook_secret: "webhook-secret-plaintext",
  pem: privateKey,
  owner: { login: "acme", type: "Organization" },
};
const INSTALLATION = {
  id: 42,
  account: { login: "acme", type: "Organization" },
  repository_selection: "selected",
  suspended_at: null,
};

/** The App JWT must be RS256-signed by the App's key with iss = app id. */
const appJwtValid = (auth: string | null) => {
  const [header, payload, signature] = (auth?.replace("Bearer ", "") ?? "")
    .split(".");
  if (!signature) return false;
  const ok = createVerify("RSA-SHA256").update(`${header}.${payload}`)
    .verify(
      publicKey,
      signature.replace(/-/g, "+").replace(/_/g, "/"),
      "base64",
    );
  const claims = JSON.parse(
    atob(payload.replace(/-/g, "+").replace(/_/g, "/")),
  );
  return ok && claims.iss === String(APP.id);
};

const fakeGitHub = Deno.serve({ port: 0, onListen() {} }, (req) => {
  const { pathname } = new URL(req.url);
  const auth = req.headers.get("authorization");
  const json = (data: unknown, headers: HeadersInit = {}) =>
    Response.json(data, { headers });

  if (pathname === "/app-manifests/one-time-code/conversions") return json(APP);
  if (pathname === "/app/installations") {
    return appJwtValid(auth)
      ? json([INSTALLATION])
      : new Response(null, { status: 401 });
  }
  if (pathname === "/app/installations/42/access_tokens") {
    return appJwtValid(auth)
      ? json({ token: "ghs_installation" })
      : new Response(null, { status: 401 });
  }
  if (auth !== "Bearer ghs_installation") {
    return new Response(null, { status: 401 });
  }
  if (pathname === "/installation/repositories") {
    return json({
      repositories: [{
        id: 1,
        name: "shop",
        full_name: "acme/shop",
        owner: { login: "acme" },
        private: true,
        default_branch: "main",
        pushed_at: null,
        description: null,
      }],
    }, { link: '<https://api.github.com/x?page=2>; rel="next"' });
  }
  if (pathname === "/repos/acme/shop/branches") {
    return json([{ name: "main", commit: { sha: "abc123" } }]);
  }
  return new Response("not found", { status: 404 });
});

const sign = async (secret: string, body: string) => {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body)),
  );
  return "sha256=" +
    [...mac].map((b) => b.toString(16).padStart(2, "0")).join("");
};

Deno.test({
  name:
    "github: connect in three redirects, list private repos, verified webhooks",
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async (t) => {
    githubApi.baseUrl = `http://localhost:${fakeGitHub.addr.port}`;
    const { call, tenant, tenantId, user, cleanup } = await testSession(
      "github",
    );
    let integration = "";

    try {
      await t.step(
        "connect → create App → install → back to the dashboard",
        async () => {
          // Click 1: the manifest form posted to GitHub.
          const { json } = await call("POST", "/gitIntegrations/api/connect", {
            org: "acme",
          });
          assertMatch(
            json.action,
            /^https:\/\/github\.com\/organizations\/acme\/settings\/apps\/new\?state=/,
          );
          const manifest = JSON.parse(json.manifest);
          integration = manifest.hook_attributes.url.split("/").pop();
          assertEquals(manifest.default_permissions, {
            contents: "read",
            metadata: "read",
          });
          const state = new URL(json.action).searchParams.get("state")!;

          // Click 2 on GitHub; it redirects back with a one-time code. No session needed.
          const created = await call(
            "GET",
            `/githubHooks/api/manifest?code=one-time-code&state=${
              encodeURIComponent(state)
            }`,
            undefined,
            { cookie: "", "x-tenant-id": "" },
          );
          assertEquals(created.status, 302);
          const install = new URL(created.headers.get("location")!);
          assertEquals(install.pathname, `/apps/${APP.slug}/installations/new`);

          // Click 3 on GitHub; it redirects back after installing.
          const installed = await call(
            "GET",
            `/githubHooks/api/setup?installation_id=42&setup_action=install&state=${
              encodeURIComponent(install.searchParams.get("state")!)
            }`,
            undefined,
            { cookie: "", "x-tenant-id": "" },
          );
          assertEquals(installed.status, 302);
          const back = new URL(installed.headers.get("location")!);
          assertEquals(
            back.pathname + back.search,
            `/app/${tenant}/build/gitIntegrations?connected=${integration}`,
          );
        },
      );

      await t.step("a forged state is refused", async () => {
        const forged = await call(
          "GET",
          "/githubHooks/api/manifest?code=one-time-code&state=forged",
          undefined,
          { cookie: "", "x-tenant-id": "" },
        );
        assertMatch(forged.headers.get("location")!, /error=expired/);
      });

      await t.step(
        "the integration lists its installation; no secrets leave",
        async () => {
          const { json } = await call("GET", "/gitIntegrations/api");
          assertEquals(json.length, 1);
          assertEquals(json[0].installations[0].account.login, "acme");
          assertEquals(json[0].isOwner, true);
          assert(!JSON.stringify(json).includes("Enc"));
        },
      );

      await t.step("private repositories and branches are listed", async () => {
        const repos = await call(
          "GET",
          `/gitIntegrations/api/${integration}/installations/42/repositories`,
        );
        assertEquals(repos.status, 200, JSON.stringify(repos.json));
        assertEquals(repos.json.repositories[0].fullName, "acme/shop");
        assertEquals(repos.json.repositories[0].private, true);
        assertEquals(repos.json.hasMore, true);

        const branches = await call(
          "GET",
          `/gitIntegrations/api/${integration}/installations/42/branches?repo=acme/shop`,
        );
        assertEquals(branches.json.branches, [{ name: "main", sha: "abc123" }]);

        const other = await call(
          "GET",
          `/gitIntegrations/api/${integration}/installations/7/repositories`,
        );
        assertEquals(other.status, 404);
      });

      await t.step("a push deploys the projects on that branch", async () => {
        const agent = new SimAgent(await createState("github-push"), {
          baseUrl: "http://localhost",
          tenant,
          send: (req) => Promise.resolve(handler(req)),
        });
        const { json: hello } = await joinAsPartition(agent, tenantId, user);
        const { json: templates } = await call("GET", "/templates/api");
        const created = await call("POST", "/projects/api", {
          name: "Shop",
          slug: "shop",
          source: {
            type: "github",
            gitIntegration: integration,
            installation: 42,
            repo: "acme/shop",
            branch: "main",
          },
          template: {
            template: templates.find((x: { slug: string }) =>
              x.slug === "thunder"
            )._id,
          },
          servers: [hello.server],
        });
        assertEquals(created.status, 200, JSON.stringify(created.json));

        const sha = "a".repeat(40);
        const push = (ref: string) =>
          JSON.stringify({
            ref,
            after: sha,
            repository: { full_name: "acme/shop" },
            head_commit: {
              message: "Fix checkout\n\nDetails",
              author: { name: "Ada" },
            },
          });
        const path = `/githubHooks/api/webhook/${integration}`;
        for (const ref of ["refs/heads/other", "refs/heads/main"]) {
          const body = push(ref);
          const res = await handlerPost(path, body, {
            "x-github-event": "push",
            "x-hub-signature-256": await sign(APP.webhook_secret, body),
          });
          assertEquals(res.status, 204);
        }

        const { json: deployments } = await call(
          "GET",
          `/projects/api/${created.json._id}/deployments`,
        );
        assertEquals(deployments.length, 1, "only the pushed branch deploys");
        assertEquals(deployments[0].trigger, "push");
        assertEquals(deployments[0].commit, {
          sha,
          message: "Fix checkout",
          author: "Ada",
        });

        await new Promise((r) => setTimeout(r, 120));
        await agent.poll();
        const build = agent.builds.at(-1)!;
        assertEquals(build.repo, {
          url: `${githubApi.cloneBaseUrl}/acme/shop.git`,
          token: "ghs_installation",
          ref: sha,
        });

        await mongodb.db().collection("serverLeases").deleteMany({
          tenant: tenantId,
        });
        for (
          const name of [
            "projects",
            "releases",
            "deployments",
            "servers",
            "agentCommands",
          ]
        ) {
          await mongodb.db().collection(name).deleteMany({ tenant: tenantId });
        }
      });

      await t.step("no plaintext credentials in MongoDB", async () => {
        const stored = JSON.stringify(
          await gitIntegrationModel.findOne({ tenant: tenantId }),
        );
        for (
          const plain of [APP.client_secret, APP.webhook_secret, "PRIVATE KEY"]
        ) {
          assert(!stored.includes(plain), `${plain} stored in plaintext`);
        }
      });

      await t.step("webhooks need this integration's signature", async () => {
        const body = JSON.stringify({
          action: "deleted",
          installation: INSTALLATION,
        });
        const path = `/githubHooks/api/webhook/${integration}`;
        const forged = await handlerPost(path, body, {
          "x-github-event": "installation",
          "x-hub-signature-256": await sign("wrong-secret", body),
        });
        assertEquals(forged.status, 401);

        const res = await handlerPost(path, body, {
          "x-github-event": "installation",
          "x-hub-signature-256": await sign(APP.webhook_secret, body),
        });
        assertEquals(res.status, 204);
        const doc = await gitIntegrationModel.findOne({ tenant: tenantId });
        assertEquals(doc?.installations, []);
      });
    } finally {
      await gitIntegrationModel.deleteMany({ tenant: tenantId });
      await cleanup();
      await fakeGitHub.shutdown();
    }
  },
});

/** Webhooks carry a raw body the signature covers, so they bypass the JSON helper. */
async function handlerPost(
  path: string,
  body: string,
  headers: Record<string, string>,
) {
  const { default: handler } = await import("@/serve.base.ts");
  return await handler(
    new Request(`http://localhost${path}`, { method: "POST", headers, body }),
  );
}
