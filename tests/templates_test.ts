import { assert, assertEquals, assertMatch, assertThrows } from "@std/assert";
import { ObjectId } from "mongodb";
import { mongodb } from "@/database.ts";
import { renderContent, TemplateError } from "@/lib/build/render.ts";
import {
  templateModel,
  templateVersionModel,
} from "@/schemas/build/template.ts";
import { tenantUsageModel } from "@/schemas/limits/tenantUsage.ts";
import { testSession } from "./_session.ts";

Deno.test("render: no HTML escaping, strict inputs, optional blocks, generated secrets", () => {
  const inputs = [
    { key: "cmd", label: "Command", type: "string" as const, required: true },
    { key: "extra", label: "Extra", type: "string" as const, required: false },
    {
      key: "pw",
      label: "Password",
      type: "secret" as const,
      required: false,
      generate: "password" as const,
    },
  ];
  const { files, generated } = renderContent(
    "app",
    {
      dockerfile:
        'RUN {{inputs.cmd}}{{#if inputs.extra}} {{inputs.extra}}{{/if}}\nENV PW="{{inputs.pw}}" ID={{build.cacheKey}}',
      inputs,
    },
    { cmd: "npm ci && npm run build" },
    { cacheKey: "p1" },
  );
  assertMatch(
    files.Dockerfile,
    /^RUN npm ci && npm run build\nENV PW="[\w-]{32}" ID=p1$/,
  );
  assertEquals(generated, ["pw"]);

  assertThrows(
    () =>
      renderContent("app", { dockerfile: "{{inputs.cmd}}", inputs }, {}, {
        cacheKey: "",
      }),
    TemplateError,
    "Command is required",
  );
  assertThrows(
    () =>
      renderContent("app", { dockerfile: "{{inputs.typo}}", inputs }, {
        cmd: "x",
      }, {
        cacheKey: "",
      }),
    TemplateError,
  );
});

Deno.test({
  name:
    "templates: clone the Thunder template and edit it into a tenant template",
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async (t) => {
    const { call, tenantId, cleanup } = await testSession("templates");
    let thunder = "";
    let mine = "";

    try {
      await t.step("system templates are listed and render", async () => {
        const { json } = await call("GET", "/templates/api");
        const slugs = json.map((t: { slug: string }) => t.slug);
        for (
          const slug of [
            "thunder",
            "react-vite",
            "nextjs",
            "node",
            "deno",
            "postgres",
            "mongodb",
            "redis",
            "mysql",
            "minio",
          ]
        ) {
          assert(slugs.includes(slug), `${slug} missing`);
        }
        thunder = json.find((t: { slug: string }) => t.slug === "thunder")._id;

        const { status, json: rendered } = await call(
          "POST",
          `/templates/api/${thunder}/render`,
          {},
        );
        assertEquals(status, 200, JSON.stringify(rendered));
        assertMatch(
          rendered.files.Dockerfile,
          /deno", "serve", "-A", "--port=8000", "serve\.ts"/,
        );

        const postgres = json.find((t: { slug: string }) =>
          t.slug === "postgres"
        )._id;
        const service = await call(
          "POST",
          `/templates/api/${postgres}/render`,
          {},
        );
        assertEquals(service.json.generated, ["password"]);
        assertMatch(
          service.json.files["compose.yaml"],
          /POSTGRES_PASSWORD: "[\w-]{32}"/,
        );
      });

      await t.step(
        "every seeded template renders with its defaults",
        async () => {
          const { json } = await call("GET", "/templates/api");
          for (
            const template of json.filter((t: { scope: string }) =>
              t.scope === "system"
            )
          ) {
            const { status, json: out } = await call(
              "POST",
              `/templates/api/${template._id}/render`,
              {},
            );
            assertEquals(
              status,
              200,
              `${template.slug}: ${JSON.stringify(out)}`,
            );
          }
        },
      );

      await t.step("clone into the tenant", async () => {
        const { status, json } = await call(
          "POST",
          `/templates/api/${thunder}/clone`,
          {
            name: "Our Thunder",
            slug: "our-thunder",
          },
        );
        assertEquals(status, 200, JSON.stringify(json));
        mine = json._id;

        const { json: got } = await call("GET", `/templates/api/${mine}`);
        assertEquals(got.template.scope, "tenant");
        assertEquals(got.template.clonedFrom.template, thunder);
        assertEquals(got.content.version, 1);

        const taken = await call("POST", `/templates/api/${thunder}/clone`, {
          name: "Again",
          slug: "our-thunder",
        });
        assertEquals(taken.status, 400);
      });

      await t.step("edit: each save is a new immutable version", async () => {
        const { json: current } = await call("GET", `/templates/api/${mine}`);
        const edited = current.content.dockerfile.replace(
          "RUN deno cache serve.ts",
          "RUN deno cache serve.ts && deno task build",
        );
        const saved = await call("POST", `/templates/api/${mine}/versions`, {
          dockerfile: edited,
          inputs: current.content.inputs,
          defaults: current.content.defaults,
          changelog: "Run the build task",
        });
        assertEquals(saved.status, 200, JSON.stringify(saved.json));
        assertEquals(saved.json.version, 2);

        const { json: versions } = await call(
          "GET",
          `/templates/api/${mine}/versions`,
        );
        assertEquals(versions.map((v: { version: number }) => v.version), [
          2,
          1,
        ]);
        const { json: v1 } = await call(
          "GET",
          `/templates/api/${mine}?version=1`,
        );
        assert(!v1.content.dockerfile.includes("deno task build"));
        const { json: rendered } = await call(
          "POST",
          `/templates/api/${mine}/render`,
          {},
        );
        assertMatch(
          rendered.files.Dockerfile,
          /deno cache serve\.ts && deno task build/,
        );
      });

      await t.step(
        "broken templates and system edits are refused",
        async () => {
          const broken = await call("POST", `/templates/api/${mine}/versions`, {
            dockerfile: "FROM {{#if}}",
          });
          assertEquals(broken.status, 400);
          const system = await call(
            "POST",
            `/templates/api/${thunder}/versions`,
            {
              dockerfile: "FROM scratch",
            },
          );
          assertEquals(system.status, 404);
        },
      );

      await t.step(
        "delete removes every version and frees the quota",
        async () => {
          assertEquals(
            (await tenantUsageModel.findOne({ tenant: tenantId }))?.templates,
            1,
          );
          // A project still using it keeps it.
          const user = await mongodb.db().collection("projects").insertOne({
            tenant: tenantId,
            template: { template: new ObjectId(mine), version: 2 },
          });
          assertEquals(
            (await call("DELETE", `/templates/api/${mine}`)).status,
            400,
          );
          await mongodb.db().collection("projects").deleteOne({
            _id: user.insertedId,
          });
          assertEquals(
            (await call("DELETE", `/templates/api/${mine}`)).status,
            200,
          );
          assertEquals(
            await templateVersionModel.countDocuments({
              template: new ObjectId(mine),
            }),
            0,
          );
          assertEquals(
            (await tenantUsageModel.findOne({ tenant: tenantId }))?.templates,
            0,
          );
        },
      );
    } finally {
      const own = await templateModel.find({ tenant: tenantId }).toArray();
      await templateVersionModel.deleteMany({
        template: { $in: own.map((t) => t._id) },
      });
      await templateModel.deleteMany({ tenant: tenantId });
      await cleanup();
    }
  },
});
