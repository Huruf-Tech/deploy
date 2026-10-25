import { assert, assertEquals, assertMatch } from "@std/assert";
// First: loads the server, whose bootstrap patches zod before schemas exist.
import { testSession } from "./_session.ts";
import { ObjectId } from "mongodb";
import { MockLanguageModelV4 } from "ai/test";
import { mongodb } from "@/database.ts";
import { entitlements } from "@/lib/services.ts";
import { aiOptions } from "@/lib/ai/model.ts";
import { createTemplate, upsertSystemTemplate } from "@/lib/build/templates.ts";
import { $project } from "@/schemas/applications/project.ts";
import { $planFeatures, $planLimits } from "@/schemas/billing/plan.ts";

// The AI template assistant (PLAN Phase 12) against a scripted model.

const usage = {
  inputTokens: {
    total: 10,
    noCache: 10,
    cacheRead: undefined,
    cacheWrite: undefined,
  },
  outputTokens: { total: 20, text: 20, reasoning: undefined },
};

/** Answers in order; a function answer can inspect the prompt or throw. */
function script(answers: Array<object | (() => object)>) {
  const prompts: string[] = [];
  aiOptions.model = new MockLanguageModelV4({
    doGenerate: (options) => {
      prompts.push(JSON.stringify(options.prompt));
      const next = answers.shift();
      if (!next) throw new Error("No scripted answer left");
      const value = typeof next === "function" ? next() : next;
      return Promise.resolve({
        content: [{ type: "text", text: JSON.stringify(value) }],
        finishReason: { unified: "stop", raw: undefined },
        usage,
        warnings: [],
      });
    },
  });
  return prompts;
}

/** A plan that writes a new Redis template. */
const redis = (source: string) => ({
  explanation: "One Redis with AOF persistence.",
  existingTemplate: null,
  inputs: [],
  template: redisTemplate(source),
  projectName: "Cache",
  replicas: null,
  domains: [],
});
const redisTemplate = (source: string) => ({
  kind: "service",
  name: "Redis",
  description: "Redis with a password",
  source,
  inputs: [{
    key: "password",
    label: "Password",
    description: null,
    type: "secret",
    default: null,
    required: false,
    options: null,
    generate: "password",
  }],
  port: 6379,
  healthcheckPath: null,
  cachePaths: [],
});
const REDIS = `services:
  redis:
    image: redis:8-alpine
    command: ["redis-server", "--requirepass", "{{inputs.password}}"]
`;

const DOCKERFILE = (cmd: string) =>
  `FROM node:24-alpine
WORKDIR /app
COPY . .
CMD ${cmd}
`;

Deno.test({
  name: "ai: drafts, retries, quota and fixes",
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async (t) => {
    const { call, tenantId, user, cleanup } = await testSession("ai");
    const db = mongodb.db();
    const period = new ObjectId();
    const plan = async (features: object, limits: object) => {
      await db.collection("subscriptionPeriods").updateOne({ _id: period }, {
        $set: {
          tenant: tenantId,
          plan: new ObjectId(),
          periodStart: new Date(Date.now() - 60_000),
          periodEnd: new Date(Date.now() + 86_400_000),
          limitsSnapshot: { ...$planLimits.parse({}), ...limits },
          featuresSnapshot: { ...$planFeatures.parse({}), ...features },
        },
      }, { upsert: true });
      entitlements.invalidate(tenantId);
    };
    const systemSlug = `ai-test-${Date.now()}`;

    try {
      await t.step("off on the free plan, before any model call", async () => {
        const prompts = script([]);
        const res = await call("POST", "/ai/api/draft", {
          description: "Redis",
        });
        assertEquals(res.status, 403);
        assertEquals(prompts.length, 0);
        const status = await call("GET", "/ai/api/status");
        assertEquals(status.json.enabled, false);
      });

      await t.step("an invalid draft is sent back and corrected", async () => {
        await plan({ aiAssistant: true }, { aiRequestsPerMonth: 2 });
        const prompts = script([
          redis(REDIS.replace("inputs.password", "inputs.missing")),
          redis(REDIS),
        ]);
        const res = await call("POST", "/ai/api/draft", {
          description: "Redis with a password",
        });
        assertEquals(res.status, 200, JSON.stringify(res.json));
        assertEquals(res.json.kind, "service");
        assertEquals(res.json.name, "Cache");
        assertEquals(res.json.existing, undefined);
        const { content } = res.json.template;
        assertMatch(content.compose, /requirepass/);
        assertEquals(content.inputs[0].generate, "password");
        assertEquals(content.defaults, { port: 6379 });
        assertEquals(prompts.length, 2);
        assertMatch(prompts[1], /doesn't validate/);
        assertEquals((await call("GET", "/ai/api/status")).json.used, 1);
      });

      await t.step("an existing template wins, with its inputs", async () => {
        const slug = `own-redis-${Date.now()}`;
        await createTemplate({
          tenant: tenantId,
          user,
          kind: "service",
          slug,
          name: "Our Redis",
          content: {
            compose: REDIS.replace("redis:8", "redis:{{inputs.version}}"),
            inputs: [
              {
                key: "version",
                label: "Version",
                type: "select",
                options: ["8", "7"],
                default: "8",
                required: true,
              },
              {
                key: "password",
                label: "Password",
                type: "secret",
                generate: "password",
                required: false,
              },
            ],
            defaults: {},
            cachePaths: [],
          },
        });
        const answer = (version: string) => ({
          explanation: "Your own Redis template fits.",
          existingTemplate: slug,
          inputs: [{ key: "version", value: version }],
          template: null,
          projectName: "Sessions",
          replicas: 1,
          domains: ["Cache.Example.test.", "not a domain"],
        });
        const prompts = script([answer("9"), answer("7")]);
        const res = await call("POST", "/ai/api/draft", {
          description:
            "Redis 7 for sessions at cache.example.test, single instance",
        });
        assertEquals(res.status, 200, JSON.stringify(res.json));
        assertMatch(prompts[0], new RegExp(slug));
        assertMatch(prompts[1], /must be one of the listed options/);
        assertEquals(res.json.template, undefined);
        assertEquals(res.json.existing.name, "Our Redis");
        assertEquals(res.json.existing.values, { version: "7" });
        assertEquals(res.json.existing.inputs.length, 2);
        assertEquals(res.json.replicas, 1);
        assertEquals(res.json.domains, ["cache.example.test"]);
        // The quota steps below count from one request.
        await db.collection("rateCounters").updateOne({
          _id: `ai:${tenantId}:${
            new Date().toISOString().slice(0, 7)
          }` as never,
        }, { $inc: { count: -1 } });
      });

      await t.step("a provider failure doesn't use the quota", async () => {
        script([() => {
          throw new Error("overloaded");
        }]);
        const res = await call("POST", "/ai/api/draft", {
          description: "Redis",
        });
        assertEquals(res.status, 400);
        assertMatch(String(res.json), /AI provider failed/);
        assertEquals((await call("GET", "/ai/api/status")).json.used, 1);
      });

      await t.step("the monthly limit", async () => {
        script([redis(REDIS)]);
        assertEquals(
          (await call("POST", "/ai/api/draft", { description: "Redis" }))
            .status,
          200,
        );
        script([redis(REDIS)]);
        const over = await call("POST", "/ai/api/draft", {
          description: "Redis",
        });
        assertEquals(over.status, 403);
        assertMatch(String(over.json), /2 AI requests a month/);
      });

      await plan({ aiAssistant: true }, { aiRequestsPerMonth: 20 });
      const server = new ObjectId();
      await db.collection("servers").insertOne({
        _id: server,
        tenant: tenantId,
        status: "active",
        name: "ai-server",
        identity: { fingerprint: `ai-${server}` },
        inventory: { cpuCores: 4, memory: 8 * 2 ** 30 },
      });
      const failed = async (template: ObjectId, slug: string) => {
        const project = new ObjectId();
        const now = new Date();
        await db.collection("projects").insertOne({
          _id: project,
          ...$project.parse({
            tenant: tenantId,
            name: "Web",
            slug,
            kind: "app",
            source: { type: "image", image: "x" },
            build: { mode: "template" },
            template: { template, version: 1 },
            runtime: { port: 3000 },
            servers: [server],
            deployStrategy: "rolling",
            status: "failed",
            createdBy: user,
            createdAt: now,
            updatedAt: now,
          }),
        });
        const deployment = new ObjectId();
        await db.collection("deployments").insertOne({
          _id: deployment,
          tenant: tenantId,
          project,
          trigger: "manual",
          strategy: "rolling",
          status: "failed",
          servers: [],
          builds: [{ seq: 1, status: "failed", error: "exit code 127" }],
          errorSummary: "Build failed",
          noCache: false,
          createdAt: now,
        });
        return { project, deployment };
      };
      const fixAnswer = {
        explanation: "The start command is misspelled.",
        template: {
          source: DOCKERFILE('["npm", "start"]'),
          inputs: [],
          port: 3000,
          healthcheckPath: "/",
          cachePaths: [],
        },
      };

      await t.step("fix: a new version of the project's template", async () => {
        const template = await createTemplate({
          tenant: tenantId,
          user,
          kind: "app",
          slug: "ai-web",
          name: "Web",
          content: {
            dockerfile: DOCKERFILE('["npm", "strat"]'),
            inputs: [],
            defaults: {},
            cachePaths: [],
          },
        });
        const { project, deployment } = await failed(template, "web-own");
        const prompts = script([fixAnswer]);
        const res = await call("POST", "/ai/api/fix", {
          deployment: String(deployment),
          log: "sh: strat: not found",
        });
        assertEquals(res.status, 200, JSON.stringify(res.json));
        assertMatch(prompts[0], /strat: not found/);
        assertMatch(prompts[0], /exit code 127/);
        assertMatch(res.json.content.dockerfile, /npm", "start/);
        assertMatch(res.json.content.changelog, /^AI fix: /);

        const applied = await call("POST", "/ai/api/fix/apply", {
          project: String(project),
          content: res.json.content,
        });
        assertEquals(applied.status, 200, JSON.stringify(applied.json));
        assertEquals(applied.json, { template: String(template), version: 2 });
        const doc = await db.collection("projects").findOne({ _id: project });
        assertEquals(doc!.template.version, 2);
      });

      await t.step("fix: a built-in template is copied first", async () => {
        await upsertSystemTemplate({
          slug: systemSlug,
          name: "Built-in web",
          kind: "app",
        }, {
          dockerfile: DOCKERFILE('["npm", "strat"]'),
          inputs: [],
          defaults: {},
          cachePaths: [],
        });
        const system = await db.collection("templates").findOne({
          scope: "system",
          slug: systemSlug,
        });
        const { project, deployment } = await failed(system!._id, "web-sys");
        script([fixAnswer]);
        const res = await call("POST", "/ai/api/fix", {
          deployment: String(deployment),
        });
        const applied = await call("POST", "/ai/api/fix/apply", {
          project: String(project),
          content: res.json.content,
        });
        assertEquals(applied.status, 200, JSON.stringify(applied.json));
        assert(applied.json.template !== String(system!._id));
        const copy = await db.collection("templates").findOne({
          _id: new ObjectId(applied.json.template),
        });
        assertEquals(copy!.scope, "tenant");
        assertEquals(copy!.slug, `${systemSlug}-web-sys`);
        const doc = await db.collection("projects").findOne({ _id: project });
        assertEquals(String(doc!.template.template), applied.json.template);
        assertEquals(doc!.template.version, 1);
      });

      await t.step("only failed deployments", async () => {
        const deployment = await db.collection("deployments").findOne({
          tenant: tenantId,
        });
        await db.collection("deployments").updateOne({ _id: deployment!._id }, {
          $set: { status: "running" },
        });
        const res = await call("POST", "/ai/api/fix", {
          deployment: String(deployment!._id),
        });
        assertEquals(res.status, 400);
      });
    } finally {
      aiOptions.model = undefined;
      const system = await db.collection("templates").findOne({
        scope: "system",
        slug: systemSlug,
      });
      await Promise.all([
        db.collection("subscriptionPeriods").deleteMany({ tenant: tenantId }),
        db.collection("projects").deleteMany({ tenant: tenantId }),
        db.collection("servers").deleteMany({ tenant: tenantId }),
        db.collection("deployments").deleteMany({ tenant: tenantId }),
        db.collection("templates").deleteMany({
          $or: [{ tenant: tenantId }, { slug: systemSlug }],
        }),
        system &&
        db.collection("templateVersions").deleteMany({ template: system._id }),
        db.collection("rateCounters").deleteMany({
          _id: new RegExp(`^ai:${tenantId}:`) as never,
        }),
      ]);
      entitlements.invalidate(tenantId);
      await cleanup();
    }
  },
});
