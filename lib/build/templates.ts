import { projectModel } from "@/schemas/applications/project.ts";
import { asBadRequest } from "@/lib/core/errors.ts";
import { type ClientSession, ObjectId } from "mongodb";
import { Response } from "@/core/http/response.ts";
import { isDuplicateKeyError, mongodb } from "@/database.ts";
import { entitlements, quotaGuard } from "@/lib/services.ts";
import {
  assertValidSource,
  OUTPUT_FILE,
  renderContent,
  TemplateError,
} from "@/lib/build/render.ts";
import { parseCompose } from "@/lib/deploy/compose.ts";
import {
  templateModel,
  templateVersionModel,
  type TTemplate,
  type TTemplateContent,
  type TTemplateVersion,
} from "@/schemas/build/template.ts";

type TKind = TTemplate["kind"];

/** System templates that are published, plus the tenant's own. */
const visibleFilter = (tenant: ObjectId) => ({
  $or: [{ scope: "system" as const, isPublished: true }, {
    scope: "tenant" as const,
    tenant,
  }],
});

/** A version must carry the source its kind renders, and it must parse. */
const checkContent = (kind: TKind, content: TTemplateContent) => {
  const source = kind === "app" ? content.dockerfile : content.compose;
  if (!source) {
    throw new TemplateError(
      kind === "app"
        ? "An app template needs a Dockerfile"
        : "A service template needs a compose file",
    );
  }
  assertValidSource(source);
  const keys = content.inputs.map((i) => i.key);
  const duplicate = keys.find((k, i) => keys.indexOf(k) !== i);
  if (duplicate) {
    throw new TemplateError(`Input ${duplicate} is declared twice`);
  }
};

const assertContent = (kind: TKind, content: TTemplateContent) =>
  asBadRequest(() => checkContent(kind, content), TemplateError);

/**
 * Whether a version would deploy: valid content that renders with its
 * defaults, and for services, a compose file the platform supports. Returns
 * the problem instead of throwing, so the AI assistant can try again.
 */
export function contentProblem(kind: TKind, content: TTemplateContent) {
  // What a user would type for required inputs without a default.
  const sample = Object.fromEntries(
    content.inputs.filter((i) => i.required && i.default === undefined).map(
      (i) => [
        i.key,
        i.type === "number"
          ? 1
          : i.type === "boolean"
          ? true
          : i.type === "select"
          ? i.options?.[0] ?? ""
          : "example",
      ],
    ),
  );
  try {
    checkContent(kind, content);
    const { files } = renderContent(kind, content, sample, {
      cacheKey: "check",
    });
    if (kind === "service") parseCompose(files[OUTPUT_FILE.service], "check-");
    return undefined;
  } catch (error) {
    return (error as Error).message;
  }
}

const slugTaken = (slug: string) =>
  Response.badRequest(`A template with the slug ${slug} already exists`);

const transaction = <T>(fn: (session: ClientSession) => Promise<T>) =>
  mongodb.withSession((s) => s.withTransaction(fn));

export async function listTemplates(tenant: ObjectId) {
  return await templateModel.find(visibleFilter(tenant), {
    sort: { scope: 1, name: 1 },
    limit: 500,
  }).toArray();
}

/** A visible template and one of its versions (the latest by default), or 404. */
export async function getTemplate(
  id: ObjectId,
  tenant: ObjectId,
  version?: number,
) {
  const template = await templateModel.findOne({
    _id: id,
    ...visibleFilter(tenant),
  });
  if (!template) throw Response.notFound("Template not found");
  const content = await templateVersionModel.findOne({
    template: id,
    version: version ?? template.latestVersion,
  });
  if (!content) throw Response.notFound("Version not found");
  return { template, content };
}

export async function listVersions(id: ObjectId, tenant: ObjectId) {
  await getTemplate(id, tenant);
  return await templateVersionModel.find({ template: id }, {
    projection: { version: 1, changelog: 1, createdAt: 1, createdBy: 1 },
    sort: { version: -1 },
    limit: 200,
  }).toArray();
}

const insertTemplate = async (
  doc: Omit<
    TTemplate,
    "latestVersion" | "createdAt" | "updatedAt" | "isPublished"
  >,
  content: TTemplateContent,
  session?: ClientSession,
) => {
  const _id = new ObjectId();
  const now = new Date();
  try {
    await templateModel.insertOne({
      _id,
      ...doc,
      latestVersion: 1,
      isPublished: true,
      createdAt: now,
      updatedAt: now,
    }, { session });
  } catch (error) {
    if (isDuplicateKeyError(error)) throw slugTaken(doc.slug);
    throw error;
  }
  await templateVersionModel.insertOne({
    ...content,
    template: _id,
    version: 1,
    createdBy: doc.createdBy,
    createdAt: now,
  }, { session });
  return _id;
};

/** Counts against the plan's `templates` quota inside the same transaction. */
const withTemplateSlot = async <T>(
  tenant: ObjectId,
  fn: (session: ClientSession) => Promise<T>,
) => {
  const { limits } = await entitlements.resolve(tenant);
  return await transaction(async (session) => {
    if (
      !await quotaGuard.acquire(tenant, "templates", limits.templates, session)
    ) {
      throw Response.forbidden(
        `Your plan allows ${limits.templates} templates. Delete one or upgrade.`,
      );
    }
    return await fn(session);
  });
};

export async function createTemplate(opts: {
  tenant: ObjectId;
  user: ObjectId;
  kind: TKind;
  slug: string;
  name: string;
  description?: string;
  icon?: string;
  content: TTemplateContent;
}) {
  assertContent(opts.kind, opts.content);
  return await withTemplateSlot(opts.tenant, (session) =>
    insertTemplate(
      {
        scope: "tenant",
        tenant: opts.tenant,
        kind: opts.kind,
        slug: opts.slug,
        name: opts.name,
        description: opts.description,
        icon: opts.icon,
        createdBy: opts.user,
      },
      opts.content,
      session,
    ));
}

/** Copies a visible template's latest version into a new tenant template (PLAN §9.1). */
export async function cloneTemplate(opts: {
  id: ObjectId;
  tenant: ObjectId;
  user: ObjectId;
  slug: string;
  name: string;
}) {
  const { template, content } = await getTemplate(opts.id, opts.tenant);
  const {
    _id: _,
    template: __,
    version,
    createdAt: ___,
    createdBy: ____,
    ...copy
  } = content;

  return await withTemplateSlot(opts.tenant, (session) =>
    insertTemplate(
      {
        scope: "tenant",
        tenant: opts.tenant,
        kind: template.kind,
        slug: opts.slug,
        name: opts.name,
        description: template.description,
        icon: template.icon,
        clonedFrom: { template: template._id, version },
        createdBy: opts.user,
      },
      { ...copy, changelog: `Cloned from ${template.name} v${version}` },
      session,
    ));
}

/** Every save is a new immutable version (PLAN §9.1); the counter makes numbers unique. */
export async function saveVersion(opts: {
  id: ObjectId;
  tenant: ObjectId;
  user: ObjectId;
  content: TTemplateContent;
}) {
  const filter = {
    _id: opts.id,
    scope: "tenant" as const,
    tenant: opts.tenant,
  };
  const template = await templateModel.findOne(filter, {
    projection: { kind: 1 },
  });
  if (!template) throw Response.notFound("Template not found");
  assertContent(template.kind, opts.content);

  return await transaction(async (session) => {
    const updated = await templateModel.findOneAndUpdate(filter, {
      $inc: { latestVersion: 1 },
      $set: { updatedAt: new Date() },
    }, { session, returnDocument: "after", projection: { latestVersion: 1 } });
    const version = updated!.latestVersion;
    await templateVersionModel.insertOne({
      ...opts.content,
      template: opts.id,
      version,
      createdBy: opts.user,
      createdAt: new Date(),
    }, { session });
    return version;
  });
}

export async function updateTemplateMeta(
  id: ObjectId,
  tenant: ObjectId,
  meta: { name?: string; description?: string; icon?: string },
) {
  const { matchedCount } = await templateModel.updateOne(
    { _id: id, scope: "tenant", tenant },
    { $set: { ...meta, updatedAt: new Date() } },
  );
  if (!matchedCount) throw Response.notFound("Template not found");
}

/** A template in use by a project stays: its next deploy needs it. */
export async function deleteTemplate(id: ObjectId, tenant: ObjectId) {
  const used = await projectModel.countDocuments(
    { tenant, "template.template": id },
    { limit: 1 },
  );
  if (used) {
    throw Response.badRequest(
      "Projects use this template: move them to another one first",
    );
  }
  await transaction(async (session) => {
    const { deletedCount } = await templateModel.deleteOne(
      { _id: id, scope: "tenant", tenant },
      { session },
    );
    if (!deletedCount) throw Response.notFound("Template not found");
    await templateVersionModel.deleteMany({ template: id }, { session });
    await quotaGuard.release(tenant, "templates", session);
  });
}

/** Preview: renders a version with sample inputs, exactly as a deploy would. */
export async function previewTemplate(opts: {
  id: ObjectId;
  tenant: ObjectId;
  version?: number;
  inputs: Record<string, unknown>;
}) {
  const { template, content } = await getTemplate(
    opts.id,
    opts.tenant,
    opts.version,
  );
  return asBadRequest(
    () =>
      renderContent(template.kind, content, opts.inputs, {
        cacheKey: "preview",
      }),
    TemplateError,
  );
}

/** For the seed script: system templates by slug, a new version only when content changed. */
export async function upsertSystemTemplate(
  meta: Pick<TTemplate, "slug" | "name" | "description" | "icon" | "kind">,
  content: TTemplateContent,
) {
  assertContent(meta.kind, content);
  const existing = await templateModel.findOne({
    scope: "system",
    slug: meta.slug,
  });
  if (!existing) {
    await insertTemplate({ scope: "system", ...meta }, content);
    return "created";
  }

  const latest = await templateVersionModel.findOne({
    template: existing._id,
    version: existing.latestVersion,
  });
  const comparable = (v?: Partial<TTemplateVersion> | null) =>
    JSON.stringify([
      v?.dockerfile,
      v?.compose,
      v?.inputs,
      v?.defaults,
      v?.cachePaths,
    ]);
  await templateModel.updateOne({ _id: existing._id }, { $set: meta });
  if (comparable(latest) === comparable(content)) return "unchanged";

  const version = existing.latestVersion + 1;
  await transaction(async (session) => {
    await templateVersionModel.insertOne({
      ...content,
      template: existing._id,
      version,
      createdAt: new Date(),
    }, { session });
    await templateModel.updateOne({ _id: existing._id }, {
      $set: { latestVersion: version, updatedAt: new Date() },
    }, { session });
  });
  return "updated";
}
