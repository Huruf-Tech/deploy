import { ObjectId, type WithId } from "mongodb";
import type z from "zod";
import { Response } from "@/core/http/response.ts";
import { entitlements, keyring, rateLimiter } from "@/lib/services.ts";
import {
  resolveReferences,
  VariableReferenceError,
} from "@/lib/variables/references.ts";
import type { TKeyringOwner } from "@/schemas/crypto/keyring.ts";
import {
  type $variableSettings,
  type TVariable,
  variableModel,
} from "@/schemas/configuration/variable.ts";

/** Where a variable lives: the user's own (global) scope, or a tenant's. */
export type TVariableOwner =
  | { scope: "global"; user: ObjectId }
  | { scope: "tenant"; tenant: ObjectId };

/** Who is asking: the user and their active tenant (both scopes they can see). */
export type TViewer = { user: ObjectId; tenant: ObjectId };

type TSettings = z.output<typeof $variableSettings>;

const ownerFilter = (owner: TVariableOwner) =>
  owner.scope === "global"
    ? { scope: "global" as const, user: owner.user }
    : { scope: "tenant" as const, tenant: owner.tenant };

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

const viewerLayers = async (viewer: TViewer) => [
  ["global", await valuesOf({ scope: "global", user: viewer.user })] as const,
  [
    "tenant",
    await valuesOf({ scope: "tenant", tenant: viewer.tenant }),
  ] as const,
];

/**
 * Rejects a change that would create a reference cycle in the viewer's
 * resolved set. Missing references are allowed here (they may be added next)
 * and fail at resolve time instead.
 */
const assertNoCycle = async (
  viewer: TViewer,
  owner: TVariableOwner,
  key: string,
  value: string,
) => {
  const layers = (await viewerLayers(viewer)).map(([scope, values]) =>
    [
      scope,
      scope === owner.scope ? { ...values, [key]: value } : values,
    ] as [string, Record<string, string>]
  );

  try {
    resolveReferences(layers, { allowMissing: true });
  } catch (error) {
    if (error instanceof VariableReferenceError) {
      throw Response.badRequest(error.message);
    }
    throw error;
  }
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
      updatedBy: opts.viewer.user,
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
}) {
  const filter = { _id: opts.id, ...ownerFilter(opts.owner) };
  const doc = await variableModel.findOne(filter, { projection: { key: 1 } });
  if (!doc) throw Response.notFound("Variable not found");

  const $set: Partial<TVariable> = {
    ...opts.settings,
    updatedBy: opts.viewer.user,
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
 * The viewer's resolved variables (tenant over global), references expanded,
 * split into container env and files. `stage` keeps `both` plus that stage.
 */
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

  const owners: TVariableOwner[] = [
    { scope: "global", user: viewer.user },
    { scope: "tenant", tenant: viewer.tenant },
  ];
  const docs = await Promise.all(owners.map(variablesOf));
  const layers = await Promise.all(
    owners.map(async (owner, i) =>
      [owner.scope, await valuesOf(owner, docs[i])] as [
        string,
        Record<string, string>,
      ]
    ),
  );

  let values: Record<string, string>;
  try {
    values = resolveReferences(layers);
  } catch (error) {
    if (error instanceof VariableReferenceError) {
      throw Response.badRequest(error.message);
    }
    throw error;
  }

  // The tenant's definition wins, so its settings decide the kind and stage.
  const settings = new Map(docs.flat().map((doc) => [doc.key, doc]));
  const env: Record<string, string> = {};
  const files: Record<string, string> = {};
  for (const [key, value] of Object.entries(values)) {
    const doc = settings.get(key)!;
    if (stage && doc.stage !== "both" && doc.stage !== stage) continue;
    (doc.kind === "file" ? files : env)[key] = value;
  }
  return { env, files };
}
