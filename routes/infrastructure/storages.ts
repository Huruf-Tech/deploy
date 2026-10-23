import z from "zod";
import { ObjectId } from "mongodb";
import { Router } from "@/core/http/router.ts";
import { bodyAsJson, paramsAsJson } from "@/core/http/utils.ts";
import { $objectId } from "@/core/utils/createCRUD.ts";
import { Response } from "@/core/http/response.ts";
import { withTenant } from "@/plugins/Huruf-Tech/thunder-core/utils/withTenant.ts";
import { keyring } from "@/lib/services.ts";
import { refreshSpecs } from "@/lib/deploy/specs.ts";
import { $storage, storageModel } from "@/schemas/infrastructure/storage.ts";
import { projectModel } from "@/schemas/applications/project.ts";

const MAX_STORAGES = 20;

/**
 * S3-compatible storage connections (PLAN §11), mounted as project volumes.
 * The secret key is stored encrypted and only ever reaches agents sealed.
 */
export default new Router("/api", function storages(router) {
  const $params = z.object({ id: $objectId });
  const $view = $storage.omit({
    tenant: true,
    secretEnc: true,
    createdBy: true,
  })
    .extend({ _id: z.string(), createdAt: z.string() });
  const $fields = $storage.pick({
    name: true,
    provider: true,
    endpoint: true,
    region: true,
    bucket: true,
    accessKeyId: true,
  });
  const seal = (tenant: ObjectId, id: ObjectId, secret: string) =>
    keyring.encrypt({ kind: "tenant", ref: tenant }, secret, `storage:${id}`);

  router.get("/", function list() {
    return {
      shape: () => ({ return: z.array($view) }),
      handler: async (req) => {
        const { tenant } = await withTenant(req);
        return Response.json(
          await storageModel.find({ tenant: tenant._id }, {
            projection: { secretEnc: 0, tenant: 0, createdBy: 0 },
            sort: { name: 1 },
            limit: MAX_STORAGES,
          }).toArray(),
        );
      },
    };
  });

  router.post("/", function create() {
    const $body = $fields.extend({
      secretAccessKey: z.string().min(1).max(500),
    });

    return {
      shape: () => ({ body: $body, return: z.object({ _id: z.string() }) }),
      handler: async (req) => {
        const { secretAccessKey, ...body } = $body.parse(await bodyAsJson(req));
        const { tenant, user } = await withTenant(req);
        if (
          await storageModel.countDocuments({ tenant: tenant._id }) >=
            MAX_STORAGES
        ) {
          throw Response.badRequest(
            `A tenant can have ${MAX_STORAGES} storage connections`,
          );
        }
        if (body.provider !== "aws" && !body.endpoint) {
          throw Response.badRequest("Enter the storage endpoint URL");
        }
        const _id = new ObjectId();
        await storageModel.insertOne({
          _id,
          ...body,
          tenant: tenant._id,
          secretEnc: await seal(tenant._id, _id, secretAccessKey),
          createdBy: user._id,
          createdAt: new Date(),
        });
        return Response.json({ _id: _id.toString() });
      },
    };
  });

  // Servers mounting it get the new settings in their spec; the next mount uses them.
  router.patch("/:id", function update() {
    const $body = $fields.partial().extend({
      secretAccessKey: z.string().min(1).max(500).optional().describe(
        "Leave out to keep the current one",
      ),
    });

    return {
      shape: () => ({ params: $params, body: $body }),
      handler: async (req) => {
        const { id } = $params.parse(paramsAsJson(req));
        const { secretAccessKey, ...body } = $body.parse(await bodyAsJson(req));
        const { tenant } = await withTenant(req);
        const { matchedCount } = await storageModel.updateOne(
          { _id: id, tenant: tenant._id },
          {
            $set: {
              ...body,
              ...(secretAccessKey
                ? { secretEnc: await seal(tenant._id, id, secretAccessKey) }
                : {}),
            },
          },
        );
        if (!matchedCount) throw Response.notFound("Storage not found");
        const users = await projectModel.find(
          { tenant: tenant._id, "volumes.storage": id },
          { projection: { placedOn: 1 }, limit: 500 },
        ).toArray();
        await refreshSpecs(users.flatMap((p) => p.placedOn));
        return Response.json({ ok: true });
      },
    };
  });

  router.del("/:id", function del() {
    return {
      shape: () => ({ params: $params }),
      handler: async (req) => {
        const { id } = $params.parse(paramsAsJson(req));
        const { tenant } = await withTenant(req);
        const used = await projectModel.findOne({
          tenant: tenant._id,
          "volumes.storage": id,
        }, { projection: { name: 1 } });
        if (used) throw Response.badRequest(`${used.name} mounts this storage`);
        const { deletedCount } = await storageModel.deleteOne({
          _id: id,
          tenant: tenant._id,
        });
        if (!deletedCount) throw Response.notFound("Storage not found");
        return Response.json({ ok: true });
      },
    };
  });
}).group("Infrastructure");
