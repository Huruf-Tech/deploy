import z from "zod";
import { type ObjectId } from "mongodb";
import { generateText, type ModelMessage, Output } from "ai";
import { Response } from "@/core/http/response.ts";
import { aiModel, withAiQuota } from "@/lib/ai/model.ts";
import {
  contentProblem,
  createTemplate,
  getTemplate,
  listTemplates,
  saveVersion,
} from "@/lib/build/templates.ts";
import { resolveInputs } from "@/lib/build/render.ts";
import { getProject, updateProject } from "@/lib/deploy/projects.ts";
import {
  readRepoFile,
  readRepoTree,
  usableIntegration,
} from "@/lib/github/integrations.ts";
import { deploymentModel } from "@/schemas/applications/deployment.ts";
import {
  $templateContent,
  templateModel,
  templateVersionModel,
  type TTemplate,
  type TTemplateContent,
} from "@/schemas/build/template.ts";
import { systemTemplates } from "@/scripts/data/systemTemplates.ts";

type TKind = TTemplate["kind"];

/*
 * What the model returns. Every field is required (nullable when it may be
 * absent): OpenAI's strict structured output allows no optional fields, and
 * this way one schema works for every provider.
 */
const $aiInput = z.object({
  key: z.string().describe("Letters, digits and underscores"),
  label: z.string(),
  description: z.string().nullable(),
  type: z.enum(["string", "number", "boolean", "select", "secret"]),
  default: z.string().nullable().describe("As text, whatever the type"),
  required: z.boolean(),
  options: z.array(z.string()).nullable().describe("For `select` only"),
  generate: z.enum(["password"]).nullable().describe(
    "`password` for secrets the platform should generate",
  ),
});

const $aiTemplate = z.object({
  source: z.string().describe(
    "The Dockerfile (app) or compose YAML (service), with Handlebars",
  ),
  inputs: z.array($aiInput),
  port: z.number().int().nullable(),
  healthcheckPath: z.string().nullable(),
  cachePaths: z.array(z.string()),
});

/** What to deploy: an existing template when one fits, else a new one. */
const $aiPlan = z.object({
  explanation: z.string().describe(
    "For the user, in a few sentences: what will run, which template and why, and any choice or limit they should know",
  ),
  existingTemplate: z.string().nullable().describe(
    "The slug of a listed template that fits, or null to write a new one",
  ),
  inputs: z.array(z.object({ key: z.string(), value: z.string() })).describe(
    "Values for the chosen existing template's inputs, where the request or repository says what they should be; leave out passwords the platform generates",
  ),
  template: $aiTemplate.extend({
    kind: z.enum(["app", "service"]),
    name: z.string(),
    description: z.string(),
  }).nullable().describe("A new template, only when no listed one fits"),
  projectName: z.string(),
  replicas: z.number().int().nullable().describe(
    'Replicas per server, when the request says ("single instance" = 1)',
  ),
  domains: z.array(z.string()).describe(
    "Custom domains the request asks to serve the project at, e.g. app.example.com",
  ),
});

type TAiPlan = z.output<typeof $aiPlan>;

const $aiFix = z.object({
  explanation: z.string().describe(
    "For the user: the cause of the failure and what changes",
  ),
  template: $aiTemplate.nullable().describe(
    "The corrected template, or null when the fix isn't in the template",
  ),
});

type TAiTemplate = z.output<typeof $aiTemplate>;

const nonNull = <T extends Record<string, unknown>>(o: T) =>
  Object.fromEntries(Object.entries(o).filter(([, v]) => v !== null));

/** The model's template as stored content; zod errors become the problem. */
function toContent(ai: TAiTemplate, changelog?: string) {
  const parsed = $templateContent.safeParse({
    [
      ai.source.includes("services:") && !/^\s*FROM\s/im.test(ai.source)
        ? "compose"
        : "dockerfile"
    ]: ai.source,
    inputs: ai.inputs.map((i) => {
      const input = nonNull(i);
      if (i.default !== null) {
        input.default = i.type === "number"
          ? Number(i.default)
          : i.type === "boolean"
          ? i.default === "true"
          : i.default;
      }
      return input;
    }),
    defaults: nonNull({ port: ai.port, healthcheckPath: ai.healthcheckPath }),
    cachePaths: ai.cachePaths,
    ...(changelog ? { changelog: changelog.slice(0, 1_000) } : {}),
  });
  return parsed.success
    ? { content: parsed.data }
    : { problem: z.prettifyError(parsed.error) };
}

const example = (slug: string) => {
  const t = systemTemplates.find((x) => x.meta.slug === slug)!;
  return JSON.stringify({ kind: t.meta.kind, ...t.content }, null, 2);
};

const SYSTEM =
  `You write deployment templates for Huruf Deploy, a platform that runs Docker containers on the user's servers.

A template is either:
- "app": a Dockerfile that builds the user's repository. Multi-stage builds; copy lockfiles before the source; cache only package-manager download stores with \`RUN --mount=type=cache,id={{build.cacheKey}}-<name>,target=<path>\` and list those paths in cachePaths. Build-time variables come as a secret, never ARG/ENV: \`RUN --mount=type=secret,id=huruf-env . /run/secrets/huruf-env && <command>\`. Runtime variables are injected by the platform, so don't hard-code them.
- "service": a compose file for ready-made software (databases, caches…). Supported keys only: services.<name>.{image, command, environment, volumes (named volumes only, no bind mounts), healthcheck, ports, expose, restart, depends_on, labels} and top-level volumes. No build:, no networks:.

Both are Handlebars (strict mode, no HTML escaping): use {{inputs.<key>}} for values the user chooses, and every input you reference must be declared. Inputs: type string|number|boolean|select|secret; passwords are type "secret" with generate "password" (stored as secret variables). Set port (what the app listens on) and healthcheckPath (an HTTP path answering 200) when they apply.

On this platform, replicas are identical copies of a service behind a load balancer. That's right for stateless apps and caches, but software that needs different roles (e.g. Redis or Postgres replication with a primary and replicas) can't be made by raising replicas: say so in the explanation and offer a single instance, or describe the extra services needed.

Example app template:
${example("node")}

Example service template:
${example("redis")}`;

const KEY_FILES =
  /^(?:[^/]+\/)?(package\.json|deno\.jsonc?|go\.mod|requirements\.txt|pyproject\.toml|Pipfile|Gemfile|composer\.json|Cargo\.toml|pom\.xml|build\.gradle(?:\.kts)?|Dockerfile|docker-compose\.ya?ml|compose\.ya?ml|Procfile|\.nvmrc|\.node-version|\.python-version|(?:next|vite|nuxt|astro|svelte)\.config\.[cm]?[jt]s|README\.md)$/;
const MAX_FILES = 12;
const MAX_FILE = 8_000;
const MAX_LOG = 40_000;

export type TRepoRef = {
  integration: ObjectId;
  installation: number;
  repo: string;
  branch: string;
};

/** The file list and a bounded set of key files, as prompt text. */
async function repoContext(tenant: ObjectId, user: ObjectId, ref: TRepoRef) {
  const doc = await usableIntegration(ref.integration, tenant, user);
  const tree = await readRepoTree(doc, ref.installation, ref.repo, ref.branch);
  const keys = tree.filter((f) =>
    KEY_FILES.test(f.path) &&
    (f.size ?? 0) < 500_000
  ).slice(0, MAX_FILES);
  const files = await Promise.all(keys.map(async (f) => {
    const text = await readRepoFile(
      doc,
      ref.installation,
      ref.repo,
      ref.branch,
      f.path,
    ).catch(() => "");
    return `--- ${f.path}\n${text.slice(0, MAX_FILE)}`;
  }));
  return `Repository ${ref.repo} (branch ${ref.branch}). Files:\n${
    tree.slice(0, 400).map((f) => f.path).join("\n")
  }${
    tree.length > 400 ? `\n… and ${tree.length - 400} more` : ""
  }\n\nKey files:\n${files.join("\n\n")}`;
}

/**
 * Asks for a schema-shaped answer, and when the template doesn't validate,
 * shows the model the problem and asks again (twice at most).
 */
async function generateValid<T>(
  schema: z.ZodType<T>,
  prompt: string,
  check: (output: T) => string | undefined,
) {
  const model = await aiModel();
  const messages: ModelMessage[] = [{ role: "user", content: prompt }];
  let problem = "";
  for (let attempt = 0; attempt < 3; attempt++) {
    const { output } = await generateText({
      model,
      system: SYSTEM,
      messages,
      output: Output.object({ schema }),
    }).catch((error) => {
      throw Response.badRequest(
        `The AI provider failed: ${(error as Error).message.slice(0, 300)}`,
      );
    });
    problem = check(output) ?? "";
    if (!problem) return output;
    messages.push(
      { role: "assistant", content: JSON.stringify(output) },
      {
        role: "user",
        content:
          `That template doesn't validate: ${problem}\nReturn the full corrected answer.`,
      },
    );
  }
  throw Response.badRequest(
    `The AI couldn't produce a valid template: ${problem}`,
  );
}

const templateProblem = (kind: TKind, template: TAiTemplate | null) => {
  if (!template) return undefined;
  const { content, problem } = toContent(template);
  return problem ?? contentProblem(kind, content!);
};

const HOSTNAME =
  /^(?=.{1,253}$)(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))+$/;

/** The tenant's and the published built-in templates, with their inputs. */
async function templateCatalog(tenant: ObjectId) {
  const templates = (await listTemplates(tenant)).slice(0, 80);
  const versions = templates.length
    ? await templateVersionModel.find({
      $or: templates.map((t) => ({
        template: t._id,
        version: t.latestVersion,
      })),
    }, { projection: { template: 1, inputs: 1 } }).toArray()
    : [];
  return templates.map((t) => ({
    ...t,
    inputs: versions.find((v) => v.template.equals(t._id))?.inputs ?? [],
  }))
    // The tenant's own first: they win when a slug is in both.
    .sort((a, b) => (a.scope === b.scope ? 0 : a.scope === "tenant" ? -1 : 1));
}

/**
 * A deployment plan from a request and, optionally, a GitHub repo: an
 * existing template when one fits (with its input values), or a new one;
 * plus the project's name, replicas and the domains the request names.
 */
export async function draftTemplate(opts: {
  tenant: ObjectId;
  user: ObjectId;
  description: string;
  repo?: TRepoRef;
}) {
  const context = opts.repo
    ? await repoContext(opts.tenant, opts.user, opts.repo)
    : "No repository: this is ready-made software, so use or write a service template unless the description says otherwise.";
  const catalog = await templateCatalog(opts.tenant);
  const listing = JSON.stringify(catalog.map((t) => ({
    slug: t.slug,
    name: t.name,
    kind: t.kind,
    ...(t.scope === "tenant" ? { own: true } : {}),
    description: t.description,
    inputs: t.inputs.map((i) =>
      nonNull({
        key: i.key,
        label: i.label,
        type: i.type,
        default: i.default ?? null,
        options: i.options ?? null,
        required: i.required || null,
        generated: i.generate ? true : null,
      })
    ),
  })));

  const find = (slug: string) => catalog.find((t) => t.slug === slug);
  /** The chosen template and the values given for its inputs. */
  const chosen = (plan: TAiPlan) => {
    const template = find(plan.existingTemplate!)!;
    const values = Object.fromEntries(
      plan.inputs.filter((i) => template.inputs.some((d) => d.key === i.key))
        .map((i) => [i.key, i.value]),
    );
    // Checks types and options; passwords left empty are generated at deploy.
    resolveInputs(template.inputs, values);
    return { template, values };
  };
  const planProblem = (plan: TAiPlan) => {
    if (!plan.existingTemplate) {
      return plan.template
        ? templateProblem(plan.template.kind, plan.template)
        : "Pick a listed template or write a new one.";
    }
    const template = find(plan.existingTemplate);
    if (!template) {
      return `There's no listed template with the slug "${plan.existingTemplate}": pick a listed slug, or null to write a new one.`;
    }
    const unknown = plan.inputs.filter((i) =>
      !template.inputs.some((d) => d.key === i.key)
    );
    if (unknown.length) {
      return `The template has no input ${
        unknown.map((i) => i.key).join(", ")
      }.`;
    }
    try {
      chosen(plan);
      return undefined;
    } catch (error) {
      return (error as Error).message;
    }
  };

  return await withAiQuota(opts.tenant, async () => {
    const plan = await generateValid(
      $aiPlan,
      `Plan a deployment for this request. Prefer a listed template when one fits the software or stack (the user's own templates first): only write a new template when none does, or when what's needed can't be reached through a listed template's inputs.

Request: ${opts.description}

Templates available:
${listing}

${context}`,
      planProblem,
    );

    const shared = {
      explanation: plan.explanation,
      name: plan.projectName.slice(0, 80),
      ...(plan.replicas && plan.replicas > 0
        ? { replicas: Math.min(plan.replicas, 20) }
        : {}),
      domains: [
        ...new Set(
          plan.domains.map((d) => d.trim().toLowerCase().replace(/\.$/, ""))
            .filter((d) => HOSTNAME.test(d)),
        ),
      ],
    };
    if (plan.existingTemplate) {
      const { template, values } = chosen(plan);
      return {
        ...shared,
        kind: template.kind,
        existing: {
          template: String(template._id),
          name: template.name,
          inputs: template.inputs,
          values,
        },
      };
    }
    const draft = plan.template!;
    return {
      ...shared,
      kind: draft.kind,
      template: {
        name: draft.name.slice(0, 80),
        description: draft.description.slice(0, 500),
        content: toContent(draft).content!,
      },
    };
  });
}

/**
 * A proposed fix for a failed deployment: the cause, and for projects built
 * from a template, a corrected version to review. `log` is the build log
 * the dashboard already shows (the control plane doesn't keep build logs).
 */
export async function fixDeployment(opts: {
  tenant: ObjectId;
  deployment: ObjectId;
  log?: string;
}) {
  const deployment = await deploymentModel.findOne({
    _id: opts.deployment,
    tenant: opts.tenant,
  });
  if (!deployment) throw Response.notFound("Deployment not found");
  if (deployment.status !== "failed") {
    throw Response.badRequest("Only a failed deployment can be fixed");
  }
  const project = await getProject(opts.tenant, deployment.project);
  const template = project.template
    ? await getTemplate(
      project.template.template,
      opts.tenant,
      project.template.version,
    )
    : undefined;

  const failures = [
    deployment.errorSummary,
    ...(deployment.builds ?? []).map((b) => b.error),
    ...(deployment.rollout?.servers ?? []).map((s) => s.error),
  ].filter(Boolean);
  const prompt = `This deployment failed. Find the cause and fix it.

Project: kind ${project.kind}, source ${project.source.type}, build mode ${project.build.mode}.
Runtime settings: ${JSON.stringify(project.runtime)}
Non-secret template inputs: ${JSON.stringify(project.templateInputs ?? {})}
Errors recorded: ${failures.join("\n") || "none"}

${
    template
      ? `Template "${template.template.name}" (${template.template.kind}) v${template.content.version}:\n${
        JSON.stringify(
          {
            source: template.content.dockerfile ?? template.content.compose,
            inputs: template.content.inputs,
            defaults: template.content.defaults,
            cachePaths: template.content.cachePaths,
          },
          null,
          2,
        )
      }`
      : "The project isn't built from a template: return template null and explain the fix in the explanation."
  }

Log (end):
${(opts.log ?? "").slice(-MAX_LOG) || "not available"}`;

  return await withAiQuota(opts.tenant, async () => {
    const fix = await generateValid(
      $aiFix,
      prompt,
      (f) =>
        template
          ? templateProblem(template.template.kind, f.template)
          : undefined,
    );
    return {
      project: String(project._id),
      explanation: fix.explanation,
      ...(template && fix.template
        ? {
          template: String(template.template._id),
          baseVersion: template.content.version,
          content: toContent(fix.template, `AI fix: ${fix.explanation}`)
            .content!,
        }
        : {}),
    };
  });
}

/**
 * Puts an accepted fix in place: a new version of the project's own template,
 * or, for a built-in one, a copy in the tenant. The project then uses it from
 * its next deploy.
 */
export async function applyFix(opts: {
  tenant: ObjectId;
  user: ObjectId;
  project: ObjectId;
  content: TTemplateContent;
}) {
  const project = await getProject(opts.tenant, opts.project);
  if (!project.template) {
    throw Response.badRequest("This project isn't built from a template");
  }
  const { template } = await getTemplate(
    project.template.template,
    opts.tenant,
  );
  const problem = contentProblem(template.kind, opts.content);
  if (problem) throw Response.badRequest(problem);

  if (template.scope === "tenant") {
    const version = await saveVersion({
      id: template._id,
      tenant: opts.tenant,
      user: opts.user,
      content: opts.content,
    });
    await updateProject({
      tenant: opts.tenant,
      id: opts.project,
      patch: { templateVersion: version },
    });
    return { template: String(template._id), version };
  }

  const base = `${template.slug}-${project.slug}`.toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-").slice(0, 52);
  let slug = base;
  for (
    let n = 2;
    await templateModel.findOne({ tenant: opts.tenant, slug }, {
      projection: { _id: 1 },
    });
    n++
  ) slug = `${base}-${n}`;
  const id = await createTemplate({
    tenant: opts.tenant,
    user: opts.user,
    kind: template.kind,
    slug,
    name: `${template.name} (${project.name})`.slice(0, 80),
    description: template.description,
    icon: template.icon,
    content: opts.content,
  });
  await updateProject({
    tenant: opts.tenant,
    id: opts.project,
    patch: { template: id, templateVersion: 1 },
  });
  return { template: String(id), version: 1 };
}
