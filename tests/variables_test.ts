import { assert, assertEquals, assertThrows } from "@std/assert";
import { ObjectId } from "mongodb";
import handler from "@/serve.base.ts";
import { Env } from "@/core/utils/env.ts";
import {
  resolveReferences,
  VariableReferenceError,
} from "@/lib/variables/references.ts";
import { variableModel } from "@/schemas/configuration/variable.ts";
import { keyringModel } from "@/schemas/crypto/keyring.ts";
import { tenantModel } from "@/plugins/Huruf-Tech/thunder-core/schemas/tenant.ts";
import { tenantMemberModel } from "@/plugins/Huruf-Tech/thunder-core/schemas/tenantMember.ts";
import { apiKeyModel } from "@/plugins/Huruf-Tech/thunder-core/schemas/apiKey.ts";
import { mongodb } from "@/database.ts";

Deno.test("references: precedence, scoped references, cycles", () => {
  const resolved = resolveReferences([
    ["global", { HOST: "global-db", PORT: "5432", URL: "${{HOST}}:${{PORT}}" }],
    ["tenant", { HOST: "tenant-db", RAW: "${{ global.HOST }}" }],
  ]);
  // Tenant wins, and unscoped references follow the merged set.
  assertEquals(resolved.HOST, "tenant-db");
  assertEquals(resolved.URL, "tenant-db:5432");
  assertEquals(resolved.RAW, "global-db");

  assertThrows(
    () => resolveReferences([["tenant", { A: "${{B}}", B: "x${{A}}" }]]),
    VariableReferenceError,
    "Reference cycle",
  );
  assertThrows(
    () => resolveReferences([["tenant", { A: "${{tenant.MISSING}}" }]]),
    VariableReferenceError,
    "tenant.MISSING, which does not exist",
  );
  assertEquals(
    resolveReferences([["tenant", { A: "${{MISSING}}" }]], {
      allowMissing: true,
    }).A,
    "${{MISSING}}",
  );
});

// End-to-end over the real handler (needs MongoDB, `deno task setup:dev`, and
// a valid DEPLOY_MASTER_KEY). This is Phase 4's "done when".
Deno.test({
  name:
    "variables: encrypted at rest, resolved by an external script with an API key",
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async (t) => {
    const origin = Env.getSync("BASE_URL");
    const email = `variables-${Date.now()}@example.com`;
    let cookie = "";
    let tenant = "";
    const call = async (
      method: string,
      path: string,
      body?: unknown,
      headers: Record<string, string> = { cookie },
    ) => {
      const res = await handler(
        new Request(`http://localhost${path}`, {
          method,
          headers: {
            "content-type": "application/json",
            origin,
            ...(tenant ? { "x-tenant-id": tenant } : {}),
            ...headers,
          },
          body: body ? JSON.stringify(body) : undefined,
        }),
      );
      const set = res.headers.getSetCookie();
      if (set.length) cookie = set.map((c) => c.split(";")[0]).join("; ");
      const text = await res.text();
      let json;
      try {
        json = JSON.parse(text);
      } catch {
        json = text;
      }
      return { status: res.status, json };
    };

    const secret = "postgres://admin:hunter2-very-secret@db:5432/app";
    const apiKeySecret = crypto.randomUUID();
    let user!: ObjectId;

    try {
      const signup = await call("POST", "/auth/api/sign-up/email", {
        email,
        password: "Passw0rd!long",
        name: "Variables Test",
      });
      assertEquals(signup.status, 200, JSON.stringify(signup.json));
      user = new ObjectId(signup.json.user.id);
      tenant = (await call("POST", "/tenants/api", { name: "variables-test" }))
        .json.tenantId;

      await t.step("create in both scopes, with a reference", async () => {
        for (
          const body of [
            { scope: "global", key: "REGION", value: "eu-west" },
            {
              scope: "tenant",
              key: "DB_PASSWORD",
              value: secret,
              isSecret: true,
            },
            {
              scope: "tenant",
              key: "DATABASE_URL",
              value: "${{DB_PASSWORD}}?region=${{global.REGION}}",
            },
            {
              scope: "tenant",
              key: "TLS_CERT",
              value: "-----BEGIN-----",
              kind: "file",
            },
          ]
        ) {
          const { status, json } = await call("POST", "/variables/api", body);
          assertEquals(status, 200, JSON.stringify(json));
        }

        const duplicate = await call("POST", "/variables/api", {
          scope: "tenant",
          key: "DB_PASSWORD",
          value: "x",
        });
        assertEquals(duplicate.status, 400);
      });

      await t.step("listing masks secrets; reveal returns them", async () => {
        const { json: list } = await call(
          "GET",
          "/variables/api?scope=tenant",
        );
        const password = list.find((v: { key: string }) =>
          v.key === "DB_PASSWORD"
        );
        assertEquals(password.value, undefined);
        assertEquals(
          list.find((v: { key: string }) => v.key === "TLS_CERT").value,
          "-----BEGIN-----",
        );

        const { json } = await call(
          "POST",
          `/variables/api/${password._id}/reveal`,
          { scope: "tenant" },
        );
        assertEquals(json.value, secret);
      });

      await t.step("a change that creates a cycle is rejected", async () => {
        const { json: list } = await call(
          "GET",
          "/variables/api?scope=tenant",
        );
        const password = list.find((v: { key: string }) =>
          v.key === "DB_PASSWORD"
        );
        const { status, json } = await call(
          "PATCH",
          `/variables/api/${password._id}`,
          { scope: "tenant", value: "${{DATABASE_URL}}" },
        );
        assertEquals(status, 400);
        assert(String(json).includes("Reference cycle"), String(json));
      });

      await t.step("no plaintext in MongoDB", async () => {
        const docs = await variableModel.find({
          $or: [{ user }, { tenant: new ObjectId(tenant) }],
        }).toArray();
        assertEquals(docs.length, 4);
        const stored = JSON.stringify(docs);
        for (const plain of ["hunter2", "eu-west", "BEGIN", "region="]) {
          assert(!stored.includes(plain), `${plain} stored in plaintext`);
        }
      });

      await t.step("an external script resolves with an API key", async () => {
        const created = await call("POST", "/apiKeys/api", {
          name: "ci",
          secret: apiKeySecret,
          scopes: ["variableApi"],
          resourceGrant: { [tenant]: ["variableApi"] },
        });
        assertEquals(created.status, 200, JSON.stringify(created.json));

        // No cookie: the key and the tenant header only, like a CI job.
        const keyOnly = { "x-api-key": apiKeySecret };
        const { status, json } = await call(
          "GET",
          "/variables/api/resolve?stage=runtime",
          undefined,
          keyOnly,
        );
        assertEquals(status, 200, JSON.stringify(json));
        assertEquals(json.env, {
          REGION: "eu-west",
          DB_PASSWORD: secret,
          DATABASE_URL: `${secret}?region=eu-west`,
        });
        assertEquals(json.files, { TLS_CERT: "-----BEGIN-----" });

        // The key is limited to resolve: it can't list or reveal.
        const list = await call(
          "GET",
          "/variables/api?scope=tenant",
          undefined,
          keyOnly,
        );
        assertEquals(list.status, 403);
      });
    } finally {
      const tenantId = tenant ? new ObjectId(tenant) : undefined;
      await Promise.all([
        variableModel.deleteMany({ $or: [{ user }, { tenant: tenantId }] }),
        keyringModel.deleteMany({
          "owner.ref": { $in: [user, tenantId].filter(Boolean) as ObjectId[] },
        }),
        apiKeyModel.deleteMany({ createdBy: user }),
        tenantModel.deleteMany({ _id: tenantId }),
        tenantMemberModel.deleteMany({ tenant: tenantId }),
        mongodb.db().collection("sessions").deleteMany({ userId: user }),
        mongodb.db().collection("accounts").deleteMany({ userId: user }),
        mongodb.db().collection("users").deleteMany({ _id: user }),
      ]);
    }
  },
});
