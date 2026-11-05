import { assert, assertEquals, assertNotEquals } from "@std/assert";
import { variableModel } from "@/schemas/configuration/variable.ts";
import { testSession } from "./_session.ts";
import { parseEnv } from "../public/app/src/lib/dotenv.ts";

// The owner invites members as `deployer` or `operator`; only operators get shells.
Deno.test({
  name: "rbac: the invited role decides who may open shells",
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async (t) => {
    const owner = await testSession("rbac-owner");
    const deployer = await testSession("rbac-deployer");
    const operator = await testSession("rbac-operator");

    const join = async (member: typeof deployer, role: string) => {
      const invite = await owner.call("POST", "/tenantInvites/api", {
        email: member.email,
        role,
        url: "http://localhost/invite/{{_id}}",
      });
      assertEquals(invite.status, 200, JSON.stringify(invite.json));
      const joined = await member.call("POST", "/tenantMembers/api", {
        invite: invite.json._id,
      });
      assertEquals(joined.status, 200, JSON.stringify(joined.json));
      // Every later call acts in the owner's workspace.
      return (method: string, path: string, body?: unknown) =>
        member.call(method, path, body, { "x-tenant-id": owner.tenant });
    };

    try {
      const asDeployer = await join(deployer, "deployer");
      const asOperator = await join(operator, "operator");
      const shells = [
        "/streams/api/terminal",
        "/streams/api/terminal/host",
        "/streams/api/exec",
      ];

      await t.step("a deployer can watch but not open shells", async () => {
        for (const path of shells) {
          const { status, json } = await asDeployer("POST", path, {});
          assertEquals(status, 403, path);
          assert(String(json).includes("missing permission"), String(json));
        }
        // Past the guard: the empty body is what fails.
        assertNotEquals(
          (await asDeployer("POST", "/streams/api/logs", {})).status,
          403,
        );
      });

      await t.step("an operator can open shells", async () => {
        for (const path of shells) {
          assertNotEquals(
            (await asOperator("POST", path, {})).status,
            403,
            path,
          );
        }
      });

      await t.step(
        "members resolve with the owner's account variables",
        async () => {
          await owner.call("POST", "/variables/api", {
            scope: "global",
            key: "OWNER_REGION",
            value: "eu-west",
          });
          await asDeployer("POST", "/variables/api", {
            scope: "global",
            key: "MEMBER_ONLY",
            value: "x",
          });
          const { json } = await asDeployer("GET", "/variables/api/resolve");
          assertEquals(json.env, { OWNER_REGION: "eu-west" });
        },
      );
      await t.step(
        "only the owner exports the workspace's .env, secrets included",
        async () => {
          const tricky = 'a "b" #c\nd\\e';
          for (
            const [key, value, isSecret] of [
              ["PLAIN", "postgres://u@h:5432/db", false],
              ["TRICKY", tricky, true],
              ["EMPTY", "", false],
            ] as const
          ) {
            const res = await owner.call("POST", "/variables/api", {
              scope: "tenant",
              key,
              value,
              isSecret,
            });
            assertEquals(res.status, 200, JSON.stringify(res.json));
          }
          await owner.call("POST", "/variables/api", {
            scope: "tenant",
            key: "CERT",
            value: "-----BEGIN-----",
            kind: "file",
          });
          const { status, json } = await owner.call(
            "GET",
            "/variables/api/export?scope=tenant",
          );
          assertEquals(status, 200, JSON.stringify(json));
          assertEquals(json.skipped, ["CERT"]);
          // What the dashboard's import reads back.
          assertEquals(
            Object.fromEntries(
              parseEnv(json.env).entries.map((e) => [e.key, e.value]),
            ),
            { EMPTY: "", PLAIN: "postgres://u@h:5432/db", TRICKY: tricky },
          );
          assertEquals(
            (await asDeployer("GET", "/variables/api/export?scope=tenant"))
              .status,
            403,
          );
          // Your own variables are yours to export.
          const mine = await asDeployer(
            "GET",
            "/variables/api/export?scope=global",
          );
          assertEquals(mine.json.env, "MEMBER_ONLY=x\n");
        },
      );
    } finally {
      await variableModel.deleteMany({
        user: { $in: [owner.user, deployer.user, operator.user] },
      });
      await variableModel.deleteMany({ tenant: owner.tenantId });
      for (const session of [owner, deployer, operator]) {
        await session.cleanup();
      }
    }
  },
});
