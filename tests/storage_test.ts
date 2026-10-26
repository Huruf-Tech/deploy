import { assert, assertEquals, assertMatch } from "@std/assert";
import { ObjectId } from "mongodb";
import handler from "@/serve.base.ts";
import { mongodb } from "@/database.ts";
import { createState, SimAgent } from "@/tools/agent-sim/agent.ts";
import { joinAsPartition } from "./_partition.ts";
import { testSession } from "./_session.ts";

// Storage connections and S3 volumes (PLAN §16 Phase 9) with two simulated servers.

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const SECRET = "s3cret-key-123456";

Deno.test({
  name: "storage: connections, S3 volumes across servers, credential refresh",
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async (t) => {
    const session = await testSession("storage");
    const { call, tenant, tenantId, user } = session;
    const d = mongodb.db();
    const agents: SimAgent[] = [];
    const servers: string[] = [];
    const pollAll = async (rounds = 1) => {
      for (let i = 0; i < rounds; i++) {
        for (const a of agents) {
          await sleep(110);
          await a.poll();
        }
      }
    };
    let storage = "";
    let app = "";

    try {
      await t.step("two servers join", async () => {
        for (const name of ["storage-a", "storage-b"]) {
          const agent = new SimAgent(await createState(name), {
            baseUrl: "http://localhost",
            tenant,
            send: (req) => Promise.resolve(handler(req)),
          });
          const { json } = await joinAsPartition(agent, tenantId, user);
          agents.push(agent);
          servers.push(json.server);
        }
        await pollAll();
      });

      await t.step("a connection keeps its secret key encrypted", async () => {
        const base = {
          name: "Files",
          provider: "minio",
          region: "us-east-1",
          bucket: "huruf-test",
          accessKeyId: "AKIA-TEST",
          secretAccessKey: SECRET,
        };
        const noEndpoint = await call("POST", "/storages/api", base);
        assertEquals(noEndpoint.status, 400);
        const created = await call("POST", "/storages/api", {
          ...base,
          endpoint: "http://minio.example.com:9000",
        });
        assertEquals(created.status, 200, JSON.stringify(created.json));
        storage = created.json._id;
        const { json: list } = await call("GET", "/storages/api");
        assertEquals(list.length, 1);
        assert(!JSON.stringify(list).includes(SECRET));
        const stored = JSON.stringify(
          await d.collection("storages").findOne({ tenant: tenantId }),
        );
        assert(!stored.includes(SECRET), "secret stored in plaintext");
      });

      await t.step(
        "S3 volumes run on several servers; local ones on one",
        async () => {
          const project = (volumes: unknown[]) => ({
            name: "files",
            slug: "files",
            source: { type: "image", image: "nginx:alpine" },
            runtime: { port: 80 },
            volumes,
            servers,
            replicasPerServer: 2,
          });
          const local = await call(
            "POST",
            "/projects/api",
            project([{ name: "data", mountPath: "/data" }]),
          );
          assertEquals(local.status, 400);
          assertMatch(JSON.stringify(local.json), /one server/);

          const foreign = await call(
            "POST",
            "/projects/api",
            project([{
              name: "data",
              mountPath: "/data",
              storage: new ObjectId().toHexString(),
            }]),
          );
          assertEquals(foreign.status, 400, "another workspace's storage");

          const created = await call(
            "POST",
            "/projects/api",
            project([{ name: "uploads", mountPath: "/uploads", storage }]),
          );
          assertEquals(created.status, 200, JSON.stringify(created.json));
          app = created.json._id;
          await call("POST", `/projects/api/${app}/deploy`, {});
          await pollAll(4);

          for (const agent of agents) {
            const release = agent.spec!.workloads.find((w) =>
              w.name === "files"
            )!.releases[0];
            assertEquals(release.replicas, 2);
            assertEquals(release.volumes, [{
              name: `huruf-${app}-uploads`,
              mountPath: "/uploads",
              s3: {
                provider: "Minio",
                endpoint: "http://minio.example.com:9000",
                region: "us-east-1",
                bucket: "huruf-test",
                path: "files/uploads",
                accessKeyId: "AKIA-TEST",
                secretAccessKey: SECRET,
              },
            }]);
          }
          const release = JSON.stringify(
            await d.collection("releases").findOne({
              project: new ObjectId(app),
            }),
          );
          assert(
            !release.includes(SECRET),
            "credentials don't go into releases",
          );
        },
      );

      await t.step("new keys reach the servers that mount it", async () => {
        const updated = await call("PATCH", `/storages/api/${storage}`, {
          secretAccessKey: "rotated-key-654321",
        });
        assertEquals(updated.status, 200, JSON.stringify(updated.json));
        await pollAll();
        const s3 = agents[0].spec!.workloads[0].releases[0].volumes[0].s3!;
        assertEquals(s3.secretAccessKey, "rotated-key-654321");
      });

      await t.step("volume changes apply on the next deploy", async () => {
        const changed = await call("PATCH", `/projects/api/${app}`, {
          volumes: [{
            name: "uploads",
            mountPath: "/uploads",
            storage,
            path: "shared/uploads",
          }],
        });
        assertEquals(changed.status, 200, JSON.stringify(changed.json));
        assertEquals(changed.json.redeploy, true);
        const duplicate = await call("PATCH", `/projects/api/${app}`, {
          volumes: [
            { name: "a", mountPath: "/x", storage },
            { name: "b", mountPath: "/x", storage },
          ],
        });
        assertEquals(duplicate.status, 400);
      });

      await t.step("a connection in use can't be deleted", async () => {
        const used = await call("DELETE", `/storages/api/${storage}`);
        assertEquals(used.status, 400);
        assertMatch(JSON.stringify(used.json), /files mounts this storage/);
      });
    } finally {
      const serverIds = servers.map((s) => new ObjectId(s));
      await Promise.all([
        ...[
          "projects",
          "releases",
          "deployments",
          "servers",
          "serverLeases",
          "agentCommands",
          "networks",
          "storages",
        ].map((name) => d.collection(name).deleteMany({ tenant: tenantId })),
        d.collection("serverSpecs").deleteMany({ _id: { $in: serverIds } }),
        d.collection("agentEvents").deleteMany({ server: { $in: serverIds } }),
      ]);
      await session.cleanup();
    }
  },
});
