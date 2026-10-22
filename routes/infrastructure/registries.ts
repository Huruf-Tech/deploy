import z from "zod";
import { ObjectId } from "mongodb";
import { Router } from "@/core/http/router.ts";
import { bodyAsJson, paramsAsJson } from "@/core/http/utils.ts";
import { $objectId } from "@/core/utils/createCRUD.ts";
import { Response } from "@/core/http/response.ts";
import { withTenant } from "@/plugins/Huruf-Tech/thunder-core/utils/withTenant.ts";
import { entitlements, keyring, quotaGuard } from "@/lib/services.ts";
import {
  $registry,
  registryModel,
} from "@/schemas/infrastructure/serverSpec.ts";
import { projectModel } from "@/schemas/applications/project.ts";

/**
 * External registries (PLAN §8.4): with one connected, a project builds once
 * and the other servers pull. The password or token is stored encrypted and
 * only ever reaches agents sealed.
 */
export default new Router("/api", function registries(router) {
  const $params = z.object({ id: $objectId });
  const $view = $registry.omit({
    tenant: true,
    secretEnc: true,
    createdBy: true,
  })
    .extend({ _id: z.string(), createdAt: z.string() });

  router.get("/", function list() {
    return {
      shape: () => ({ return: z.array($view) }),
      handler: async (req) => {
        const { tenant } = await withTenant(req);
        return Response.json(
          await registryModel.find({ tenant: tenant._id }, {
            projection: { secretEnc: 0, tenant: 0, createdBy: 0 },
            sort: { name: 1 },
            limit: 100,
          }).toArray(),
        );
      },
    };
  });

  router.post("/", function create() {
    const $body = $registry.pick({
      name: true,
      kind: true,
      url: true,
      namespace: true,
      username: true,
      isDefault: true,
    }).extend({ password: z.string().min(1).max(2_000) })
      .refine((r) => r.kind === "dockerhub" || !!r.url, {
        message: "Generic registries need a URL",
      });

    return {
      shape: () => ({ body: $body, return: z.object({ _id: z.string() }) }),
      handler: async (req) => {
        const { password, ...body } = $body.parse(await bodyAsJson(req));
        const { tenant, user } = await withTenant(req);
        const { limits } = await entitlements.resolve(tenant._id);
        if (
          !await quotaGuard.acquire(tenant._id, "registries", limits.registries)
        ) {
          throw Response.forbidden(
            `Your plan allows ${limits.registries} registries`,
          );
        }
        const _id = new ObjectId();
        if (body.isDefault) {
          await registryModel.updateMany({ tenant: tenant._id }, {
            $set: { isDefault: false },
          });
        }
        await registryModel.insertOne({
          _id,
          ...body,
          tenant: tenant._id,
          secretEnc: await keyring.encrypt(
            { kind: "tenant", ref: tenant._id },
            password,
            `registry:${_id}`,
          ),
          createdBy: user._id,
          createdAt: new Date(),
        });
        return Response.json({ _id: _id.toString() });
      },
    };
  });

  router.post("/:id/default", function makeDefault() {
    return {
      shape: () => ({ params: $params }),
      handler: async (req) => {
        const { id } = $params.parse(paramsAsJson(req));
        const { tenant } = await withTenant(req);
        const exists = await registryModel.findOne({
          _id: id,
          tenant: tenant._id,
        }, { projection: { _id: 1 } });
        if (!exists) throw Response.notFound("Registry not found");
        await registryModel.updateMany({ tenant: tenant._id }, {
          $set: { isDefault: false },
        });
        await registryModel.updateOne({ _id: id }, {
          $set: { isDefault: true },
        });
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
          registry: id,
        }, { projection: { name: 1 } });
        if (used) throw Response.badRequest(`${used.name} uses this registry`);
        const { deletedCount } = await registryModel.deleteOne({
          _id: id,
          tenant: tenant._id,
        });
        if (!deletedCount) throw Response.notFound("Registry not found");
        await quotaGuard.release(tenant._id, "registries");
        return Response.json({ ok: true });
      },
    };
  });
}).group("Infrastructure");
