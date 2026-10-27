import { assertEquals } from "@std/assert";
import { ObjectId } from "mongodb";
import handler from "@/serve.base.ts";
import { mongodb } from "@/database.ts";
import { createState, SimAgent } from "@/tools/agent-sim/agent.ts";
import { joinAsPartition } from "./_partition.ts";
import { testSession } from "./_session.ts";

// Pasted or uploaded .env files: bulk import, and variables with a new project.

Deno.test({
  name: "variables: import a .env, and create a project with variables",
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async (t) => {
    const session = await testSession("envimport");
    const { call, tenant, tenantId, user } = session;
    const d = mongodb.db();
    let server = "";

    try {
      await t.step(
        "new keys are created; existing ones skipped or overwritten",
        async () => {
          const body = (overwrite: boolean, value: string) => ({
            scope: "tenant",
            overwrite,
            variables: [
              { key: "API_URL", value, isSecret: false },
              { key: "API_TOKEN", value: "t0ken", isSecret: true },
            ],
          });
          const first = await call(
            "POST",
            "/variables/api/import",
            body(false, "https://a"),
          );
          assertEquals(first.status, 200, JSON.stringify(first.json));
          assertEquals(first.json.created.sort(), ["API_TOKEN", "API_URL"]);

          const again = await call(
            "POST",
            "/variables/api/import",
            body(false, "https://b"),
          );
          assertEquals(again.json.skipped.sort(), ["API_TOKEN", "API_URL"]);

          const replaced = await call(
            "POST",
            "/variables/api/import",
            body(true, "https://b"),
          );
          assertEquals(replaced.json.updated.sort(), ["API_TOKEN", "API_URL"]);

          const { json: list } = await call(
            "GET",
            "/variables/api?scope=tenant",
          );
          const url = list.find((v: { key: string }) => v.key === "API_URL");
          const token = list.find((v: { key: string }) =>
            v.key === "API_TOKEN"
          );
          assertEquals([url.value, token.value, token.isSecret], [
            "https://b",
            undefined,
            true,
          ]);

          // Importing it again as plain text doesn't reveal the secret.
          await call("POST", "/variables/api/import", {
            scope: "tenant",
            overwrite: true,
            variables: [{ key: "API_TOKEN", value: "new", isSecret: false }],
          });
          const { json: after } = await call(
            "GET",
            "/variables/api?scope=tenant",
          );
          const kept = after.find((v: { key: string }) =>
            v.key === "API_TOKEN"
          );
          assertEquals([kept.value, kept.isSecret], [undefined, true]);

          const bad = await call("POST", "/variables/api/import", {
            scope: "tenant",
            variables: [{ key: "1BAD", value: "x" }],
          });
          assertEquals(bad.status, 400, "keys are validated");
        },
      );

      await t.step("a project can be created with its variables", async () => {
        const agent = new SimAgent(await createState("envimport-a"), {
          baseUrl: "http://localhost",
          tenant,
          send: (req) => Promise.resolve(handler(req)),
        });
        const { json } = await joinAsPartition(agent, tenantId, user);
        server = json.server;
        const created = await call("POST", "/projects/api", {
          name: "web",
          slug: "web",
          source: { type: "image", image: "nginx:alpine" },
          runtime: { port: 80 },
          servers: [server],
          variables: [
            { key: "NODE_ENV", value: "production" },
            { key: "DB_PASSWORD", value: "s3cret", isSecret: true },
          ],
        });
        assertEquals(created.status, 200, JSON.stringify(created.json));
        const { json: vars } = await call(
          "GET",
          `/variables/api?scope=project&project=${created.json._id}`,
        );
        assertEquals(
          vars.map((
            v: { key: string; isSecret: boolean },
          ) => [v.key, v.isSecret]).sort(),
          [["DB_PASSWORD", true], ["NODE_ENV", false]],
        );
      });
    } finally {
      const ids = server ? [new ObjectId(server)] : [];
      await Promise.all([
        ...[
          "projects",
          "variables",
          "servers",
          "serverLeases",
          "agentCommands",
          "networks",
          "deployments",
          "releases",
        ]
          .map((name) => d.collection(name).deleteMany({ tenant: tenantId })),
        d.collection("serverSpecs").deleteMany({ _id: { $in: ids } }),
        d.collection("agentEvents").deleteMany({ server: { $in: ids } }),
      ]);
      await session.cleanup();
    }
  },
});
