import { ObjectId, type WithId } from "mongodb";
import type z from "zod";
import { Response } from "@/core/http/response.ts";
import { entitlements, keyring, rateLimiter } from "@/lib/services.ts";
import {
  referencedScopes,
  resolveReferences,
  VariableReferenceError,
} from "@/lib/variables/references.ts";
import type { TKeyringOwner } from "@/schemas/crypto/keyring.ts";
import {
  type $variableSettings,
  type TVariable,
  variableModel,
} from "@/schemas/configuration/variable.ts";
import { projectModel } from "@/schemas/applications/project.ts";

/** Where a variable lives: the user's own (global) scope, a tenant's, or a project's. */
export type TVariableOwner =
  | { scope: "global"; user: ObjectId }
  | { scope: "tenant"; tenant: ObjectId }
  | { scope: "project"; tenant: ObjectId; project: ObjectId };

/**
 * The scopes a resolution sees: the workspace owner's account variables, the
 * workspace's, and optionally one project's (owner's decision: members
 * override with project variables).
 */
export type TViewer = { user: ObjectId; tenant: ObjectId; project?: ObjectId };

type TSettings = z.output<typeof $variableSettings>;

export type TResolved = {
  key: string;
  value: string;
  kind: TVariable["kind"];
  stage: TVariable["stage"];
  isSecret: boolean;
};

const ownerFilter = (owner: TVariableOwner) => {
  switch (owner.scope) {
    case "global":
      return { scope: "global" as const, user: owner.user };
    case "tenant":
      return { scope: "tenant" as const, tenant: owner.tenant };
    case "project":
      return {
        scope: "project" as const,
        tenant: owner.tenant,
        project: owner.project,
      };
  }
};

// Project variables use the tenant's data key: projects belong to the tenant.
const keyOwner = (owner: TVariableOwner): TKeyringOwner =>
  owner.scope === "global"
    ? { kind: "user", ref: owner.user }
    : { kind: "tenant", ref: owner.tenant };

// The _id is part of the AAD, so a ciphertext copied onto another variable fails to decrypt.
const seal = (owner: TVariableOwner, _id: ObjectId, value: string) =>
  keyring.encrypt(keyOwner(owner), value, `variable:${_id}`);

const unseal = (
  owner: TVariableOwner,
  doc: Pick<WithId<TVariable>, "_id" | "valueEnc">,
) => keyring.decrypt(keyOwner(owner), doc.valueEnc, `variable:${doc._id}`);

const variablesOf = (owner: TVariableOwner) =>
  variableModel.find(ownerFilter(owner), { sort: { key: 1 } }).toArray();

const valuesOf = async (
  owner: TVariableOwner,
  docs?: WithId<TVariable>[],
) =>
  Object.fromEntries(
    await Promise.all(
      (docs ?? await variablesOf(owner)).map(async (doc) =>
        [doc.key, await unseal(owner, doc)] as const
      ),
    ),
  );

const ownersOf = (viewer: TViewer): TVariableOwner[] => [
  { scope: "global", user: viewer.user },
  { scope: "tenant", tenant: viewer.tenant },
  ...(viewer.project
    ? [{
      scope: "project" as const,
      tenant: viewer.tenant,
      project: viewer.project,
    }]
    : []),
];

type TLayer = [string, Record<string, string>];

/**
 * The viewer's layers, lowest precedence first, plus reference-only layers
 * for other projects named in references (`${{shop-db.PASSWORD}}`, PLAN §12).
 */
const layersOf = async (viewer: TViewer) => {
  const owners = ownersOf(viewer);
  const docs = await Promise.all(owners.map(variablesOf));
  const layers: TLayer[] = await Promise.all(
    owners.map(async (owner, i) =>
      [owner.scope, await valuesOf(owner, docs[i])] as TLayer
    ),
  );

  const named = [
    ...referencedScopes(layers.flatMap(([, values]) => Object.values(values))),
  ].filter((scope) => !["global", "tenant", "project"].includes(scope));
  const others = named.length
    ? await projectModel.find(
      { tenant: viewer.tenant, slug: { $in: named } },
      { projection: { slug: 1 }, limit: 20 },
    ).toArray()
    : [];
  const refOnly: TLayer[] = await Promise.all(
    others.map(async (p) =>
      [
        p.slug,
        await valuesOf({
          scope: "project",
          tenant: viewer.tenant,
          project: p._id,
        }),
      ] as TLayer
    ),
  );
  return { layers, refOnly, docs: docs.flat() };
};

const asBadRequest = <T>(fn: () => T) => {
  try {
    return fn();
  } catch (error) {
    if (error instanceof VariableReferenceError) {
      throw Response.badRequest(error.message);
    }
    throw error;
  }
};

/**
 * Rejects a change that would create a reference cycle in what the viewer
 * resolves. Missing references are allowed here (they may be added next)
 * and fail at resolve time instead.
 */
const assertNoCycle = async (
  viewer: TViewer,
  owner: TVariableOwner,
  key: string,
  value: string,
) => {
  const { layers, refOnly } = await layersOf(viewer);
  asBadRequest(() =>
    resolveReferences(
      layers.map((
        [scope, values],
      ) => [
        scope,
        scope === owner.scope ? { ...values, [key]: value } : values,
      ]),
      { allowMissing: true, refOnly },
    )
  );
};

/** Values of secrets are left out; they are read one at a time with `revealVariable`. */
export async function listVariables(owner: TVariableOwner) {
  return await Promise.all(
    (await variablesOf(owner)).map(async ({ valueEnc, ...doc }) => ({
      ...doc,
      value: doc.isSecret ? undefined : await unseal(owner, {
        _id: doc._id,
        valueEnc,
      }),
    })),
  );
}

export async function createVariable(opts: {
  viewer: TViewer;
  owner: TVariableOwner;
  key: string;
  value: string;
  settings: TSettings;
  /** The caller who saved it; defaults to the viewer's user. */
  by?: ObjectId;
}) {
  // Bounded by the limit, so this reads at most `limit` index entries.
  const { limits } = await entitlements.resolve(opts.viewer.tenant);
  const count = await variableModel.countDocuments(ownerFilter(opts.owner), {
    limit: limits.variablesPerScope,
  });
  if (count >= limits.variablesPerScope) {
    throw Response.forbidden(
      `This scope already has ${limits.variablesPerScope} variables, the most your plan allows`,
    );
  }

  await assertNoCycle(opts.viewer, opts.owner, opts.key, opts.value);

  const _id = new ObjectId();
  const now = new Date();
  try {
    await variableModel.insertOne({
      _id,
      ...ownerFilter(opts.owner),
      ...opts.settings,
      key: opts.key,
      valueEnc: await seal(opts.owner, _id, opts.value),
      version: 1,
      updatedBy: opts.by ?? opts.viewer.user,
      createdAt: now,
      updatedAt: now,
    });
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      throw Response.badRequest(`${opts.key} already exists in this scope`);
    }
    throw error;
  }
  return _id;
}

export async function updateVariable(opts: {
  viewer: TViewer;
  owner: TVariableOwner;
  id: ObjectId;
  value?: string;
  settings: Partial<TSettings>;
  by?: ObjectId;
}) {
  const filter = { _id: opts.id, ...ownerFilter(opts.owner) };
  const doc = await variableModel.findOne(filter, { projection: { key: 1 } });
  if (!doc) throw Response.notFound("Variable not found");

  const $set: Partial<TVariable> = {
    ...opts.settings,
    updatedBy: opts.by ?? opts.viewer.user,
    updatedAt: new Date(),
  };
  if (opts.value !== undefined) {
    await assertNoCycle(opts.viewer, opts.owner, doc.key, opts.value);
    $set.valueEnc = await seal(opts.owner, opts.id, opts.value);
  }

  await variableModel.updateOne(filter, { $set, $inc: { version: 1 } });
}

export async function deleteVariable(owner: TVariableOwner, id: ObjectId) {
  const { deletedCount } = await variableModel.deleteOne({
    _id: id,
    ...ownerFilter(owner),
  });
  if (!deletedCount) throw Response.notFound("Variable not found");
}

/** Removes every variable of a deleted project. */
export async function deleteProjectVariables(
  tenant: ObjectId,
  project: ObjectId,
) {
  await variableModel.deleteMany({ scope: "project", tenant, project });
}

// ponytail: reveals are not audited; the owner turned audit logs off for now (PLAN §12 asks for it).
export async function revealVariable(owner: TVariableOwner, id: ObjectId) {
  const doc = await variableModel.findOne(
    { _id: id, ...ownerFilter(owner) },
    { projection: { valueEnc: 1 } },
  );
  if (!doc) throw Response.notFound("Variable not found");
  return await unseal(owner, doc);
}

/**
 * Everything the viewer resolves (project over tenant over global),
 * references expanded, with each key's kind and stage from the winning scope.
 * Deploys snapshot this into the release (PLAN §12).
 */
export async function resolveVariableSet(
  viewer: TViewer,
): Promise<TResolved[]> {
  const { layers, refOnly, docs } = await layersOf(viewer);
  const values = asBadRequest(() => resolveReferences(layers, { refOnly }));

  // Docs come in scope order, so the last one for a key is the winning scope's.
  const settings = new Map(docs.map((doc) => [doc.key, doc]));
  return Object.entries(values).map(([key, value]) => {
    const doc = settings.get(key)!;
    return {
      key,
      value,
      kind: doc.kind,
      stage: doc.stage,
      isSecret: doc.isSecret,
    };
  });
}

/** Splits a resolved set into container env and files for one stage. */
export function forStage(set: TResolved[], stage?: "build" | "runtime") {
  const env: Record<string, string> = {};
  const files: Record<string, string> = {};
  for (const v of set) {
    if (stage && v.stage !== "both" && v.stage !== stage) continue;
    (v.kind === "file" ? files : env)[v.key] = v.value;
  }
  return { env, files };
}

/** `variables.resolve` for scripts (PLAN §12), rate-limited per tenant. */
export async function resolveVariables(
  viewer: TViewer,
  stage?: "build" | "runtime",
) {
  const { limits } = await entitlements.resolve(viewer.tenant);
  if (
    !await rateLimiter.hit(
      `variables:${viewer.tenant}`,
      limits.variableApiReadsPerMinute,
      60,
    )
  ) throw Response.json({ message: "Too many reads" }, { status: 429 });

  return forStage(await resolveVariableSet(viewer), stage);
}
